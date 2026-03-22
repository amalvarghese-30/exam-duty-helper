const express = require("express");
const router = express.Router();
const TeacherLeave = require("../models/TeacherLeave");

// GET leave dates for a teacher
router.get("/:teacherId", async (req, res) => {
    try {
        const leaves = await TeacherLeave.find({ teacher_id: req.params.teacherId })
            .sort({ leave_date: 1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE leave date
router.post("/", async (req, res) => {
    try {
        const leave = new TeacherLeave(req.body);
        await leave.save();
        res.status(201).json(leave);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE leave date
router.delete("/:id", async (req, res) => {
    try {
        const leave = await TeacherLeave.findByIdAndDelete(req.params.id);
        if (!leave) return res.status(404).json({ error: "Leave date not found" });
        res.json({ message: "Leave date removed" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;