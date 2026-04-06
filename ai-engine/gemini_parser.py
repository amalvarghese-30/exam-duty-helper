import json
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def parse_rules(rule_text):
    prompt = f"""
    You are a Logic Engine. Convert the following human rules into a JSON configuration for a scheduling algorithm.
    
    Rules provided:
    {rule_text}

    Return ONLY a JSON object with this exact structure:
    {{
      "avoid_own_subject": boolean,
      "max_duties_per_day": int,
      "equalize_workload": boolean,
      "ignore_leave_status": boolean
      "custom_restrictions": "string containing any specific names, departments, or unique constraints mentioned"
    }}
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    if "max_duties_per_day" not in data:
        data["max_duties_per_day"] = 1
    text = response.text.strip().replace("```json", "").replace("```", "")
    try:
        data = json.loads(text)
        # Ensure the key exists even if AI forgets it
        if "custom_restrictions" not in data:
            data["custom_restrictions"] = ""
        return data
    except:
        # Safe defaults if AI output fails
        return {
            "avoid_own_subject": True,
            "max_duties_per_day": 1,
            "equalize_workload": True,
            "ignore_leave_status": False,
            "custom_restrictions": ""
        }