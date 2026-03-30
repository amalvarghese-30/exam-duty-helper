"""
Phase 2 Integration Guide
Complete setup and usage examples for all Phase 2 modules.

This document shows how to integrate OR-Tools optimizer, dynamic rescheduler,
swap engine, and Gemini fairness reviewer into the existing Phase 1 pipeline.
"""

# ============================================================================
# SECTION 1: Import All Phase 2 Modules
# ============================================================================

from ai-engine.scheduler import (
    SchedulingPipeline,
    AllocationEngine,
    ConstraintEngine,
    ScoringEngine,
    ConflictResolver,
)

from ai-engine.scheduler.optimizer import OptimizationEngine
from ai-engine.scheduler.rescheduler import DynamicRescheduler
from ai-engine.scheduler.swap_engine import SwapEngine
from ai-engine.gemini_reviewer import GeminiFairnessReviewer

import logging
logger = logging.getLogger(__name__)


# ============================================================================
# SECTION 2: Create Phase 2 Enhanced Pipeline
# ============================================================================

class Phase2SchedulingPipeline:
    """
    Phase 2 extension of Phase 1 pipeline with optimization, 
    emergency handling, fairness analysis.
    """
    
    def __init__(
        self,
        constraint_engine: ConstraintEngine,
        scoring_engine: ScoringEngine,
        loader=None,
        enable_gemini: bool = False,
        gemini_api_key: str = None,
    ):
        self.constraints = constraint_engine
        self.scorer = scoring_engine
        self.loader = loader
        
        # Phase 1 components
        self.allocator = AllocationEngine(constraint_engine, scoring_engine)
        self.resolver = ConflictResolver(constraint_engine)
        
        # Phase 2 components
        self.optimizer = OptimizationEngine([], [], constraint_engine, scoring_engine)
        self.rescheduler = DynamicRescheduler(
            constraint_engine, scoring_engine, self.allocator
        )
        self.swap_engine = SwapEngine(constraint_engine, scoring_engine)
        self.fairness_reviewer = (
            GeminiFairnessReviewer(gemini_api_key) if enable_gemini else None
        )
        
        self.allocation_result = None
        self.fairness_analysis = None
        self.swap_recommendations = None
        
        logger.info("✅ Phase 2 Pipeline initialized")

    def run_allocation(
        self,
        teachers: list,
        exams: list,
        institution_id: str = "default",
        use_optimization: bool = True,
        enable_fairness_review: bool = False,
        apply_best_swap: bool = False,
    ) -> dict:
        """
        Run complete allocation with Phase 2 features.
        
        Args:
            teachers, exams: Input data
            institution_id: For multi-tenant support
            use_optimization: Use OR-Tools solver (Phase 2)
            enable_fairness_review: Get Gemini analysis (Phase 2)
            apply_best_swap: Auto-apply best fairness swap (Phase 2)
            
        Returns:
            {
                "allocation": Phase 1 result,
                "optimization": Phase 2 result (if enabled),
                "fairness_analysis": Gemini review (if enabled),
                "swaps_applied": Swap count,
                "total_time": execution time,
            }
        """
        import time
        start = time.time()
        
        logger.info(f"=== PHASE 2 ALLOCATION START ===")
        logger.info(f"Teachers: {len(teachers)}, Exams: {len(exams)}")
        
        # STEP 1: Run Phase 1 baseline allocation
        logger.info("\n[1/5] Running Phase 1 baseline allocation...")
        self.allocation_result = self.allocator.allocate_all_duties(
            teachers, exams
        )
        
        # STEP 2: Attempt OR-Tools optimization (Phase 2)
        optimization_result = None
        if use_optimization:
            logger.info("\n[2/5] Running OR-Tools optimization...")
            try:
                self.optimizer = OptimizationEngine(
                    teachers, exams, self.constraints, self.scorer
                )
                optimization_result = self.optimizer.solve_allocation(
                    self.allocation_result["assigned_duties_per_teacher"],
                    time_limit_seconds=60,
                )
                if optimization_result:
                    logger.info(
                        f"✅ Optimization: {optimization_result['improvement']}"
                    )
            except Exception as e:
                logger.warning(f"Optimization failed, continuing with Phase 1: {e}")
        else:
            logger.info("\n[2/5] Skipping optimization (disabled)")
        
        # STEP 3: Analyze fairness and get swaps (Phase 2)
        logger.info("\n[3/5] Analyzing fairness and swaps...")
        fairness_metrics = self._calculate_fairness(
            self.allocation_result["assigned_duties_per_teacher"], teachers
        )
        
        self.swap_recommendations = self.swap_engine.find_swap_recommendations(
            self.allocation_result["allocated_duties"],
            teachers,
            exams,
        )
        
        logger.info(
            f"Found {self.swap_recommendations['total_opportunities']} "
            f"swap opportunities"
        )
        
        # STEP 4: Apply best swap if requested (Phase 2)
        swaps_applied = 0
        if apply_best_swap and self.swap_recommendations["swap_recommendations"]:
            logger.info("\n[4/5] Applying best swap...")
            best_swap = self.swap_recommendations["swap_recommendations"][0]
            swap_result = self.swap_engine.apply_swap(
                best_swap, self.allocation_result["allocated_duties"]
            )
            if swap_result["status"] == "success":
                swaps_applied = len(swap_result["changes"])
                logger.info(f"✅ Applied {swaps_applied} swaps")
        else:
            logger.info("\n[4/5] Skipping swap application...")
        
        # STEP 5: Get Gemini fairness review (Phase 2)
        self.fairness_analysis = None
        if enable_fairness_review and self.fairness_reviewer:
            logger.info("\n[5/5] Getting Gemini fairness analysis...")
            try:
                self.fairness_analysis = (
                    self.fairness_reviewer.review_allocation_fairness(
                        self.allocation_result["allocated_duties"],
                        fairness_metrics,
                        teachers,
                        exams,
                        self.swap_recommendations.get("swap_recommendations", []),
                    )
                )
                logger.info(
                    f"Fairness Score: {self.fairness_analysis['fairness_score']}/100"
                )
            except Exception as e:
                logger.warning(f"Fairness review failed: {e}")
        else:
            logger.info("\n[5/5] Skipping Gemini review...")
        
        elapsed = time.time() - start
        
        return {
            "status": "success",
            "allocation": self.allocation_result,
            "fairness_metrics": fairness_metrics,
            "optimization": optimization_result,
            "swaps": {
                "recommendations": self.swap_recommendations,
                "applied": swaps_applied,
            },
            "fairness_analysis": self.fairness_analysis,
            "execution_time_seconds": round(elapsed, 2),
            "institution_id": institution_id,
        }

    def handle_emergency_leave(
        self,
        teacher_id: str,
        leave_date: str,
    ) -> dict:
        """
        Handle emergency teacher leave with Phase 2 rescheduler.
        
        Fast emergency response without full recomputation.
        """
        logger.info(f"Emergency leave: teacher {teacher_id} on {leave_date}")
        
        if not self.allocation_result:
            logger.error("No allocation to reschedule")
            return {"status": "failed", "error": "No allocation ready"}
        
        try:
            result = self.rescheduler.handle_emergency_leave(
                teacher_id,
                leave_date,
                self.allocation_result["allocated_duties"],
                [],  # Teachers (need to fetch)
                [],  # Exams (need to fetch)
            )
            logger.info(f"Emergency handled: {len(result['replacements'])} replacements")
            return result
        except Exception as e:
            logger.error(f"Emergency handling failed: {e}")
            return {"status": "failed", "error": str(e)}

    def reschedule_exam(self, exam_id: str) -> dict:
        """Reschedule single exam (fast partial recompute)."""
        logger.info(f"Rescheduling exam {exam_id}")
        
        if not self.allocation_result:
            return {"status": "failed", "error": "No allocation ready"}
        
        try:
            return self.rescheduler.reschedule_exam(exam_id, *self.allocation_result)
        except Exception as e:
            logger.error(f"Rescheduling failed: {e}")
            return {"status": "failed", "error": str(e)}

    def get_swap_recommendations(self) -> list:
        """Get current swap recommendations."""
        if not self.swap_recommendations:
            return []
        return self.swap_recommendations.get("swap_recommendations", [])

    def apply_swap(self, swap_index: int) -> dict:
        """Apply specific swap recommendation."""
        if not self.swap_recommendations:
            return {"status": "failed", "error": "No swaps available"}
        
        swaps = self.swap_recommendations.get("swap_recommendations", [])
        if swap_index >= len(swaps):
            return {"status": "failed", "error": "Swap index out of range"}
        
        return self.swap_engine.apply_swap(
            swaps[swap_index],
            self.allocation_result["allocated_duties"],
        )

    def explain_teacher_allocation(self, teacher_id: str) -> dict:
        """Get AI explanation of teacher's allocation."""
        if not self.fairness_reviewer:
            return {"status": "unavailable"}
        
        return self.fairness_reviewer.generate_fairness_explanation(
            self.allocation_result["allocated_duties"],
            teacher_id,
            self.swap_recommendations.get("current_fairness", {}),
        )

    def detect_swap_conflicts(self) -> dict:
        """Detect cascading conflicts from last swap."""
        if not self.allocation_result:
            return {"status": "failed"}
        
        affected_exams = self.rescheduler._find_affected_exams(
            None, None, 
            self.allocation_result["allocated_duties"],
            [],  # Need exams
        )
        
        return self.rescheduler.propagate_conflicts(
            affected_exams,
            self.allocation_result["allocated_duties"],
            [],  # teachers
            [],  # exams
        )

    def _calculate_fairness(
        self, assigned_duties: dict, teachers: list
    ) -> dict:
        """Calculate fairness metrics."""
        return self.swap_engine._calculate_fairness_metrics(
            {tid: [d for d in duties] for tid, duties in assigned_duties.items()},
            teachers,
        )


# ============================================================================
# SECTION 3: REST API Integration (Flask)
# ============================================================================

from flask import Flask, request, jsonify
from functools import wraps
import json

app = Flask(__name__)
pipeline = None  # Global instance

def setup_phase2_api(constraint_engine, scoring_engine, loader=None):
    """Initialize Phase 2 API endpoints."""
    global pipeline
    pipeline = Phase2SchedulingPipeline(
        constraint_engine, scoring_engine, loader,
        enable_gemini=True,
    )
    logger.info("✅ Phase 2 API initialized")

# Routes

@app.route("/api/phase2/allocations/run", methods=["POST"])
def run_allocation():
    """Run Phase 2 allocation with optimization."""
    data = request.json
    
    result = pipeline.run_allocation(
        teachers=data.get("teachers", []),
        exams=data.get("exams", []),
        institution_id=data.get("institution_id", "default"),
        use_optimization=data.get("use_optimization", True),
        enable_fairness_review=data.get("fairness_review", False),
        apply_best_swap=data.get("apply_swap", False),
    )
    
    return jsonify(result), 200

@app.route("/api/phase2/allocations/emergency-leave", methods=["POST"])
def handle_emergency():
    """Handle emergency teacher leave."""
    data = request.json
    
    result = pipeline.handle_emergency_leave(
        teacher_id=data["teacher_id"],
        leave_date=data["leave_date"],
    )
    
    return jsonify(result), 200

@app.route("/api/phase2/allocations/swaps", methods=["GET"])
def list_swaps():
    """Get current swap recommendations."""
    return jsonify({
        "swaps": pipeline.get_swap_recommendations(),
    }), 200

@app.route("/api/phase2/allocations/apply-swap/<int:swap_index>", methods=["POST"])
def apply_swap(swap_index):
    """Apply specific swap."""
    result = pipeline.apply_swap(swap_index)
    return jsonify(result), 200 if result["status"] == "success" else 400

@app.route("/api/phase2/allocations/explain/<teacher_id>", methods=["GET"])
def explain_allocation(teacher_id):
    """Get explanation of teacher's allocation."""
    result = pipeline.explain_teacher_allocation(teacher_id)
    return jsonify(result), 200


# ============================================================================
# SECTION 4: Node.js Backend Integration
# ============================================================================

# In backend/services/AllocationService.js:

"""
// Phase 2 integration example

async function runPhase2Allocation(teachers, exams, options = {}) {
    try {
        const response = await axios.post(
            `${PYTHON_API_URL}/api/phase2/allocations/run`,
            {
                teachers,
                exams,
                institution_id: options.institution_id || 'default',
                use_optimization: options.useOptimization !== false,
                fairness_review: options.fairnessReview || false,
                apply_swap: options.applySwap || false,
            }
        );
        
        return {
            status: 'success',
            allocation: response.data.allocation,
            fairness: response.data.fairness_analysis,
            swaps: response.data.swaps.recommendations,
            time: response.data.execution_time_seconds,
        };
    } catch (error) {
        logger.error('Phase 2 allocation failed:', error.message);
        return { status: 'failed', error: error.message };
    }
}

async function handleEmergencyLeave(teacherId, leaveDate) {
    try {
        const response = await axios.post(
            `${PYTHON_API_URL}/api/phase2/allocations/emergency-leave`,
            { teacher_id: teacherId, leave_date: leaveDate }
        );
        
        return {
            status: response.data.status,
            replacements: response.data.replacements,
            time: response.data.reschedule_time_seconds,
        };
    } catch (error) {
        logger.error('Emergency handling failed:', error.message);
        return { status: 'failed' };
    }
}

module.exports = {
    runPhase2Allocation,
    handleEmergencyLeave,
};
"""


# ============================================================================
# SECTION 5: Complete Example Usage
# ============================================================================

def complete_example():
    """
    Full example of using Phase 2 system for allocation.
    """
    import logging
    logging.basicConfig(level=logging.INFO)
    
    # Initialize
    constraints = ConstraintEngine()
    scorer = ScoringEngine()
    pipeline = Phase2SchedulingPipeline(
        constraints, scorer,
        enable_gemini=True,
        gemini_api_key="your_api_key"
    )
    
    # Load data
    teachers = [
        {
            "_id": "alice_1",
            "name": "Alice",
            "email": "alice@example.com",
            "subject": "Math",
            "seniority_years": 10,
            "reliability_score": 0.95,
            "allowed_roles": ["invigilator", "supervisor"],
            "is_active": True,
        },
        # ... more teachers
    ]
    
    exams = [
        {
            "_id": "exam_1",
            "subject": "Mathematics",
            "exam_date": "2025-03-15",
            "start_time": "09:00",
            "required_roles": {
                "invigilator": 2,
                "supervisor": 1,
                "coordinator": 1,
            },
            "category": "final",
            "is_locked": False,
        },
        # ... more exams
    ]
    
    # RUN ALLOCATION
    result = pipeline.run_allocation(
        teachers=teachers,
        exams=exams,
        institution_id="myschool_2025",
        use_optimization=True,
        enable_fairness_review=True,
        apply_best_swap=False,  # Review swaps first
    )
    
    # RESULTS
    print(f"\n✅ Allocation completed in {result['execution_time_seconds']}s")
    print(f"Fairness Score: {result['fairness_analysis']['fairness_score']}/100")
    print(f"Swap Opportunities: {result['swaps']['recommendations']['total_opportunities']}")
    
    # REVIEW SWAPS
    swaps = pipeline.get_swap_recommendations()
    for i, swap in enumerate(swaps[:3]):
        print(f"\nSwap {i+1}:")
        print(f"  {swap['overloaded_teacher']['name']} → {swap['underloaded_teacher']['name']}")
        print(f"  Improvement: +{swap['fairness_improvement_percent']}%")
    
    # APPLY BEST SWAP
    if swaps:
        apply_result = pipeline.apply_swap(0)
        if apply_result['status'] == 'success':
            print(f"\n✅ Applied best swap ({len(apply_result['changes'])} changes)")
    
    # GET EXPLANATIONS
    if result['fairness_analysis']:
        print(f"\n📊 AI Analysis (Gemini):")
        print(f"Assessment: {result['fairness_analysis']['fairness_assessment']}")
        print(f"Patterns: {len(result['fairness_analysis']['patterns'])} identified")
    
    return result


# ============================================================================
# SECTION 6: Configuration Validation
# ============================================================================

def validate_phase2_setup():
    """Validate that all Phase 2 components are installed."""
    
    checks = {
        "ortools": False,
        "gemini": False,
        "pymongo": False,
    }
    
    try:
        import ortools
        checks["ortools"] = True
        print("✅ OR-Tools installed")
    except ImportError:
        print("❌ OR-Tools missing: pip install ortools")
    
    try:
        import google.generativeai
        checks["gemini"] = True
        print("✅ Gemini API installed")
    except ImportError:
        print("⚠️  Gemini missing (optional): pip install google-generativeai")
    
    try:
        import pymongo
        checks["pymongo"] = True
        print("✅ PyMongo installed")
    except ImportError:
        print("❌ PyMongo missing: pip install pymongo")
    
    all_ok = checks["ortools"] and checks["pymongo"]
    gemini_ok = checks["gemini"]
    
    print(f"\n{'✅ READY FOR PRODUCTION' if all_ok else '❌ MISSING DEPENDENCIES'}")
    print(f"{'✅ Gemini enabled' if gemini_ok else '⚠️  Gemini optional'}")
    
    return all_ok


# ============================================================================
# SECTION 7: Performance Tuning
# ============================================================================

"""
**OR-Tools CP-SAT Solver Tuning**

For different scenarios, adjust solver parameters:

# Small institution (<100 teachers)
optimizer = OptimizationEngine(...)
optimizer.solver_stats = {
    "max_time_in_seconds": 30,  # Faster
    "log_search_progress": True,
}

# Large institution (>200 teachers)  
optimizer = OptimizationEngine(...)
optimizer.solver_stats = {
    "max_time_in_seconds": 120,  # More time for optimal
    "log_search_progress": False,
    "params.linearization_level": 2,
}

# Emergency mode (fast response)
# Use DynamicRescheduler instead of full optimization
reschedule = DynamicRescheduler(...)  # 5-10x faster than optimizer
"""


if __name__ == "__main__":
    print("Phase 2 Integration Examples")
    print("=" * 50)
    
    # Validate setup
    print("\n1. Validating Phase 2 Setup...")
    validate_phase2_setup()
    
    print("\n2. Phase 2 System Ready!")
    print("   - Use Phase2SchedulingPipeline for complete allocation")
    print("   - Use DynamicRescheduler for emergency response")
    print("   - Use SwapEngine for fairness optimization")
    print("   - Use GeminiFairnessReviewer for AI insights")
