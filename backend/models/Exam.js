const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const examSchema = new mongoose.Schema(
    {
        institution_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: false,
        },

        subject: {
            type: String,
            required: true,
        },

        department: {
            type: String,
            default: "",
        },

        exam_date: {
            type: String,
            required: true,
        },

        start_time: {
            type: String,
            required: true,
        },

        end_time: {
            type: String,
            required: true,
        },

        room_number: {
            type: String,
            required: false,
        },

        // Role-based allocation: maps role -> count
        // Example: { invigilator: 3, supervisor: 1, coordinator: 1, relief: 1 }
        required_roles: {
            type: Map,
            of: Number,
            default: { invigilator: 1 },
        },

        // Exam category: regular, makeup, special, etc.
        category: {
            type: String,
            enum: ["regular", "makeup", "special", "supplementary"],
            default: "regular",
        },

        // Whether this exam is locked (no changes allowed)
        is_locked: {
            type: Boolean,
            default: false,
        },

        // Notes about exam
        notes: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

// Pre-validate hook to assign room automatically
examSchema.pre("validate", async function () {
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