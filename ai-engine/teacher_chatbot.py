"""
Teacher Chatbot - AI assistant for teacher queries about allocations
Provides natural language Q&A for teachers
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


def teacher_query(question: str, teacher_data: dict, allocation_data: dict) -> dict:
    """
    Answer teacher's question about their allocation
    
    Args:
        question: Teacher's natural language question
        teacher_data: Teacher's profile and duties
        allocation_data: Overall allocation context
        
    Returns:
        Dict with answer and metadata
    """
    if not GEMINI_AVAILABLE:
        return {
            "answer": "AI assistant is currently unavailable. Please contact your admin.",
            "confidence": 0.0,
            "requires_human": True
        }
    
    try:
        # Build teacher context
        teacher_duties = teacher_data.get("allocations", [])
        total_duties = len(teacher_duties)
        
        # Calculate workload comparison
        all_teachers = allocation_data.get("teachers", [])
        all_duties = [t.get("total_duties", 0) for t in all_teachers]
        avg_duties = sum(all_duties) / len(all_duties) if all_duties else 0
        
        prompt = f"""
You are an AI assistant for teachers in an exam duty allocation system.
Answer the teacher's question professionally and helpfully.

TEACHER CONTEXT:
- Name: {teacher_data.get('name', 'Teacher')}
- Department: {teacher_data.get('department', 'Unknown')}
- Total Duties: {total_duties}
- Average Duties (all teachers): {avg_duties:.1f}

TEACHER'S DUTIES:
{json.dumps([{
    'exam': d.get('exam_subject'),
    'date': d.get('date'),
    'role': d.get('role')
} for d in teacher_duties[:5]], indent=2)}

OVERALL STATS:
- Total Teachers: {len(all_teachers)}
- Total Exams: {allocation_data.get('total_exams', 0)}
- Workload Std Dev: {allocation_data.get('workload_std_dev', 0):.2f}

TEACHER'S QUESTION:
{question}

Provide a clear, empathetic, and helpful answer.
If workload seems unfair, explain why it happened.
If they ask about swaps, explain the process.
Keep response concise (2-4 sentences).

Return JSON:
{{
    "answer": "string",
    "category": "workload|fairness|swap|schedule|other",
    "requires_action": boolean,
    "suggested_action": "string or null",
    "confidence": number (0-1)
}}
"""
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        
        text = response.text.strip()
        # Extract JSON
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
            
        result = json.loads(text)
        
        return {
            "answer": result.get("answer", "I'm unable to answer that question right now."),
            "category": result.get("category", "other"),
            "requires_action": result.get("requires_action", False),
            "suggested_action": result.get("suggested_action"),
            "confidence": result.get("confidence", 0.7)
        }
        
    except Exception as e:
        logger.error(f"Teacher query failed: {e}")
        return {
            "answer": f"I encountered an error processing your question. Please try again or contact support. (Error: {str(e)[:100]})",
            "confidence": 0.0,
            "requires_human": True
        }


def generate_weekly_summary(teacher_data: dict) -> str:
    """
    Generate a weekly summary of teacher's duties
    
    Args:
        teacher_data: Teacher's profile and duties
        
    Returns:
        Natural language summary
    """
    if not GEMINI_AVAILABLE:
        return "Weekly summary unavailable."
    
    try:
        duties = teacher_data.get("allocations", [])
        
        prompt = f"""
Create a brief weekly summary for a teacher with these duties:

Teacher: {teacher_data.get('name')}
Total Duties: {len(duties)}

Duty Schedule:
{json.dumps([{
    'date': d.get('date'),
    'exam': d.get('exam_subject'),
    'time': d.get('time'),
    'role': d.get('role')
} for d in duties], indent=2)}

Write a friendly 2-3 sentence summary highlighting:
- Number of duties this week
- Busiest day
- Any back-to-back duties
- Reminder about leave policies if needed
"""
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        
        return response.text.strip()
        
    except Exception as e:
        logger.error(f"Weekly summary failed: {e}")
        return f"You have {len(teacher_data.get('allocations', []))} duties assigned."