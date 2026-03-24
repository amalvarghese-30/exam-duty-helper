def generate_schedule(teachers, exams):

    teacher_schedule = {t["email"]: [] for t in teachers}

    duty_roster = []

    for exam in exams:

        assigned = False

        for teacher in sorted(teachers, key=lambda x: x["totalDuties"]):

            # ❌ Subject conflict
            if teacher["subject"].lower() == exam["subject"].lower():
                continue

            # ❌ Already assigned same date
            if exam["exam_date"] in teacher_schedule[teacher["email"]]:
                continue

            # ❌ Leave / availability check
            unavailable = False
            for a in teacher.get("availability", []):
                if a["date"] == exam["exam_date"]:
                    unavailable = True
                    break

            if unavailable:
                continue

            # ✅ Assign teacher
            duty_roster.append({
                "teacher": teacher["email"],
                "exam": exam["subject"],
                "date": exam["exam_date"]
            })

            teacher_schedule[teacher["email"]].append(exam["exam_date"])
            teacher["totalDuties"] += 1

            assigned = True
            break

        if not assigned:
            duty_roster.append({
                "teacher": None,
                "exam": exam["subject"],
                "date": exam["exam_date"]
            })

    return duty_roster