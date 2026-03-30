"""
Constraint Engine for Scheduling System
Separates hard constraints (must-have) and soft constraints (optimize)
"""

from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class ConstraintEngine:
    """Validates hard and soft constraints for duty allocation"""

    def __init__(
        self,
        teachers: List[Dict[str, Any]],
        exams: List[Dict[str, Any]],
        teacher_leaves: List[Dict[str, Any]],
        policies: List[Dict[str, Any]],
    ):
        self.teachers = teachers
        self.exams = exams
        self.teacher_leaves = teacher_leaves
        self.policies = policies
        self._build_leaves_map()
        self._build_availability_map()

    def _build_leaves_map(self):
        """Build map of teacher_id -> leave_dates"""
        self.leave_map = {}
        for leave in self.teacher_leaves:
            teacher_id = leave["teacher_id"]
            if teacher_id not in self.leave_map:
                self.leave_map[teacher_id] = []
            self.leave_map[teacher_id].append(leave["leave_date"])

    def _build_availability_map(self):
        """Build map of teacher_id -> available_dates"""
        self.availability_map = {}
        for teacher in self.teachers:
            available_dates = [a["date"] for a in teacher.get("availability", [])]
            self.availability_map[teacher["_id"]] = available_dates

    # ============ HARD CONSTRAINTS ============
    def check_hard_constraints(
        self,
        teacher: Dict[str, Any],
        exam: Dict[str, Any],
        assigned_duties: Dict[str, List[str]],
    ) -> Tuple[bool, str]:
        """
        Check all hard constraints.
        Returns (is_valid, reason_if_invalid)
        """

        # HC1: Teacher not on leave
        if not self._check_not_on_leave(teacher, exam):
            return False, f"Teacher {teacher['email']} is on leave on {exam['exam_date']}"

        # HC2: Teacher is available (marked as available)
        if not self._check_available(teacher, exam):
            return False, f"Teacher {teacher['email']} not marked available on {exam['exam_date']}"

        # HC3: No subject conflict
        if not self._check_no_subject_conflict(teacher, exam):
            return False, f"Teacher {teacher['email']} teaches subject {exam['subject']}"

        # HC4: No double booking at same time
        if not self._check_no_double_booking(
            teacher, exam, assigned_duties
        ):
            return False, f"Teacher {teacher['email']} already assigned at {exam['exam_date']} {exam['start_time']}"

        # HC5: Room requirement met (not applicable for all roles)
        if not self._check_room_requirements(teacher, exam):
            return False, f"Room requirements not met for {exam['subject']}"

        return True, ""

    def _check_not_on_leave(
        self, teacher: Dict[str, Any], exam: Dict[str, Any]
    ) -> bool:
        """HC1: Teacher must not be on leave"""
        teacher_id = teacher["_id"]
        exam_date = exam["exam_date"]
        leaves = self.leave_map.get(teacher_id, [])
        return exam_date not in leaves

    def _check_available(
        self, teacher: Dict[str, Any], exam: Dict[str, Any]
    ) -> bool:
        """HC2: Teacher must be marked as available for date"""
        teacher_id = teacher["_id"]
        exam_date = exam["exam_date"]
        available_dates = self.availability_map.get(teacher_id, [])
        # If no availability is specified, assume available
        if not available_dates:
            return True
        return exam_date in available_dates

    def _check_no_subject_conflict(
        self, teacher: Dict[str, Any], exam: Dict[str, Any]
    ) -> bool:
        """HC3: Teacher must not teach the subject being examined"""
        teacher_subject = teacher.get("subject", "").lower().strip()
        exam_subject = exam.get("subject", "").lower().strip()
        return teacher_subject != exam_subject

    def _check_no_double_booking(
        self,
        teacher: Dict[str, Any],
        exam: Dict[str, Any],
        assigned_duties: Dict[str, List[str]],
    ) -> bool:
        """HC4: Teacher cannot be assigned to multiple exams at same time"""
        teacher_id = teacher["_id"]
        exam_date = exam["exam_date"]
        exam_start = exam.get("start_time", "")
        exam_end = exam.get("end_time", "")
        
        # Create a unique duty identifier (date + time)
        exam_duty_id = f"{exam_date}_{exam_start}"

        # Check if teacher already assigned to same exam slot
        teacher_duties = assigned_duties.get(teacher_id, [])
        for duty in teacher_duties:
            # Exact match means same exam slot
            if duty == exam_duty_id:
                return False
            
            # Additional check: if same date but overlapping time
            # For now, assuming different start times = different sessions
            # This allows same-day assignments of different exams

        return True

    def _check_room_requirements(
        self, teacher: Dict[str, Any], exam: Dict[str, Any]
    ) -> bool:
        """HC5: Room must be assigned (if required)"""
        return bool(exam.get("room_number"))

    # ============ SOFT CONSTRAINTS ============
    def compute_soft_constraint_violations(
        self,
        teacher: Dict[str, Any],
        exam: Dict[str, Any],
        assigned_duties: Dict[str, List[str]],
    ) -> Dict[str, float]:
        """
        Compute violations of soft constraints.
        Returns dict of constraint_name -> penalty_score
        """
        violations = {}

        # SC1: Back-to-back assignments penalty
        violations["back_to_back"] = self._compute_back_to_back_penalty(
            teacher, exam, assigned_duties
        )

        # SC2: Department balance penalty
        violations["department_balance"] = (
            self._compute_department_imbalance_penalty(teacher, exam)
        )

        # SC3: Workload distribution penalty
        violations["workload_variance"] = self._compute_workload_variance_penalty(
            teacher
        )

        # SC4: Same-day multiple duties penalty
        violations["same_day_multiple"] = self._compute_same_day_penalty(
            teacher, exam, assigned_duties
        )

        return violations

    def _compute_back_to_back_penalty(
        self,
        teacher: Dict[str, Any],
        exam: Dict[str, Any],
        assigned_duties: Dict[str, List[str]],
    ) -> float:
        """SC1: Penalize back-to-back assignments"""
        teacher_id = teacher["_id"]
        teacher_duties = assigned_duties.get(teacher_id, [])

        # If teacher has duties, check for gaps
        if teacher_duties:
            # Simplified: just count as penalty if has existing duties
            return 0.5

        return 0.0

    def _compute_department_imbalance_penalty(
        self, teacher: Dict[str, Any], exam: Dict[str, Any]
    ) -> float:
        """SC2: Penalize if assigning same department multiple times"""
        teacher_dept = teacher.get("department", "")
        exam_dept = exam.get("department", "")

        # If different departments, no penalty
        if teacher_dept != exam_dept:
            return 0.0

        # Same department gets small bonus, not penalty
        return -0.2  # Negative = bonus

    def _compute_workload_variance_penalty(
        self, teacher: Dict[str, Any]
    ) -> float:
        """SC3: Penalize if teacher already has high workload"""
        total_duties = teacher.get("total_duties", 0)
        mean_expected_duties = 2.0  # Average expected

        # Penalty increases with distance from mean
        deviation = abs(total_duties - mean_expected_duties)
        return deviation * 0.3

    def _compute_same_day_penalty(
        self,
        teacher: Dict[str, Any],
        exam: Dict[str, Any],
        assigned_duties: Dict[str, List[str]],
    ) -> float:
        """SC4: Penalize multiple duties on same day"""
        teacher_id = teacher["_id"]
        exam_date = exam["exam_date"]
        teacher_duties = assigned_duties.get(teacher_id, [])

        # Count duties on same date
        same_day_count = sum(
            1 for duty in teacher_duties if duty.startswith(exam_date)
        )

        # Each additional duty on same day: penalty
        return same_day_count * 0.4

    # ============ UTILITY METHODS ============
    def get_policy_for_teacher(
        self, teacher: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get applicable policy for teacher's department"""
        dept = teacher.get("department", "")
        for policy in self.policies:
            if policy["department"] == dept:
                return policy
        # Return default policy
        return {
            "max_daily_duties": 3,
            "allow_external_allocation": True,
            "seniority_override": False,
        }

    def check_daily_duty_limit(
        self,
        teacher: Dict[str, Any],
        exam: Dict[str, Any],
        assigned_duties: Dict[str, List[str]],
    ) -> bool:
        """Check if assigning this exam violates daily duty limit per policy"""
        policy = self.get_policy_for_teacher(teacher)
        max_daily = policy["max_daily_duties"]

        teacher_id = teacher["_id"]
        exam_date = exam["exam_date"]
        teacher_duties = assigned_duties.get(teacher_id, [])

        same_day_duties = sum(
            1 for duty in teacher_duties if duty.startswith(exam_date)
        )

        return same_day_duties < max_daily
