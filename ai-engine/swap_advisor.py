"""
Swap Advisor - Uses Gemini AI to suggest intelligent duty swaps
Enhances the swap engine with AI reasoning
"""

import google.genai as genai
import os
from dotenv import load_dotenv
import json
import logging

load_dotenv()

logger = logging.getLogger(__name__)

try:
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    GEMINI_AVAILABLE = True
except Exception as e:
    logger.warning(f"Gemini not available: {e}")
    GEMINI_AVAILABLE = False


def suggest_swaps(allocation_data: dict, teachers: list = None) -> list:
    """
    Generate AI-powered swap recommendations
    
    Args:
        allocation_data: Current allocation structure
        teachers: List of teachers for context
        
    Returns:
        List of swap suggestions with reasoning
    """
    if not GEMINI_AVAILABLE:
        return []
    
    try:
        # Build workload summary
        workload_summary = []
        if teachers:
            for teacher in teachers[:10]:  # Limit for prompt size
                workload_summary.append({
                    "name": teacher.get("name"),
                    "department": teacher.get("department"),
                    "duties": teacher.get("total_duties", 0)
                })
        
        prompt = f"""
Analyze this exam duty allocation and suggest swaps to improve fairness:

WORKLOAD DISTRIBUTION:
{json.dumps(workload_summary, indent=2)}

ALLOCATION OVERVIEW:
- Total Exams: {allocation_data.get('statistics', {}).get('total_exams', 0)}
- Allocated: {allocation_data.get('statistics', {}).get('allocated_exams', 0)}
- Workload Std Dev: {allocation_data.get('statistics', {}).get('workload_statistics', {}).get('std_dev', 0)}

CONFLICTS:
{json.dumps(allocation_data.get('conflicts', [])[:5], indent=2)}

Suggest 3-5 specific swap opportunities that would:
1. Balance workload (reduce std deviation)
2. Respect department preferences
3. Maintain hard constraints

Return as JSON array:
[
    {{
        "swap_id": "string",
        "teacher_from": "name",
        "teacher_to": "name",
        "exam": "subject",
        "reasoning": "why this swap helps",
        "expected_improvement": number (percentage),
        "feasibility": "high|medium|low"
    }}
]
"""
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        
        text = response.text.strip()
        # Extract JSON array
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
            
        suggestions = json.loads(text)
        
        # Ensure it's a list
        if isinstance(suggestions, dict):
            suggestions = [suggestions]
            
        return suggestions[:5]  # Return top 5
        
    except Exception as e:
        logger.error(f"Swap suggestion failed: {e}")
        return []


def explain_swap_benefit(swap: dict, current_allocation: dict) -> str:
    """
    Generate human-readable explanation for a swap recommendation
    
    Args:
        swap: Swap recommendation object
        current_allocation: Current allocation state
        
    Returns:
        Natural language explanation
    """
    if not GEMINI_AVAILABLE:
        return f"Swap {swap.get('teacher_from')} with {swap.get('teacher_to')} for {swap.get('exam')}"
    
    try:
        prompt = f"""
Explain why this swap improves exam duty allocation fairness:

Current: {swap.get('teacher_from')} assigned to {swap.get('exam')}
Proposed: {swap.get('teacher_to')} assigned to {swap.get('exam')}

Reason: {swap.get('reasoning', 'Fairness improvement')}

Write a 2-3 sentence explanation for an admin dashboard.
Keep it professional and clear.
"""
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        
        return response.text.strip()
        
    except Exception as e:
        logger.error(f"Swap explanation failed: {e}")
        return swap.get('reasoning', 'Swap recommended for fairness improvement')