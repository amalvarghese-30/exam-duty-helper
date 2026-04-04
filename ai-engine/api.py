"""
Scheduler API - Flask wrapper for the allocation pipeline
Exposes allocation endpoints for the Node.js backend to call
"""

from flask import Flask, request, jsonify
import logging
from scheduler import SchedulingPipeline
from nlp_policy_engine import NLPPolicyEngine

# Import the email notifier
from notifier import notify_assigned_teachers

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
        "policies": [...],
        "rules_text": "...",
        "send_emails": true  # Optional, defaults to true
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
        
        # Check if emails should be sent (default to true)
        send_emails = data.get("send_emails", True)
        
        # NEW: Parse NLP rules if provided
        rules_text = data.get("rules_text", "")
        if rules_text:
            try:
                logger.info(f"Processing NLP rules: {rules_text[:100]}...")
                dynamic_constraints = NLPPolicyEngine.convert_text_to_constraints(rules_text)
                
                if dynamic_constraints:
                    logger.info(f"Generated {len(dynamic_constraints)} dynamic constraints")
                    # Validate and add to policies
                    validated = NLPPolicyEngine.validate_constraints(dynamic_constraints)
                    policies.extend(validated)
                    logger.info(f"Added {len(validated)} validated constraints to policies")
                    
            except Exception as e:
                logger.warning(f"NLP policy parsing failed: {e}")

        logger.info(
            f"Received allocation request: {len(teachers)} teachers, "
            f"{len(exams)} exams, {len(policies)} policies"
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

        # ============================================================
        # NEW: Send email notifications after successful allocation
        # ============================================================
        emails_sent = 0
        if send_emails and result.get("allocated_duties"):
            try:
                logger.info("📧 Sending email notifications to teachers...")
                
                # Convert the allocated_duties to roster format for notifier
                roster = []
                for exam_id, exam_allocation in result["allocated_duties"].items():
                    exam_subject = exam_allocation.get("subject", "Unknown Exam")
                    exam_date = exam_allocation.get("date", "")
                    
                    for role, assignments in exam_allocation.get("roles", {}).items():
                        for assignment in assignments:
                            roster.append({
                                "teacher": assignment.get("teacher_email") or assignment.get("teacher"),
                                "exam": exam_subject,
                                "date": exam_date,
                                "role": role
                            })
                
                # Get original teacher objects for email lookup
                emails_sent = notify_assigned_teachers(roster, teachers, exams)
                logger.info(f"✅ Sent {emails_sent} email notifications")
            except Exception as e:
                logger.error(f"Email notification failed: {e}")
                # Don't fail the allocation if emails fail

        logger.info(
            f"Allocation complete: {result['statistics']['allocated_exams']}/"
            f"{result['statistics']['total_exams']} exams allocated"
        )

        response_data = {
            "status": result.get("status", "success"),
            "message": "Allocation completed",
            "allocated_duties": result["allocated_duties"],
            "statistics": result["statistics"],
            "unallocated_exams": result.get("unallocated_exams", []),
            "conflicts": conflicts,
            "fix_suggestions": fix_suggestions["suggestions"],
        }
        
        # Add email count to response if emails were sent
        if send_emails:
            response_data["emails_sent"] = emails_sent

        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f"Allocation error: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e),
        }), 500


@app.route("/api/parse-rule", methods=["POST"])
def parse_rule():
    """
    Parse a single natural language rule using Gemini
    Returns structured JSON constraint
    
    Expected payload:
    {
        "text": "Avoid assigning Dr. Smith on Mondays"
    }
    """
    try:
        data = request.json
        rule_text = data.get("text", "")
        
        if not rule_text:
            return jsonify({
                "status": "error",
                "message": "No rule text provided"
            }), 400
            
        constraints = NLPPolicyEngine.convert_text_to_constraints(rule_text)
        
        return jsonify({
            "status": "success",
            "original_text": rule_text,
            "parsed_constraints": constraints,
            "count": len(constraints)
        }), 200
        
    except Exception as e:
        logger.error(f"Parse rule error: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
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
        rules_text = data.get("rules_text", "")
        
        if rules_text:
            try:
                from gemini_parser import parse_rules
        
                logger.info("Parsing dynamic admin rules...")
                parsed_rules = parse_rules(rules_text)
        
                if isinstance(parsed_rules, dict):
                    policies.append(parsed_rules)
        
                elif isinstance(parsed_rules, list):
                    policies.extend(parsed_rules)
        
            except Exception as e:
                logger.warning(f"Rule parsing failed: {e}")
                
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

        # ADD AI RISK PREDICTION
        from simulation_predictor import predict_risk
        try:
            risk_prediction = predict_risk(simulated_result)
            simulated_result["risk_prediction"] = risk_prediction
            logger.info(f"Risk prediction: {risk_prediction.get('risk_level', 'unknown')} risk")
        except Exception as e:
            logger.warning(f"Risk prediction failed: {e}")
            simulated_result["risk_prediction"] = {"error": str(e)}

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
            "risk_prediction": simulated_result.get("risk_prediction", {})
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
        from swap_advisor import suggest_swaps, explain_swap_benefit
        
        logger.info("🔄 Generating swap recommendations...")
        
        current_allocation = data.get("current_allocation", {})
        teachers = data.get("teachers", [])
        
        # Build constraint engine for swap validation
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
        
        # ADD AI-POWERED SWAP SUGGESTIONS
        try:
            ai_swaps = suggest_swaps(recommendations, teachers)
            if ai_swaps:
                recommendations["ai_recommendations"] = ai_swaps
                
                # Add explanations for each AI suggestion
                for swap in ai_swaps:
                    swap["explanation"] = explain_swap_benefit(swap, current_allocation)
        except Exception as e:
            logger.warning(f"AI swap suggestions failed: {e}")
            recommendations["ai_recommendations"] = []
        
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


@app.route("/api/teacher/chat", methods=["POST"])
def teacher_chat():
    """
    AI-powered chat endpoint for teacher queries
    
    Expected payload:
    {
        "question": "Why do I have 5 duties?",
        "teacher_data": {...},
        "allocation_data": {...}
    }
    """
    try:
        data = request.json
        
        if not data.get("question"):
            return jsonify({
                "status": "error",
                "message": "Missing question"
            }), 400
        
        from teacher_chatbot import teacher_query
        
        teacher_data = data.get("teacher_data", {})
        allocation_data = data.get("allocation_data", {})
        
        logger.info(f"Teacher chat query: {data['question'][:100]}...")
        
        response = teacher_query(
            data["question"],
            teacher_data,
            allocation_data
        )
        
        return jsonify({
            "status": "success",
            "data": response
        }), 200
        
    except Exception as e:
        logger.error(f"Teacher chat error: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


if __name__ == "__main__":
    logger.info("Starting Scheduler API on http://localhost:5000")
    app.run(debug=True, host="0.0.0.0", port=5000)