from flask import Flask, request, jsonify
from gemini_parser import parse_rules
from scheduler import generate_schedule
from explain import explain_schedule
from notifier import notify_assigned_teachers

app = Flask(__name__)

@app.route("/")
def home():
    return "AI Engine is running 🚀"

@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    
    # 🧠 Step 1: Gemini parses the rules string into a JSON config
    constraints = parse_rules(data["rules"])

    # ⚙️ Step 2: The logic engine uses that JSON to build the roster
    roster = generate_schedule(data["teachers"], data["exams"], constraints)

    # 🤖 Step 3: Gemini explains the result
    explanation = explain_schedule(roster)

    # 4. Notify (Clean 1-line call!)
    emails_sent = notify_assigned_teachers(roster, data["teachers"], data["exams"])

    return jsonify({
        "interpreted_constraints": constraints, # Show this in UI to prove AI worked
        "roster": roster,
        "explanation": explanation,
        "emails_sent": emails_sent
    })

if __name__ == "__main__":
    app.run(port=5001, debug=True)