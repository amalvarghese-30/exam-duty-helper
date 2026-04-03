import os
import time
import smtplib
from email.message import EmailMessage
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Setup Gemini Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def send_single_mail(teacher_name, teacher_email, duty):
    """Drafts with Gemini and sends via SMTP"""
    prompt = f"""
    Write a brief, professional email to {teacher_name} regarding their exam duty.
    Subject: {duty['exam_name']}
    Date: {duty['date']}
    Time: {duty['time']}
    Room: {duty['room']}
    Mention they should arrive 15 mins early. 
    Write only the body text. No subject line.
    """
    
    try:
        # Note: Corrected to gemini-2.5-flash (most stable for 2026)
        response = client.models.generate_content(
            model="gemini-2.5-flash", 
            contents=prompt
        )
        email_body = response.text

        msg = EmailMessage()
        msg.set_content(email_body)
        msg['Subject'] = f"Exam Duty Assignment: {duty['exam_name']}"
        msg['From'] = f"Exam Cell AI Assistant <{os.getenv('EMAIL_USER')}>"
        msg['To'] = teacher_email

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASS"))
            smtp.send_message(msg)
        return True
    except Exception as e:
        print(f"❌ Error sending to {teacher_name}: {e}")
        return False

def notify_assigned_teachers(roster, all_teachers, all_exams):
    """
    The manager function. 
    roster: list of allocations (teacher is usually an email string)
    all_teachers: the full list of teacher objects from the request
    all_exams: the full list of exam objects from the request
    """
    success_count = 0
    
    # 1. Create a lookup map so we can find names by email
    # Map looks like: {"email@mes.ac.in": {"name": "Dr. Smith", ...}}
    teacher_map = {t['email']: t for t in all_teachers}

    exam_map = {f"{e['subject']}_{e['exam_date']}": e for e in all_exams}

    for entry in roster:
        # 2. Get the teacher identifier (could be string email or object)
        raw_teacher = entry.get("teacher")
        
        if not raw_teacher or raw_teacher == "UNASSIGNED":
            continue

        # 3. Handle String vs Object
        if isinstance(raw_teacher, str):
            teacher_email = raw_teacher
            teacher_obj = teacher_map.get(teacher_email, {})
            teacher_name = teacher_obj.get("name", "Professor")
        else:
            teacher_email = raw_teacher.get("email")
            teacher_name = raw_teacher.get("name", "Professor")

        if not teacher_email:
            continue

        exam_key = f"{entry.get('exam')}_{entry.get('date')}"
        exam_details = exam_map.get(exam_key, {})

        # 4. Handle Exam Data (Matching your scheduler.py output keys)
        # We use .get() with fallbacks to avoid crashes
        duty_info = {
            "exam_name": entry.get('exam', 'Scheduled Exam'),
            "date": entry.get('date', 'Upcoming Date'),
            "time": f"{exam_details.get('start_time', 'TBD')} - {exam_details.get('end_time', 'TBD')}",
            "room": exam_details.get('room_number', 'Main Hall')
        }

        print(f"📩 Drafting & Sending to {teacher_name} ({teacher_email})...")
        
        if send_single_mail(teacher_name, teacher_email, duty_info):
            success_count += 1
            time.sleep(6) # Safety delay
            
    return success_count