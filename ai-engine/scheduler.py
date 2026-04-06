def generate_schedule(teachers, exams, constraints):
    duty_roster = []
    
    custom_rules = constraints.get("custom_restrictions", "").lower()
    excluded_teachers = {
        str(name).strip().lower()
        for name in constraints.get("excluded_teachers", [])
        if str(name).strip()
    }
    # Extract AI-parsed rules
    avoid_subject = constraints.get("avoid_own_subject", True)
    max_per_day = constraints.get("max_duties_per_day", 1)
    if not isinstance(max_per_day, int) or max_per_day < 1:
        max_per_day = 1
    equalize = constraints.get("equalize_workload", True)

    # If equalize is true, we sort teachers by totalDuties so those with 0 get picked first
    if equalize:
        teachers = sorted(teachers, key=lambda x: x.get("totalDuties", 0))

    def has_capacity_conflict(exam):
        class_capacity = exam.get("class_capacity", exam.get("student_count", 0))
        room_capacity = exam.get("room_capacity", 0)

        try:
            class_capacity = int(class_capacity)
            room_capacity = int(room_capacity)
        except (TypeError, ValueError):
            return False

        if class_capacity <= 0 or room_capacity <= 0:
            return False

        return room_capacity < class_capacity

    def try_assign_teacher(exam, per_day_limit):
        for teacher in teachers:
            teacher_name = (teacher.get("name") or "").lower()
            teacher_email = (teacher.get("email") or "").lower()

            # 0. Rule: Explicit exclusion list from parser.
            if excluded_teachers and (teacher_name in excluded_teachers or teacher_email in excluded_teachers):
                continue

            # 1. Rule: Avoid Subject Conflict (NLP Rule 1)
            if avoid_subject and teacher["subject"].lower() == exam["subject"].lower():
                continue

            # 2. Rule: Check Availability/Leave (NLP Rule 2)
            is_unavailable = any(a["date"] == exam["exam_date"] for a in teacher.get("availability", []))
            if is_unavailable:
                continue

            # 3. Rule: Daily Limit (NLP Rule 4)
            duties_today = sum(
                1
                for r in duty_roster
                if r["teacher"] == teacher["email"] and r["date"] == exam["exam_date"]
            )
            if duties_today >= per_day_limit:
                continue

            # 4. Rule: Custom Restrictions (NLP Rule 5)
            if custom_rules and teacher_name and teacher_name in custom_rules:
                if "exclude" in custom_rules or "no duties" in custom_rules:
                    print(f"AI Skip: {teacher['name']} based on custom rule")
                    continue

            return teacher

        return None

    for exam in exams:
        if has_capacity_conflict(exam):
            duty_roster.append({
                "teacher": "UNASSIGNED",
                "exam": exam["subject"],
                "date": exam["exam_date"]
            })
            continue

        assigned_teacher = try_assign_teacher(exam, max_per_day)

        # Coverage fallback: allow up to 2 duties/day when strict limit leaves exam unassigned.
        if not assigned_teacher and max_per_day < 2:
            assigned_teacher = try_assign_teacher(exam, 2)

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