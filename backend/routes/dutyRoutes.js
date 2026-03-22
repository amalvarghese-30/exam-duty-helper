const express = require("express");
const router = express.Router();

const DutyAllocation = require("../models/DutyAllocation");
const Teacher = require("../models/Teacher");
const Exam = require("../models/Exam");
const TeacherLeave = require("../models/TeacherLeave");


// =============================
// GET ALL DUTIES
// =============================
router.get("/", async (req, res) => {
    try {

        const duties = await DutyAllocation.find()
            .populate("teacher_id", "name email department subject")
            .populate("exam_id", "subject exam_date start_time end_time room_number")
            .sort({ allocated_at: -1 });

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


// =============================
// GET DUTIES FOR SINGLE TEACHER
// =============================
router.get("/teacher/:teacherId", async (req, res) => {

    try {

        const duties = await DutyAllocation.find({
            teacher_id: req.params.teacherId
        })
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


// =============================
// AI AUTO DUTY ALLOCATION
// =============================
router.post("/allocate", async (req, res) => {

    try {

        console.log("Starting AI allocation engine...");

        const exams = await Exam.find().sort({ exam_date: 1 });
        const teachers = await Teacher.find();

        if (!exams.length)
            return res.status(400).json({ error: "No exams available" });

        if (!teachers.length)
            return res.status(400).json({ error: "No teachers available" });


        const existingAllocs = await DutyAllocation.find();
        const leaveDates = await TeacherLeave.find();


        // leave lookup set
        const leaveSet = new Set(
            leaveDates.map(l => `${l.teacher_id}_${l.leave_date}`)
        );


        // existing allocation lookup
        const existingSet = new Set(
            existingAllocs.map(a => `${a.teacher_id}_${a.exam_id}`)
        );


        // workload tracker
        const workload = {};

        teachers.forEach(t => {
            workload[t._id.toString()] = 0;
        });

        existingAllocs.forEach(a => {
            const tid = a.teacher_id.toString();
            if (workload[tid] !== undefined)
                workload[tid]++;
        });


        // slot tracker
        const teacherSlots = {};

        teachers.forEach(t => {
            teacherSlots[t._id.toString()] = [];
        });

        existingAllocs.forEach(a => {

            const exam = exams.find(
                e => e._id.toString() === a.exam_id.toString()
            );

            if (exam) {

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

            const alreadyAssigned =
                existingAllocs.filter(
                    a => a.exam_id.toString() === exam._id.toString()
                ).length;

            const remaining = needed - alreadyAssigned;

            if (remaining <= 0) continue;


            console.log("Processing exam:", exam.subject);


            const eligible = teachers
                .filter(t => {

                    const tid = t._id.toString();

                    const teacherSubject =
                        (t.subject || "").toLowerCase().trim();

                    const examSubject =
                        (exam.subject || "").toLowerCase().trim();


                    console.log(
                        "Checking teacher:",
                        t.name,
                        "| teacher subject:",
                        teacherSubject,
                        "| exam subject:",
                        examSubject
                    );


                    // ❌ SUBJECT CONFLICT BLOCK
                    if (teacherSubject === examSubject) {
                        console.log("Blocked subject teacher:", t.name);
                        return false;
                    }


                    // ❌ ALREADY ASSIGNED SAME EXAM
                    if (existingSet.has(`${tid}_${exam._id}`))
                        return false;


                    // ❌ DUPLICATE DURING CURRENT RUN
                    if (
                        newAllocations.some(
                            a =>
                                a.teacher_id === tid &&
                                a.exam_id === exam._id.toString()
                        )
                    )
                        return false;


                    // ❌ ON LEAVE
                    if (leaveSet.has(`${tid}_${exam.exam_date}`))
                        return false;


                    // ❌ TIME OVERLAP
                    const slots = teacherSlots[tid];

                    const overlap = slots.some(
                        s =>
                            s.date === exam.exam_date &&
                            s.start < exam.end_time &&
                            s.end > exam.start_time
                    );

                    if (overlap)
                        return false;


                    return true;

                })
                .sort(
                    (a, b) =>
                        workload[a._id.toString()] -
                        workload[b._id.toString()]
                );


            for (
                let i = 0;
                i < remaining && i < eligible.length;
                i++
            ) {

                const teacher = eligible[i];

                const tid = teacher._id.toString();


                newAllocations.push({
                    teacher_id: tid,
                    exam_id: exam._id.toString(),
                    status: "assigned"
                });


                workload[tid]++;


                teacherSlots[tid].push({
                    date: exam.exam_date,
                    start: exam.start_time,
                    end: exam.end_time
                });

            }

        }


        if (!newAllocations.length)
            return res.json({
                message: "All duties already allocated",
                allocated: 0
            });


        await DutyAllocation.insertMany(newAllocations);


        res.json({
            message: `${newAllocations.length} duties allocated successfully`,
            allocated: newAllocations.length
        });

    }
    catch (err) {

        console.error("Allocation failed:", err);

        res.status(500).json({
            error: err.message
        });

    }

});


// =============================
// CLEAR ALL ALLOCATIONS
// =============================
router.delete("/", async (req, res) => {

    try {

        await DutyAllocation.deleteMany({});

        res.json({
            message: "All allocations cleared"
        });

    }
    catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});


module.exports = router;