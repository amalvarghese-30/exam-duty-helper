"""
Scheduling Service - Production-Grade Allocation Pipeline
Phase 1: Core allocation engine with hard/soft constraints and role-based support
Phase 2: OR-Tools optimization and fairness minimization
Phase 3: Gemini AI integration and predictive workload

Main entry point for allocation orchestration.
"""

from typing import Dict
from .loader import ScheduleLoader
from .constraints import ConstraintEngine
from .scorer import ScoringEngine
from .allocator import AllocationEngine
from .resolver import ConflictResolver
from .optimizer import OptimizationEngine

__version__ = "1.0.0-alpha"
__all__ = [
    "ScheduleLoader",
    "ConstraintEngine",
    "ScoringEngine",
    "AllocationEngine",
    "ConflictResolver",
    "OptimizationEngine",
    "SchedulingPipeline",
    "generate_schedule",
]


def generate_schedule(teachers, exams):
    """Simple schedule generation with basic conflict avoidance."""
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


class SchedulingPipeline:
    """
    Main orchestrator for complete scheduling pipeline.
    Coordinates all components from loading to allocation to resolution.
    """

    def __init__(self, db_connection=None):
        """
        Initialize pipeline with database connection.

        Args:
            db_connection: MongoDB connection object
        """
        self.db = db_connection
        self.loader = ScheduleLoader(db_connection)
        self.constraint_engine = None
        self.scoring_engine = None
        self.allocation_engine = None
        self.conflict_resolver = None
        self.optimizer = None

    def run_full_allocation(
        self,
        institution_id: str,
        include_optimization: bool = False,
    ) -> Dict:
        """
        Execute complete allocation pipeline.

        Pipeline stages:
        1. Load Data - fetch teachers, exams, leaves, policies
        2. Normalize Constraints - build constraint engine
        3. Build Candidate Pools - filter by hard constraints
        4. Apply Scoring - compute multi-factor scores
        5. Run Allocation - assign with role support
        6. Resolve Conflicts - detect and suggest fixes
        7. Optimize (optional) - apply OR-Tools if enabled

        Args:
            institution_id: Institution to allocate for
            include_optimization: Include Phase 2 OR-Tools optimization

        Returns:
            Complete allocation result with statistics
        """
        try:
            # Stage 1: Load Data
            print(f"[1/7] Loading data for institution {institution_id}...")
            teachers = self.loader.load_teachers(institution_id)
            exams = self.loader.load_exams(institution_id)
            teacher_leaves = self.loader.load_teacher_leaves(institution_id)
            policies = self.loader.load_department_policies(institution_id)

            if not exams:
                return {"status": "error", "message": "No exams found"}
            if not teachers:
                return {"status": "error", "message": "No teachers found"}

            # Stage 2: Initialize Constraint Engine
            print("[2/7] Initializing constraint engine...")
            self.constraint_engine = ConstraintEngine(
                teachers, exams, teacher_leaves, policies
            )

            # Stage 3: Initialize Scoring Engine
            print("[3/7] Initializing scoring engine...")
            self.scoring_engine = ScoringEngine(teachers, exams, policies)

            # Stage 4: Initialize Allocation Engine
            print("[4/7] Initializing allocation engine...")
            self.allocation_engine = AllocationEngine(
                self.constraint_engine, self.scoring_engine, self.loader
            )

            # Stage 5: Run Allocation
            print("[5/7] Running allocation...")
            allocation_result = self.allocation_engine.allocate_all_duties(
                teachers, exams
            )

            # Stage 6: Detect and Resolve Conflicts
            print("[6/7] Detecting and resolving conflicts...")
            self.conflict_resolver = ConflictResolver(self.constraint_engine)
            conflicts = self.conflict_resolver.detect_all_conflicts(
                allocation_result["allocated_duties"],
                allocation_result["assigned_duties_per_teacher"],
                teachers,
                exams,
            )
            fix_suggestions = self.conflict_resolver.auto_fix_conflicts(
                conflicts, allocation_result["allocated_duties"]
            )

            allocation_result["conflicts"] = conflicts
            allocation_result["fix_suggestions"] = fix_suggestions

            # Stage 7: Optional Optimization
            if include_optimization:
                print("[7/7] Running optimization engine...")
                self.optimizer = OptimizationEngine(
                    teachers, exams, self.constraint_engine, self.scoring_engine
                )
                improvements = self.optimizer.suggest_improvements(
                    allocation_result
                )
                allocation_result["optimization_suggestions"] = improvements

            return allocation_result

        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "traceback": str(e.__traceback__),
            }

    def get_allocation_report(
        self, allocation_result: Dict
    ) -> Dict:
        """
        Generate human-readable allocation report.
        """
        return {
            "summary": {
                "total_exams": allocation_result.get("statistics", {}).get(
                    "total_exams"
                ),
                "allocated_exams": allocation_result.get("statistics", {}).get(
                    "allocated_exams"
                ),
                "success_rate": allocation_result.get("statistics", {}).get(
                    "success_rate_percent"
                ),
                "unallocated_exams": allocation_result.get(
                    "unallocated_exams", []
                ),
            },
            "workload_distribution": allocation_result.get("statistics", {}).get(
                "workload_statistics", {}
            ),
            "conflicts_summary": (
                self.conflict_resolver.get_conflicts_summary()
                if self.conflict_resolver
                else {}
            ),
            "allocation_breakdown": allocation_result.get(
                "allocation_breakdown", []
            ),
        }

    def export_to_mongodb(
        self,
        allocation_result: Dict,
        institution_id: str,
    ) -> bool:
        """
        Export allocation results to MongoDB.
        Will be implemented in backend integration.
        """
        if not self.db:
            return False

        try:
            # Insert allocation records into database
            # Implementation depends on backend structure
            return True
        except Exception as e:
            print(f"Error exporting to MongoDB: {e}")
            return False
