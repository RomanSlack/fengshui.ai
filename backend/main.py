#!/usr/bin/env -S uv run fastapi dev
# main.py
# FastAPI backend for Feng Shui AI image analysis
#
# Setup:
#   1. Install dependencies: pip install -r requirements.txt
#   2. Create .env file with: GOOGLE_API_KEY=your_api_key_here
#   3. Run server: uvicorn main:app --reload --port 8000
#
# API Endpoints:
#   POST /analyze/ - Upload image and get feng shui analysis

import base64
import os
import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from dotenv import load_dotenv

from object_detection import detect_room_objects
from model_generation import generate_room_model
from blender_service import start_blender_service, stop_blender_service, is_blender_service_running

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start Blender service
    logger.info("Starting Blender 3D generation service...")
    service_started = start_blender_service()

    if service_started:
        logger.info("✓ Blender service is ready")
    else:
        logger.warning("⚠ Blender service failed to start - 3D generation will be disabled")

    yield

    # Shutdown: Stop Blender service
    logger.info("Shutting down Blender service...")
    stop_blender_service()
    logger.info("✓ Blender service stopped")


app = FastAPI(lifespan=lifespan)



# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini client
# Load .env from current directory or parent directory
load_dotenv()  # Looks in current directory first, then parent

# Initialize client lazily to avoid cleanup errors
_client = None

def get_gemini_client():
    """Get or create Gemini client instance"""
    global _client
    if _client is None:
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        _client = genai.Client(api_key=api_key)
    return _client

def encode_image_to_base64(file) -> str:
    return base64.b64encode(file.read()).decode("utf-8")


def call_gemini_fengshui(image_data: bytes, detected_objects: list = None) -> dict:
    """
    Call Gemini for feng shui analysis with object-specific tooltips
    Returns: dict with score, analysis, and object-specific tooltips
    """
    img_b64 = base64.b64encode(image_data).decode("utf-8")

    # Build object list for context
    object_context = ""
    if detected_objects:
        object_context = "\n\nDetected objects in the room:\n"
        for i, obj in enumerate(detected_objects):
            object_context += f"{i}. {obj['class']} (confidence: {obj['confidence']:.2f})\n"

    prompt = (
        "You are a Feng Shui master. Analyze the room in this image.\n\n"
        f"{object_context}\n"
        "Please provide your response in the following JSON format:\n"
        "{\n"
        '  "score": <number 1-10>,\n'
        '  "overall_analysis": "<your overall feng shui analysis>",\n'
        '  "strengths": ["<strength 1>", "<strength 2>"],\n'
        '  "weaknesses": ["<weakness 1>", "<weakness 2>"],\n'
        '  "suggestions": ["<suggestion 1>", "<suggestion 2>"],\n'
        '  "object_tooltips": [\n'
        '    {"object_index": <index from detected objects>, "type": "good|bad|neutral", "message": "<specific feng shui tip for this object>"},\n'
        '    ...\n'
        '  ]\n'
        "}\n\n"
        "For object_tooltips, select 2-4 important objects that significantly impact feng shui. "
        "Use the object_index from the detected objects list above. "
        "Type should be 'good' (positive energy), 'bad' (negative energy), or 'neutral' (needs adjustment)."
    )

    client = get_gemini_client()
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            {
                "role": "user",
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": img_b64,
                        }
                    },
                ],
            }
        ],
        config=types.GenerateContentConfig(
            temperature=0.3,
            max_output_tokens=800,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
            response_mime_type="application/json"
        ),
    )

    return response.text


async def generate_3d_model_background(image_data: bytes):
    """Background task to generate 3D model without blocking the response."""
    try:
        logger.info("Starting background 3D model generation...")

        # Check if service is available
        if not is_blender_service_running():
            logger.warning("Blender service not running - skipping 3D generation")
            return

        # Run in executor to avoid blocking
        loop = asyncio.get_event_loop()
        fbx_path, message = await loop.run_in_executor(
            None,
            generate_room_model,
            image_data,
            'vits',  # Fast model
            'cpu',   # Use CPU (GPU may have CUDA issues in background)
            True     # Save results
        )

        if fbx_path:
            logger.info(f"✓ 3D model generated: {fbx_path}")
        else:
            logger.warning(f"3D model generation failed: {message}")

    except Exception as e:
        logger.error(f"Background 3D generation error: {e}")


@app.post("/analyze/")
async def analyze_image(file: UploadFile = File(...)):
    import json

async def analyze_image(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    image_data = await file.read()

    # Run object detection with automatic saving to results folder
    try:
        detected_objects, json_path, image_path = detect_room_objects(image_data, save_results=True)
        logger.info(f"Object detection completed. Found {len(detected_objects)} objects")
        logger.info(f"Results saved to: {json_path}")
        logger.info(f"Annotated image saved to: {image_path}")

        for obj in detected_objects:
            logger.info(
                f"  - {obj['class']}: confidence={obj['confidence']}, "
                f"bbox=({obj['bbox']['x1']}, {obj['bbox']['y1']}, {obj['bbox']['x2']}, {obj['bbox']['y2']}), "
                f"center=({obj['center']['x']}, {obj['center']['y']})"
            )
    except Exception as e:
        logger.error(f"Object detection failed: {e}")
        detected_objects = []
        json_path = ""
        image_path = ""

    # Run Feng Shui analysis with detected objects
    gemini_response = call_gemini_fengshui(image_data, detected_objects)

    # Parse Gemini JSON response
    try:
        feng_shui_analysis = json.loads(gemini_response)
    except json.JSONDecodeError:
        logger.error("Failed to parse Gemini response as JSON")
        feng_shui_analysis = {
            "score": 5,
            "overall_analysis": gemini_response,
            "strengths": [],
            "weaknesses": [],
            "suggestions": [],
            "object_tooltips": []
        }

    # Start 3D model generation in background (non-blocking)
    background_tasks.add_task(generate_3d_model_background, image_data)
    logger.info("3D model generation queued as background task")

    return {"result": result}
    # Combine tooltips with object coordinates
    tooltips_with_coords = []
    for tooltip in feng_shui_analysis.get("object_tooltips", []):
        obj_idx = tooltip.get("object_index")
        if obj_idx is not None and 0 <= obj_idx < len(detected_objects):
            obj = detected_objects[obj_idx]
            tooltips_with_coords.append({
                "object_class": obj["class"],
                "object_index": obj_idx,
                "type": tooltip.get("type", "neutral"),
                "message": tooltip.get("message", ""),
                "coordinates": {
                    "bbox": obj["bbox"],
                    "center": obj["center"]
                },
                "confidence": obj["confidence"]
            })

    # Build final response
    response = {
        "score": feng_shui_analysis.get("score", 5),
        "overall_analysis": feng_shui_analysis.get("overall_analysis", ""),
        "strengths": feng_shui_analysis.get("strengths", []),
        "weaknesses": feng_shui_analysis.get("weaknesses", []),
        "suggestions": feng_shui_analysis.get("suggestions", []),
        "detected_objects": detected_objects,
        "tooltips": tooltips_with_coords,
        "detection_metadata": {
            "total_objects": len(detected_objects),
            "json_path": json_path,
            "image_path": image_path
        }
    }

    return response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
