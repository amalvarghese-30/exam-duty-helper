const express = require("express");
const router = express.Router();

const Teacher = require("../models/Teacher");
const Exam = require("../models/Exam");
const DutyAllocation = require("../models/DutyAllocation");
const TeacherLeave = require("../models/TeacherLeave");

router.post("/auto-allocate", async (req, res) => {

    try {

        const exams = await Exam.find().sort({ date: 1 });

        let allocations = [];

        for (let exam of exams) {

            const teachers = await Teacher.find();

            const leaves = await TeacherLeave.find({
                date: exam.date,
                slot: exam.slot
            });

            const leaveEmails = leaves.map(l => l.email);

            let bestTeacher = null;
            let bestScore = -Infinity;

            for (let teacher of teachers) {

                let score = 0;

                // ❌ Skip if subject conflict
                if (
                    teacher.subject &&
                    teacher.subject.toLowerCase() === exam.subject.toLowerCase()
                ) {
                    score -= 100;
                }

                // ❌ Skip if on leave
                if (leaveEmails.includes(teacher.email)) {
                    score -= 100;
                }

                // ✅ Fairness (less duties = higher score)
                score += (10 - teacher.totalDuties);

                // ✅ Availability bonus
                const unavailable = teacher.availability.some(a =>
                    a.date === exam.date && a.slot === exam.slot
                );

                if (!unavailable) {
                    score += 5;
                }

                // ❌ Consecutive duty penalty
                const previousDuty = await DutyAllocation.findOne({
                    teacherEmail: teacher.email,
                    date: exam.date
                });

                if (previousDuty) {
                    score -= 4;
                }

                // Optional department match bonus
                if (
                    teacher.department &&
                    exam.department &&
                    teacher.department === exam.department
                ) {
                    score += 2;
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestTeacher = teacher;
                }
            }

            if (bestTeacher) {

                const allocation = await DutyAllocation.create({
                    teacherEmail: bestTeacher.email,
                    examId: exam._id,
                    subject: exam.subject,
                    date: exam.date,
                    slot: exam.slot
                });

                bestTeacher.totalDuties += 1;
                await bestTeacher.save();

                allocations.push(allocation);
            }
        }

        res.json({
            message: "Smart allocation completed",
            allocations
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;