const express = require("express");
const router = express.Router();
const Exam = require("../models/Exam");
const AllocationPolicy = require("../models/AllocationPolicy");
const axios = require("axios");

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || "http://127.0.0.1:5000";

function withSeatingFallback(exam) {
    const raw = typeof exam?.toObject === "function" ? exam.toObject() : exam;
    const seating = Array.isArray(raw?.seating_plan) ? raw.seating_plan : [];
    if (seating.length > 0) {
        return {
            ...raw,
            required_invigilators: Math.max(Number(raw?.required_invigilators) || 1, seating.length),
        };
    }

    const room = String(raw?.room_number || "").trim();
    const students = Number(raw?.student_count || 0);
    if (!room || students <= 0) return raw;

    return {
        ...raw,
        required_invigilators: Math.max(Number(raw?.required_invigilators) || 1, 1),
        seating_plan: [
            {
                room_number: room,
                room_capacity: students,
                assigned_count: students,
                start_roll: 1,
                end_roll: students,
            },
        ],
    };
}

async function backfillLegacyExamSeating() {
    const legacyExams = await Exam.find({
        $or: [
            { seating_plan: { $exists: false } },
            { seating_plan: { $size: 0 } },
            { student_count: { $exists: false } },
            { student_count: null },
        ],
    }).sort({ exam_date: 1, start_time: 1, createdAt: 1 });

    const summary = {
        totalCandidates: legacyExams.length,
        updated: 0,
        failed: 0,
        failures: [],
    };

    for (const exam of legacyExams) {
        try {
            await exam.validate();
            await exam.save();
            summary.updated += 1;
        } catch (err) {
            summary.failed += 1;
            summary.failures.push({
                exam_id: String(exam._id),
                subject: exam.subject,
                class_name: exam.class_name,
                exam_date: exam.exam_date,
                start_time: exam.start_time,
                error: err.message,
            });
        }
    }

    return summary;
}

async function triggerAutomatedRunIfEnabled() {
    try {
        const policy = await AllocationPolicy.findOne({ name: "default" }).lean();
        if (!policy?.autoRunOnExamChange) return;
        await axios.post(`${BACKEND_BASE_URL}/auto-allocate/run-automated`);
    } catch (err) {
        console.error("Auto-run trigger skipped:", err.message);
    }
}

// GET all exams - SORTED BY CLASS (FY->LY), THEN DATE, THEN TIME
router.get("/", async (req, res) => {
    try {
        await backfillLegacyExamSeating();
        const exams = await Exam.find().sort({ 
            class_name: 1,  // Then group by FY, SY, TY, LY
            exam_date: 1,   // Sort by Date first
            start_time: 1   // Then sort by morning vs afternoon
        });
        res.json(exams.map(withSeatingFallback));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// BACKFILL legacy exams with seating split using class capacity defaults
router.post("/backfill-seating", async (req, res) => {
    try {
        const summary = await backfillLegacyExamSeating();
        res.json({ message: "Legacy seating backfill completed", ...summary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET student timetable for class with room-wise roll ranges
router.get("/student-timetable/:className", async (req, res) => {
    try {
        const className = String(req.params.className || "").trim().toUpperCase();
        if (!className) {
            return res.status(400).json({ error: "className is required" });
        }

        const exams = await Exam.find({ class_name: className }).sort({ exam_date: 1, start_time: 1 }).lean();
        const timetable = exams.map((exam) => {
            const normalized = withSeatingFallback(exam);
            return ({
            exam_id: exam._id,
            subject: normalized.subject,
            class_name: normalized.class_name,
            exam_date: normalized.exam_date,
            start_time: normalized.start_time,
            end_time: normalized.end_time,
            student_count: normalized.student_count,
            seating_plan: (normalized.seating_plan || []).map((slot) => ({
                room_number: slot.room_number,
                start_roll: slot.start_roll,
                end_roll: slot.end_roll,
                assigned_count: slot.assigned_count,
                room_capacity: slot.room_capacity,
            })),
        });
        });

        res.json({ class_name: className, exams: timetable });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single exam
router.get("/:id", async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ error: "Exam not found" });
        res.json(withSeatingFallback(exam));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE exam
router.post("/", async (req, res) => {
    try {
        const exam = new Exam(req.body);
        await exam.save();
        triggerAutomatedRunIfEnabled();
        res.status(201).json(exam);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE exam
router.put("/:id", async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ error: "Exam not found" });

        Object.assign(exam, req.body);
        await exam.save();

        triggerAutomatedRunIfEnabled();
        res.json(exam);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE exam
router.delete("/:id", async (req, res) => {
    try {
        const exam = await Exam.findByIdAndDelete(req.params.id);
        if (!exam) return res.status(404).json({ error: "Exam not found" });
        triggerAutomatedRunIfEnabled();
        res.json({ message: "Exam deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;