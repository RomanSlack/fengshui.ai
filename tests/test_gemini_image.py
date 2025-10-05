import google.generativeai as genai
from PIL import Image
import os

# Configure API
genai.configure(api_key="")

# Load image
image_path = "/frontend/public/mascot_peeking_1.png"
image = Image.open(image_path)

# Create model
model = genai.GenerativeModel("gemini-2.5-flash")

# Ask about the image
response = model.generate_content([
    "What do you see in this image? Describe it in detail.",
    image
])

print(response.text)
