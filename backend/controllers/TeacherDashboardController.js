const DutyAllocation = require("../models/DutyAllocation");
const Teacher = require("../models/Teacher");
const TeacherLeave = require("../models/TeacherLeave");


// =============================
// GET TEACHER DASHBOARD STATS
// =============================
exports.getTeacherStats = async (req, res) => {
    console.log('📊 getTeacherStats called');
    console.log('📊 req.query:', req.query);
    console.log('📊 req.user:', req.user);
    try {
        const email = req.query.email || req.user?.email;
        console.log('📊 Extracted email:', email);


        if (!email) {
            console.log('❌ No email found in request');
            return res.status(400).json({
                success: false,
                error: "Email parameter is required"
            });
        }

        const teacher = await Teacher.findOne({ email });
        console.log('📊 Teacher found:', teacher ? teacher.name : 'NOT FOUND');

        if (!teacher) {
            console.log('❌ Teacher not found for email:', email);
            return res.status(404).json({
                success: false,
                error: "Teacher profile not found for email: " + email
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
            a.exam_id && new Date(a.exam_id.exam_date) >= today
        ).length;

        const leaveDays = await TeacherLeave.countDocuments({
            teacher_id
        });

        // Get accepted duties
        const acceptedDuties = await DutyAllocation.countDocuments({
            teacher_id,
            status: "accepted"
        });

        // Get pending approvals
        const pendingApprovals = await DutyAllocation.countDocuments({
            teacher_id,
            status: "assigned"
        });

        console.log(`✅ Stats found for ${teacher.name}: total=${totalDuties}, upcoming=${upcomingDuties}`);

        res.json({
            success: true,
            data: {
                total_duties: totalDuties,
                upcoming_duties: upcomingDuties,
                leave_days: leaveDays,
                accepted_duties: acceptedDuties,
                pending_approvals: pendingApprovals
            }
        });

    } catch (error) {
        console.error("❌ Teacher stats error:", error);
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
        const email = req.query.email || req.user?.email;
        const limit = parseInt(req.query.limit) || 50;

        console.log('📋 Getting duties for email:', email);

        if (!email) {
            return res.status(400).json({
                success: false,
                error: "Email parameter is required"
            });
        }

        const teacher = await Teacher.findOne({ email });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: "Teacher not found for email: " + email
            });
        }

        const allocations = await DutyAllocation.find({ teacher_id: teacher._id })
            .populate("exam_id", "subject exam_date start_time end_time room_number")
            .limit(limit)
            .lean();

        const duties = allocations.map(a => ({
            exam_id: a.exam_id?._id,
            subject_name: a.exam_id?.subject || "Unknown",
            date: a.exam_id?.exam_date,
            time_from: a.exam_id?.start_time,
            time_to: a.exam_id?.end_time,
            room: a.exam_id?.room_number,
            duty_types: [a.role || "invigilator"],
            status: a.status || "assigned"
        }));

        console.log(`✅ Found ${duties.length} duties for ${teacher.name}`);

        res.json({
            success: true,
            data: duties
        });

    } catch (error) {
        console.error("❌ Error fetching duties:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch duties",
            error: error.message
        });
    }
};


// =============================
// GET UPCOMING DUTIES
// =============================
exports.getUpcomingDuties = async (req, res) => {
    try {
        const email = req.query.email || req.user?.email;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: "Email parameter is required"
            });
        }

        const teacher = await Teacher.findOne({ email });

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
            .filter(a => a.exam_id && new Date(a.exam_id.exam_date) >= today)
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
        console.error("❌ Upcoming duties error:", error);
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
        const email = req.query.email || req.user?.email;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: "Email parameter is required"
            });
        }

        const teacher = await Teacher.findOne({ email });

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
        console.error("❌ Teacher leaves error:", error);
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
        const email = req.query.email || req.user?.email;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: "Email parameter is required"
            });
        }

        const teacher = await Teacher.findOne({ email }).lean();

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
        console.error("❌ Teacher profile error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};