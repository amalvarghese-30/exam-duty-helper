from flask import Flask, request, jsonify
import os
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
    try:
        data = request.json or {}
        teachers = data.get("teachers", [])
        exams = data.get("exams", [])
        rules = data.get("rules", "")

        if not isinstance(teachers, list) or not isinstance(exams, list):
            return jsonify({"error": "Invalid payload: teachers/exams must be arrays"}), 400

        # Step 1: Parse rules into scheduler constraints.
        constraints = parse_rules(rules)

        # Step 2: Build roster.
        roster = generate_schedule(teachers, exams, constraints)

        # Step 3: Explain schedule (with fallback handled in explain module).
        explanation = explain_schedule(roster)

        # Step 4: Notify teachers (safe fallback if email config is missing).
        emails_sent = notify_assigned_teachers(roster, teachers, exams)

        return jsonify({
            "interpreted_constraints": constraints,
            "roster": roster,
            "explanation": explanation,
            "emails_sent": emails_sent
        })
    except Exception as e:
        return jsonify({"error": f"AI engine failed: {str(e)}"}), 500

if __name__ == "__main__":
    # Disable auto-reloader to avoid connection resets during long requests.
    host = os.getenv("AI_HOST", "0.0.0.0")
    port = int(os.getenv("PORT", os.getenv("AI_PORT", "5001")))
    app.run(host=host, port=port, debug=False, use_reloader=False)