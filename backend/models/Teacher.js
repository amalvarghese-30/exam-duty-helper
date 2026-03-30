const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
    {
        institution_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: false,
        },

        name: {
            type: String,
            required: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
        },

        department: {
            type: String,
            default: "",
        },

        subject: {
            type: String,
            default: "",
        },

        // Seniority in years
        seniority_years: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Reliability score (0-1): based on past acceptance/rejection rates
        reliability_score: {
            type: Number,
            default: 0.8,
            min: 0,
            max: 1,
        },

        // Total duties assigned in current term/cycle
        totalDuties: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Availability for exams (date/slot pairs)
        availability: [
            {
                date: String,
                slot: String,
            },
        ],

        // Preferred/allowed roles (invigilator, supervisor, coordinator, etc.)
        allowed_roles: {
            type: [String],
            default: ["invigilator"],
            enum: ["invigilator", "supervisor", "coordinator", "relief", "reserve"],
        },

        // Emergency contact
        emergency_contact: {
            type: String,
            default: "",
        },

        // Is teacher actively available for allocation
        is_active: {
            type: Boolean,
            default: true,
        },

        // Notes about teacher
        notes: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

// Index for efficient queries
teacherSchema.index({ institution_id: 1, email: 1 });
teacherSchema.index({ institution_id: 1, department: 1 });

module.exports = mongoose.model("Teacher", teacherSchema);
