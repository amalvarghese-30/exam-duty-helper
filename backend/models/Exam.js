const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true
    },
    exam_date: {
        type: String,
        required: true
    },
    start_time: {
        type: String,
        required: true
    },
    end_time: {
        type: String,
        required: true
    },
    room_number: {
        type: String,
        required: true
    },
    required_invigilators: {
        type: Number,
        default: 1
    }
}, { timestamps: true });

module.exports = mongoose.model("Exam", examSchema);