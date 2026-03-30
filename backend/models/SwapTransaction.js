const mongoose = require('mongoose');

/**
 * SwapTransaction Schema - Tracks duty swap operations
 * Manages swap history, approvals, and reversals
 */
const SwapTransactionSchema = new mongoose.Schema(
    {
        // Transaction identification
        allocation_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Allocation',
            required: true,
            index: true
        },

        swap_id: {
            type: String,
            unique: true,
            required: true
        },

        // Parties involved in swap
        teacher1: {
            teacher_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Teacher',
                required: true
            },
            teacher_name: String,
            teacher_department: String,
            original_duty_id: mongoose.Schema.Types.ObjectId,
            original_duty_details: {
                exam_name: String,
                exam_id: mongoose.Schema.Types.ObjectId,
                duty_type: String,
                date: Date,
                time_slot: String,
                location: String
            },
            new_duty_id: mongoose.Schema.Types.ObjectId,
            new_duty_details: {
                exam_name: String,
                exam_id: mongoose.Schema.Types.ObjectId,
                duty_type: String,
                date: Date,
                time_slot: String,
                location: String
            }
        },

        teacher2: {
            teacher_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Teacher',
                required: true
            },
            teacher_name: String,
            teacher_department: String,
            original_duty_id: mongoose.Schema.Types.ObjectId,
            original_duty_details: {
                exam_name: String,
                exam_id: mongoose.Schema.Types.ObjectId,
                duty_type: String,
                date: Date,
                time_slot: String,
                location: String
            },
            new_duty_id: mongoose.Schema.Types.ObjectId,
            new_duty_details: {
                exam_name: String,
                exam_id: mongoose.Schema.Types.ObjectId,
                duty_type: String,
                date: Date,
                time_slot: String,
                location: String
            }
        },

        // Swap reason and justification
        reason: {
            type: String,
            enum: ['teacher_request', 'fairness_improvement', 'conflict_resolution', 'emergency', 'optimization', 'manual_adjustment'],
            required: true
        },

        reason_description: String,
        requested_by: mongoose.Schema.Types.ObjectId,

        // Swap impact analysis
        impact_analysis: {
            fairness_impact_teacher1: Number,
            fairness_impact_teacher2: Number,
            total_fairness_impact: Number,
            load_balance_impact: Number,
            constraint_violations_before: Number,
            constraint_violations_after: Number,
            feasibility_score: Number,
            risk_level: {
                type: String,
                enum: ['low', 'medium', 'high'],
                default: 'medium'
            },
            risk_description: [String]
        },

        // Approval workflow
        approval: {
            status: {
                type: String,
                enum: ['pending', 'approved', 'rejected', 'pending_teacher1', 'pending_teacher2', 'both_approved'],
                default: 'pending'
            },

            teacher1_approval: {
                status: {
                    type: String,
                    enum: ['pending', 'approved', 'rejected'],
                    default: 'pending'
                },
                response_date: Date,
                response_notes: String
            },

            teacher2_approval: {
                status: {
                    type: String,
                    enum: ['pending', 'approved', 'rejected'],
                    default: 'pending'
                },
                response_date: Date,
                response_notes: String
            },

            admin_approval: {
                status: {
                    type: String,
                    enum: ['pending', 'approved', 'rejected'],
                    default: 'pending'
                },
                approved_by: mongoose.Schema.Types.ObjectId,
                approval_date: Date,
                approval_notes: String
            }
        },

        // Execution
        execution: {
            status: {
                type: String,
                enum: ['pending', 'executed', 'failed', 'reversed'],
                default: 'pending'
            },

            executed_at: Date,
            executed_by: mongoose.Schema.Types.ObjectId,
            execution_notes: String,
            error_message: String
        },

        // Reversal (if applicable)
        reversal: {
            is_reversed: {
                type: Boolean,
                default: false
            },
            reversed_at: Date,
            reversed_by: mongoose.Schema.Types.ObjectId,
            reversal_reason: String,
            restoration_status: String
        },

        // Audit trails
        audit_trail: [
            {
                action: String,
                timestamp: Date,
                actor_id: mongoose.Schema.Types.ObjectId,
                details: String
            }
        ],

        // Notifications sent
        notifications: [
            {
                recipient_id: mongoose.Schema.Types.ObjectId,
                notification_type: String,
                sent_at: Date,
                delivery_status: String
            }
        ],

        // Related information
        related_swaps: [mongoose.Schema.Types.ObjectId],
        simulation_id: mongoose.Schema.Types.ObjectId,

        // Metadata
        swap_chain_id: String,
        swap_order_in_chain: Number,
        tags: [String],
        notes: String
    },
    {
        timestamps: true,
        collection: 'swap_transactions'
    }
);

// Indexes
SwapTransactionSchema.index({ allocation_id: 1 });
SwapTransactionSchema.index({ swap_id: 1 });
SwapTransactionSchema.index({ 'teacher1.teacher_id': 1 });
SwapTransactionSchema.index({ 'teacher2.teacher_id': 1 });
SwapTransactionSchema.index({ 'approval.status': 1 });
SwapTransactionSchema.index({ 'execution.status': 1 });
SwapTransactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SwapTransaction', SwapTransactionSchema);
