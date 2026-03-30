const mongoose = require('mongoose');

/**
 * FairnessMetric Schema - Tracks fairness metrics for allocations
 * Stores historical fairness data and analysis
 */
const FairnessMetricSchema = new mongoose.Schema(
    {
        allocation_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Allocation',
            required: true,
            index: true
        },

        exam_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exam',
            required: true,
            index: true
        },

        teacher_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Teacher',
            required: true
        },

        teacher_name: String,
        teacher_department: String,

        // Overall fairness score
        fairness_score: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },

        // Individual metric components
        metrics: {
            // Load balance - how evenly duties are distributed
            load_balance_score: {
                type: Number,
                min: 0,
                max: 1,
                description: 'Measure of even duty distribution'
            },

            // Specialty match - how well duties match teacher expertise
            specialty_match_score: {
                type: Number,
                min: 0,
                max: 1,
                description: 'Measure of duty-expertise alignment'
            },

            // Availability respect - how well availability is respected
            availability_score: {
                type: Number,
                min: 0,
                max: 1,
                description: 'Measure of availability constraint adherence'
            },

            // Preference satisfaction - how well preferences are met
            preference_score: {
                type: Number,
                min: 0,
                max: 1,
                description: 'Measure of preference fulfillment'
            },

            // Workload distribution across time
            temporal_distribution_score: {
                type: Number,
                min: 0,
                max: 1,
                description: 'Measure of even time distribution'
            },

            // Constraint adherence
            constraint_adherence_score: {
                type: Number,
                min: 0,
                max: 1,
                description: 'Measure of constraint compliance'
            }
        },

        // Comparative analysis
        comparison_data: {
            percentile_rank: {
                type: Number,
                min: 0,
                max: 100
            },
            comparison_to_average: Number,
            comparison_to_min: Number,
            comparison_to_max: Number,
            rank_among_peers: Number
        },

        // Detailed analysis
        fairness_analysis: {
            is_fair: Boolean,
            fairness_status: {
                type: String,
                enum: ['optimal', 'acceptable', 'marginal', 'poor']
            },
            primary_concerns: [String],
            improvement_suggestions: [String],
            affected_duties: [
                {
                    duty_id: mongoose.Schema.Types.ObjectId,
                    exam_name: String,
                    impact_on_fairness: String
                }
            ]
        },

        // Historical tracking
        metric_history: [
            {
                recorded_at: Date,
                score: Number,
                status: String
            }
        ],

        // Phase 3 changes
        phase3_changes: {
            swapped_duties: [
                {
                    original_duty_id: mongoose.Schema.Types.ObjectId,
                    swapped_duty_id: mongoose.Schema.Types.ObjectId,
                    fairness_impact: Number,
                    swap_date: Date,
                    reason: String
                }
            ],
            emergency_adjustments: Number,
            adjustment_justifications: [String]
        },

        // Generated reports
        report_metadata: {
            generated_at: Date,
            generated_by: mongoose.Schema.Types.ObjectId,
            report_type: String,
            includes_recommendations: Boolean
        }
    },
    {
        timestamps: true,
        collection: 'fairness_metrics'
    }
);

// Compound index for faster queries
FairnessMetricSchema.index({ allocation_id: 1, teacher_id: 1 });
FairnessMetricSchema.index({ exam_id: 1 });
FairnessMetricSchema.index({ fairness_score: -1 });
FairnessMetricSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FairnessMetric', FairnessMetricSchema);
