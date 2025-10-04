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
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from dotenv import load_dotenv

app = FastAPI()



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


@app.post("/analyze/")
async def analyze_image(file: UploadFile = File(...)):
    image_data = await file.read()
    result = call_gemini_fengshui(image_data)
    return {"result": result}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
