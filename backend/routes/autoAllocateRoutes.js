const express = require("express");
const router = express.Router();
const Teacher = require("../models/Teacher");
const Exam = require("../models/Exam");
const DutyAllocation = require("../models/DutyAllocation");
const TeacherLeave = require("../models/TeacherLeave");
const AllocationPolicy = require("../models/AllocationPolicy");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const DEFAULT_RULES = `
1. Teachers should not invigilate their own subject.
2. Teachers on leave should not be assigned.
3. Distribute duties so each teacher gets approximately equal total duties.
4. Avoid assigning teachers multiple times on same date.
`;

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://127.0.0.1:5001";

function loadCapacityMap(filePath, keyName, valueName) {
  try {
    const rows = fs.readFileSync(filePath, "utf-8")
      .split("\n")
      .map((row) => row.trim())
      .filter(Boolean);

    if (!rows.length) return new Map();

    const header = rows[0].split(",").map((part) => part.trim().toLowerCase());
    const keyIndex = header.indexOf(keyName.toLowerCase());
    const valueIndex = header.indexOf(valueName.toLowerCase());

    if (keyIndex < 0 || valueIndex < 0) return new Map();

    const map = new Map();
    rows.slice(1).forEach((row) => {
      const cols = row.split(",").map((part) => part.trim());
      const key = cols[keyIndex];
      const value = Number(cols[valueIndex]);
      if (!key || !Number.isFinite(value)) return;
      map.set(key.toLowerCase(), value);
    });

    return map;
  } catch {
    return new Map();
  }
}

function enrichExamsWithCapacities(exams) {
  const roomCapacityMap = loadCapacityMap(
    path.join(__dirname, "../data/rooms.csv"),
    "room",
    "capacity"
  );
  const classCapacityMap = loadCapacityMap(
    path.join(__dirname, "../data/class_capacity.csv"),
    "class_name",
    "student_count"
  );

  return exams.map((exam) => {
    const classCapacity = classCapacityMap.get(String(exam.class_name || "").toLowerCase());
    const resolvedClassCapacity = Number(exam.student_count) || classCapacity || 0;
    const seatingCapacity = Array.isArray(exam.seating_plan)
      ? exam.seating_plan.reduce((sum, slot) => sum + (Number(slot?.room_capacity) || 0), 0)
      : 0;
    const roomCapacity = seatingCapacity || roomCapacityMap.get(String(exam.room_number || "").toLowerCase()) || 0;

    return {
      ...exam,
      class_capacity: resolvedClassCapacity,
      room_capacity: roomCapacity,
    };
  });
}

function rebalanceRoomsForCapacity(exams) {
  const roomCapacityMap = loadCapacityMap(
    path.join(__dirname, "../data/rooms.csv"),
    "room",
    "capacity"
  );

  const roomPool = [...roomCapacityMap.entries()]
    .map(([room, capacity]) => ({ room: room.toUpperCase(), capacity: Number(capacity) || 0 }))
    .sort((a, b) => a.capacity - b.capacity);

  const slotMap = new Map();
  exams.forEach((exam) => {
    const key = `${exam.exam_date}__${exam.start_time}`;
    if (!slotMap.has(key)) slotMap.set(key, []);
    slotMap.get(key).push({
      ...exam,
      original_room_number: exam.room_number || "",
      class_capacity: Number(exam.class_capacity || exam.student_count || 0),
    });
  });

  const adjusted = [];

  slotMap.forEach((slotExams) => {
    const availableRooms = roomPool.map((room) => ({ ...room }));

    const examsByDemand = [...slotExams].sort((a, b) => b.class_capacity - a.class_capacity);

    examsByDemand.forEach((exam) => {
      const needed = Number(exam.class_capacity) || 0;
      const existingRoom = String(exam.room_number || "").toUpperCase();

      let roomIndex = availableRooms.findIndex(
        (room) =>
          room.room === existingRoom &&
          (needed <= 0 || room.capacity <= 0 || room.capacity >= needed)
      );

      if (roomIndex < 0) {
        roomIndex = availableRooms.findIndex(
          (room) => needed <= 0 || room.capacity <= 0 || room.capacity >= needed
        );
      }

      if (roomIndex < 0 && availableRooms.length > 0) {
        roomIndex = availableRooms.length - 1;
      }

      if (roomIndex >= 0) {
        const assignedRoom = availableRooms.splice(roomIndex, 1)[0];
        exam.room_number = assignedRoom.room;
        exam.room_capacity = assignedRoom.capacity;
      }

      exam.capacity_conflict = Boolean(
        needed > 0 && exam.room_capacity > 0 && exam.room_capacity < needed
      );
      exam.room_reassigned =
        Boolean(exam.room_number) &&
        String(exam.room_number).toUpperCase() !== String(exam.original_room_number || "").toUpperCase();

      adjusted.push(exam);
    });
  });

  return adjusted;
}

function formatDate(dateString) {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function withSeatingFallback(exam) {
  const raw = typeof exam?.toObject === "function" ? exam.toObject() : exam;
  const seating = Array.isArray(raw?.seating_plan) ? raw.seating_plan : [];
  if (seating.length > 0) {
    return {
      ...raw,
      required_invigilators: Math.max(Number(raw?.required_invigilators) || 1, seating.length),
    };
  }

  const room = String(raw?.room_number || "").trim();
  const students = Number(raw?.student_count || 0);
  if (!room || students <= 0) return raw;

  return {
    ...raw,
    required_invigilators: Math.max(Number(raw?.required_invigilators) || 1, 1),
    seating_plan: [
      {
        room_number: room,
        room_capacity: students,
        assigned_count: students,
        start_roll: 1,
        end_roll: students,
      },
    ],
  };
}

function buildWorkloadStats(teachers, allocations) {
  const countMap = new Map();
  teachers.forEach((teacher) => countMap.set(String(teacher._id), 0));

  allocations.forEach((allocation) => {
    const tid = String(allocation.teacher_id?._id || allocation.teacher_id);
    if (countMap.has(tid)) {
      countMap.set(tid, countMap.get(tid) + 1);
    }
  });

  const teacherLoad = teachers.map((teacher) => ({
    teacherId: String(teacher._id),
    teacherName: teacher.name,
    email: teacher.email,
    department: teacher.department || "General",
    subject: teacher.subject || "N/A",
    duties: countMap.get(String(teacher._id)) || 0,
  }));

  const loads = teacherLoad.map((row) => row.duties);
  const total = loads.reduce((sum, val) => sum + val, 0);
  const mean = loads.length ? total / loads.length : 0;
  const variance = loads.length
    ? loads.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / loads.length
    : 0;
  const standardDeviation = Math.sqrt(variance);
  const min = loads.length ? Math.min(...loads) : 0;
  const max = loads.length ? Math.max(...loads) : 0;
  const range = max - min;
  const fairnessScore = Math.max(0, Math.round(100 - standardDeviation * 25 - range * 8));

  return {
    teacherLoad,
    summary: {
      totalTeachers: teachers.length,
      totalAssignedDuties: total,
      averageDuties: Number(mean.toFixed(2)),
      minDuties: min,
      maxDuties: max,
      dutyRange: range,
      standardDeviation: Number(standardDeviation.toFixed(2)),
      fairnessScore,
      highLoadTeachers: teacherLoad.filter((row) => row.duties > mean).length,
      lowLoadTeachers: teacherLoad.filter((row) => row.duties < mean).length,
    },
  };
}

function hasDateConflict(allocationsForTeacher, examDate, currentAllocationId) {
  return allocationsForTeacher.some((allocation) => {
    if (String(allocation._id) === String(currentAllocationId)) return false;
    return allocation.exam_id?.exam_date === examDate;
  });
}

function generateSwapRecommendations(allocations, teachers, leaves) {
  const teacherById = new Map(teachers.map((teacher) => [String(teacher._id), teacher]));
  const allocationsByTeacher = new Map();

  allocations.forEach((allocation) => {
    const tid = String(allocation.teacher_id?._id || allocation.teacher_id);
    if (!allocationsByTeacher.has(tid)) allocationsByTeacher.set(tid, []);
    allocationsByTeacher.get(tid).push(allocation);
  });

  const leaveMap = new Map();
  leaves.forEach((leave) => {
    const tid = String(leave.teacher_id);
    if (!leaveMap.has(tid)) leaveMap.set(tid, new Set());
    leaveMap.get(tid).add(leave.leave_date);
  });

  const dutyCount = new Map();
  teachers.forEach((teacher) => {
    const tid = String(teacher._id);
    dutyCount.set(tid, (allocationsByTeacher.get(tid) || []).length);
  });

  const recommendations = [];
  for (let i = 0; i < allocations.length; i += 1) {
    const first = allocations[i];
    const firstTeacherId = String(first.teacher_id?._id || first.teacher_id);
    const firstTeacher = teacherById.get(firstTeacherId);
    if (!firstTeacher || !first.exam_id) continue;

    for (let j = i + 1; j < allocations.length; j += 1) {
      const second = allocations[j];
      const secondTeacherId = String(second.teacher_id?._id || second.teacher_id);
      const secondTeacher = teacherById.get(secondTeacherId);
      if (!secondTeacher || !second.exam_id) continue;
      if (firstTeacherId === secondTeacherId) continue;

      const firstExam = first.exam_id;
      const secondExam = second.exam_id;

      if (
        (firstTeacher.subject || "").toLowerCase() === (secondExam.subject || "").toLowerCase() ||
        (secondTeacher.subject || "").toLowerCase() === (firstExam.subject || "").toLowerCase()
      ) {
        continue;
      }

      if ((leaveMap.get(firstTeacherId) || new Set()).has(secondExam.exam_date)) continue;
      if ((leaveMap.get(secondTeacherId) || new Set()).has(firstExam.exam_date)) continue;

      if (
        hasDateConflict(allocationsByTeacher.get(firstTeacherId) || [], secondExam.exam_date, first._id) ||
        hasDateConflict(allocationsByTeacher.get(secondTeacherId) || [], firstExam.exam_date, second._id)
      ) {
        continue;
      }

      const firstLoad = dutyCount.get(firstTeacherId) || 0;
      const secondLoad = dutyCount.get(secondTeacherId) || 0;
      const currentGap = Math.abs(firstLoad - secondLoad);
      if (currentGap === 0) continue;

      const adjustedFirst = firstLoad > secondLoad ? firstLoad - 1 : firstLoad + 1;
      const adjustedSecond = secondLoad > firstLoad ? secondLoad - 1 : secondLoad + 1;
      const newGap = Math.abs(adjustedFirst - adjustedSecond);
      if (newGap >= currentGap) continue;

      const improvement = currentGap - newGap;
      const impactScore = Math.min(100, 60 + improvement * 20 + (firstExam.exam_date !== secondExam.exam_date ? 10 : 0));

      recommendations.push({
        teacherA: {
          id: firstTeacherId,
          name: firstTeacher.name,
          email: firstTeacher.email,
          currentLoad: firstLoad,
          currentExam: firstExam.subject,
          currentDate: firstExam.exam_date,
        },
        teacherB: {
          id: secondTeacherId,
          name: secondTeacher.name,
          email: secondTeacher.email,
          currentLoad: secondLoad,
          currentExam: secondExam.subject,
          currentDate: secondExam.exam_date,
        },
        impactScore,
        rationale: `Reduces workload gap from ${currentGap} to ${newGap} while keeping subject and leave constraints valid.`,
      });
    }
  }

  recommendations.sort((a, b) => b.impactScore - a.impactScore);
  return recommendations.slice(0, 8);
}

function buildTeacherAssistantReply(teacher, duties, allTeachersStats, question) {
  const now = new Date();
  const normalizedQuestion = (question || "").toLowerCase();
  const sortedUpcoming = duties
    .filter((row) => row.exam_id?.exam_date)
    .filter((row) => new Date(row.exam_id.exam_date) >= now)
    .sort((a, b) => new Date(a.exam_id.exam_date) - new Date(b.exam_id.exam_date));

  const nextDuty = sortedUpcoming[0];
  const teacherStat = allTeachersStats.teacherLoad.find((row) => row.email === teacher.email);
  const avg = allTeachersStats.summary.averageDuties;
  const loadText = teacherStat
    ? `You currently have ${teacherStat.duties} duties. Team average is ${avg}.`
    : "Your duty distribution is being recalculated.";

  if (normalizedQuestion.includes("next") || normalizedQuestion.includes("when")) {
    if (!nextDuty) {
      return "You currently have no upcoming duties. Please check back after the next allocation run.";
    }
    return `Your next duty is for ${nextDuty.exam_id.subject} on ${formatDate(nextDuty.exam_id.exam_date)} at ${nextDuty.exam_id.start_time} in room ${nextDuty.exam_id.room_number || "TBA"}. ${loadText}`;
  }

  if (normalizedQuestion.includes("fair") || normalizedQuestion.includes("load")) {
    return `${loadText} Fairness score for this cycle is ${allTeachersStats.summary.fairnessScore}/100 with duty range ${allTeachersStats.summary.dutyRange}.`;
  }

  if (normalizedQuestion.includes("leave") || normalizedQuestion.includes("unavailable")) {
    return "Leave entries are respected during allocation. If you add a leave date in Availability, that date is automatically excluded during the next run.";
  }

  if (nextDuty) {
    return `You have ${duties.length} total assigned duties with ${sortedUpcoming.length} upcoming. Next duty: ${nextDuty.exam_id.subject} on ${formatDate(nextDuty.exam_id.exam_date)}. ${loadText}`;
  }

  return `You have ${duties.length} total assigned duties and no upcoming schedules right now. ${loadText}`;
}

async function getOrCreatePolicy() {
  let policy = await AllocationPolicy.findOne({ name: "default" });
  if (!policy) {
    policy = await AllocationPolicy.create({
      name: "default",
      rulesText: DEFAULT_RULES,
      autoRunOnExamChange: false,
    });
  }
  return policy;
}

async function backfillLegacyExamSeating() {
  const legacyExams = await Exam.find({
    $or: [
      { seating_plan: { $exists: false } },
      { seating_plan: { $size: 0 } },
      { student_count: { $exists: false } },
      { student_count: null },
    ],
  }).sort({ exam_date: 1, start_time: 1, createdAt: 1 });

  for (const exam of legacyExams) {
    try {
      await exam.validate();
      await exam.save();
    } catch {
      // Continue processing so one problematic exam does not block all legacy backfills.
    }
  }
}

function toDateKey(value) {
  return String(value || "").slice(0, 10);
}

function isTeacherOnLeave(leaveDateSet, teacherId, examDate) {
  const dates = leaveDateSet.get(String(teacherId));
  if (!dates) return false;
  return dates.has(toDateKey(examDate));
}

function hasSubjectConflict(teacher, examDoc) {
  const teacherSubject = String(teacher?.subject || "").trim().toLowerCase();
  const examSubject = String(examDoc?.subject || "").trim().toLowerCase();
  return Boolean(teacherSubject && examSubject && teacherSubject === examSubject);
}

function getExamSlots(examDoc) {
  const plan = Array.isArray(examDoc?.seating_plan) ? examDoc.seating_plan : [];
  if (plan.length) {
    return plan.map((slot) => ({
      room_number: slot.room_number,
      start_roll: Number(slot.start_roll) || 1,
      end_roll: Number(slot.end_roll) || 1,
      assigned_count: Number(slot.assigned_count) || 0,
    }));
  }

  const students = Number(examDoc?.student_count || 0);
  const room = String(examDoc?.room_number || "").trim();
  if (!room || students <= 0) return [];

  return [{
    room_number: room,
    start_roll: 1,
    end_roll: students,
    assigned_count: students,
  }];
}

function pickTeacherForSlot({
  candidateTeachers,
  examDoc,
  usedTeacherIds,
  leaveDateSet,
  assignedDateMap,
}) {
  for (const teacher of candidateTeachers) {
    const teacherId = String(teacher._id);
    if (usedTeacherIds.has(teacherId)) continue;
    if (hasSubjectConflict(teacher, examDoc)) continue;
    if (isTeacherOnLeave(leaveDateSet, teacherId, examDoc.exam_date)) continue;

    const dateKey = toDateKey(examDoc.exam_date);
    const alreadyAssignedDates = assignedDateMap.get(teacherId) || new Set();
    if (alreadyAssignedDates.has(dateKey)) continue;

    return teacher;
  }
  return null;
}

async function runAllocationPipeline(rulesText) {
  await backfillLegacyExamSeating();
  const teachers = await Teacher.find().lean();
  const exams = await Exam.find().lean();
  const allLeaves = await TeacherLeave.find().lean();

  if (!teachers.length || !exams.length) {
    throw new Error("Teachers or exams data missing");
  }

  const enrichedExams = enrichExamsWithCapacities(exams);

  const teachersWithMergedLeaves = teachers.map((teacher) => {
    const teacherLeaves = allLeaves
      .filter((leave) => leave.teacher_id.toString() === teacher._id.toString())
      .map((leave) => ({ date: leave.leave_date, slot: "ALL_DAY" }));

    return {
      ...teacher,
      availability: [...(teacher.availability || []), ...teacherLeaves],
    };
  });

  const aiResponse = await axios.post(`${AI_ENGINE_URL}/generate`, {
    teachers: teachersWithMergedLeaves,
    exams: enrichedExams,
    rules: rulesText || DEFAULT_RULES,
  });

  const roster = aiResponse.data.roster || [];

  const teachersByEmail = new Map(
    teachers.map((teacher) => [String(teacher.email || "").toLowerCase(), teacher])
  );
  const teachersById = new Map(
    teachers.map((teacher) => [String(teacher._id), teacher])
  );
  const examByKey = new Map(
    exams.map((exam) => [
      `${String(exam.subject || "").toLowerCase()}__${toDateKey(exam.exam_date)}`,
      exam,
    ])
  );
  const leaveDateSet = new Map();
  allLeaves.forEach((leave) => {
    const tid = String(leave.teacher_id);
    if (!leaveDateSet.has(tid)) leaveDateSet.set(tid, new Set());
    leaveDateSet.get(tid).add(toDateKey(leave.leave_date));
  });

  await DutyAllocation.deleteMany({});
  await Teacher.updateMany({}, { $set: { totalDuties: 0 } });

  const assignedDateMap = new Map();
  const dutyCountMap = new Map(teachers.map((teacher) => [String(teacher._id), 0]));

  const markAssigned = (teacherId, examDate) => {
    const tid = String(teacherId);
    if (!assignedDateMap.has(tid)) assignedDateMap.set(tid, new Set());
    assignedDateMap.get(tid).add(toDateKey(examDate));
    dutyCountMap.set(tid, (dutyCountMap.get(tid) || 0) + 1);
  };

  const createAllocation = async (teacherId, examDoc, slot) => {
    await DutyAllocation.create({
      teacher_id: teacherId,
      exam_id: examDoc._id,
      room_number: slot.room_number || examDoc.room_number || "",
      start_roll: slot.start_roll,
      end_roll: slot.end_roll,
      assigned_count: slot.assigned_count,
      status: "assigned",
    });
    markAssigned(teacherId, examDoc.exam_date);
  };

  for (const item of roster) {
    if (!item.teacher || item.teacher === "UNASSIGNED") continue;

    const teacherDoc = teachersByEmail.get(String(item.teacher || "").toLowerCase());
    const examDoc = examByKey.get(`${String(item.exam || "").toLowerCase()}__${toDateKey(item.date)}`);

    if (teacherDoc && examDoc) {
      const slots = getExamSlots(examDoc);
      if (!slots.length) continue;

      const usedTeacherIds = new Set();

      // Primary AI-selected teacher takes first slot.
      await createAllocation(String(teacherDoc._id), examDoc, slots[0]);
      usedTeacherIds.add(String(teacherDoc._id));

      // For additional rooms, pick additional teachers so each room has an invigilator.
      for (let i = 1; i < slots.length; i += 1) {
        const candidateTeachers = [...teachers]
          .sort((a, b) => (dutyCountMap.get(String(a._id)) || 0) - (dutyCountMap.get(String(b._id)) || 0));

        let extraTeacher = pickTeacherForSlot({
          candidateTeachers,
          examDoc,
          usedTeacherIds,
          leaveDateSet,
          assignedDateMap,
        });

        // Relax date conflict only if strictly needed to avoid leaving a room unstaffed.
        if (!extraTeacher) {
          extraTeacher = candidateTeachers.find((teacher) => {
            const teacherId = String(teacher._id);
            if (usedTeacherIds.has(teacherId)) return false;
            if (hasSubjectConflict(teacher, examDoc)) return false;
            if (isTeacherOnLeave(leaveDateSet, teacherId, examDoc.exam_date)) return false;
            return true;
          }) || null;
        }

        if (extraTeacher) {
          await createAllocation(String(extraTeacher._id), examDoc, slots[i]);
          usedTeacherIds.add(String(extraTeacher._id));
        }
      }
    }
  }

  const teacherIds = [...dutyCountMap.keys()];
  for (const tid of teacherIds) {
    await Teacher.updateOne({ _id: tid }, { $set: { totalDuties: dutyCountMap.get(tid) || 0 } });
  }

  return {
    message: "AI Allocation successful",
    interpreted_logic: aiResponse.data.interpreted_constraints,
    explanation: aiResponse.data.explanation,
    roster,
  };
}

// =============================
// GET ALL ALLOCATIONS
// =============================
router.get("/", async (req, res) => {
  try {
    const [allocations, exams] = await Promise.all([
      DutyAllocation.find()
        .populate("teacher_id", "name department email")
        .populate("exam_id", "subject class_name exam_date start_time end_time room_number seating_plan student_count"),
      Exam.find().lean(),
    ]);

    const allocationsByExamId = new Map();
    allocations.forEach((allocation) => {
      const examId = String(allocation.exam_id?._id || "");
      if (!examId) return;
      if (!allocationsByExamId.has(examId)) allocationsByExamId.set(examId, []);
      allocationsByExamId.get(examId).push(allocation);
    });

    // 1. Map persisted allocated rows.
    const formattedAllocated = allocations.map((a) => ({
      _id: a._id,
      status: a.status,
      teacher: a.teacher_id,
      exam: withSeatingFallback(a.exam_id),
      class_name: a.exam_id ? a.exam_id.class_name : "N/A",
      room_number: a.room_number,
      start_roll: a.start_roll,
      end_roll: a.end_roll,
      assigned_count: a.assigned_count,
    }));

    // 2. Add synthetic rows for any split room that does not yet have a teacher.
    const formattedUnassigned = exams.flatMap((exam) => {
      const normalizedExam = withSeatingFallback(exam);
      const slots = Array.isArray(normalizedExam.seating_plan) ? normalizedExam.seating_plan : [];
      const examAllocations = allocationsByExamId.get(String(exam._id)) || [];

      const assignedSlotKeys = new Set(
        examAllocations.map((row) => {
          const room = String(row.room_number || normalizedExam.room_number || "");
          const start = Number(row.start_roll) || 0;
          const end = Number(row.end_roll) || 0;
          return `${room}__${start}__${end}`;
        })
      );

      if (!slots.length) {
        if (examAllocations.length > 0) return [];
        return [{
          _id: `UNASSIGNED_${exam._id}`,
          status: "unassigned",
          teacher: null,
          exam: normalizedExam,
          class_name: exam.class_name || "N/A",
          room_number: normalizedExam.room_number || "",
          start_roll: 0,
          end_roll: 0,
          assigned_count: 0,
        }];
      }

      return slots
        .map((slot, index) => ({ slot, index }))
        .filter(({ slot }) => {
          const room = String(slot.room_number || "");
          const start = Number(slot.start_roll) || 0;
          const end = Number(slot.end_roll) || 0;
          return !assignedSlotKeys.has(`${room}__${start}__${end}`);
        })
        .map(({ slot, index }) => ({
          _id: `UNASSIGNED_${exam._id}_${index}`,
          status: "unassigned",
          teacher: null,
          exam: normalizedExam,
          class_name: exam.class_name || "N/A",
          room_number: slot.room_number,
          start_roll: Number(slot.start_roll) || 0,
          end_roll: Number(slot.end_roll) || 0,
          assigned_count: Number(slot.assigned_count) || 0,
        }));
    });

    let formatted = [...formattedAllocated, ...formattedUnassigned];

    // 3. Apply the Triple-Sort (Class -> Date -> Time)
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
    const userRules = req.body.rules || DEFAULT_RULES;
    const result = await runAllocationPipeline(userRules);
    res.json(result);

  } catch (err) {
    console.error("Allocation error:", err.response?.data || err.message);
    res.status(500).json({ error: "AI Engine error: " + err.message });
  }
});

// =============================
// AUTOMATED ASSIGNMENT USING SAVED POLICY
// =============================
router.post("/run-automated", async (req, res) => {
  try {
    const policy = await getOrCreatePolicy();
    const result = await runAllocationPipeline(policy.rulesText || DEFAULT_RULES);
    policy.lastTriggeredAt = new Date();
    await policy.save();

    res.json({
      ...result,
      mode: "automated",
      autoRunOnExamChange: policy.autoRunOnExamChange,
      policyUpdatedAt: policy.updatedAt,
    });
  } catch (err) {
    console.error("Automated allocation error:", err.response?.data || err.message);
    res.status(500).json({ error: "Automated allocation failed: " + err.message });
  }
});

// =============================
// DYNAMIC RULE POLICY MANAGEMENT
// =============================
router.get("/policy", async (req, res) => {
  try {
    const policy = await getOrCreatePolicy();
    res.json(policy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/policy", async (req, res) => {
  try {
    const policy = await getOrCreatePolicy();
    if (typeof req.body.rulesText === "string") {
      policy.rulesText = req.body.rulesText.trim() || DEFAULT_RULES;
    }
    if (typeof req.body.autoRunOnExamChange === "boolean") {
      policy.autoRunOnExamChange = req.body.autoRunOnExamChange;
    }
    await policy.save();
    res.json({ message: "Policy updated", policy });
  } catch (err) {
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
    res.json({ message: "All allocations cleared successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// FAIRNESS ANALYTICS
// =============================
router.get("/fairness", async (req, res) => {
  try {
    const teachers = await Teacher.find().lean();
    const allocations = await DutyAllocation.find().populate("teacher_id", "name email department subject").lean();
    const exams = await Exam.find().lean();

    const stats = buildWorkloadStats(teachers, allocations);
    const assignedExamIds = new Set(
      allocations
        .map((allocation) => String(allocation.exam_id || ""))
        .filter(Boolean)
    );
    const assignedExamsCount = assignedExamIds.size;
    const unassignedCount = Math.max(0, exams.length - assignedExamsCount);

    res.json({
      ...stats,
      cycle: {
        totalExams: exams.length,
        assignedExams: assignedExamsCount,
        assignedSlots: allocations.length,
        unassignedExams: unassignedCount,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// SWAP RECOMMENDATIONS
// =============================
router.get("/swap-recommendations", async (req, res) => {
  try {
    const [teachers, allocations, leaves] = await Promise.all([
      Teacher.find().lean(),
      DutyAllocation.find()
        .populate("teacher_id", "name email subject department")
        .populate("exam_id", "subject exam_date start_time room_number")
        .lean(),
      TeacherLeave.find().lean(),
    ]);

    const recommendations = generateSwapRecommendations(allocations, teachers, leaves);
    res.json({
      totalRecommendations: recommendations.length,
      recommendations,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// REAL-TIME CONFLICT DETECTION
// =============================
router.get("/conflicts", async (req, res) => {
  try {
    const [exams, allocations, teachers, leaves] = await Promise.all([
      Exam.find().lean(),
      DutyAllocation.find().populate("teacher_id", "name email subject").populate("exam_id", "subject exam_date start_time end_time room_number").lean(),
      Teacher.find().lean(),
      TeacherLeave.find().lean(),
    ]);

    const roomMap = new Map();
    exams.forEach((exam) => {
      const key = `${exam.exam_date}__${exam.start_time}__${exam.room_number || ""}`;
      if (!roomMap.has(key)) roomMap.set(key, []);
      roomMap.get(key).push(exam);
    });

    const roomConflicts = [];
    roomMap.forEach((items, key) => {
      if (items.length > 1 && items[0]?.room_number) {
        roomConflicts.push({
          key,
          room: items[0].room_number,
          date: items[0].exam_date,
          time: items[0].start_time,
          exams: items.map((item) => ({ subject: item.subject, class_name: item.class_name })),
        });
      }
    });

    const teacherDateMap = new Map();
    allocations.forEach((allocation) => {
      const tid = String(allocation.teacher_id?._id || "");
      const examDate = allocation.exam_id?.exam_date;
      if (!tid || !examDate) return;
      const key = `${tid}__${examDate}`;
      if (!teacherDateMap.has(key)) teacherDateMap.set(key, []);
      teacherDateMap.get(key).push(allocation);
    });

    const teacherConflicts = [];
    teacherDateMap.forEach((items) => {
      if (items.length > 1) {
        teacherConflicts.push({
          teacher: {
            name: items[0].teacher_id?.name,
            email: items[0].teacher_id?.email,
          },
          date: items[0].exam_id?.exam_date,
          exams: items.map((row) => row.exam_id?.subject),
        });
      }
    });

    const leaveMap = new Map();
    leaves.forEach((leave) => {
      const key = `${String(leave.teacher_id)}__${leave.leave_date}`;
      leaveMap.set(key, true);
    });

    const leaveConflicts = allocations
      .filter((allocation) => {
        const tid = String(allocation.teacher_id?._id || "");
        const date = allocation.exam_id?.exam_date;
        return tid && date && leaveMap.has(`${tid}__${date}`);
      })
      .map((allocation) => ({
        teacher: allocation.teacher_id?.name,
        email: allocation.teacher_id?.email,
        date: allocation.exam_id?.exam_date,
        exam: allocation.exam_id?.subject,
      }));

    const teacherMap = new Map(teachers.map((teacher) => [String(teacher._id), teacher]));
    const subjectConflicts = allocations
      .filter((allocation) => {
        const teacher = teacherMap.get(String(allocation.teacher_id?._id || allocation.teacher_id));
        if (!teacher || !allocation.exam_id) return false;
        return (teacher.subject || "").toLowerCase() === (allocation.exam_id.subject || "").toLowerCase();
      })
      .map((allocation) => ({
        teacher: allocation.teacher_id?.name,
        subject: allocation.exam_id?.subject,
        date: allocation.exam_id?.exam_date,
      }));

    res.json({
      generatedAt: new Date().toISOString(),
      summary: {
        totalRoomConflicts: roomConflicts.length,
        totalTeacherConflicts: teacherConflicts.length,
        totalLeaveConflicts: leaveConflicts.length,
        totalSubjectConflicts: subjectConflicts.length,
        healthy:
          roomConflicts.length === 0 &&
          teacherConflicts.length === 0 &&
          leaveConflicts.length === 0 &&
          subjectConflicts.length === 0,
      },
      roomConflicts,
      teacherConflicts,
      leaveConflicts,
      subjectConflicts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// CENTRALIZED DATA HUB
// =============================
router.get("/data-hub", async (req, res) => {
  try {
    const [teachers, exams, leaves, allocations, policy] = await Promise.all([
      Teacher.find().sort({ createdAt: -1 }).lean(),
      Exam.find().sort({ exam_date: 1, start_time: 1 }).lean(),
      TeacherLeave.find().populate("teacher_id", "name email").sort({ leave_date: 1 }).lean(),
      DutyAllocation.find().populate("teacher_id", "name email department").populate("exam_id", "subject class_name exam_date start_time end_time room_number").sort({ createdAt: -1 }).lean(),
      getOrCreatePolicy(),
    ]);

    res.json({
      counts: {
        teachers: teachers.length,
        exams: exams.length,
        leaves: leaves.length,
        allocations: allocations.length,
      },
      policy: {
        autoRunOnExamChange: policy.autoRunOnExamChange,
        lastTriggeredAt: policy.lastTriggeredAt,
        updatedAt: policy.updatedAt,
      },
      teachers: teachers.slice(0, 15),
      exams: exams.slice(0, 20),
      leaves: leaves.slice(0, 20),
      allocations: allocations.slice(0, 20),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// ALLOCATION SIMULATION (NO DB WRITE)
// =============================
router.post("/simulate", async (req, res) => {
  try {
    const teachers = await Teacher.find().lean();
    const exams = await Exam.find().lean();
    const allLeaves = await TeacherLeave.find().lean();

    if (!teachers.length || !exams.length) {
      return res.status(400).json({ error: "Teachers or exams data missing" });
    }

    const absentTeacherEmails = Array.isArray(req.body.absentTeacherEmails)
      ? req.body.absentTeacherEmails.map((email) => String(email).trim().toLowerCase()).filter(Boolean)
      : [];

    const enrichedExams = enrichExamsWithCapacities(exams);

    const teachersWithMergedLeaves = teachers.map((teacher) => {
      const teacherLeaves = allLeaves
        .filter((leave) => String(leave.teacher_id) === String(teacher._id))
        .map((leave) => ({ date: leave.leave_date, slot: "ALL_DAY" }));

      const forcedAbsence = absentTeacherEmails.includes((teacher.email || "").toLowerCase())
        ? exams.map((exam) => ({ date: exam.exam_date, slot: "ALL_DAY" }))
        : [];

      return {
        ...teacher,
        availability: [...(teacher.availability || []), ...teacherLeaves, ...forcedAbsence],
      };
    });

    const simulationRules = req.body.rules || `
      1. Teachers should not invigilate their own subject.
      2. Teachers on leave should not be assigned.
      3. Distribute duties so each teacher gets approximately equal total duties.
      4. Avoid assigning teachers multiple times on same date.
    `;

    const aiResponse = await axios.post(`${AI_ENGINE_URL}/generate`, {
      teachers: teachersWithMergedLeaves,
      exams: enrichedExams,
      rules: simulationRules,
    });

    const roster = aiResponse.data.roster || [];
    const assigned = roster.filter((row) => row.teacher && row.teacher !== "UNASSIGNED");
    const unassigned = roster.filter((row) => row.teacher === "UNASSIGNED");
    const teacherCountMap = {};

    assigned.forEach((row) => {
      teacherCountMap[row.teacher] = (teacherCountMap[row.teacher] || 0) + 1;
    });

    const allCounts = teachers.map((teacher) => teacherCountMap[teacher.email] || 0);
    const max = allCounts.length ? Math.max(...allCounts) : 0;
    const min = allCounts.length ? Math.min(...allCounts) : 0;

    res.json({
      message: "Simulation completed",
      interpreted_logic: aiResponse.data.interpreted_constraints,
      explanation: aiResponse.data.explanation,
      roster,
      summary: {
        totalExams: exams.length,
        assignedCount: assigned.length,
        unassignedCount: unassigned.length,
        fairnessRange: max - min,
        absentTeacherEmails,
      },
    });
  } catch (err) {
    console.error("Simulation error:", err.response?.data || err.message);
    res.status(500).json({ error: "Simulation error: " + err.message });
  }
});

// =============================
// TEACHER EXPLANATION ASSISTANT
// =============================
router.post("/teacher-assistant", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const question = String(req.body.question || "").trim();

    if (!email) {
      return res.status(400).json({ error: "Teacher email is required" });
    }

    const teacher = await Teacher.findOne({ email }).lean();
    if (!teacher) {
      return res.status(404).json({ error: "Teacher profile not found" });
    }

    const [duties, allTeachers, allAllocations] = await Promise.all([
      DutyAllocation.find({ teacher_id: teacher._id }).populate("exam_id", "subject exam_date start_time end_time room_number").lean(),
      Teacher.find().lean(),
      DutyAllocation.find().populate("teacher_id", "name email department subject").lean(),
    ]);

    const stats = buildWorkloadStats(allTeachers, allAllocations);
    const reply = buildTeacherAssistantReply(teacher, duties, stats, question);

    const quickFacts = {
      totalDuties: duties.length,
      upcomingDuties: duties.filter((row) => row.exam_id?.exam_date && new Date(row.exam_id.exam_date) >= new Date()).length,
      fairnessScore: stats.summary.fairnessScore,
      averageDuties: stats.summary.averageDuties,
    };

    res.json({
      answer: reply,
      quickFacts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;