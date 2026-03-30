"""
Swap Recommendation Engine (Phase 2)
Detects workload imbalances and suggests beneficial swaps.

Features:
- Identify overloaded teachers
- Find compatible swap partners  
- Validate constraint compliance
- Estimate fairness improvements

Use case: Admin reviews allocation and asks "who can swap with Alice?"
Response: "Bob is underloaded and suitable. Swapping improves fairness by 15%"
"""

from typing import List, Dict, Any, Optional, Tuple
import logging
import math

logger = logging.getLogger(__name__)


class SwapEngine:
    """
    Recommends beneficial duty swaps to improve fairness.
    """

    def __init__(
        self,
        constraint_engine,
        scoring_engine,
    ):
        """
        Args:
            constraint_engine: ConstraintEngine instance
            scoring_engine: ScoringEngine instance
        """
        self.constraints = constraint_engine
        self.scorer = scoring_engine

    def find_swap_recommendations(
        self,
        current_allocation: Dict[str, Any],
        teachers: List[Dict[str, Any]],
        exams: List[Dict[str, Any]],
        overload_threshold_std_dev: float = 1.5,
    ) -> Dict[str, Any]:
        """
        Find swap recommendations to improve fairness.
        
        Algorithm:
        1. Calculate fairness metrics (mean, std_dev)
        2. Identify overloaded teachers (duties > mean + threshold)
        3. Find underloaded candidates
        4. For each overloaded-underloaded pair:
           a. Find swappable duties (same exam role)
           b. Validate constraints
           c. Estimate fairness improvement
        5. Rank recommendations by improvement
        
        Args:
            current_allocation: Current exam -> [teachers] allocation
            teachers: List of teachers
            exams: List of exams
            overload_threshold_std_dev: How many std devs above mean = overloaded
            
        Returns:
            {
                "current_fairness": {
                    "mean_duties": float,
                    "std_dev": float,
                    "variance": float,
                },
                "overloaded_teachers": [
                    {
                        "teacher_id": str,
                        "name": str,
                        "current_duties": int,
                        "threshold": float,
                    }
                ],
                "swap_recommendations": [
                    {
                        "priority": int,
                        "overloaded_teacher": {...},
                        "underloaded_teacher": {...},
                        "swappable_duties": [...],
                        "fairness_improvement_percent": float,
                        "reason": str,
                    }
                ],
            }
        """
        logger.info("Finding swap recommendations...")
        
        # Step 1: Build duty tracking
        assigned_duties = self._build_assigned_duties(current_allocation)
        
        # Step 2: Calculate fairness metrics
        fairness_metrics = self._calculate_fairness_metrics(
            assigned_duties, teachers
        )
        
        mean_duties = fairness_metrics["mean"]
        std_dev = fairness_metrics["std_dev"]
        threshold = mean_duties + (overload_threshold_std_dev * std_dev)
        
        # Step 3: Identify overloaded teachers
        overloaded = self._identify_overloaded_teachers(
            assigned_duties, teachers, threshold
        )
        
        logger.info(f"Found {len(overloaded)} overloaded teachers")
        
        if not overloaded:
            return {
                "current_fairness": fairness_metrics,
                "overloaded_teachers": [],
                "swap_recommendations": [],
                "message": "All teachers are fairly loaded",
            }
        
        # Step 4: Identify underloaded teachers
        underloaded = self._identify_underloaded_teachers(
            assigned_duties, teachers, mean_duties * 0.5
        )
        
        logger.info(f"Found {len(underloaded)} underloaded teachers")
        
        # Step 5: Generate and evaluate swaps
        swap_recommendations = []
        
        for overloaded_teacher in overloaded:
            teacher_id = overloaded_teacher["teacher_id"]
            
            for underloaded_teacher in underloaded:
                underloaded_id = underloaded_teacher["teacher_id"]
                
                # Skip if same teacher
                if teacher_id == underloaded_id:
                    continue
                
                # Find swappable duties
                swappable = self._find_swappable_duties(
                    teacher_id,
                    underloaded_id,
                    current_allocation,
                    teachers,
                    exams,
                    assigned_duties,
                )
                
                if not swappable:
                    continue
                
                # Evaluate swap
                improvement = self._estimate_swap_improvement(
                    overloaded_teacher,
                    underloaded_teacher,
                    len(swappable),
                    fairness_metrics,
                )
                
                if improvement["improvement_percent"] > 0:
                    swap_recommendations.append({
                        "priority": round(improvement["improvement_percent"], 1),
                        "overloaded_teacher": overloaded_teacher,
                        "underloaded_teacher": underloaded_teacher,
                        "swappable_duties_count": len(swappable),
                        "swappable_duties": swappable,
                        "fairness_improvement_percent": round(
                            improvement["improvement_percent"], 1
                        ),
                        "new_variance": round(improvement["new_variance"], 3),
                        "reason": improvement["reason"],
                    })
        
        # Sort by priority (highest improvement first)
        swap_recommendations.sort(
            key=lambda x: x["priority"], reverse=True
        )
        
        return {
            "current_fairness": fairness_metrics,
            "overloaded_teachers": overloaded,
            "underloaded_teachers": underloaded,
            "swap_recommendations": swap_recommendations[:10],  # Top 10
            "total_opportunities": len(swap_recommendations),
        }

    def apply_swap(
        self,
        swap_recommendation: Dict[str, Any],
        current_allocation: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Apply a recommended swap to the allocation.
        
        Args:
            swap_recommendation: From find_swap_recommendations()
            current_allocation: Current allocation state
            
        Returns:
            {
                "status": "success|failed",
                "updated_allocation": {...},
                "changes": [...],
            }
        """
        logger.info("Applying swap recommendation...")
        
        try:
            updated_allocation = dict(current_allocation)
            changes = []
            
            swappable = swap_recommendation.get("swappable_duties", [])
            overloaded_id = swap_recommendation["overloaded_teacher"]["teacher_id"]
            underloaded_id = swap_recommendation["underloaded_teacher"]["teacher_id"]
            
            # For each swappable duty: reassign from overloaded to underloaded
            for duty in swappable:
                exam_id = duty["exam_id"]
                role = duty["role"]
                
                # Find the assignment in current allocation
                if exam_id not in updated_allocation:
                    continue
                
                exam_allocation = updated_allocation[exam_id]
                if role not in exam_allocation.get("roles", {}):
                    continue
                
                assignments = exam_allocation["roles"][role]
                
                # Find and replace the assignment
                for idx, assignment in enumerate(assignments):
                    if assignment.get("teacher_id") == overloaded_id:
                        old_assignment = assignment.copy()
                        
                        # Update to underloaded teacher
                        assignment["teacher_id"] = underloaded_id
                        assignment["allocation_method"] = "swap"
                        
                        changes.append({
                            "exam_id": exam_id,
                            "role": role,
                            "from_teacher": old_assignment,
                            "to_teacher": assignment,
                        })
                        
                        break
            
            return {
                "status": "success",
                "updated_allocation": updated_allocation,
                "changes": changes,
                "swaps_applied": len(changes),
            }
            
        except Exception as e:
            logger.error(f"Swap failed: {e}")
            return {
                "status": "failed",
                "error": str(e),
            }

    def _build_assigned_duties(
        self, current_allocation: Dict[str, Any]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Convert allocation format to duties per teacher."""
        duties = {}
        
        for exam_id, exam_alloc in current_allocation.items():
            roles = exam_alloc.get("roles", {})
            
            for role, assignments in roles.items():
                for assignment in assignments:
                    teacher_id = assignment.get("teacher_id")
                    if teacher_id:
                        if teacher_id not in duties:
                            duties[teacher_id] = []
                        
                        duties[teacher_id].append({
                            "exam_id": exam_id,
                            "role": role,
                            "assignment": assignment,
                        })
        
        return duties

    def _calculate_fairness_metrics(
        self,
        assigned_duties: Dict[str, List[Dict[str, Any]]],
        teachers: List[Dict[str, Any]],
    ) -> Dict[str, float]:
        """
        Calculate fairness metrics for current allocation.
        
        Returns:
            {
                "mean": mean duties per teacher,
                "std_dev": standard deviation,
                "variance": variance,
                "min": minimum duties,
                "max": maximum duties,
            }
        """
        active_teachers = [t for t in teachers if t.get("is_active", True)]
        
        if not active_teachers:
            return {
                "mean": 0,
                "std_dev": 0,
                "variance": 0,
                "min": 0,
                "max": 0,
            }
        
        duties_per_teacher = [
            len(assigned_duties.get(t["_id"], []))
            for t in active_teachers
        ]
        
        mean = sum(duties_per_teacher) / len(duties_per_teacher)
        variance = sum(
            (d - mean) ** 2 for d in duties_per_teacher
        ) / len(duties_per_teacher)
        std_dev = math.sqrt(variance)
        
        return {
            "mean": round(mean, 2),
            "std_dev": round(std_dev, 2),
            "variance": round(variance, 2),
            "min": min(duties_per_teacher),
            "max": max(duties_per_teacher),
        }

    def _identify_overloaded_teachers(
        self,
        assigned_duties: Dict[str, List[Dict[str, Any]]],
        teachers: List[Dict[str, Any]],
        threshold: float,
    ) -> List[Dict[str, Any]]:
        """Identify teachers with duties > threshold."""
        overloaded = []
        
        for teacher in teachers:
            if not teacher.get("is_active", True):
                continue
            
            teacher_id = teacher["_id"]
            duty_count = len(assigned_duties.get(teacher_id, []))
            
            if duty_count > threshold:
                overloaded.append({
                    "teacher_id": teacher_id,
                    "name": teacher.get("name"),
                    "email": teacher.get("email"),
                    "current_duties": duty_count,
                    "threshold": round(threshold, 1),
                    "excess": duty_count - int(threshold),
                })
        
        return overloaded

    def _identify_underloaded_teachers(
        self,
        assigned_duties: Dict[str, List[Dict[str, Any]]],
        teachers: List[Dict[str, Any]],
        underload_threshold: float,
    ) -> List[Dict[str, Any]]:
        """Identify teachers with duties < underload_threshold."""
        underloaded = []
        
        for teacher in teachers:
            if not teacher.get("is_active", True):
                continue
            
            teacher_id = teacher["_id"]
            duty_count = len(assigned_duties.get(teacher_id, []))
            
            if duty_count < underload_threshold:
                underloaded.append({
                    "teacher_id": teacher_id,
                    "name": teacher.get("name"),
                    "email": teacher.get("email"),
                    "current_duties": duty_count,
                    "capacity": int(underload_threshold) - duty_count,
                })
        
        return underloaded

    def _find_swappable_duties(
        self,
        overloaded_id: str,
        underloaded_id: str,
        current_allocation: Dict[str, Any],
        teachers: List[Dict[str, Any]],
        exams: List[Dict[str, Any]],
        assigned_duties: Dict[str, List[Dict[str, Any]]],
    ) -> List[Dict[str, Any]]:
        """
        Find duties from overloaded teacher that can be swapped to underloaded.
        
        Criteria:
        - Same role (can't swap invigilator to supervisor)
        - Underloaded teacher not already assigned to that exam
        - No hard constraint violations
        
        Returns list of swappable duties with exam_id and role.
        """
        swappable = []
        overloaded_duties = assigned_duties.get(overloaded_id, [])
        underloaded_duties = {
            d["exam_id"] for d in assigned_duties.get(underloaded_id, [])
        }
        
        # Get teachers as dict
        teachers_by_id = {t["_id"]: t for t in teachers}
        exams_by_id = {e["_id"]: e for e in exams}
        
        underloaded_teacher = teachers_by_id.get(underloaded_id)
        if not underloaded_teacher:
            return []
        
        for duty in overloaded_duties:
            exam_id = duty["exam_id"]
            role = duty["role"]
            
            # Skip if underloaded teacher already on this exam
            if exam_id in underloaded_duties:
                continue
            
            exam = exams_by_id.get(exam_id)
            if not exam:
                continue
            
            # Check if underloaded teacher can take this role
            is_valid, _ = self.constraints.check_hard_constraints(
                underloaded_teacher, exam, {}
            )
            
            if is_valid:
                swappable.append({
                    "exam_id": exam_id,
                    "role": role,
                    "exam_subject": exam.get("subject"),
                })
                
                if len(swappable) >= 3:  # Limit swaps to 3 per pair
                    break
        
        return swappable

    def _estimate_swap_improvement(
        self,
        overloaded: Dict[str, Any],
        underloaded: Dict[str, Any],
        swap_count: int,
        current_fairness: Dict[str, float],
    ) -> Dict[str, Any]:
        """
        Estimate fairness improvement from swapping duties.
        """
        # Simulate swap
        overloaded_new = overloaded["current_duties"] - swap_count
        underloaded_new = underloaded["current_duties"] + swap_count
        
        # Estimate new variance
        # Simplified: just count change in max-min spread
        improvement_percent = (
            ((overloaded["current_duties"] - underloaded_new) -
             (underloaded["current_duties"] - overloaded_new)) / 
            (current_fairness["std_dev"] + 0.1) * 10
        )
        
        return {
            "improvement_percent": max(0, improvement_percent),
            "new_variance": current_fairness["variance"] * 0.9,  # Approximate
            "reason": (
                f"Swap {swap_count} duties: {overloaded['name']} "
                f"({overloaded['current_duties']}→{overloaded_new}) "
                f"and {underloaded['name']} ({underloaded['current_duties']}→{underloaded_new})"
            ),
        }
