/**
 * Teacher Chat Controller - AI-powered assistant for teachers
 */

const axios = require('axios');
const DutyAllocation = require('../models/DutyAllocation');
const Teacher = require('../models/Teacher');
const Exam = require('../models/Exam');

/**
 * POST /api/teacher/chat/ask
 * Ask a question about allocation
 */
exports.askQuestion = async (req, res) => {
    try {
        const { question } = req.body;
        const teacherId = req.user?.id;

        if (!question) {
            return res.status(400).json({
                success: false,
                error: 'Question is required'
            });
        }

        if (!teacherId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        // Fetch teacher data
        const teacher = await Teacher.findById(teacherId).lean();
        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Teacher not found'
            });
        }

        // Fetch teacher's allocations
        const allocations = await DutyAllocation.find({ teacher_id: teacherId })
            .populate('exam_id', 'subject exam_date start_time end_time room_number')
            .lean();

        // Fetch overall stats
        const allTeachers = await Teacher.find({ is_active: true }).lean();
        const allExams = await Exam.find().lean();

        const teacherDuties = allocations.map(a => ({
            exam_subject: a.exam_id?.subject,
            date: a.exam_id?.exam_date,
            time: a.exam_id?.start_time,
            role: a.role,
            status: a.status
        }));

        const teacherData = {
            name: teacher.name,
            department: teacher.department,
            total_duties: teacher.totalDuties,
            allocations: teacherDuties
        };

        const allocationData = {
            total_exams: allExams.length,
            total_teachers: allTeachers.length,
            teachers: allTeachers.map(t => ({ name: t.name, total_duties: t.totalDuties })),
            workload_std_dev: calculateStdDev(allTeachers.map(t => t.totalDuties))
        };

        // Call Python AI chat endpoint
        const response = await axios.post(
            'http://localhost:5000/api/teacher/chat',
            {
                question,
                teacher_data: teacherData,
                allocation_data: allocationData
            },
            { timeout: 30000 }
        );

        return res.json({
            success: true,
            data: response.data.data
        });

    } catch (error) {
        console.error('Teacher chat error:', error);
        return res.status(500).json({
            success: false,
            error: error.response?.data?.message || error.message
        });
    }
};

/**
 * GET /api/teacher/chat/suggested-questions
 * Get suggested questions for teachers
 */
exports.getSuggestedQuestions = async (req, res) => {
    try {
        const teacherId = req.user?.id;

        if (!teacherId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const teacher = await Teacher.findById(teacherId).lean();
        const allocations = await DutyAllocation.find({ teacher_id: teacherId }).countDocuments();
        const avgDuties = await getAverageDuties();

        const suggestions = [
            "Why do I have this many duties?",
            "How are duties distributed fairly?",
            "Can I request a swap?"
        ];

        if (allocations > avgDuties + 1) {
            suggestions.unshift("Why do I have more duties than average?");
        }

        if (allocations < avgDuties - 1) {
            suggestions.unshift("Why do I have fewer duties than colleagues?");
        }

        return res.json({
            success: true,
            data: suggestions.slice(0, 5)
        });

    } catch (error) {
        console.error('Get suggested questions error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Helper function
function calculateStdDev(numbers) {
    if (!numbers.length) return 0;
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
}

async function getAverageDuties() {
    const teachers = await Teacher.find({ is_active: true });
    const total = teachers.reduce((sum, t) => sum + (t.totalDuties || 0), 0);
    return teachers.length ? total / teachers.length : 0;
}