"""
Scoring Engine for Scheduling System
Computes multi-factor scores for allocation candidates
"""

from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class ScoringEngine:
    """Computes candidate scores for intelligent allocation"""

    def __init__(
        self,
        teachers: List[Dict[str, Any]],
        exams: List[Dict[str, Any]],
        policies: List[Dict[str, Any]],
    ):
        self.teachers = teachers
        self.exams = exams
        self.policies = policies
        self._compute_teacher_stats()

    def _compute_teacher_stats(self):
        """Pre-compute statistics for all teachers"""
        self.teacher_stats = {}
        all_duties = [t["total_duties"] for t in self.teachers if t["is_active"]]

        self.mean_duties = sum(all_duties) / len(all_duties) if all_duties else 0
        self.max_duties = max(all_duties) if all_duties else 0
        self.min_duties = min(all_duties) if all_duties else 0

        for teacher in self.teachers:
            self.teacher_stats[teacher["_id"]] = {
                "load_ratio": teacher["total_duties"] / (self.max_duties + 1),
                "seniority_score": min(teacher["seniority_years"] / 20.0, 1.0),
            }

    def compute_overall_score(
        self,
        teacher: Dict[str, Any],
        exam: Dict[str, Any],
        assigned_duties: Dict[str, List[str]],
        soft_violations: Dict[str, float],
    ) -> float:
        """
        Compute overall allocation score.
        Higher score = better candidate
        """
        score = 0.0

        # Component 1: Remaining Capacity (HIGH PRIORITY)
        # Teachers with lower workload should get preference
        remaining_capacity_score = self._compute_remaining_capacity_score(
            teacher
        )
        score += remaining_capacity_score * 5.0

        # Component 2: Soft Constraint Penalties (MEDIUM PRIORITY)
        total_soft_penalty = sum(soft_violations.values())
        score -= abs(total_soft_penalty) * 2.0

        # Component 3: Seniority Weight (LOW PRIORITY)
        seniority_score = self._compute_seniority_score(teacher)
        score += seniority_score * 1.0

        # Component 4: Reliability Score (MEDIUM PRIORITY)
        reliability_score = teacher.get("reliability_score", 0.8)
        score += reliability_score * 2.0

        # Component 5: Department Match Bonus
        dept_match_score = self._compute_department_match_score(teacher, exam)
        score += dept_match_score * 1.5

        # Component 6: Fairness Score
        fairness_score = self._compute_fairness_score(teacher)
        score += fairness_score * 3.0

        return score

    def _compute_remaining_capacity_score(
        self, teacher: Dict[str, Any]
    ) -> float:
        """
        Score based on available capacity.
        Teachers with less workload score higher.
        Range: 0 to 1
        """
        teacher_duties = teacher["total_duties"]

        # Inverse of load ratio - lower duties = higher score
        if self.max_duties == 0:
            return 1.0

        load_ratio = teacher_duties / (self.max_duties + 1)
        # Score: 1 - load_ratio gives inverse priority
        return max(0.0, 1.0 - load_ratio)

    def _compute_seniority_score(self, teacher: Dict[str, Any]) -> float:
        """
        Score based on seniority (experience).
        More senior teachers might be preferred for complex exams.
        Range: 0 to 1
        """
        seniority_years = teacher.get("seniority_years", 0)
        # Normalize to 0-1: assume max 30 years
        return min(seniority_years / 30.0, 1.0)

    def _compute_department_match_score(
        self, teacher: Dict[str, Any], exam: Dict[str, Any]
    ) -> float:
        """
        Score bonus if teacher and exam from same department.
        Encourages internal allocation over external.
        Range: -1 to 1
        """
        teacher_dept = teacher.get("department", "").lower()
        exam_dept = exam.get("department", "").lower()

        if not teacher_dept or not exam_dept:
            return 0.0

        if teacher_dept == exam_dept:
            return 1.0  # Full bonus for same department
        else:
            return -0.5  # Penalty for external

    def _compute_fairness_score(self, teacher: Dict[str, Any]) -> float:
        """
        Score penalty if teacher is far from mean workload.
        Promotes fair distribution across all teachers.
        Range: -1 to 0 (always penalty/neutral)
        """
        if self.mean_duties == 0:
            return 0.0

        deviation_from_mean = abs(teacher["total_duties"] - self.mean_duties)
        max_possible_deviation = self.max_duties - self.mean_duties + 1

        # Normalize deviation to 0-1
        normalized_deviation = deviation_from_mean / max_possible_deviation

        # Return negative score (more deviation = worse score)
        return -(normalized_deviation)

    def rank_candidates(
        self,
        candidates: List[Dict[str, Any]],
        exam: Dict[str, Any],
        assigned_duties: Dict[str, List[str]],
        soft_violations_dict: Dict[str, Dict[str, float]],
    ) -> List[tuple]:
        """
        Rank candidates by score.
        Returns list of (teacher, score) tuples sorted by score descending
        """
        ranked = []

        for candidate in candidates:
            candidate_id = candidate["_id"]
            soft_violations = soft_violations_dict.get(candidate_id, {})

            score = self.compute_overall_score(
                candidate, exam, assigned_duties, soft_violations
            )

            ranked.append((candidate, score))

        # Sort by score descending (higher score = better)
        ranked.sort(key=lambda x: x[1], reverse=True)

        return ranked

    def explain_score(
        self,
        teacher: Dict[str, Any],
        exam: Dict[str, Any],
        assigned_duties: Dict[str, List[str]],
        soft_violations: Dict[str, float],
    ) -> Dict[str, Any]:
        """
        Detailed breakdown of score components for explainability
        """
        remaining_capacity = self._compute_remaining_capacity_score(teacher)
        seniority = self._compute_seniority_score(teacher)
        dept_match = self._compute_department_match_score(teacher, exam)
        fairness = self._compute_fairness_score(teacher)

        breakdown = {
            "teacher_id": teacher["_id"],
            "teacher_name": teacher["name"],
            "exam_subject": exam["subject"],
            "components": {
                "remaining_capacity": {
                    "value": remaining_capacity,
                    "weight": 5.0,
                    "contribution": remaining_capacity * 5.0,
                },
                "seniority": {
                    "value": seniority,
                    "weight": 1.0,
                    "contribution": seniority * 1.0,
                },
                "reliability": {
                    "value": teacher.get("reliability_score", 0.8),
                    "weight": 2.0,
                    "contribution": teacher.get("reliability_score", 0.8) * 2.0,
                },
                "department_match": {
                    "value": dept_match,
                    "weight": 1.5,
                    "contribution": dept_match * 1.5,
                },
                "fairness": {
                    "value": fairness,
                    "weight": 3.0,
                    "contribution": fairness * 3.0,
                },
                "soft_constraints": {
                    "violations": soft_violations,
                    "weight": -2.0,
                    "contribution": -sum(soft_violations.values()) * 2.0,
                },
            },
            "total_score": self.compute_overall_score(
                teacher, exam, assigned_duties, soft_violations
            ),
        }

        return breakdown
