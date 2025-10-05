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
client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

def encode_image_to_base64(file) -> str:
    return base64.b64encode(file.read()).decode("utf-8")


def call_gemini_fengshui(image_data: bytes) -> str:
    img_b64 = base64.b64encode(image_data).decode("utf-8")

    prompt = (
        "You are a Feng Shui master. Analyze the room in this image.\n\n"
        "Please provide:\n"
        "1. A Feng Shui score from 1 to 10 (higher = better energy, balance, and flow).\n"
        "2. Key strengths of the room’s Feng Shui (what is working well).\n"
        "3. Key weaknesses or problems that harm the Feng Shui (why the score isn’t perfect).\n"
        "4. Simple, practical suggestions for improvement (e.g., move furniture, reduce clutter, reposition bed, add plants, etc.).\n\n"
        "Keep your response concise, structured, and clear."
    )

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
            max_output_tokens=300,
            thinking_config=types.ThinkingConfig(thinking_budget=0)
        ),
    )

    return response.text


async def generate_3d_model_background(image_data: bytes):
    """Background task to generate 3D model without blocking the response."""
    logger.info("3D model generation is currently disabled")
    logger.info("TrueDepth plugin requires GUI mode for full functionality")
    logger.info("To generate 3D models:")
    logger.info("  1. Open Blender in GUI mode")
    logger.info("  2. Use TrueDepth extension with saved images from backend/results/")
    logger.info("  3. Export FBX files to backend/room_renders/")
    return

    # NOTE: Headless 3D generation disabled due to TrueDepth UI dependencies
    # TrueDepth extension uses context.area.tag_redraw() which requires GUI mode
    # Uncomment below to re-enable (may fail in headless mode)
    """
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
            'gpu',   # Use GPU for faster processing
            True     # Save results
        )

        if fbx_path:
            logger.info(f"✓ 3D model generated: {fbx_path}")
        else:
            logger.warning(f"3D model generation failed: {message}")

    except Exception as e:
        logger.error(f"Background 3D generation error: {e}")
    """


@app.post("/analyze/")
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

    # Run Feng Shui analysis
    result = call_gemini_fengshui(image_data)

    # Start 3D model generation in background (non-blocking)
    background_tasks.add_task(generate_3d_model_background, image_data)
    logger.info("3D model generation queued as background task")

    return {"result": result}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
