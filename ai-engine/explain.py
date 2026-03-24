from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def explain_schedule(roster):

    prompt = f"""
Explain the following exam duty allocation.

Include:
- fairness
- subject conflicts avoided
- availability rules

Roster:
{roster}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return response.text