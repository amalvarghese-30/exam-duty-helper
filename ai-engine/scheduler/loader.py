"""
Data Loader for Scheduling System
Normalizes and loads data from MongoDB
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ScheduleLoader:
    """Loads and normalizes data for scheduling pipeline"""

    def __init__(self, db_connection=None):
        """
        Args:
            db_connection: MongoDB connection object
        """
        self.db = db_connection
        self.teachers = []
        self.exams = []
        self.teacher_leaves = []
        self.department_policies = []
        self.institution_id = None

    def load_teachers(self, institution_id: str) -> List[Dict[str, Any]]:
        """Load teachers from MongoDB"""
        try:
            teachers = self.db.teachers.find({"institution_id": institution_id})
            self.teachers = [self._normalize_teacher(t) for t in teachers]
            logger.info(f"Loaded {len(self.teachers)} teachers")
            return self.teachers
        except Exception as e:
            logger.error(f"Error loading teachers: {e}")
            return []

    def load_exams(self, institution_id: str) -> List[Dict[str, Any]]:
        """Load exams from MongoDB"""
        try:
            exams = self.db.exams.find({"institution_id": institution_id})
            self.exams = [self._normalize_exam(e) for e in exams]
            logger.info(f"Loaded {len(self.exams)} exams")
            return self.exams
        except Exception as e:
            logger.error(f"Error loading exams: {e}")
            return []

    def load_teacher_leaves(self, institution_id: str) -> List[Dict[str, Any]]:
        """Load teacher leaves/unavailability"""
        try:
            leaves = self.db.teacher_leaves.find({"institution_id": institution_id})
            self.teacher_leaves = [self._normalize_leave(l) for l in leaves]
            logger.info(f"Loaded {len(self.teacher_leaves)} teacher leaves")
            return self.teacher_leaves
        except Exception as e:
            logger.error(f"Error loading teacher leaves: {e}")
            return []

    def load_department_policies(self, institution_id: str) -> List[Dict[str, Any]]:
        """Load department policies for constraint rules"""
        try:
            policies = self.db.department_policies.find(
                {"institution_id": institution_id}
            )
            self.department_policies = [self._normalize_policy(p) for p in policies]
            logger.info(f"Loaded {len(self.department_policies)} department policies")
            return self.department_policies
        except Exception as e:
            logger.error(f"Error loading department policies: {e}")
            return []

    def _normalize_teacher(self, teacher: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize teacher data structure
        Handles both database format and REST API format
        """
        return {
            "_id": str(teacher.get("_id", "")),
            "name": teacher.get("name", ""),
            "email": teacher.get("email", ""),
            "department": teacher.get("department", ""),
            "subject": teacher.get("subject", ""),  # Ensure subject is present
            "seniority_years": teacher.get("seniority_years", 0),
            "reliability_score": teacher.get("reliability_score", 0.8),
            "total_duties": teacher.get("total_duties") or teacher.get("totalDuties", 0),
            "availability": teacher.get("availability", []),
            "is_active": teacher.get("is_active", True),
            "allowed_roles": teacher.get("allowed_roles", ["invigilator"]),
        }

    def _normalize_exam(self, exam: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize exam data structure
        Handles both database format and REST API format
        """
        # Handle exam_date vs date
        exam_date = exam.get("exam_date") or exam.get("date", "")
        
        # Handle time string conversion (e.g., "09:00 - 12:00" -> "09:00", "12:00")
        time_str = exam.get("start_time") or exam.get("time", "")
        start_time = ""
        end_time = ""
        
        if time_str and " - " in time_str:
            parts = time_str.split(" - ")
            start_time = parts[0].strip()
            end_time = parts[1].strip() if len(parts) > 1 else ""
        else:
            start_time = exam.get("start_time", "")
            end_time = exam.get("end_time", "")
        
        # Handle room_number vs room
        room = exam.get("room_number") or exam.get("room", "")
        
        return {
            "_id": str(exam.get("_id", "")),
            "subject": exam.get("subject", ""),
            "exam_date": exam_date,
            "start_time": start_time,
            "end_time": end_time,
            "room_number": room,
            "required_roles": exam.get("required_roles", {"invigilator": 1}),
            "total_slots": exam.get("required_roles", {}).get("invigilator", 1),
            "category": exam.get("category", "regular"),
            "department": exam.get("department", ""),
        }

    def _normalize_leave(self, leave: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize leave record"""
        return {
            "teacher_id": str(leave.get("teacher_id", "")),
            "leave_date": leave.get("leave_date", ""),
            "reason": leave.get("reason", ""),
            "type": leave.get("type", "leave"),  # 'leave', 'emergency', 'medical'
        }

    def _normalize_policy(self, policy: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize department policy"""
        return {
            "department": policy.get("department", ""),
            "max_daily_duties": policy.get("max_daily_duties", 3),
            "allow_external_allocation": policy.get("allow_external_allocation", True),
            "priority_subjects": policy.get("priority_subjects", []),
            "min_gap_between_duties_hours": policy.get(
                "min_gap_between_duties_hours", 1
            ),
            "seniority_override": policy.get("seniority_override", False),
            "min_seniority_years": policy.get("min_seniority_years", 0),
        }

    def get_teacher_by_id(self, teacher_id: str) -> Optional[Dict[str, Any]]:
        """Get single teacher by ID"""
        for teacher in self.teachers:
            if teacher["_id"] == teacher_id:
                return teacher
        return None

    def get_exam_by_id(self, exam_id: str) -> Optional[Dict[str, Any]]:
        """Get single exam by ID"""
        for exam in self.exams:
            if exam["_id"] == exam_id:
                return exam
        return None

    def get_policy_for_department(
        self, department: str
    ) -> Optional[Dict[str, Any]]:
        """Get policy for specific department"""
        for policy in self.department_policies:
            if policy["department"] == department:
                return policy
        return None

    def build_availability_map(self) -> Dict[str, List[str]]:
        """Build map of teacher -> available dates"""
        availability_map = {}
        for teacher in self.teachers:
            available_dates = [
                a["date"] for a in teacher.get("availability", [])
            ]
            availability_map[teacher["_id"]] = available_dates
        return availability_map

    def build_leave_map(self) -> Dict[str, List[str]]:
        """Build map of teacher -> leave dates"""
        leave_map = {}
        for leave in self.teacher_leaves:
            teacher_id = leave["teacher_id"]
            if teacher_id not in leave_map:
                leave_map[teacher_id] = []
            leave_map[teacher_id].append(leave["leave_date"])
        return leave_map
