"""
Scheduler API - Flask wrapper for the allocation pipeline
Exposes allocation endpoints for the Node.js backend to call
"""

from flask import Flask, request, jsonify
import logging
from scheduler import SchedulingPipeline

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Initialize pipeline (without DB connection for now)
pipeline = SchedulingPipeline(db_connection=None)


@app.route("/api/allocate", methods=["POST"])
def allocate():
    """
    Main allocation endpoint
    
    Expected payload:
    {
        "teachers": [...],
        "exams": [...],
        "teacher_leaves": [...],
        "policies": [...]
    }
    """
    try:
        data = request.json

        # Validate required fields
        if not data.get("teachers") or not data.get("exams"):
            return jsonify({
                "status": "error",
                "message": "Missing required fields: teachers, exams"
            }), 400

        # Extract data
        teachers = data.get("teachers", [])
        exams = data.get("exams", [])
        teacher_leaves = data.get("teacher_leaves", [])
        policies = data.get("policies", [])

        logger.info(
            f"Received allocation request: {len(teachers)} teachers, "
            f"{len(exams)} exams"
        )
        
        # DEBUG: Log raw data before normalization
        if teachers:
            logger.info(f"Sample teacher before normalization: {teachers[0]}")
        if exams:
            logger.info(f"Sample exam before normalization: {exams[0]}")

        # Normalize data from REST API
        from scheduler.loader import ScheduleLoader
        loader = ScheduleLoader(db_connection=None)
        
        normalized_teachers = [loader._normalize_teacher(t) for t in teachers]
        normalized_exams = [loader._normalize_exam(e) for e in exams]
        normalized_leaves = [loader._normalize_leave(l) for l in teacher_leaves]
        normalized_policies = [loader._normalize_policy(p) for p in policies]

        # DEBUG: Log normalized data
        if normalized_teachers:
            logger.info(f"Sample teacher after normalization: {normalized_teachers[0]}")
        if normalized_exams:
            logger.info(f"Sample exam after normalization: {normalized_exams[0]}")
            
        # Log locked allocations
        total_locked = sum(len(exam.get("locked_allocations", [])) for exam in normalized_exams)
        if total_locked > 0:
            logger.info(f"🔒 Found {total_locked} locked allocations - will be protected during rescheduling")
            for exam in normalized_exams:
                if exam.get("locked_allocations"):
                    logger.info(f"   - Exam {exam['subject']}: {len(exam['locked_allocations'])} locked allocation(s)")

        # Initialize constraint engine
        from scheduler.constraints import ConstraintEngine
        constraint_engine = ConstraintEngine(
            normalized_teachers, normalized_exams, normalized_leaves, normalized_policies
        )

        # Initialize scoring engine
        from scheduler.scorer import ScoringEngine
        scoring_engine = ScoringEngine(normalized_teachers, normalized_exams, normalized_policies)

        # Initialize allocation engine
        from scheduler.allocator import AllocationEngine
        allocation_engine = AllocationEngine(
            constraint_engine, scoring_engine
        )

        # Run allocation
        logger.info("Starting allocation pipeline...")
        result = allocation_engine.allocate_all_duties(normalized_teachers, normalized_exams)

        # Initialize conflict resolver
        from scheduler.resolver import ConflictResolver
        conflict_resolver = ConflictResolver(constraint_engine)
        
        # Detect conflicts using NORMALIZED data
        conflicts = conflict_resolver.detect_all_conflicts(
            result["allocated_duties"],
            result["assigned_duties_per_teacher"],
            normalized_teachers,
            normalized_exams,
        )
        fix_suggestions = conflict_resolver.auto_fix_conflicts(
            conflicts, result["allocated_duties"]
        )

        result["conflicts"] = conflicts
        result["fix_suggestions"] = fix_suggestions

        logger.info(
            f"Allocation complete: {result['statistics']['allocated_exams']}/"
            f"{result['statistics']['total_exams']} exams allocated"
        )

        return jsonify({
            "status": result.get("status", "success"),
            "message": "Allocation completed",
            "allocated_duties": result["allocated_duties"],
            "statistics": result["statistics"],
            "unallocated_exams": result.get("unallocated_exams", []),
            "conflicts": conflicts,
            "fix_suggestions": fix_suggestions["suggestions"],
        }), 200

    except Exception as e:
        logger.error(f"Allocation error: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e),
        }), 500


@app.route("/api/allocate/with-optimization", methods=["POST"])
def allocate_with_optimization():
    """
    Allocation with Phase 2 optimization enabled
    This will use OR-Tools CP-SAT solver when implemented
    """
    try:
        data = request.json

        # For now, same as regular allocation
        # In Phase 2, will add OR-Tools optimization
        return allocate()

    except Exception as e:
        logger.error(f"Optimization error: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e),
        }), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "scheduler-api",
        "version": "1.0.0-alpha",
    }), 200


@app.route("/api/constraints-info", methods=["GET"])
def constraints_info():
    """Get information about constraint system"""
    return jsonify({
        "status": "success",
        "hard_constraints": [
            "not_on_leave",
            "available",
            "no_subject_conflict",
            "no_double_booking",
            "room_requirements",
        ],
        "soft_constraints": [
            "back_to_back",
            "department_balance",
            "workload_variance",
            "same_day_multiple",
        ],
    }), 200


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        "status": "error",
        "message": "Endpoint not found",
    }), 404


@app.route("/api/simulate", methods=["POST"])
def simulate_allocation():
    """
    Simulate allocation without saving to database
    Returns comparison between current and simulated allocations
    
    Expected payload:
    {
        "teachers": [...],
        "exams": [...],
        "teacher_leaves": [...],
        "policies": [...],
        "current_allocations": [...]  # Optional: current allocations for comparison
    }
    """
    try:
        data = request.json

        if not data.get("teachers") or not data.get("exams"):
            return jsonify({
                "status": "error",
                "message": "Missing required fields: teachers, exams"
            }), 400

        teachers = data.get("teachers", [])
        exams = data.get("exams", [])
        teacher_leaves = data.get("teacher_leaves", [])
        policies = data.get("policies", [])
        current_allocations = data.get("current_allocations", {})

        logger.info(
            f"🧪 Simulation Mode: {len(teachers)} teachers, {len(exams)} exams"
        )

        # Normalize data
        from scheduler.loader import ScheduleLoader
        loader = ScheduleLoader(db_connection=None)
        
        normalized_teachers = [loader._normalize_teacher(t) for t in teachers]
        normalized_exams = [loader._normalize_exam(e) for e in exams]
        normalized_leaves = [loader._normalize_leave(l) for l in teacher_leaves]
        normalized_policies = [loader._normalize_policy(p) for p in policies]

        # Initialize engines
        from scheduler.constraints import ConstraintEngine
        from scheduler.scorer import ScoringEngine
        from scheduler.allocator import AllocationEngine
        from scheduler.resolver import ConflictResolver
        
        constraint_engine = ConstraintEngine(
            normalized_teachers, normalized_exams, normalized_leaves, normalized_policies
        )
        scoring_engine = ScoringEngine(normalized_teachers, normalized_exams, normalized_policies)
        allocation_engine = AllocationEngine(constraint_engine, scoring_engine)
        conflict_resolver = ConflictResolver(constraint_engine)

        # Run simulation
        logger.info("Running simulation...")
        simulated_result = allocation_engine.allocate_all_duties(normalized_teachers, normalized_exams)

        # Detect conflicts
        conflicts = conflict_resolver.detect_all_conflicts(
            simulated_result["allocated_duties"],
            simulated_result["assigned_duties_per_teacher"],
            normalized_teachers,
            normalized_exams,
        )
        fix_suggestions = conflict_resolver.auto_fix_conflicts(
            conflicts, simulated_result["allocated_duties"]
        )

        simulated_result["conflicts"] = conflicts
        simulated_result["fix_suggestions"] = fix_suggestions

        # Compare with current allocations if provided
        comparison = {}
        if current_allocations:
            logger.info("Comparing with current allocations...")
            current_count = len(current_allocations)
            simulated_count = simulated_result["statistics"]["allocated_exams"]
            comparison = {
                "current_allocated": current_count,
                "simulated_allocated": simulated_count,
                "improvement": simulated_count - current_count,
                "improvement_percent": round(
                    ((simulated_count - current_count) / current_count * 100) 
                    if current_count > 0 else 0,
                    2
                ),
            }

        logger.info(
            f"✅ Simulation complete: {simulated_result['statistics']['allocated_exams']}/"
            f"{simulated_result['statistics']['total_exams']} exams"
        )

        return jsonify({
            "status": "success",
            "mode": "simulation",
            "message": "Allocation simulation completed successfully",
            "allocated_duties": simulated_result["allocated_duties"],
            "statistics": simulated_result["statistics"],
            "conflicts": conflicts,
            "fix_suggestions": fix_suggestions["suggestions"],
            "comparison": comparison,
        }), 200

    except Exception as e:
        logger.error(f"Simulation error: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Simulation failed: {str(e)}",
        }), 500


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        "status": "error",
        "message": "Internal server error",
    }), 500


@app.route("/api/swaps/recommendations", methods=["POST"])
def get_swap_recommendations():
    """
    Generate swap recommendations based on current allocation
    
    Expected payload:
    {
        "current_allocation": {exam_id -> {roles -> [assignments]}},
        "teachers": [...]
    }
    """
    try:
        data = request.json
        
        if not data.get("current_allocation") or not data.get("teachers"):
            return jsonify({
                "status": "error",
                "message": "Missing required fields"
            }), 400
        
        from scheduler.swap_engine import SwapEngine
        from scheduler.constraints import ConstraintEngine
        from scheduler.scorer import ScoringEngine
        
        logger.info("🔄 Generating swap recommendations...")
        
        # For swap engine, we need mock teachers/exams for constraint checking
        # This is a simplified implementation
        current_allocation = data.get("current_allocation", {})
        teachers = data.get("teachers", [])
        
        # Build a basic constraint engine for swap validation
        constraint_engine = ConstraintEngine(teachers, [], [], [])
        scoring_engine = ScoringEngine(teachers, [], [])
        swap_engine = SwapEngine(constraint_engine, scoring_engine)
        
        # Generate recommendations
        recommendations = swap_engine.find_swap_recommendations(
            current_allocation,
            teachers,
            [],  # exams (not needed for basic swap finding)
            overload_threshold_std_dev=1.5
        )
        
        logger.info(
            f"✅ Found {len(recommendations.get('swap_recommendations', []))} swap opportunities"
        )
        
        return jsonify({
            "status": "success",
            "data": recommendations
        }), 200
        
    except Exception as e:
        logger.error(f"Swap recommendation error: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


if __name__ == "__main__":
    logger.info("Starting Scheduler API on http://localhost:5000")
    app.run(debug=True, host="0.0.0.0", port=5000)
