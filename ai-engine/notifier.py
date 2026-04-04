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
    End the email with the sign-off: "Best Regards, PCE Exam Cell".
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
    success_count = 0
    teacher_map = {t['email']: t for t in all_teachers}
    exam_map = {f"{e['subject']}_{e['exam_date']}": e for e in all_exams}
    
    print("🚀 Starting Hybrid Notification System...")

    for index, entry in enumerate(roster):
        teacher_email = entry.get("teacher")
        if not teacher_email or teacher_email == "UNASSIGNED":
            continue

        # 1. Lookups
        teacher_obj = teacher_map.get(teacher_email, {})
        teacher_name = teacher_obj.get("name", "Professor")
        
        exam_key = f"{entry.get('exam')}_{entry.get('date')}"
        exam_details = exam_map.get(exam_key, {})

        duty_info = {
            "exam_name": entry.get('exam', 'Scheduled Exam'),
            "date": entry.get('date', 'Upcoming Date'),
            "time": f"{exam_details.get('start_time', 'TBD')} - {exam_details.get('end_time', 'TBD')}",
            "room": exam_details.get('room_number', 'Main Hall')
        }

        # 🤖 2. HYBRID LOGIC: Only use AI for the first 2 emails
        use_ai = (index < 2)

        if use_ai:
            print(f"✨ [AI DRAFT] Processing email for {teacher_name}...")
            # We use our existing send_single_mail function
            success = send_single_mail(teacher_name, teacher_email, duty_info)
            # Short sleep to stay safe during the AI portion
            time.sleep(6)
        else:
            print(f"⚡ [TEMPLATE] Fast-sending email to {teacher_name}...")
            # Direct SMTP send without calling Gemini
            success = send_template_mail(teacher_name, teacher_email, duty_info)
            # Very short sleep (just for SMTP stability)
            time.sleep(0.5)

        if success:
            success_count += 1
            
    return success_count

def send_template_mail(name, email, duty):
    """Fast SMTP send using a standard template (No AI call)"""
    try:
        msg = EmailMessage()
        body = f"Dear {name},\n\nYou have been assigned invigilation duty.\n\n" \
               f"Subject: {duty['exam_name']}\nDate: {duty['date']}\n" \
               f"Time: {duty['time']}\nRoom: {duty['room']}\n\n" \
               f"Please arrive 15 mins early.\n\nRegards,\nExam Cell"
        
        msg.set_content(body)
        msg['Subject'] = f"Exam Duty: {duty['exam_name']}"
        msg['From'] = f"Exam Cell <{os.getenv('EMAIL_USER')}>"
        msg['To'] = email

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASS"))
            smtp.send_message(msg)
        return True
    except Exception as e:
        print(f"❌ Template Error: {e}")
        return False