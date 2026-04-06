const mongoose = require("mongoose");

const dutyAllocationSchema = new mongoose.Schema({
    teacher_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        required: true
    },
    exam_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exam",
        required: true
    },
    room_number: {
        type: String,
        required: false
    },
    start_roll: {
        type: Number,
        required: false
    },
    end_roll: {
        type: Number,
        required: false
    },
    assigned_count: {
        type: Number,
        required: false
    },
    status: {
        type: String,
        enum: ["assigned", "accepted", "on_leave"],
        default: "assigned"
    },
    allocated_at: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model("DutyAllocation", dutyAllocationSchema);