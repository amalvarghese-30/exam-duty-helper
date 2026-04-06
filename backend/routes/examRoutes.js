const express = require("express");
const router = express.Router();
const Exam = require("../models/Exam");
const AllocationPolicy = require("../models/AllocationPolicy");
const axios = require("axios");

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || "http://127.0.0.1:5000";

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
        const exams = await Exam.find().sort({ 
            class_name: 1,  // Then group by FY, SY, TY, LY
            exam_date: 1,   // Sort by Date first
            start_time: 1   // Then sort by morning vs afternoon
        });
        res.json(exams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single exam
router.get("/:id", async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ error: "Exam not found" });
        res.json(exam);
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
        const exam = await Exam.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!exam) return res.status(404).json({ error: "Exam not found" });
        triggerAutomatedRunIfEnabled();
        res.json(exam);
    } catch (err) {
        res.status(500).json({ error: err.message });
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