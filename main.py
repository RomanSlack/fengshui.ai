import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os

load_dotenv()  # Load variables from .env file

client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))
print(os.environ.get("GOOGLE_API_KEY"))


def encode_image_to_base64(path: str) -> str:
    """Helper to load & base64-encode an image file"""
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def call_gemini_fengshui(image_path: str) -> str:
    # 1. Encode the image
    img_b64 = encode_image_to_base64(image_path)

    # 2. Feng Shui analysis prompt (improved)
    prompt = (
        "You are a Feng Shui master. Analyze the room in this image.\n\n"
        "Please provide:\n"
        "1. A Feng Shui score from 1 to 10 (higher = better energy, balance, and flow).\n"
        "2. Key strengths of the room’s Feng Shui (what is working well).\n"
        "3. Key weaknesses or problems that harm the Feng Shui (why the score isn’t perfect).\n"
        "4. Simple, practical suggestions for improvement (e.g., move furniture, reduce clutter, reposition bed, add plants, etc.).\n\n"
        "Keep your response concise, structured, and clear."
    )

    # 3. Call Gemini
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
            temperature=0.3,  # slight creativity
            max_output_tokens=300,
            thinking_config=types.ThinkingConfig(thinking_budget=0)  # disables hidden reasoning
        ),
    )

    return response.text

if __name__ == "__main__":
    image_path = "room_photo.png"   
    result = call_gemini_fengshui(image_path)
    print("Gemini Feng Shui output:")
    print(result)
