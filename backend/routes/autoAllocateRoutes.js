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
      .populate("teacher_id", "name department email") // populate teacher info
      .populate("exam_id", "subject exam_date start_time end_time room_number") // populate exam info
      .sort({ allocated_at: -1 });

    const formatted = allocations.map(a => ({
      _id: a._id,
      status: a.status,
      teacher: a.teacher_id,
      exam: a.exam_id
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Fetch allocations error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================
// AI AUTO DUTY ALLOCATION with fairness check
// =============================
router.post("/", async (req, res) => {
  try {
    console.log("React → Node backend → Flask scheduler → allocator.py");

    const teachers = await Teacher.find();
    const exams = await Exam.find();

    if (!teachers.length || !exams.length) {
      return res.status(400).json({ error: "Teachers or exams data missing" });
    }

    const rules = `
    1. Teachers should not invigilate their own subject.
    2. Teachers on leave should not be assigned.
    3. Distribute duties so each teacher gets approximately equal total duties.
    4. Avoid assigning teachers multiple times on same date.
    `;

    // Call Python AI engine
    const response = await axios.post("http://localhost:5001/generate", {
      teachers,
      exams,
      rules
    });

    let roster = response.data.roster;

    // =============================
    // FAIRNESS CHECK: redistribute duties to balance workload
    // =============================
    // Build a map of teacher email → assigned duty count
    const dutyCount = {};
    teachers.forEach(t => { dutyCount[t.email] = 0; });

    // Count duties per teacher in the roster
    roster.forEach(r => {
      if (r.teacher) dutyCount[r.teacher] += 1;
    });

    // Calculate average duties per teacher
    const totalAssigned = roster.filter(r => r.teacher).length;
    const avgDuties = Math.ceil(totalAssigned / teachers.length);

    // Find teachers over and under the average
    const overWorked = Object.entries(dutyCount)
      .filter(([_, count]) => count > avgDuties)
      .map(([email]) => email);
    const underWorked = Object.entries(dutyCount)
      .filter(([_, count]) => count < avgDuties)
      .map(([email]) => email);

    // Redistribute duties from overWorked to underWorked
    roster = roster.map(r => {
      if (!r.teacher) return r;

      // Only consider overworked teachers for reassignment
      if (overWorked.includes(r.teacher) && underWorked.length > 0) {
        // Find a replacement teacher who:
        // 1. Is underworked
        // 2. Is not the subject teacher of the exam
        const examObj = exams.find(e => e.subject === r.exam && e.exam_date === r.date);
        const eligible = underWorked.filter(email => {
          const teacherObj = teachers.find(t => t.email === email);
          return teacherObj.subject !== examObj?.subject;
        });

        if (eligible.length > 0) {
          const newTeacher = eligible[0]; // assign to first eligible underworked teacher
          dutyCount[r.teacher] -= 1;
          dutyCount[newTeacher] += 1;

          // Update overWorked and underWorked lists
          if (dutyCount[r.teacher] <= avgDuties) overWorked.splice(overWorked.indexOf(r.teacher), 1);
          if (dutyCount[newTeacher] >= avgDuties) underWorked.splice(underWorked.indexOf(newTeacher), 1);

          r.teacher = newTeacher;
        }
      }
      return r;
    });

    // =============================
    // Reset old allocations
    // =============================
    await DutyAllocation.deleteMany({});
    await Teacher.updateMany({}, { $set: { totalDuties: 0 } });

    // Save new allocations
    for (let r of roster) {
      if (!r.teacher) continue;

      const teacher = await Teacher.findOne({ email: r.teacher });
      const exam = await Exam.findOne({
        subject: r.exam,
        exam_date: r.date
      });

      if (teacher && exam) {
        await DutyAllocation.create({
          teacher_id: teacher._id,
          exam_id: exam._id,
          status: "assigned"
        });

        teacher.totalDuties += 1;
        await teacher.save();
      }
    }

    // Return formatted allocations
    const allocations = await DutyAllocation.find()
      .populate("teacher_id", "name department email")
      .populate("exam_id", "subject exam_date start_time end_time room_number")
      .sort({ allocated_at: -1 });

    const formatted = allocations.map(a => ({
      _id: a._id,
      status: a.status,
      teacher: a.teacher_id,
      exam: a.exam_id
    }));

    res.json({
      message: "AI Allocation completed successfully",
      roster: formatted
    });

  } catch (err) {
    console.error("Allocation error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================
// RESET / CLEAR ALLOCATIONS
// =============================
router.delete("/clear", async (req, res) => {
  try {
    await DutyAllocation.deleteMany({});
    await Teacher.updateMany({}, { $set: { totalDuties: 0 } });

    res.json({
      message: "All allocations cleared successfully"
    });
  } catch (err) {
    console.error("Clear allocations error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;