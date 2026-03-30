const mongoose = require('mongoose');

/**
 * Simulation Schema - Stores simulation run data for Phase 3
 * Tracks simulation scenarios, results, and comparisons
 */
const SimulationSchema = new mongoose.Schema(
    {
        // Simulation identification
        allocation_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Allocation',
            required: true
        },

        exam_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exam',
            required: true
        },

        simulation_name: String,
        simulation_description: String,

        // Creation and execution
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        executed_at: Date,
        execution_duration_ms: Number,

        // Simulation configuration
        config: {
            scenario: {
                type: String,
                enum: ['baseline', 'what_if', 'stress_test', 'optimization', 'fairness_improvement']
            },
            parameters: {
                number_of_iterations: Number,
                random_seed: String,
                optimization_objectives: [String],
                fairness_threshold: Number,
                constraint_violation_penalty: Number
            },
            variables_modified: [
                {
                    variable_name: String,
                    original_value: mongoose.Schema.Types.Mixed,
                    modified_value: mongoose.Schema.Types.Mixed,
                    reason: String
                }
            ]
        },

        // Simulation results
        results: {
            status: {
                type: String,
                enum: ['running', 'completed', 'failed', 'cancelled'],
                default: 'running'
            },

            // Allocation results
            proposed_allocation: {
                total_duties: Number,
                assigned_duties: Number,
                unassigned_duties: Number,
                duties: [
                    {
                        _id: mongoose.Schema.Types.ObjectId,
                        exam_id: mongoose.Schema.Types.ObjectId,
                        assigned_teacher_id: mongoose.Schema.Types.ObjectId,
                        fairness_score: Number,
                        constraint_violations: Number
                    }
                ]
            },

            // Metrics
            metrics: {
                average_fairness_score: Number,
                fairness_variance: Number,
                constraint_violations_total: Number,
                constraint_violations_critical: Number,
                load_distribution_score: Number,
                availability_respect_score: Number,
                completion_rate: Number,
                optimization_achieved: Number
            },

            // Comparison with original
            comparison_with_original: {
                fairness_improvement: Number,
                fairness_improvement_percentage: Number,
                constraint_violations_change: Number,
                load_distribution_change: Number,
                overall_quality_change: Number,
                is_better_than_original: Boolean
            },

            // Issues found
            issues: [
                {
                    issue_type: String,
                    severity: String,
                    description: String,
                    affected_teachers: [mongoose.Schema.Types.ObjectId],
                    suggested_fix: String
                }
            ],

            // Recommendations
            recommendations: [
                {
                    type: String,
                    description: String,
                    expected_impact: String,
                    implementation_effort: String,
                    priority: Number
                }
            ],

            error_message: String,
            error_details: String
        },

        // Swap recommendations (from SimulationController)
        swap_recommendations: [
            {
                swap_id: String,
                duty1_id: mongoose.Schema.Types.ObjectId,
                duty1_current_teacher: mongoose.Schema.Types.ObjectId,
                duty2_id: mongoose.Schema.Types.ObjectId,
                duty2_current_teacher: mongoose.Schema.Types.ObjectId,
                fairness_impact: Number,
                load_impact: Number,
                feasibility_score: Number,
                reason: String,
                risk_level: String
            }
        ],

        // Sensitivity analysis
        sensitivity_analysis: {
            parameters_tested: [String],
            sensitivity_results: [
                {
                    parameter: String,
                    baseline_value: mongoose.Schema.Types.Mixed,
                    test_values: [mongoose.Schema.Types.Mixed],
                    impact_on_fairness: [Number],
                    impact_on_constraints: [Number]
                }
            ]
        },

        // What-if scenario tracking
        what_if_scenario: {
            scenario_name: String,
            scenario_description: String,
            assumptions: [String],
            probability_estimate: Number
        },

        // Approval and implementation
        approval: {
            status: {
                type: String,
                enum: ['pending', 'approved', 'rejected', 'pending_review'],
                default: 'pending'
            },
            approved_by: mongoose.Schema.Types.ObjectId,
            approval_date: Date,
            approval_notes: String,
            approval_changes_required: [String]
        },

        implementation: {
            accepted: Boolean,
            accepted_by: mongoose.Schema.Types.ObjectId,
            accepted_at: Date,
            swaps_implemented: [
                {
                    swap_id: String,
                    implemented_at: Date,
                    implemented_by: mongoose.Schema.Types.ObjectId
                }
            ]
        },

        // Version tracking
        parent_allocation_version: Number,
        revision_number: {
            type: Number,
            default: 1
        },

        // Tags and metadata
        tags: [String],
        is_baseline: {
            type: Boolean,
            default: false
        },
        notes: String
    },
    {
        timestamps: true,
        collection: 'simulations'
    }
);

// Indexes
SimulationSchema.index({ allocation_id: 1 });
SimulationSchema.index({ exam_id: 1 });
SimulationSchema.index({ created_by: 1 });
SimulationSchema.index({ 'results.status': 1 });
SimulationSchema.index({ 'approval.status': 1 });
SimulationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Simulation', SimulationSchema);
