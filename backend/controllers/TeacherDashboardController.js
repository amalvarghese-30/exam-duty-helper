const DutyAllocation = require("../models/DutyAllocation");
const Teacher = require("../models/Teacher");
const TeacherLeave = require("../models/TeacherLeave");


// =============================
// GET TEACHER DASHBOARD STATS
// =============================
exports.getTeacherStats = async (req, res) => {
    try {

        const teacher = await Teacher.findOne({
            email: req.user.email
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: "Teacher profile not found"
            });
        }

        const teacher_id = teacher._id;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalDuties = await DutyAllocation.countDocuments({
            teacher_id
        });

        const upcomingAllocations = await DutyAllocation.find({
            teacher_id
        }).populate("exam_id");

        const upcomingDuties = upcomingAllocations.filter(a =>
            new Date(a.exam_id.exam_date) >= today
        ).length;

        const leaveDays = await TeacherLeave.countDocuments({
            teacher_id
        });

        res.json({
            success: true,
            data: {
                total_duties: totalDuties,
                upcoming_duties: upcomingDuties,
                leave_days: leaveDays
            }
        });

    } catch (error) {

        console.error("Teacher stats error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


// =============================
// GET TEACHER DUTIES
// =============================
exports.getTeacherDuties = async (req, res) => {
    try {

        const teacher = await Teacher.findOne({
            email: req.user.email
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: "Teacher profile not found"
            });
        }

        const allocations = await DutyAllocation.find({
            teacher_id: teacher._id
        })
            .populate("exam_id")
            .sort({ "exam_id.exam_date": 1 })
            .lean();

        const duties = allocations.map(a => ({
            exam_id: a.exam_id._id,
            subject_name: a.exam_id.subject,
            date: a.exam_id.exam_date,
            time_from: a.exam_id.start_time,
            time_to: a.exam_id.end_time,
            room: a.exam_id.room_number,
            duty_types: [a.role],   // ← ADD THIS
            status: a.status
        }));

        res.json({
            success: true,
            data: duties
        });

    } catch (error) {

        console.error("Teacher duties error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


// =============================
// GET UPCOMING DUTIES
// =============================
exports.getUpcomingDuties = async (req, res) => {
    try {

        const teacher = await Teacher.findOne({
            email: req.user.email
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: "Teacher profile not found"
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allocations = await DutyAllocation.find({
            teacher_id: teacher._id
        })
            .populate("exam_id")
            .lean();

        const upcoming = allocations
            .filter(a => new Date(a.exam_id.exam_date) >= today)
            .map(a => ({
                subject_name: a.exam_id.subject,
                date: a.exam_id.exam_date,
                time_from: a.exam_id.start_time,
                time_to: a.exam_id.end_time,
                room: a.exam_id.room_number
            }));

        res.json({
            success: true,
            data: upcoming
        });

    } catch (error) {

        console.error("Upcoming duties error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


// =============================
// GET TEACHER LEAVES
// =============================
exports.getTeacherLeaves = async (req, res) => {
    try {

        const teacher = await Teacher.findOne({
            email: req.user.email
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: "Teacher profile not found"
            });
        }

        const leaves = await TeacherLeave.find({
            teacher_id: teacher._id
        })
            .sort({ leave_date: 1 })
            .lean();

        res.json({
            success: true,
            data: leaves
        });

    } catch (error) {

        console.error("Teacher leaves error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


// =============================
// GET TEACHER PROFILE
// =============================
exports.getTeacherProfile = async (req, res) => {
    try {

        const teacher = await Teacher.findOne({
            email: req.user.email
        }).lean();

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: "Teacher profile not found"
            });
        }

        res.json({
            success: true,
            data: teacher
        });

    } catch (error) {

        console.error("Teacher profile error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};