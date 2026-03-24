from flask import Flask, request, jsonify
from gemini_parser import parse_rules
from scheduler import generate_schedule
from explain import explain_schedule

app = Flask(__name__)

@app.route("/")
def home():
    return "AI Engine is running 🚀"

@app.route("/generate", methods=["POST"])
def generate():

    data = request.json

    teachers = data["teachers"]
    exams = data["exams"]
    rules = data["rules"]

    # 🧠 Step 1: NLP
    constraints = parse_rules(rules)

    # ⚙️ Step 2: Scheduling
    roster = generate_schedule(teachers, exams)

    # 🤖 Step 3: Explanation
    explanation = explain_schedule(roster)

    return jsonify({
        "constraints": constraints,
        "roster": roster,
        "explanation": explanation
    })

if __name__ == "__main__":
    app.run(port=5001, debug=True)