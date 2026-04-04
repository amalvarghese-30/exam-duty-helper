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
    print(f"📧 Attempting to send email to {teacher_name} ({teacher_email})")
    
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
        print("🤖 Generating email content with Gemini...")
        response = client.models.generate_content(
            model="gemini-2.5-flash", 
            contents=prompt
        )
        email_body = response.text
        print(f"✅ Gemini generated email body: {email_body[:100]}...")

        msg = EmailMessage()
        msg.set_content(email_body)
        msg['Subject'] = f"Exam Duty Assignment: {duty['exam_name']}"
        msg['From'] = f"Exam Cell AI Assistant <{os.getenv('EMAIL_USER')}>"
        msg['To'] = teacher_email

        print(f"📤 Sending via SMTP to {teacher_email}...")
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASS"))
            smtp.send_message(msg)
        print(f"✅ Email sent successfully to {teacher_email}")
        return True
    except Exception as e:
        print(f"❌ Error sending to {teacher_name} ({teacher_email}): {e}")
        return False

def notify_assigned_teachers(roster, all_teachers, all_exams):
    """
    The manager function. 
    roster: list of allocations (teacher is usually an email string)
    all_teachers: the full list of teacher objects from the request
    all_exams: the full list of exam objects from the request
    """
    print(f"📧 notify_assigned_teachers called with {len(roster)} roster entries")
    print(f"   Teachers count: {len(all_teachers)}, Exams count: {len(all_exams)}")
    
    success_count = 0
    
    # Create lookup maps
    teacher_map = {t['email']: t for t in all_teachers}
    exam_map = {f"{e['subject']}_{e['exam_date']}": e for e in all_exams}

    for idx, entry in enumerate(roster):
        print(f"\n--- Processing roster entry {idx+1}/{len(roster)} ---")
        raw_teacher = entry.get("teacher")
        
        if not raw_teacher or raw_teacher == "UNASSIGNED":
            print(f"⚠️ Skipping - no teacher or UNASSIGNED: {raw_teacher}")
            continue

        # Handle String vs Object
        if isinstance(raw_teacher, str):
            teacher_email = raw_teacher
            teacher_obj = teacher_map.get(teacher_email, {})
            teacher_name = teacher_obj.get("name", "Professor")
        else:
            teacher_email = raw_teacher.get("email")
            teacher_name = raw_teacher.get("name", "Professor")

        if not teacher_email:
            print(f"⚠️ Skipping - no teacher email for {raw_teacher}")
            continue

        exam_key = f"{entry.get('exam')}_{entry.get('date')}"
        exam_details = exam_map.get(exam_key, {})

        duty_info = {
            "exam_name": entry.get('exam', 'Scheduled Exam'),
            "date": entry.get('date', 'Upcoming Date'),
            "time": f"{exam_details.get('start_time', 'TBD')} - {exam_details.get('end_time', 'TBD')}",
            "room": exam_details.get('room_number', 'Main Hall')
        }

        print(f"📩 Preparing email for {teacher_name} ({teacher_email})")
        print(f"   Exam: {duty_info['exam_name']} on {duty_info['date']}")
        
        if send_single_mail(teacher_name, teacher_email, duty_info):
            success_count += 1
            print(f"   ✅ Email sent (success count: {success_count})")
            time.sleep(6)  # Safety delay
            
    print(f"\n📊 Email summary: {success_count} emails sent successfully")
    return success_count