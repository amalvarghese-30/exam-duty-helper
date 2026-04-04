const express = require("express");
const router = express.Router();
const Teacher = require("../models/Teacher");
const Exam = require("../models/Exam");
const DutyAllocation = require("../models/DutyAllocation");
const TeacherLeave = require("../models/TeacherLeave");
const axios = require("axios");

// =============================
// GET ALL ALLOCATIONS
// =============================
router.get("/", async (req, res) => {
  try {
    const allocations = await DutyAllocation.find()
      .populate("teacher_id", "name department email")
      .populate("exam_id", "subject class_name exam_date start_time end_time room_number");

    // 1. Map the data into your formatted structure first
    let formatted = allocations.map(a => ({
      _id: a._id,
      status: a.status,
      teacher: a.teacher_id,
      exam: a.exam_id,
      class_name: a.exam_id ? a.exam_id.class_name : "N/A"
    }));

    // 2. Apply the Triple-Sort (Class -> Date -> Time)
    formatted.sort((a, b) => {
      // Priority 1: Class Name (FY < SY < TY < LY)
      const classOrder = { "FY": 1, "SY": 2, "TY": 3, "LY": 4 };
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
    res.status(500).json({ error: err.message });
  }
});

// =============================
// AI AUTO DUTY ALLOCATION
// =============================
router.post("/", async (req, res) => {
  try {
    // 1. Fetch all raw data from MongoDB
    const teachers = await Teacher.find().lean();
    const exams = await Exam.find().lean();
    const allLeaves = await TeacherLeave.find().lean();

    if (!teachers.length || !exams.length) {
      return res.status(400).json({ error: "Teachers or exams data missing" });
    }

    // 2. THE BRIDGE: Merge Leave collection into Teacher Availability
    // This ensures scheduler.py can see the "Rule 2: Teachers on leave" constraint
    const teachersWithMergedLeaves = teachers.map(t => {
      const teacherLeaves = allLeaves
        .filter(l => l.teacher_id.toString() === t._id.toString())
        .map(l => ({ date: l.leave_date, slot: "ALL_DAY" }));

      return {
        ...t,
        availability: [...(t.availability || []), ...teacherLeaves]
      };
    });

    // 3. Get dynamic rules from the Frontend (React UI)
    // If empty, we send your 4 standard rules as the default prompt
    const userRules = req.body.rules || `
        1. Teachers should not invigilate their own subject.
        2. Teachers on leave should not be assigned.
        3. Distribute duties so each teacher gets approximately equal total duties.
        4. Avoid assigning teachers multiple times on same date.
    `;

    // 4. Call Python AI engine (Gemini Parser + Scheduler)
    console.log("Calling Python AI engine with dynamic rules...");
    const aiResponse = await axios.post("http://localhost:5001/generate", {
      teachers: teachersWithMergedLeaves,
      exams: exams,
      rules: userRules
    });

    const roster = aiResponse.data.roster;

    // 5. CLEANUP: Reset old allocations and duty counts
    await DutyAllocation.deleteMany({});
    await Teacher.updateMany({}, { $set: { totalDuties: 0 } });

    // 6. PERSISTENCE: Save the new roster back to MongoDB
    for (let item of roster) {
      if (!item.teacher || item.teacher === "UNASSIGNED") continue;

      const teacherDoc = await Teacher.findOne({ email: item.teacher });
      const examDoc = await Exam.findOne({ 
          subject: item.exam, 
          exam_date: item.date 
      });

      if (teacherDoc && examDoc) {
        await DutyAllocation.create({
          teacher_id: teacherDoc._id,
          exam_id: examDoc._id,
          status: "assigned"
        });

        // Sync totalDuties back to Teacher model for the UI
        teacherDoc.totalDuties += 1;
        await teacherDoc.save();
      }
    }

    res.json({
      message: "AI Allocation successful",
      interpreted_logic: aiResponse.data.interpreted_constraints,
      explanation: aiResponse.data.explanation,
      roster: roster
    });

  } catch (err) {
    console.error("Allocation error:", err.response?.data || err.message);
    res.status(500).json({ error: "AI Engine error: " + err.message });
  }
});

// =============================
// RESET / CLEAR ALLOCATIONS
// =============================
router.delete("/clear", async (req, res) => {
  try {
    await DutyAllocation.deleteMany({});
    await Teacher.updateMany({}, { $set: { totalDuties: 0 } });
    res.json({ message: "All allocations cleared successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;