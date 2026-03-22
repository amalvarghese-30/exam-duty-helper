const express = require("express");
const router = express.Router();
const Exam = require("../models/Exam");

// GET all exams
router.get("/", async (req, res) => {
    try {
        const exams = await Exam.find().sort({ exam_date: 1 });
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
        res.json({ message: "Exam deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;