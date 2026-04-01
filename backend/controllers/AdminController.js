/**
 * AdminController - Dashboard stats and admin operations
 * File: backend/controllers/AdminController.js
 */

const Exam = require('../models/Exam');
const Teacher = require('../models/Teacher');
const TeacherLeave = require('../models/TeacherLeave');
const User = require('../models/User');

// Try to load Allocation model (Phase 3), but don't fail if it doesn't exist
let Allocation = null;
try {
  Allocation = require('../models/Allocation');
} catch (e) {
  // Model doesn't exist, will use fallback
}

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const teachers = await Teacher.countDocuments();
        const exams = await Exam.countDocuments();

        // Get duties allocated (if Allocation model exists)
        let dutiesAllocated = 0;
        try {
            if (Allocation) {
                dutiesAllocated = await Allocation.aggregate([
                    { $unwind: '$duties' },
                    { $count: 'total' }
                ]);
                dutiesAllocated = dutiesAllocated.length > 0 ? dutiesAllocated[0].total : 0;
            } else {
                // Fallback: count from Exam model
                const examsWithDuties = await Exam.countDocuments({ 'invigilators.0': { $exists: true } });
                dutiesAllocated = examsWithDuties * 3; // Rough estimate
            }
        } catch (e) {
            // Fallback on error
            const examsWithDuties = await Exam.countDocuments({ 'invigilators.0': { $exists: true } });
            dutiesAllocated = examsWithDuties * 3;
        }

        // Get pending swaps (if needed)
        let pendingSwaps = 0;
        try {
            const SwapTransaction = require('../models/SwapTransaction') || null;
            if (SwapTransaction) {
                pendingSwaps = await SwapTransaction.find({ 'approval.status': 'pending' }).countDocuments();
            }
        } catch (e) {
            // Ignore if model doesn't exist
        }

        res.json({
            success: true,
            data: {
                total_teachers: teachers,
                exam_schedules: exams,
                duties_allocated: dutiesAllocated,
                pending_swaps: pendingSwaps
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/admin/teachers
 * Get all teachers list
 */
exports.getTeachersList = async (req, res) => {
    try {
        const { department, limit = 100, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (department) {
            query.department = department;
        }

        const teachers = await Teacher.find(query)
            .select('name email department specialization contact_number')
            .limit(parseInt(limit))
            .skip(skip)
            .lean();

        const total = await Teacher.countDocuments(query);

        res.json({
            success: true,
            data: teachers,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get teachers error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/admin/teachers/:teacher_id
 * Get teacher details with allocation info
 */
exports.getTeacherDetail = async (req, res) => {
    try {
        const { teacher_id } = req.params;

        const teacher = await Teacher.findById(teacher_id)
            .populate('department')
            .lean();

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Teacher not found'
            });
        }

        // Get teacher's exams (invigilations)
        const exams = await Exam.find({
            $or: [
                { 'invigilators': teacher_id },
                { 'checkers': teacher_id },
                { 'coordinator': teacher_id }
            ]
        }).lean();

        // Get teacher's leaves
        const leaves = await TeacherLeave.find({ teacher_id }).lean();

        res.json({
            success: true,
            data: {
                teacher,
                exams,
                leaves,
                stats: {
                    total_duties: exams.length,
                    leave_days: leaves.length
                }
            }
        });
    } catch (error) {
        console.error('Get teacher detail error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/admin/duties
 * Get all allocated duties
 */
exports.getAllDuties = async (req, res) => {
    try {
        const { exam_id, teacher_id, limit = 100, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (exam_id) {
            query.exam_id = exam_id;
        }

        // Get exams with invigilators
        let duties = [];

        const exams = await Exam.find(query)
            .select('subject_name date time_from time_to room invigilators checkers coordinator')
            .limit(parseInt(limit))
            .skip(skip)
            .populate('invigilators', 'name email department')
            .populate('checkers', 'name email department')
            .populate('coordinator', 'name email department')
            .lean();

        // Transform to duties array
        duties = [];
        for (const exam of exams) {
            if (exam.invigilators && exam.invigilators.length > 0) {
                exam.invigilators.forEach((inv) => {
                    duties.push({
                        exam_id: exam._id,
                        exam_name: exam.subject_name,
                        teacher_id: inv._id,
                        teacher_name: inv.name,
                        teacher_email: inv.email,
                        department: inv.department,
                        duty_type: 'invigilator',
                        date: exam.date,
                        time_from: exam.time_from,
                        time_to: exam.time_to,
                        room: exam.room,
                        status: 'assigned'
                    });
                });
            }

            if (exam.checkers && exam.checkers.length > 0) {
                exam.checkers.forEach((chk) => {
                    duties.push({
                        exam_id: exam._id,
                        exam_name: exam.subject_name,
                        teacher_id: chk._id,
                        teacher_name: chk.name,
                        teacher_email: chk.email,
                        department: chk.department,
                        duty_type: 'checker',
                        date: exam.date,
                        time_from: exam.time_from,
                        time_to: exam.time_to,
                        room: exam.room,
                        status: 'assigned'
                    });
                });
            }

            if (exam.coordinator) {
                duties.push({
                    exam_id: exam._id,
                    exam_name: exam.subject_name,
                    teacher_id: exam.coordinator._id,
                    teacher_name: exam.coordinator.name,
                    teacher_email: exam.coordinator.email,
                    department: exam.coordinator.department,
                    duty_type: 'coordinator',
                    date: exam.date,
                    time_from: exam.time_from,
                    time_to: exam.time_to,
                    room: exam.room,
                    status: 'assigned'
                });
            }
        }

        // Filter by teacher if provided
        if (teacher_id) {
            duties = duties.filter((d) => d.teacher_id.toString() === teacher_id);
        }

        res.json({
            success: true,
            data: duties,
            pagination: {
                page,
                limit,
                total: duties.length
            }
        });
    } catch (error) {
        console.error('Get all duties error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/admin/leaves
 * Get teachers on leave
 */
exports.getTeachersOnLeave = async (req, res) => {
    try {
        const { date, limit = 100, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (date) {
            const leaveDate = new Date(date);
            query.leave_date = {
                $gte: new Date(leaveDate.setHours(0, 0, 0, 0)),
                $lt: new Date(leaveDate.setHours(23, 59, 59, 999))
            };
        } else {
            // Default: today and future
            const today = new Date();
            query.leave_date = { $gte: today };
        }

        const leaves = await TeacherLeave.find(query)
            .populate('teacher_id', 'name email department')
            .limit(parseInt(limit))
            .skip(skip)
            .lean();

        const total = await TeacherLeave.countDocuments(query);

        // Include duties for those days
        const teachersOnLeave = await Promise.all(
            leaves.map(async (leave) => {
                const duties = await Exam.find({
                    date: {
                        $gte: new Date(leave.leave_date.setHours(0, 0, 0, 0)),
                        $lt: new Date(leave.leave_date.setHours(23, 59, 59, 999))
                    },
                    $or: [
                        { invigilators: leave.teacher_id._id },
                        { checkers: leave.teacher_id._id },
                        { coordinator: leave.teacher_id._id }
                    ]
                })
                    .select('subject_name time_from time_to room')
                    .lean();

                return {
                    ...leave,
                    assigned_duties_on_leave: duties
                };
            })
        );

        res.json({
            success: true,
            data: teachersOnLeave,
            pagination: {
                page,
                limit,
                total
            }
        });
    } catch (error) {
        console.error('Get teachers on leave error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/admin/overview
 * Get comprehensive admin overview
 */
exports.getAdminOverview = async (req, res) => {
    try {
        const teachers = await Teacher.countDocuments();
        const exams = await Exam.countDocuments();
        const leaves = await TeacherLeave.find({
            leave_date: { $gte: new Date() }
        }).countDocuments();

        // Get duty assignments
        const examsWithDuties = await Exam.find({
            $or: [
                { 'invigilators.0': { $exists: true } },
                { 'checkers.0': { $exists: true } },
                { coordinator: { $exists: true, $ne: null } }
            ]
        }).countDocuments();

        // Get conflicting duties (teachers assigned while on leave)
        const teachersOnLeave = await TeacherLeave.find({
            leave_date: { $gte: new Date() }
        })
            .lean()
            .select('teacher_id leave_date');

        let conflictCount = 0;
        for (const leave of teachersOnLeave) {
            const conflicts = await Exam.find({
                date: {
                    $gte: new Date(leave.leave_date.setHours(0, 0, 0, 0)),
                    $lt: new Date(leave.leave_date.setHours(23, 59, 59, 999))
                },
                $or: [
                    { invigilators: leave.teacher_id },
                    { checkers: leave.teacher_id },
                    { coordinator: leave.teacher_id }
                ]
            }).countDocuments();
            conflictCount += conflicts;
        }

        res.json({
            success: true,
            data: {
                total_teachers: teachers,
                total_exams: exams,
                exams_with_duties: examsWithDuties,
                teachers_on_leave: leaves,
                duty_conflicts: conflictCount
            }
        });
    } catch (error) {
        console.error('Admin overview error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
