const express = require("express");
const router = express.Router();

const Teacher = require("../models/Teacher");
const Exam = require("../models/Exam");
const DutyAllocation = require("../models/DutyAllocation");
const TeacherLeave = require("../models/TeacherLeave");

router.post("/auto-allocate", async (req, res) => {
    try {

        console.log("Starting allocation engine...");

        // Reset previous allocations
        await DutyAllocation.deleteMany({});
        await Teacher.updateMany({}, { $set: { totalDuties: 0 } });

        const exams = await Exam.find().sort({ date: 1 });

        let allocations = [];

        for (let exam of exams) {

            console.log("\nProcessing exam:", exam.subject);

            const requiredInvigilators = exam.invigilators || 1;

            for (let i = 0; i < requiredInvigilators; i++) {

                const teachers = await Teacher.find();

                const leaves = await TeacherLeave.find({
                    date: exam.date
                });

                const leaveEmails = leaves.map(l => l.email);

                let bestTeacher = null;
                let bestScore = -Infinity;

                for (let teacher of teachers) {

                    const teacherSubject = (teacher.subject || "")
                        .toLowerCase()
                        .replace(/\s+/g, " ")
                        .trim();

                    const examSubject = (exam.subject || "")
                        .toLowerCase()
                        .replace(/\s+/g, " ")
                        .trim();

                    console.log(
                        "Comparing:",
                        teacher.email,
                        "| teacher subject:",
                        teacherSubject,
                        "| exam subject:",
                        examSubject
                    );

                    // HARD BLOCK — subject conflict
                    if (teacherSubject === examSubject) {
                        console.log("Blocked (same subject):", teacher.email);
                        continue;
                    }

                    // HARD BLOCK — teacher on leave
                    if (leaveEmails.includes(teacher.email)) {
                        console.log("Blocked (leave):", teacher.email);
                        continue;
                    }

                    // HARD BLOCK — already assigned same exam slot
                    const alreadyAssigned = await DutyAllocation.findOne({
                        teacherEmail: teacher.email,
                        date: exam.date
                    });

                    if (alreadyAssigned) {
                        console.log("Blocked (already assigned same date):", teacher.email);
                        continue;
                    }

                    let score = 0;

                    // fairness
                    score += (20 - teacher.totalDuties);

                    // availability bonus
                    const unavailable = teacher.availability?.some(a =>
                        a.date === exam.date
                    );

                    if (!unavailable) {
                        score += 5;
                    }

                    // department bonus
                    if (
                        teacher.department &&
                        exam.department &&
                        teacher.department === exam.department
                    ) {
                        score += 2;
                    }

                    console.log("Score for", teacher.email, "=", score);

                    if (score > bestScore) {
                        bestScore = score;
                        bestTeacher = teacher;
                    }
                }

                if (bestTeacher) {

                    console.log("Selected:", bestTeacher.email);

                    const allocation = await DutyAllocation.create({
                        teacherEmail: bestTeacher.email,
                        examId: exam._id,
                        subject: exam.subject,
                        date: exam.date
                    });

                    bestTeacher.totalDuties += 1;
                    await bestTeacher.save();

                    allocations.push(allocation);

                } else {

                    console.log("No teacher available for:", exam.subject);

                }
            }
        }

        res.json({
            message: "Smart allocation completed successfully",
            allocations
        });

    } catch (err) {

        console.error("Allocation error:", err);

        res.status(500).json({
            error: err.message
        });
    }
});


/* RESET ROUTE */

router.delete("/clear", async (req, res) => {
    try {

        await DutyAllocation.deleteMany({});
        await Teacher.updateMany({}, { $set: { totalDuties: 0 } });

        res.json({
            message: "All allocations cleared successfully"
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }
});


module.exports = router;