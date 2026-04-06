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
    seating_plan: [
        {
            room_number: { type: String, required: true },
            room_capacity: { type: Number, required: true },
            assigned_count: { type: Number, required: true },
            start_roll: { type: Number, required: true },
            end_roll: { type: Number, required: true },
        }
    ],
    required_invigilators: {
        type: Number,
        default: 1
    },
    student_count: {
        type: Number,
        default: 30,
        min: 1
    }
}, { timestamps: true });

function loadRoomConfigs() {
    const roomsFile = path.join(__dirname, "../data/rooms.csv");
    const rows = fs.readFileSync(roomsFile, "utf-8")
        .split("\n")
        .map(r => r.trim())
        .filter(r => r);

    return rows
        .map((row) => {
            const [roomRaw, capacityRaw] = row.split(",").map((value) => String(value || "").trim());
            const room = roomRaw;
            if (!room || room.toLowerCase() === "room") return null;

            const parsedCapacity = Number(capacityRaw);
            const capacity = Number.isFinite(parsedCapacity) && parsedCapacity > 0 ? parsedCapacity : 30;
            return { room, capacity };
        })
        .filter(Boolean);
}

function loadClassCapacityMap() {
    const classFile = path.join(__dirname, "../data/class_capacity.csv");
    try {
        const rows = fs.readFileSync(classFile, "utf-8")
            .split("\n")
            .map((row) => row.trim())
            .filter(Boolean);

        if (!rows.length) return new Map();

        const header = rows[0].split(",").map((part) => part.trim().toLowerCase());
        const classIndex = header.indexOf("class_name");
        const countIndex = header.indexOf("student_count");
        if (classIndex < 0 || countIndex < 0) return new Map();

        const map = new Map();
        rows.slice(1).forEach((row) => {
            const cols = row.split(",").map((part) => part.trim());
            const className = String(cols[classIndex] || "").toUpperCase();
            const studentCount = Number(cols[countIndex]);
            if (!className || !Number.isFinite(studentCount) || studentCount <= 0) return;
            map.set(className, studentCount);
        });
        return map;
    } catch {
        return new Map();
    }
}

// Pre-validate hook to assign room automatically
examSchema.pre("validate", async function() {
    const roomConfigs = loadRoomConfigs();
    const classCapacityMap = loadClassCapacityMap();
    const classDefault = classCapacityMap.get(String(this.class_name || "").toUpperCase()) || 0;

    // Promote class default capacity when form keeps generic fallback value.
    const currentStudentCount = Number(this.student_count) || 0;
    if ((!currentStudentCount || currentStudentCount === 30) && classDefault > 0) {
        this.student_count = classDefault;
    }

    const requiredCapacity = Number(this.student_count) || classDefault || 0;
    if (requiredCapacity <= 0) {
        throw new Error("Student count is required to allocate rooms");
    }

    // Find exams at the same date and time
    const Exam = mongoose.model("Exam", examSchema);
    const conflictingExams = await Exam.find({
        exam_date: this.exam_date,
        start_time: this.start_time,
        _id: { $ne: this._id }
    });

    const usedRooms = new Set();
    conflictingExams.forEach((exam) => {
        if (exam.room_number) usedRooms.add(String(exam.room_number).toUpperCase());
        (exam.seating_plan || []).forEach((seat) => {
            if (seat?.room_number) usedRooms.add(String(seat.room_number).toUpperCase());
        });
    });

    const preferredRoom = String(this.room_number || "").toUpperCase();
    const freeRooms = roomConfigs
        .map((room) => ({ room: String(room.room).toUpperCase(), capacity: Number(room.capacity) || 30 }))
        .filter(({ room }) => !usedRooms.has(room));

    if (!freeRooms.length) {
        throw new Error("No available rooms for this slot");
    }

    freeRooms.sort((a, b) => a.capacity - b.capacity);

    // Keep preferred room first when it is free to preserve user intent.
    if (preferredRoom) {
        const index = freeRooms.findIndex((room) => room.room === preferredRoom);
        if (index >= 0) {
            const [selected] = freeRooms.splice(index, 1);
            freeRooms.unshift(selected);
        }
    }

    let remaining = requiredCapacity;
    let nextRoll = 1;
    const seatingPlan = [];

    for (const room of freeRooms) {
        if (remaining <= 0) break;
        const assignCount = Math.min(room.capacity, remaining);
        seatingPlan.push({
            room_number: room.room,
            room_capacity: room.capacity,
            assigned_count: assignCount,
            start_roll: nextRoll,
            end_roll: nextRoll + assignCount - 1,
        });
        nextRoll += assignCount;
        remaining -= assignCount;
    }

    if (remaining > 0) {
        const totalFreeCapacity = freeRooms.reduce((sum, room) => sum + room.capacity, 0);
        throw new Error(
            `Class strength is ${requiredCapacity}, but available room capacity in this slot is ${totalFreeCapacity}.`
        );
    }

    this.seating_plan = seatingPlan;
    this.room_number = seatingPlan[0]?.room_number || "";
    this.required_invigilators = Math.max(Number(this.required_invigilators) || 1, seatingPlan.length || 1);
});

module.exports = mongoose.model("Exam", examSchema);