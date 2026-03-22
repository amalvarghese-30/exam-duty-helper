const mongoose = require("mongoose");

const teacherLeaveSchema = new mongoose.Schema({
    teacher_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        required: true
    },
    leave_date: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        default: ""
    }
}, { timestamps: true });

module.exports = mongoose.model("TeacherLeave", teacherLeaveSchema);