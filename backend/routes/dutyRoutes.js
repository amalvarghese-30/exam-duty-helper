const express = require("express");
const router = express.Router();
const DutyAllocation = require("../models/DutyAllocation");
const Teacher = require("../models/Teacher");
const Exam = require("../models/Exam");
const TeacherLeave = require("../models/TeacherLeave");

// GET all duties (with populated teacher and exam)
router.get("/", async (req, res) => {
    try {
        const duties = await DutyAllocation.find()
            .populate("teacher_id", "name email department")
            .populate("exam_id", "subject exam_date start_time end_time room_number")
            .sort({ allocated_at: -1 });

        // Format response to match frontend expectations
        const formatted = duties.map(d => ({
            _id: d._id,
            teacher_id: d.teacher_id?._id,
            exam_id: d.exam_id?._id,
            status: d.status,
            teacher: d.teacher_id,
            exam: d.exam_id
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET duties for specific teacher
router.get("/teacher/:teacherId", async (req, res) => {
    try {
        const duties = await DutyAllocation.find({ teacher_id: req.params.teacherId })
            .populate("exam_id", "subject exam_date start_time end_time room_number")
            .sort({ allocated_at: -1 });

        const formatted = duties.map(d => ({
            _id: d._id,
            status: d.status,
            exam: d.exam_id
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// AI allocation endpoint
router.post("/allocate", async (req, res) => {
    try {
        // Fetch all exams and teachers
        const exams = await Exam.find().sort({ exam_date: 1 });
        const teachers = await Teacher.find();

        if (!exams.length) {
            return res.status(400).json({ error: "No exams to allocate" });
        }
        if (!teachers.length) {
            return res.status(400).json({ error: "No teachers available" });
        }

        // Fetch existing allocations and leave dates
        const existingAllocs = await DutyAllocation.find();
        const leaveDates = await TeacherLeave.find();

        // Build leave set
        const leaveSet = new Set(leaveDates.map(l => `${l.teacher_id}_${l.leave_date}`));

        // Build existing allocation set
        const existingSet = new Set(existingAllocs.map(a => `${a.teacher_id}_${a.exam_id}`));

        // Track workload per teacher
        const workload = {};
        teachers.forEach(t => { workload[t._id.toString()] = 0; });
        existingAllocs.forEach(a => {
            const tid = a.teacher_id.toString();
            if (workload[tid] !== undefined) workload[tid]++;
        });

        // Track teacher time slots to prevent overlaps
        const teacherSlots = {};
        teachers.forEach(t => { teacherSlots[t._id.toString()] = []; });
        existingAllocs.forEach(async (a) => {
            const exam = exams.find(e => e._id.toString() === a.exam_id.toString());
            if (exam && teacherSlots[a.teacher_id.toString()]) {
                teacherSlots[a.teacher_id.toString()].push({
                    date: exam.exam_date,
                    start: exam.start_time,
                    end: exam.end_time
                });
            }
        });

        const newAllocations = [];

        for (const exam of exams) {
            const needed = exam.required_invigilators;
            const alreadyAssigned = existingAllocs.filter(a => a.exam_id.toString() === exam._id.toString()).length;
            const remaining = needed - alreadyAssigned;

            if (remaining <= 0) continue;

            // Filter eligible teachers for this exam
            const eligible = teachers
                .filter(t => {
                    const tid = t._id.toString();
                    // Not already assigned to this exam
                    if (existingSet.has(`${tid}_${exam._id}`)) return false;
                    if (newAllocations.some(a => a.teacher_id === tid && a.exam_id === exam._id.toString())) return false;
                    // Not on leave
                    if (leaveSet.has(`${tid}_${exam.exam_date}`)) return false;
                    // No time overlap
                    const slots = teacherSlots[tid] || [];
                    const hasOverlap = slots.some(s =>
                        s.date === exam.exam_date && s.start < exam.end_time && s.end > exam.start_time
                    );
                    return !hasOverlap;
                })
                .sort((a, b) => (workload[a._id.toString()] || 0) - (workload[b._id.toString()] || 0));

            for (let i = 0; i < remaining && i < eligible.length; i++) {
                const teacher = eligible[i];
                const tid = teacher._id.toString();
                newAllocations.push({ teacher_id: tid, exam_id: exam._id.toString(), status: "assigned" });
                workload[tid] = (workload[tid] || 0) + 1;
                if (!teacherSlots[tid]) teacherSlots[tid] = [];
                teacherSlots[tid].push({
                    date: exam.exam_date,
                    start: exam.start_time,
                    end: exam.end_time
                });
            }
        }

        if (newAllocations.length === 0) {
            return res.json({ message: "All duties are already allocated", allocated: 0 });
        }

        await DutyAllocation.insertMany(newAllocations);
        res.json({ message: `${newAllocations.length} duties allocated successfully`, allocated: newAllocations.length });

    } catch (err) {
        console.error("Allocation failed:", err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE all duties (clear allocations)
router.delete("/", async (req, res) => {
    try {
        await DutyAllocation.deleteMany({});
        res.json({ message: "All allocations cleared" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;