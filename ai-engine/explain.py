from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

import json

def explain_schedule(roster):
    # Convert the list/object into a clean, readable string for the AI
    roster_summary = json.dumps(roster, indent=2)

    prompt = f"""
You are an Exam Cell coordinator. Analyze this duty roster and explain the logic.
Check for:
1. Fairness (Did teachers get equal duties?)
2. Rules (Are there any conflicts?)
3. Specifics (Mention 1-2 teachers who were assigned).

Duty Roster Data:
{roster_summary}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return response.text