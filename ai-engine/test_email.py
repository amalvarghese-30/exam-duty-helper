import os
from dotenv import load_dotenv
import smtplib
from email.message import EmailMessage

load_dotenv()

def test_email():
    try:
        msg = EmailMessage()
        msg.set_content("Test email from Exam Duty System")
        msg['Subject'] = "Test Email"
        msg['From'] = f"Exam Cell <{os.getenv('EMAIL_USER')}>"
        msg['To'] = "amv.9820.am31@gmail.com"  # Change to your email
        
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASS"))
            smtp.send_message(msg)
        print("✅ Test email sent successfully!")
        return True
    except Exception as e:
        print(f"❌ Test email failed: {e}")
        return False

if __name__ == "__main__":
    test_email()