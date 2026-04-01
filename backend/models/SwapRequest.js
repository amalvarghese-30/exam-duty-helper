const mongoose = require("mongoose");

/**
 * SwapRequest Schema
 * Records all swap requests and approvals for audit and workflow
 */
const SwapRequestSchema = new mongoose.Schema(
    {
        institution_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: true,
        },

        // Requester (usually teacher or admin)
        requester_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        requester_name: String,
        requester_email: String,

        // Teachers involved
        teacher_a_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true,
        },

        teacher_a_name: String,

        teacher_b_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true,
        },

        teacher_b_name: String,

        // Duties being swapped
        duties_a: [
            {
                exam_id: mongoose.Schema.Types.ObjectId,
                role: String,
                date: Date,
            },
        ],

        duties_b: [
            {
                exam_id: mongoose.Schema.Types.ObjectId,
                role: String,
                date: Date,
            },
        ],

        // Fairness improvement details
        fairness_improvement: {
            current_variance: Number,
            post_swap_variance: Number,
            improvement_percent: Number,
            reason: String,
        },

        // Request status workflow
        status: {
            type: String,
            enum: [
                "pending_teacher_b_approval",
                "pending_admin_approval",
                "approved",
                "rejected",
                "cancelled",
                "executed",
                "reverted",
            ],
            default: "pending_teacher_b_approval",
        },

        // Approvals
        teacher_b_approval: {
            approved: Boolean,
            approved_at: Date,
            response: String,
        },

        admin_approval: {
            admin_id: mongoose.Schema.Types.ObjectId,
            admin_name: String,
            approved: Boolean,
            approved_at: Date,
            reason: String,
        },

        // Execution
        executed_at: Date,
        execution_method: String, // manual, automated, system

        // Revert information
        reverted_at: Date,
        revert_reason: String,

        // Request details
        request_type: {
            type: String,
            enum: ["teacher_requested", "admin_suggested", "auto_recommended"],
            default: "teacher_requested",
        },

        message: String,

        // Metadata
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        requested_at: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Indexes for efficient queries
SwapRequestSchema.index({
    institution_id: 1,
    status: 1,
});
SwapRequestSchema.index({
    teacher_a_id: 1,
    status: 1,
});
SwapRequestSchema.index({
    teacher_b_id: 1,
    status: 1,
});
SwapRequestSchema.index({
    institution_id: 1,
    requested_at: -1,
});

module.exports = mongoose.model("SwapRequest", SwapRequestSchema);
