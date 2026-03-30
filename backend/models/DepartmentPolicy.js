const mongoose = require("mongoose");

const departmentPolicySchema = new mongoose.Schema(
    {
        institution_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: true,
        },

        department: {
            type: String,
            required: true,
        },

        // Daily duty limits
        max_daily_duties: {
            type: Number,
            default: 3,
            min: 1,
            max: 10,
        },

        // Whether external department teachers can be allocated
        allow_external_allocation: {
            type: Boolean,
            default: true,
        },

        // Priority subjects for this department (invigilators preferred from these subjects)
        priority_subjects: [
            {
                type: String,
            },
        ],

        // Minimum gap required between consecutive duties (in hours)
        min_gap_between_duties_hours: {
            type: Number,
            default: 1,
            min: 0,
        },

        // Whether seniority can override other constraints
        seniority_override: {
            type: Boolean,
            default: false,
        },

        // Minimum seniority years required for certain duty types
        min_seniority_years: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Preferred roles by seniority (senior teachers get supervisor roles)
        role_preferences: {
            supervisor: {
                min_seniority: { type: Number, default: 5 },
            },
            coordinator: {
                min_seniority: { type: Number, default: 8 },
            },
            relief: {
                min_seniority: { type: Number, default: 1 },
            },
            invigilator: {
                min_seniority: { type: Number, default: 0 },
            },
        },

        // Fair allocation target - try to keep teachers within this range
        target_duty_range: {
            min: { type: Number, default: 1 },
            max: { type: Number, default: 5 },
        },

        // Optional notes
        notes: {
            type: String,
            default: "",
        },

        is_active: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Index for efficient queries
departmentPolicySchema.index({ institution_id: 1, department: 1 }, { unique: true });

module.exports = mongoose.model("DepartmentPolicy", departmentPolicySchema);
