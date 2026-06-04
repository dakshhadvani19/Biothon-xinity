import json
import os
import traceback
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from openai import AsyncOpenAI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WeatherPayload(BaseModel):
    data: dict
    farms: list = []

@app.post("/api/v1/agronomic-insights")
async def get_agronomic_insights(payload: WeatherPayload):
    try:
        # Securely pull API key from Vercel Environment Variables
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set on Vercel.")
            
        client = AsyncOpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
        
        response = await client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {
                    "role": "system", 
                    "content": "You are the Agronomic Intelligence Engine for AgriShield. You will receive real-time weather data AND a list of specific farms (crop + soil type) owned by the user. Generate 3 highly technical, actionable agronomic instructions. IF farm data is provided, you MUST tailor the advice specifically to those exact crops and soil combinations based on the weather parameters. IF no farm data is provided, give general high-level advice for the Saurashtra region. Return ONLY a valid JSON object with exactly one key named 'insights' containing an array of 3 strings."
                },
                {
                    "role": "user", 
                    "content": f"Weather Telemetry: {json.dumps(payload.data)}\nUser Farms: {json.dumps(payload.farms)}"
                }
            ],
            response_format={"type": "json_object"}
        )
        raw_content = response.choices[0].message.content
        if not raw_content:
            raise ValueError("Groq returned an empty response body.")
            
        sanitized_content = raw_content.replace("```json", "").replace("```", "").strip()
        return json.loads(sanitized_content)
    except Exception as e:
        print(f"🛑 CRITICAL LLM EXCEPTION: {e}")
        traceback.print_exc()
        return {"insights": ["AI advisory system is temporarily syncing. Adhere to standard crop protocols."]}

@app.post("/api/v1/predict")
async def mock_predict(file: UploadFile = File(...)):
    # Vercel Serverless environment cannot host the 1.5GB PyTorch ResNet model.
    # Returning a mock payload so the production UI doesn't crash during testing.
    return {
        "disease": "Apple___Apple_scab",
        "confidence": 0.99,
        "mocked": True
    }
