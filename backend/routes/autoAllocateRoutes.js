const express = require("express");
const router = express.Router();

const Teacher = require("../models/Teacher");
const Exam = require("../models/Exam");
const DutyAllocation = require("../models/DutyAllocation");
const TeacherLeave = require("../models/TeacherLeave");
const leaveValidator = require("../utils/leaveValidator");

const axios = require("axios");


// =============================
// GET ALL ALLOCATIONS
// =============================
router.get("/", async (req, res) => {

  try {

    const allocations = await DutyAllocation.find()
      .populate("teacher_id", "name department email")
      .populate("exam_id", "subject class_name exam_date start_time end_time room_number");

    // Format with class_name
    let formatted = allocations.map(a => ({
      _id: a._id,
      status: a.status,
      teacher: a.teacher_id || null,
      exam: a.exam_id || null,
      class_name: a.exam_id ? (a.exam_id.class_name || "N/A") : "N/A"
    }));

    // Triple-Sort: Class (FY->LY) -> Date -> Time
    const classOrder = { "FY": 1, "SY": 2, "TY": 3, "LY": 4 };

    formatted.sort((a, b) => {
      // Priority 1: Class Name
      const classA = classOrder[a.class_name] || 99;
      const classB = classOrder[b.class_name] || 99;
      if (classA !== classB) return classA - classB;

      // Priority 2: Exam Date
      const dateA = new Date(a.exam?.exam_date || 0);
      const dateB = new Date(b.exam?.exam_date || 0);
      if (dateA - dateB !== 0) return dateA - dateB;

      // Priority 3: Start Time
      const timeA = a.exam?.start_time || "";
      const timeB = b.exam?.start_time || "";
      return timeA.localeCompare(timeB);
    });

    res.json(formatted);

  } catch (err) {

    console.error("Fetch allocations error:", err.message);

    res.status(500).json({
      error: err.message
    });
  }
});


// =============================
// AI AUTO DUTY ALLOCATION
// =============================
router.post("/", async (req, res) => {

  try {

    console.log("React → Node → Flask scheduler");

    // ✅ FIX: Move this line INSIDE the route handler
    const { rules_text = "", send_emails = true } = req.body;

    const teachers = await Teacher.find();
    const exams = await Exam.find();
    const leaves = await TeacherLeave.find();

    if (!teachers.length || !exams.length) {
      return res.status(400).json({
        error: "Teachers or exams missing"
      });
    }

    // ✅ FIX: Use send_emails in the request
    const response = await axios.post(
      "http://localhost:5000/api/allocate",
      {
        teachers,
        exams,
        teacher_leaves: leaves,
        policies: [],
        rules_text,
        send_emails   // ✅ Add this line
      }
    );

    const roster = response.data?.allocated_duties;

    if (!roster || Object.keys(roster).length === 0) {

      console.log("Scheduler output:", response.data);

      return res.status(400).json({
        error: "Scheduler returned empty allocation"
      });
    }


    // =============================
    // RESET OLD ALLOCATIONS
    // =============================
    await DutyAllocation.deleteMany({});
    await Teacher.updateMany({}, { totalDuties: 0 });


    // =============================
    // SAVE NEW ALLOCATIONS
    // =============================
    for (const examId of Object.keys(roster)) {

      const examData = roster[examId];

      if (!examData?.roles) continue;

      const exam = await Exam.findById(examId);

      if (!exam) continue;

      for (const role of Object.keys(examData.roles)) {

        const assignments = examData.roles[role];

        for (const assignment of assignments) {

          let teacher = null;

          if (assignment.teacher_id) {

            teacher = await Teacher.findById(
              assignment.teacher_id
            );

          } else if (assignment.teacher) {

            teacher = await Teacher.findOne({
              email: assignment.teacher
            });

          }

          if (!teacher) continue;

          const { isOnLeave } =
            await leaveValidator.checkTeacherLeaveOnDate(
              teacher._id,
              exam.exam_date
            );

          if (isOnLeave) continue;

          await DutyAllocation.create({
            teacher_id: teacher._id,
            exam_id: exam._id,
            role,
            status: "assigned"
          });

          teacher.totalDuties += 1;
          await teacher.save();
        }
      }
    }


    const allocations = await DutyAllocation.find()
      .populate("teacher_id", "name department email")
      .populate("exam_id", "subject exam_date start_time end_time room_number")
      .sort({ allocated_at: -1 })
      .lean();


    res.json({
      message: "AI Allocation completed successfully",
      allocations,
      emails_sent: response.data?.emails_sent || 0  // ✅ Optional: show how many emails sent
    });

  } catch (err) {

    console.error(
      "Allocation error:",
      err.response?.data || err.message
    );

    res.status(500).json({
      error: err.message
    });
  }
});


// =============================
// CLEAR ALLOCATIONS
// =============================
router.delete("/clear", async (req, res) => {

  try {

    await DutyAllocation.deleteMany({});
    await Teacher.updateMany({}, { totalDuties: 0 });

    res.json({
      message: "All allocations cleared successfully"
    });

  } catch (err) {

    console.error("Clear allocations error:", err.message);

    res.status(500).json({
      error: err.message
    });
  }
});


module.exports = router;