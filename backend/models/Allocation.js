const mongoose = require('mongoose');

/**
 * Allocation Schema - Represents duty assignments for an exam
 * Stores final allocation results with metadata
 */
const AllocationSchema = new mongoose.Schema(
    {
        exam_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exam',
            required: true
        },

        // Allocation metadata
        status: {
            type: String,
            enum: ['draft', 'pending_review', 'approved', 'rejected', 'active', 'completed'],
            default: 'draft'
        },

        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        approved_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        approval_date: Date,

        // Duty assignments (actual allocations)
        duties: [
            {
                _id: mongoose.Schema.Types.ObjectId,
                exam_id: mongoose.Schema.Types.ObjectId,
                room_id: String,
                duty_type: {
                    type: String,
                    enum: ['invigilator', 'checker', 'coordinator']
                },
                assigned_teacher_id: mongoose.Schema.Types.ObjectId,
                assigned_teacher_name: String,
                assigned_teacher_department: String,

                // Duty details
                start_time: Date,
                end_time: Date,
                location: String,
                instructions: String,

                // Status tracking
                confirmation_status: {
                    type: String,
                    enum: ['pending', 'confirmed', 'rejected', 'cannot_attend'],
                    default: 'pending'
                },
                confirmed_at: Date,
                confirmation_notes: String,

                // Fairness tracking
                fairness_score: {
                    type: Number,
                    min: 0,
                    max: 1,
                    default: 0.5
                },

                // Constraints applied
                constraints_applied: [String],
                constraint_violations: [
                    {
                        constraint_id: String,
                        constraint_name: String,
                        severity: { type: String, enum: ['warning', 'error'] },
                        message: String
                    }
                ]
            }
        ],

        // Allocation metrics
        metrics: {
            total_duties: Number,
            assigned_duties: Number,
            pending_confirmations: Number,
            total_teachers: Number,
            average_fairness_score: {
                type: Number,
                min: 0,
                max: 1,
                default: 0.5
            },
            fairness_variance: Number,
            constraint_violations_count: Number,
            critical_violations: Number
        },

        // Algorithm information
        algorithm_config: {
            algorithm_type: {
                type: String,
                enum: ['heuristic', 'optimization', 'hybrid'],
                default: 'heuristic'
            },
            heuristic_name: String,
            optimization_model: String,
            solver_used: String,
            execution_time_ms: Number,
            iterations: Number,
            convergence_reached: Boolean,
            fairness_weight: Number,
            constraint_weight: Number,
            availability_weight: Number,
            load_balance_weight: Number
        },

        // Phase 3 specific tracking
        phase3_info: {
            simulation_run: Boolean,
            simulated_by: mongoose.Schema.Types.ObjectId,
            swap_count: {
                type: Number,
                default: 0
            },
            last_modified_by: mongoose.Schema.Types.ObjectId,
            last_modified_at: Date,
            modification_history: [
                {
                    modified_at: Date,
                    modified_by: mongoose.Schema.Types.ObjectId,
                    change_type: String,
                    change_description: String
                }
            ]
        },

        // Notes and comments
        allocation_notes: String,
        special_considerations: [String],

        // Expiry and lifecycle
        valid_from: {
            type: Date,
            required: true
        },
        valid_to: {
            type: Date,
            required: true
        },
        is_active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        collection: 'allocations'
    }
);

// Indexes for performance
AllocationSchema.index({ exam_id: 1 });
AllocationSchema.index({ status: 1 });
AllocationSchema.index({ created_by: 1 });
AllocationSchema.index({ 'duties.assigned_teacher_id': 1 });
AllocationSchema.index({ 'phase3_info.simulation_run': 1 });
AllocationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Allocation', AllocationSchema);
