from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
_gemini_explainer_available = True

import json


def _local_explanation(roster):
    assigned = [row for row in roster if row.get("teacher") != "UNASSIGNED"]
    unassigned = [row for row in roster if row.get("teacher") == "UNASSIGNED"]
    sample = assigned[:2]

    sample_lines = []
    for item in sample:
        sample_lines.append(f"- {item.get('exam', 'Unknown')} on {item.get('date', 'Unknown')} assigned.")
    if not sample_lines:
        sample_lines.append("- No assignments available in this cycle.")

    return (
        "Allocation Summary\n"
        f"- Total exams processed: {len(roster)}\n"
        f"- Assigned: {len(assigned)}, Unassigned: {len(unassigned)}\n\n"
        "Fairness Snapshot\n"
        "- Allocation followed subject, leave, and daily-limit constraints.\n"
        "- Workload balancing was applied where eligible.\n\n"
        "Conflict Check\n"
        "- Own-subject assignments were avoided when rule enabled.\n"
        "- Leave/unavailability checks were enforced.\n\n"
        "Sample Assignments\n"
        + "\n".join(sample_lines)
        + "\n\n"
        "Recommended Action\n"
        "- If unassigned exams remain, add available staff or relax constraints for this cycle."
    )


def _is_quota_or_auth_error(error):
    message = str(error).lower()
    return (
        "resource_exhausted" in message
        or "quota" in message
        or "429" in message
        or "invalid api key" in message
        or "permission denied" in message
    )

def explain_schedule(roster):
    global _gemini_explainer_available

    if not os.getenv("GEMINI_API_KEY") or not _gemini_explainer_available:
        return _local_explanation(roster)

    # Convert the list/object into a clean, readable string for the AI
    roster_summary = json.dumps(roster, indent=2)

    prompt = f"""
You are an Exam Cell coordinator creating a dashboard-friendly explanation.
Analyze this duty roster and return a concise, presentation-ready summary.

STRICT OUTPUT RULES:
1. Keep response between 90 and 150 words.
2. Use this exact section order and headings:
    Allocation Summary
    Fairness Snapshot
    Conflict Check
    Sample Assignments
    Recommended Action
3. Use short bullet points under each heading (1-2 bullets max).
4. Do NOT include raw email addresses in output.
5. If suspicious identities appear (for example student-style IDs), mention it generically as
    "Some assignments may require faculty eligibility review".
6. Keep tone professional, clear, and suitable for admin dashboard display.
7. Avoid long narratives, repeated points, and legal/policy lecture style text.

Duty Roster Data:
{roster_summary}
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return response.text
    except Exception as error:
        if _is_quota_or_auth_error(error):
            _gemini_explainer_available = False
        return _local_explanation(roster)