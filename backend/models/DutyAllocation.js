const mongoose = require("mongoose");

const dutyAllocationSchema = new mongoose.Schema(
    {
        institution_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: false,
        },

        teacher_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true,
        },

        exam_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Exam",
            required: true,
        },

        // Role for this allocation (invigilator, supervisor, coordinator, relief, reserve)
        role: {
            type: String,
            enum: ["invigilator", "supervisor", "coordinator", "relief", "reserve"],
            default: "invigilator",
        },

        // Allocation status
        status: {
            type: String,
            enum: ["assigned", "accepted", "rejected", "on_leave", "swapped"],
            default: "assigned",
        },

        // Allocation score (for explainability)
        allocation_score: {
            type: Number,
            min: -100,
            max: 100,
            default: 0,
        },

        // Whether this assignment is locked
        is_locked: {
            type: Boolean,
            default: false,
        },

        // Admin override flag and reason
        admin_override: {
            type: Boolean,
            default: false,
        },

        override_reason: {
            type: String,
            default: "",
        },

        // Allocation method (scoring, optimization, manual, swap)
        allocation_method: {
            type: String,
            enum: ["scoring", "optimization", "manual", "swap", "emergency"],
            default: "scoring",
        },

        // Notes
        notes: {
            type: String,
            default: "",
        },

        allocated_at: {
            type: Date,
            default: Date.now,
        },

        accepted_at: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Index for efficient queries
dutyAllocationSchema.index({
    institution_id: 1,
    teacher_id: 1,
    status: 1,
});
dutyAllocationSchema.index({
    institution_id: 1,
    exam_id: 1,
    role: 1,
});

module.exports = mongoose.model("DutyAllocation", dutyAllocationSchema);
