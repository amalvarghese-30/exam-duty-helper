def generate_schedule(teachers, exams, constraints):
    duty_roster = []
    
    custom_rules = constraints.get("custom_restrictions", "").lower()
    # Extract AI-parsed rules
    avoid_subject = constraints.get("avoid_own_subject", True)
    max_per_day = constraints.get("max_duties_per_day", 1)
    equalize = constraints.get("equalize_workload", True)

    # If equalize is true, we sort teachers by totalDuties so those with 0 get picked first
    if equalize:
        teachers = sorted(teachers, key=lambda x: x.get("totalDuties", 0))

    for exam in exams:
        assigned_teacher = None

        for teacher in teachers:
            # 1. Rule: Avoid Subject Conflict (NLP Rule 1)
            if avoid_subject and teacher["subject"].lower() == exam["subject"].lower():
                continue

            # 2. Rule: Check Availability/Leave (NLP Rule 2)
            # We assume the 'availability' array reflects their allowed dates
            is_unavailable = any(a["date"] == exam["exam_date"] for a in teacher.get("availability", []))
            if is_unavailable:
                continue

            # 3. Rule: Daily Limit (NLP Rule 4)
            # Check if they are already in the roster for THIS specific date
            already_busy_today = any(r["teacher"] == teacher["email"] and r["date"] == exam["exam_date"] for r in duty_roster)
            if already_busy_today:
                continue

            #4. Rule: Custom Restrictions (NLP Rule 5)
            # NEW: Check if this teacher's name appears in the special instructions
            if custom_rules and teacher["name"].lower() in custom_rules:
                if "exclude" in custom_rules or "no duties" in custom_rules:
                    print(f"AI Skip: {teacher['name']} based on custom rule")
                    continue

            # If all checks passed
            assigned_teacher = teacher
            break

        if assigned_teacher:
            duty_roster.append({
                "teacher": assigned_teacher["email"],
                "exam": exam["subject"],
                "date": exam["exam_date"]
            })
            assigned_teacher["totalDuties"] = assigned_teacher.get("totalDuties", 0) + 1
            # Re-sort after assignment to keep it fair for the next exam
            if equalize:
                teachers = sorted(teachers, key=lambda x: x.get("totalDuties", 0))
        else:
            duty_roster.append({
                "teacher": "UNASSIGNED",
                "exam": exam["subject"],
                "date": exam["exam_date"]
            })

    return duty_roster