const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const examSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true
    },
    class_name: {
    type: String, 
    required: true, 
    enum: ['FY', 'SY', 'TY', 'LY']
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
        required: false
    },
    required_invigilators: {
        type: Number,
        default: 1
    }
}, { timestamps: true });

// Pre-validate hook to assign room automatically
examSchema.pre("validate", async function() {
    if (this.room_number) return; // already set, skip

    // Load rooms from CSV
    const roomsFile = path.join(__dirname, "../data/rooms.csv");
    const rooms = fs.readFileSync(roomsFile, "utf-8")
                    .split("\n")
                    .map(r => r.trim())
                    .filter(r => r);

    // Find exams at the same date and time
    const Exam = mongoose.model("Exam", examSchema);
    const conflictingExams = await Exam.find({
        exam_date: this.exam_date,
        start_time: this.start_time
    });

    const usedRooms = conflictingExams.map(e => e.room_number);

    // Pick first available room
    const availableRoom = rooms.find(r => !usedRooms.includes(r));
    if (!availableRoom) throw new Error("No available rooms for this slot");

    this.room_number = availableRoom;
});

module.exports = mongoose.model("Exam", examSchema);