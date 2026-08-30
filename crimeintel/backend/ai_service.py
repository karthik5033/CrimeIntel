import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load env variables from Next.js .env.local
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local'))

api_key = os.getenv("GOOGLE_API_KEY_1") or os.getenv("GOOGLE_API_KEY_2")
if not api_key:
    raise ValueError("Missing GOOGLE_API_KEY_1 in .env.local")

client = genai.Client(api_key=api_key)

def generate_embedding(text: str) -> list[float]:
    """Generates a 768-dimensional embedding using Gemini."""
    if not text or len(text.strip()) == 0:
        return [0.0] * 768
        
    try:
        response = client.models.embed_content(
            model='gemini-embedding-001',
            contents=text,
        )
        return response.embeddings[0].values
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return [0.0] * 768

def generate_chat_response(prompt: str, system_instruction: str) -> str:
    """Generates a chat response using Gemini 2.5 Flash."""
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
            )
        )
        return response.text
    except Exception as e:
        print(f"Error generating chat response: {e}")
        return "I encountered an error while trying to process the intelligence data."
