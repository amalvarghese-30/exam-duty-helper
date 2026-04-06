const express = require("express");
const router = express.Router();

const Teacher = require("../models/Teacher");


// GET teacher by email (must come BEFORE /:id routes)
router.get("/email/:email", async (req, res) => {
    try {
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
        res.status(500).json({
            error: err.message
        });
    }
});


// CREATE teacher
router.post("/", async (req, res) => {
    try {
        const teacher = new Teacher(req.body);
        await teacher.save();
        res.status(201).json(teacher);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// GET all teachers
router.get("/", async (req, res) => {
    try {
        const teachers = await Teacher.find();
        res.json(teachers);
    } catch (err) {
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

        res.json(updated);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// DELETE teacher
router.delete("/:id", async (req, res) => {
    try {
        await Teacher.findByIdAndDelete(req.params.id);
        res.json({ message: "Teacher deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get("/:id/duties", async (req, res) => {
try {
const DutyAllocation = require("../models/DutyAllocation");
const duties = await DutyAllocation.find({
teacher_id: req.params.id
}).populate("exam_id");
res.json(duties);
} catch (err) {
res.status(500).json({ error: err.message });
}
});


module.exports = router;
