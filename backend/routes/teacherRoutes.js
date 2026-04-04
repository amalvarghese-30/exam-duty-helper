const express = require("express");
const router = express.Router();

const Teacher = require("../models/Teacher");
const TeacherDashboardController = require("../controllers/TeacherDashboardController");


// GET teacher by email - MUST BE BEFORE /:id routes
router.get("/email/:email", async (req, res) => {
    try {
        console.log("🔍 Looking for teacher with email:", req.params.email);

        const teacher = await Teacher.findOne({
            email: req.params.email
        });

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found"
            });
        }

        res.json(teacher);

    } catch (err) {
        console.error("Error finding teacher by email:", err);
        res.status(500).json({
            error: err.message
        });
    }
});


// GET teacher duties (IMPORTANT: keep before /:id routes)
router.get("/duties", TeacherDashboardController.getTeacherDuties);


// CREATE teacher
router.post("/", async (req, res) => {
    try {
        const teacher = new Teacher(req.body);
        await teacher.save();
        res.status(201).json(teacher);
    } catch (err) {
        console.error("Error creating teacher:", err);
        res.status(500).json({ error: err.message });
    }
});


// GET all teachers
router.get("/", async (req, res) => {
    try {
        const teachers = await Teacher.find();
        res.json(teachers);
    } catch (err) {
        console.error("Error fetching teachers:", err);
        res.status(500).json({ error: err.message });
    }
});


// GET teacher by ID
router.get("/:id", async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }
        res.json(teacher);
    } catch (err) {
        console.error("Error fetching teacher by ID:", err);
        res.status(500).json({ error: err.message });
    }
});


// UPDATE teacher
router.put("/:id", async (req, res) => {
    try {
        const updated = await Teacher.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ message: "Teacher not found" });
        }
        res.json(updated);
    } catch (err) {
        console.error("Error updating teacher:", err);
        res.status(500).json({ error: err.message });
    }
});


// DELETE teacher
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Teacher.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "Teacher not found" });
        }
        res.json({ message: "Teacher deleted successfully" });
    } catch (err) {
        console.error("Error deleting teacher:", err);
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;