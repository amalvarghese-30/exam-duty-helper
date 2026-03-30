"""
Conflict Resolution Engine
Detects and resolves allocation conflicts
"""

from typing import List, Dict, Any, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class ConflictResolver:
    """Detects and resolves conflicts in duty allocations"""

    def __init__(self, constraint_engine):
        self.constraints = constraint_engine
        self.conflicts = []

    def detect_all_conflicts(
        self,
        allocated_duties: Dict[str, Any],
        assigned_duties: Dict[str, List[str]],
        teachers: List[Dict[str, Any]],
        exams: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Comprehensive conflict detection.
        Returns list of detected conflicts.
        """
        self.conflicts = []

        # Check for overload conflicts
        self.detect_overload_conflicts(assigned_duties, teachers)

        # Check for double bookings
        self.detect_double_bookings(assigned_duties)

        # Check for policy violations
        self.detect_policy_violations(
            allocated_duties, assigned_duties, teachers
        )

        # Check for missing roles
        self.detect_missing_roles(allocated_duties, exams)

        logger.info(f"Detected {len(self.conflicts)} conflict(s)")
        return self.conflicts

    def detect_overload_conflicts(
        self,
        assigned_duties: Dict[str, List[str]],
        teachers: List[Dict[str, Any]],
    ) -> None:
        """Detect teachers assigned beyond reasonable limits"""

        for teacher in teachers:
            teacher_id = teacher["_id"]
            duties = assigned_duties.get(teacher_id, [])

            policy = self.constraints.get_policy_for_teacher(teacher)
            max_daily = policy.get("max_daily_duties", 3)

            # Count duties per day
            daily_duties = {}
            for duty in duties:
                date = duty.split("_")[0]
                daily_duties[date] = daily_duties.get(date, 0) + 1

            # Check for violations
            for date, count in daily_duties.items():
                if count > max_daily:
                    self.conflicts.append(
                        {
                            "type": "overload",
                            "severity": "high",
                            "teacher_id": teacher_id,
                            "teacher_name": teacher["name"],
                            "date": date,
                            "duties_assigned": count,
                            "max_allowed": max_daily,
                            "violation_count": count - max_daily,
                        }
                    )

    def detect_double_bookings(
        self, assigned_duties: Dict[str, List[str]]
    ) -> None:
        """Detect teachers assigned to overlapping time slots"""

        for teacher_id, duties in assigned_duties.items():
            time_slots = {}

            for duty in duties:
                parts = duty.split("_")
                if len(parts) >= 2:
                    time_slot = "_".join(parts[:2])  # date_time

                    if time_slot in time_slots:
                        self.conflicts.append(
                            {
                                "type": "double_booking",
                                "severity": "critical",
                                "teacher_id": teacher_id,
                                "date": parts[0],
                                "time": parts[1] if len(parts) > 1 else "unknown",
                                "conflicting_duties": [
                                    time_slots[time_slot],
                                    duty,
                                ],
                            }
                        )
                    else:
                        time_slots[time_slot] = duty

    def detect_policy_violations(
        self,
        allocated_duties: Dict[str, Any],
        assigned_duties: Dict[str, List[str]],
        teachers: List[Dict[str, Any]],
    ) -> None:
        """Detect violations of department policies"""

        for teacher in teachers:
            teacher_id = teacher["_id"]
            duties = assigned_duties.get(teacher_id, [])
            policy = self.constraints.get_policy_for_teacher(teacher)

            # Check seniority requirement
            min_seniority = policy.get("min_seniority_years", 0)
            if teacher.get("seniority_years", 0) < min_seniority:
                self.conflicts.append(
                    {
                        "type": "seniority_violation",
                        "severity": "medium",
                        "teacher_id": teacher_id,
                        "teacher_name": teacher["name"],
                        "teacher_seniority": teacher.get("seniority_years", 0),
                        "required_seniority": min_seniority,
                    }
                )

    def detect_missing_roles(
        self,
        allocated_duties: Dict[str, Any],
        exams: List[Dict[str, Any]],
    ) -> None:
        """Detect exams missing required roles"""

        for exam_id, allocation in allocated_duties.items():
            required_roles = self._get_exam_required_roles(exam_id, exams)

            for role, count in required_roles.items():
                assigned = len(allocation.get("roles", {}).get(role, []))

                if assigned < count:
                    self.conflicts.append(
                        {
                            "type": "missing_role",
                            "severity": "high",
                            "exam_id": exam_id,
                            "exam_subject": allocation.get("subject", ""),
                            "role": role,
                            "required": count,
                            "assigned": assigned,
                            "shortage": count - assigned,
                        }
                    )

    def auto_fix_conflicts(
        self,
        conflicts: List[Dict[str, Any]],
        allocated_duties: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Attempt automatic fixes for detected conflicts.
        Returns summary of fixes applied.
        """
        fixes_applied = []

        for conflict in conflicts:
            conflict_type = conflict.get("type")

            if conflict_type == "overload":
                # Potential fix: recommend swap
                fix = self._suggest_swap(conflict)
                if fix:
                    fixes_applied.append(fix)

            elif conflict_type == "missing_role":
                # Potential fix: suggest additional allocation
                fix = {
                    "action": "increase_allocation",
                    "exam_id": conflict["exam_id"],
                    "role": conflict["role"],
                    "additional_needed": conflict["shortage"],
                }
                fixes_applied.append(fix)

        return {
            "total_conflicts": len(conflicts),
            "auto_fixed": len(fixes_applied),
            "unfixed": len(conflicts) - len(fixes_applied),
            "suggestions": fixes_applied,
        }

    def _suggest_swap(self, conflict: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Suggest a swap to resolve overload conflict"""
        return {
            "action": "suggest_swap",
            "teacher_id": conflict["teacher_id"],
            "date": conflict["date"],
            "excess_duties": conflict["violation_count"],
            "suggestion": (
                f"Reassign {conflict['violation_count']} duty/duties "
                f"for {conflict['teacher_name']} on {conflict['date']}"
            ),
        }

    def _get_exam_required_roles(
        self, exam_id: str, exams: List[Dict[str, Any]]
    ) -> Dict[str, int]:
        """Get required roles for an exam"""
        for exam in exams:
            if exam.get("_id") == exam_id:
                return exam.get("required_roles", {"invigilator": 1})
        return {}

    def get_conflicts_summary(self) -> Dict[str, Any]:
        """Get summary of all detected conflicts"""
        by_type = {}
        for conflict in self.conflicts:
            conflict_type = conflict.get("type", "unknown")
            if conflict_type not in by_type:
                by_type[conflict_type] = []
            by_type[conflict_type].append(conflict)

        return {
            "total_conflicts": len(self.conflicts),
            "by_severity": self._group_by_severity(),
            "by_type": by_type,
        }

    def _group_by_severity(self) -> Dict[str, List[Dict[str, Any]]]:
        """Group conflicts by severity"""
        by_severity = {}
        for conflict in self.conflicts:
            severity = conflict.get("severity", "unknown")
            if severity not in by_severity:
                by_severity[severity] = []
            by_severity[severity].append(conflict)
        return by_severity
