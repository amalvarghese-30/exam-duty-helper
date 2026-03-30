const mongoose = require('mongoose');

/**
 * AllocationSimulation Schema
 * Stores simulation runs before they're approved and applied
 * Allows admins to preview changes before committing
 */
const AllocationSimulationSchema = new mongoose.Schema(
    {
        // Reference to original allocation
        allocation_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Allocation',
            required: true
        },

        // Institution running the simulation
        institution_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Institution',
            required: true
        },

        // Simulation parameters
        simulation_type: {
            type: String,
            enum: ['optimization', 'swap_test', 'emergency_replacement', 'manual'],
            required: true
        },

        // Current state (before changes)
        original_allocation: [
            {
                exam_id: mongoose.Schema.Types.ObjectId,
                teacher_id: mongoose.Schema.Types.ObjectId,
                exam_code: String,
                exam_name: String,
                teacher_name: String
            }
        ],

        // Proposed state (after changes)
        proposed_allocation: [
            {
                exam_id: mongoose.Schema.Types.ObjectId,
                teacher_id: mongoose.Schema.Types.ObjectId,
                exam_code: String,
                exam_name: String,
                teacher_name: String,
                change_reason: String
            }
        ],

        // Comparison metrics
        comparison: {
            fairness_before: Number,
            fairness_after: Number,
            fairness_delta: Number,
            workload_balance_before: Number,
            workload_balance_after: Number,
            workload_delta: Number,
            changes_count: Number,
            added_assignments: [
                {
                    exam_id: mongoose.Schema.Types.ObjectId,
                    teacher_id: mongoose.Schema.Types.ObjectId,
                    reason: String
                }
            ],
            removed_assignments: [
                {
                    exam_id: mongoose.Schema.Types.ObjectId,
                    teacher_id: mongoose.Schema.Types.ObjectId,
                    reason: String
                }
            ]
        },

        // Simulation parameters
        parameters: {
            use_optimization: Boolean,
            optimization_constraints: mongoose.Schema.Types.Mixed,
            time_limit_seconds: Number,
            random_seed: Number
        },

        // Simulation statistics
        statistics: {
            hard_constraints_satisfied: Boolean,
            soft_constraints_violated: Number,
            optimization_time_ms: Number,
            solution_quality: Number
        },

        // User who ran simulation
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        // Status
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'expired'],
            default: 'pending'
        },

        // If approved, when and by whom
        approval_info: {
            approved_at: Date,
            approved_by: mongoose.Schema.Types.ObjectId,
            approval_comments: String
        },

        // Expiration (simulations expire after 7 days if not approved)
        expires_at: Date
    },
    {
        timestamps: true
    }
);

/**
 * AllocationHistory Schema
 * Complete audit trail of all allocation changes
 * Tracks every modification, swap, emergency replacement, etc.
 */
const AllocationHistorySchema = new mongoose.Schema(
    {
        // Reference to the allocation
        allocation_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Allocation',
            required: true
        },

        // Institution
        institution_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Institution',
            required: true
        },

        // Type of change
        change_type: {
            type: String,
            enum: [
                'initial_allocation',
                'optimization',
                'manual_swap',
                'automatic_swap',
                'emergency_replacement',
                'policy_change',
                'conflict_resolution',
                'fairness_correction',
                'rollback'
            ],
            required: true
        },

        // Specific change details
        change_details: {
            // For swaps
            swap_details: {
                exam_id: mongoose.Schema.Types.ObjectId,
                teacher_from_id: mongoose.Schema.Types.ObjectId,
                teacher_to_id: mongoose.Schema.Types.ObjectId,
                teacher_from_name: String,
                teacher_to_name: String,
                swap_reason: String,
                fairness_improvement: Number
            },

            // For emergency replacements
            replacement_details: {
                unavailable_teacher_id: mongoose.Schema.Types.ObjectId,
                replacement_teacher_id: mongoose.Schema.Types.ObjectId,
                replacement_teacher_name: String,
                affected_duties: [mongoose.Schema.Types.ObjectId],
                unavailability_reason: String,
                unavailable_from: Date,
                unavailable_to: Date
            },

            // For policy changes
            policy_change: {
                department_id: mongoose.Schema.Types.ObjectId,
                policy_field: String,
                old_value: mongoose.Schema.Types.Mixed,
                new_value: mongoose.Schema.Types.Mixed
            },

            // For manual changes
            manual_change: {
                exam_id: mongoose.Schema.Types.ObjectId,
                teacher_id: mongoose.Schema.Types.ObjectId,
                operation: String, // 'assign', 'unassign', 'modify'
                reason: String
            }
        },

        // Impact metrics
        impact: {
            fairness_delta: Number,
            workload_delta: Number,
            constraint_violations_before: Number,
            constraint_violations_after: Number,
            affected_teachers_count: Number,
            affected_exams_count: Number
        },

        // User who made the change
        changed_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        // User role/title for audit trail
        user_role: String,

        // Change reason (for audit compliance)
        reason: String,

        // Approval status for major changes
        requires_approval: Boolean,
        approval_status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'not_required'],
            default: 'not_required'
        },
        approved_by: mongoose.Schema.Types.ObjectId,
        approval_comments: String,

        // Reversal capability
        can_be_reverted: {
            type: Boolean,
            default: true
        },
        reverted: {
            type: Boolean,
            default: false
        },
        reverted_by: mongoose.Schema.Types.ObjectId,
        reverted_at: Date,
        revert_reason: String,

        // Related history entries
        parent_change_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AllocationHistory'
        },
        child_changes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AllocationHistory'
            }
        ]
    },
    {
        timestamps: true
    }
);

// Indexes for efficient querying
AllocationSimulationSchema.index({ allocation_id: 1, status: 1 });
AllocationSimulationSchema.index({ institution_id: 1, created_at: -1 });
AllocationSimulationSchema.index({ expires_at: 1 });

AllocationHistorySchema.index({ allocation_id: 1, created_at: -1 });
AllocationHistorySchema.index({ institution_id: 1, created_at: -1 });
AllocationHistorySchema.index({ change_type: 1, created_at: -1 });
AllocationHistorySchema.index({ changed_by: 1, created_at: -1 });
AllocationHistorySchema.index({ 'change_details.swap_details.exam_id': 1 });
AllocationHistorySchema.index(
    { 'change_details.replacement_details.unavailable_teacher_id': 1 }
);

// Methods
AllocationHistorySchema.methods.revert = function () {
    this.reverted = true;
    this.reverted_at = new Date();
    return this.save();
};

AllocationHistorySchema.methods.getImpactSummary = function () {
    return {
        change_type: this.change_type,
        fairness_improvement: this.impact.fairness_delta > 0,
        fairness_delta: this.impact.fairness_delta,
        affected_teachers: this.impact.affected_teachers_count,
        affected_exams: this.impact.affected_exams_count,
        can_be_reverted: this.can_be_reverted && !this.reverted
    };
};

AllocationSimulationSchema.methods.approve = function (user_id, comments) {
    this.status = 'approved';
    this.approval_info = {
        approved_at: new Date(),
        approved_by: user_id,
        approval_comments: comments
    };
    return this.save();
};

AllocationSimulationSchema.methods.reject = function () {
    this.status = 'rejected';
    return this.save();
};

// Automatically mark simulations as expired if past expiry date
AllocationSimulationSchema.query.notExpired = function () {
    return this.where('expires_at').gt(new Date());
};

// Middleware to set expiry date on new simulations
AllocationSimulationSchema.pre('save', function (next) {
    if (this.isNew && !this.expires_at) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7); // 7 day expiry
        this.expires_at = expiryDate;
    }
    next();
});

module.exports = {
    AllocationSimulation: mongoose.model(
        'AllocationSimulation',
        AllocationSimulationSchema
    ),
    AllocationHistory: mongoose.model(
        'AllocationHistory',
        AllocationHistorySchema
    )
};
