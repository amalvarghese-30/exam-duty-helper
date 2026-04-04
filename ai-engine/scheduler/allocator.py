"""
Role-Based Allocation Engine
Orchestrates the complete allocation pipeline with role support
"""

from typing import List, Dict, Any, Optional, Tuple
import logging
from datetime import datetime

# ADD THIS IMPORT
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from gemini_reviewer import GeminiFairnessReviewer
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("Gemini reviewer not available")

logger = logging.getLogger(__name__)


class AllocationEngine:
    """
    Main orchestrator for duty allocation.
    Supports role-based assignments (invigilator, supervisor, coordinator, etc.)
    """

    def __init__(
        self,
        constraint_engine,
        scoring_engine,
        loader=None,
    ):
        """
        Args:
            constraint_engine: ConstraintEngine instance
            scoring_engine: ScoringEngine instance
            loader: ScheduleLoader instance
        """
        self.constraints = constraint_engine
        self.scorer = scoring_engine
        self.loader = loader
        self.allocation_log = []

        if GEMINI_AVAILABLE:
            self.explainer = GeminiFairnessReviewer()
        else:
            self.explainer = None

    def allocate_all_duties(
        self,
        teachers: List[Dict[str, Any]],
        exams: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Main allocation pipeline.
        Returns complete allocation with statistics.
        """
        logger.info(f"Starting allocation for {len(exams)} exams")

        allocated_duties = {}  # exam_id -> [assigned_teachers_info]
        assigned_duties = {}   # teacher_id -> [duty_list]
        unallocated_exams = []
        allocation_breakdown = []

        # Sort exams by complexity (more roles = process first)
        sorted_exams = sorted(
            exams,
            key=lambda e: sum(e.get("required_roles", {}).values()),
            reverse=True,
        )

        for exam in sorted_exams:
            exam_id = exam["_id"]
            roles_needed = exam.get("required_roles", {})

            exam_allocation = {
                "exam_id": exam_id,
                "subject": exam["subject"],
                "date": exam["exam_date"],
                "roles": {},
            }

            # Allocate each role for this exam
            all_roles_allocated = True
            for role, count in roles_needed.items():
                role_assignments = self._allocate_role(
                    teachers, exam, role, count, assigned_duties
                )

                if len(role_assignments) < count:
                    logger.warning(
                        f"Could not allocate all {role}s for {exam['subject']}: "
                        f"allocated {len(role_assignments)}/{count}"
                    )
                    all_roles_allocated = False

                exam_allocation["roles"][role] = role_assignments

            if not all_roles_allocated:
                unallocated_exams.append(exam_id)

            allocated_duties[exam_id] = exam_allocation
            allocation_breakdown.append(exam_allocation)

        # Compute statistics
        stats = self._compute_allocation_statistics(
            allocated_duties, assigned_duties, teachers, exams, unallocated_exams
        )

        return {
            "status": "success" if not unallocated_exams else "partial",
            "allocated_duties": allocated_duties,
            "assigned_duties_per_teacher": assigned_duties,
            "unallocated_exams": unallocated_exams,
            "statistics": stats,
            "allocation_breakdown": allocation_breakdown,
            "timestamp": datetime.now().isoformat(),
        }

    def _allocate_role(
        self,
        teachers: List[Dict[str, Any]],
        exam: Dict[str, Any],
        role: str,
        count: int,
        assigned_duties: Dict[str, List[str]],
    ) -> List[Dict[str, Any]]:
        """
        Allocate teachers for a specific role in an exam.
        Uses scoring to select best candidates.
        """
        role_assignments = []
        attempted = 0
        max_attempts = len(teachers) * 2  # Prevent infinite loops

        while len(role_assignments) < count and attempted < max_attempts:
            attempted += 1

            # Get candidates who haven't been filtered out
            candidates = self._get_valid_candidates(
                teachers, exam, assigned_duties, role_assignments
            )

            if not candidates:
                logger.warning(
                    f"No valid candidates for {role} in {exam['subject']}"
                )
                break

            # Compute soft violations for all candidates
            soft_violations_dict = {}
            for candidate in candidates:
                violations = (
                    self.constraints.compute_soft_constraint_violations(
                        candidate, exam, assigned_duties
                    )
                )
                soft_violations_dict[candidate["_id"]] = violations

            # Rank candidates by score
            ranked = self.scorer.rank_candidates(
                candidates, exam, assigned_duties, soft_violations_dict
            )

            if not ranked:
                logger.warning(
                    f"No ranked candidates for {role} in {exam['subject']}"
                )
                break

            # Select best candidate
            best_candidate, score = ranked[0]
            teacher_id = best_candidate["_id"]

            assignment = {
                "teacher_id": teacher_id,
                "teacher_name": best_candidate["name"],
                "teacher_email": best_candidate["email"],
                "role": role,
                "score": float(score),
            }
            
            # ADD AI EXPLANATION
            if self.explainer:
                try:
                    # Build fairness metrics for explanation
                    fairness_metrics = {
                        "mean": 2.0,  # Default, will be updated
                        "std_dev": 0,
                        "total_allocations": len(role_assignments)
                    }
                    
                    explanation = self.explainer.generate_fairness_explanation(
                        {"allocated_duties": {}},  # Simplified for now
                        teacher_id,
                        fairness_metrics
                    )
                    
                    if explanation.get("status") == "success":
                        assignment["ai_explanation"] = explanation.get("explanation", "")
                    else:
                        assignment["ai_explanation"] = f"Selected due to high score ({score:.2f})"
                except Exception as e:
                    logger.debug(f"Could not generate AI explanation: {e}")
                    assignment["ai_explanation"] = f"Selected due to high score ({score:.2f})"
            else:
                assignment["ai_explanation"] = f"Selected due to high score ({score:.2f})"

            # Record assignment
            role_assignments.append(assignment)

            # Update tracking
            duty_record = f"{exam['exam_date']}_{exam['start_time']}"
            if teacher_id not in assigned_duties:
                assigned_duties[teacher_id] = []
            assigned_duties[teacher_id].append(duty_record)

            # Update teacher's total duties in-memory (for this allocation session)
            best_candidate["total_duties"] += 1

            self.allocation_log.append(
                {
                    "exam": exam["subject"],
                    "role": role,
                    "teacher": best_candidate["name"],
                    "score": float(score),
                    "explanation": assignment.get("ai_explanation", "")
                }
            )

            logger.debug(
                f"Allocated {best_candidate['name']} for {role} in {exam['subject']} (score: {score:.2f})"
            )

        return role_assignments
    
    def _get_valid_candidates(
        self,
        teachers: List[Dict[str, Any]],
        exam: Dict[str, Any],
        assigned_duties: Dict[str, List[str]],
        already_assigned: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Filter teachers to get valid candidates for allocation.
        Applies hard constraints.
        ✨ Phase 2: Skips locked allocations for safe rescheduling
        """
        valid = []

        # Already assigned teacher IDs for this exam
        already_assigned_ids = {a["teacher_id"] for a in already_assigned}

        for teacher in teachers:
            teacher_id = teacher["_id"]

            # Skip if already assigned to this exam
            if teacher_id in already_assigned_ids:
                continue

            # Skip inactive teachers
            if not teacher.get("is_active", True):
                continue

            # ✨ Phase 2: Skip teachers with LOCKED allocations for this exam
            # This protects admin overrides during rescheduling events
            if self._has_locked_allocation_for_exam(teacher_id, exam):
                logger.debug(
                    f"Skipped {teacher['name']}: has locked allocation for this exam"
                )
                continue

            # Check hard constraints
            is_valid, reason = self.constraints.check_hard_constraints(
                teacher, exam, assigned_duties
            )

            if not is_valid:
                logger.debug(f"Rejected {teacher['name']}: {reason}")
                continue

            # Check daily limit
            if not self.constraints.check_daily_duty_limit(
                teacher, exam, assigned_duties
            ):
                logger.debug(
                    f"Rejected {teacher['name']}: daily duty limit exceeded"
                )
                continue

            # Apply dynamic NLP rules (if provided)
            if hasattr(self.constraints, "apply_dynamic_rules"):
                if not self.constraints.apply_dynamic_rules(
                    teacher,
                    exam,
                    assigned_duties
                ):
                    continue

            valid.append(teacher)

        return valid

    def _has_locked_allocation_for_exam(
        self, teacher_id: str, exam: Dict[str, Any]
    ) -> bool:
        """
        Check if teacher has a locked allocation for this exam.
        ✨ Phase 2: Protects admin overrides during rescheduling
        
        This is a placeholder that will be connected to MongoDB in Phase 2.
        For now, checks the exam's locked_allocations list if present.
        """
        exam_id = exam.get("_id")
        locked_allocations = exam.get("locked_allocations", [])
        
        for allocation in locked_allocations:
            if allocation.get("teacher_id") == teacher_id:
                return True
        
        return False

    def _compute_allocation_statistics(
        self,
        allocated_duties: Dict[str, Any],
        assigned_duties: Dict[str, List[str]],
        teachers: List[Dict[str, Any]],
        exams: List[Dict[str, Any]],
        unallocated_exams: List[str],
    ) -> Dict[str, Any]:
        """Compute allocation statistics and metrics"""

        total_exams = len(exams)
        allocated_exams = total_exams - len(unallocated_exams)
        success_rate = (
            (allocated_exams / total_exams * 100) if total_exams > 0 else 0
        )

        # Compute workload statistics
        teacher_workloads = [
            len(assigned_duties.get(t["_id"], []))
            for t in teachers
            if t.get("is_active", True)
        ]

        if teacher_workloads:
            mean_workload = sum(teacher_workloads) / len(teacher_workloads)
            variance = sum(
                (x - mean_workload) ** 2 for x in teacher_workloads
            ) / len(teacher_workloads)
            std_dev = variance ** 0.5
        else:
            mean_workload = variance = std_dev = 0

        return {
            "total_exams": total_exams,
            "allocated_exams": allocated_exams,
            "unallocated_exams": len(unallocated_exams),
            "success_rate_percent": round(success_rate, 2),
            "total_teachers": len(teachers),
            "active_teachers": sum(
                1 for t in teachers if t.get("is_active", True)
            ),
            "workload_statistics": {
                "mean": round(mean_workload, 2),
                "std_dev": round(std_dev, 2),
                "variance": round(variance, 2),
                "min": min(teacher_workloads) if teacher_workloads else 0,
                "max": max(teacher_workloads) if teacher_workloads else 0,
            },
            "total_allocations": sum(
                len(assigned_duties.get(t["_id"], []))
                for t in teachers
            ),
        }

    def get_allocation_log(self) -> List[Dict[str, Any]]:
        """Get detailed log of all allocations"""
        return self.allocation_log