/**
 * Swap Controller - Handles swap recommendations and requests
 */

const SwapRequest = require('../models/SwapRequest');
const DutyAllocation = require('../models/DutyAllocation');
const Teacher = require('../models/Teacher');
const axios = require('axios');

/**
 * POST /api/swaps/recommend
 * Get swap recommendations from AI engine
 */
exports.getSwapRecommendations = async (req, res) => {
    try {
        const { institution_id } = req.body;

        if (!institution_id) {
            return res.status(400).json({
                success: false,
                message: 'institution_id is required'
            });
        }

        // Fetch current allocations
        const allocations = await DutyAllocation.find({
            institution_id,
            status: 'assigned'
        }).populate('teacher_id', 'name email department totalDuties');

        const teachers = await Teacher.find({
            institution_id,
            is_active: true
        });

        if (!allocations.length || !teachers.length) {
            return res.status(400).json({
                success: false,
                message: 'No allocations or teachers found'
            });
        }

        // Build current allocation structure for Python engine
        const currentAllocation = {};
        for (const allocation of allocations) {
            const examId = allocation.exam_id.toString();
            if (!currentAllocation[examId]) {
                currentAllocation[examId] = {
                    exam_id: examId,
                    roles: {}
                };
            }

            const role = allocation.role || 'invigilator';
            if (!currentAllocation[examId].roles[role]) {
                currentAllocation[examId].roles[role] = [];
            }

            currentAllocation[examId].roles[role].push({
                teacher_id: allocation.teacher_id._id.toString(),
                teacher_name: allocation.teacher_id.name,
                role: role
            });
        }

        // Calculate current fairness metrics
        const teacherDuties = {};
        teachers.forEach(teacher => {
            teacherDuties[teacher._id.toString()] = 0;
        });
        allocations.forEach(allocation => {
            const teacherId = allocation.teacher_id._id.toString();
            teacherDuties[teacherId] = (teacherDuties[teacherId] || 0) + 1;
        });

        const dutyValues = Object.values(teacherDuties);
        const mean = dutyValues.reduce((a, b) => a + b, 0) / dutyValues.length;
        const variance = dutyValues.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / dutyValues.length;
        const stdDev = Math.sqrt(variance);

        const currentFairness = Math.max(0, Math.min(100, 100 - (stdDev * 15)));

        // Identify overloaded and underloaded teachers
        const overloadThreshold = mean + (1.5 * stdDev);
        const underloadThreshold = mean * 0.6;

        const overloadedTeachers = teachers
            .filter(t => (teacherDuties[t._id.toString()] || 0) > overloadThreshold)
            .map(t => ({
                teacher_id: t._id,
                name: t.name,
                current_duties: teacherDuties[t._id.toString()] || 0,
                threshold: overloadThreshold
            }));

        const underloadedTeachers = teachers
            .filter(t => (teacherDuties[t._id.toString()] || 0) < underloadThreshold)
            .map(t => ({
                teacher_id: t._id,
                name: t.name,
                current_duties: teacherDuties[t._id.toString()] || 0,
                capacity: Math.floor(underloadThreshold - (teacherDuties[t._id.toString()] || 0))
            }));

        // Generate swap recommendations
        const swapRecommendations = [];

        for (const overloaded of overloadedTeachers) {
            for (const underloaded of underloadedTeachers) {
                // Find swappable exams
                const overloadedExams = allocations.filter(a =>
                    a.teacher_id._id.toString() === overloaded.teacher_id
                );

                const underloadedExams = allocations.filter(a =>
                    a.teacher_id._id.toString() === underloaded.teacher_id
                );

                // Check if they teach the same subjects
                const overloadedTeacher = teachers.find(t => t._id.toString() === overloaded.teacher_id);
                const underloadedTeacher = teachers.find(t => t._id.toString() === underloaded.teacher_id);

                const sameSubject = overloadedTeacher?.subject === underloadedTeacher?.subject;

                if (overloadedExams.length > 0) {
                    const improvement = Math.min(15, (overloaded.current_duties - underloaded.current_duties) * 2.5);

                    swapRecommendations.push({
                        teacher_a: {
                            name: overloaded.name,
                            id: overloaded.teacher_id,
                            current_duties: overloaded.current_duties
                        },
                        teacher_b: {
                            name: underloaded.name,
                            id: underloaded.teacher_id,
                            current_duties: underloaded.current_duties
                        },
                        fairness_improvement_percent: improvement,
                        reason: sameSubject
                            ? `Both teach ${overloadedTeacher?.subject}. Swapping would balance workload by ${Math.round(improvement)}%`
                            : `${underloaded.name} has ${underloaded.current_duties} duties (${underloaded.capacity} capacity). Would reduce ${overloaded.name}'s load by 1 duty.`,
                        constraint_compliance: true
                    });
                }
            }
        }

        // Sort by improvement percentage
        swapRecommendations.sort((a, b) => b.fairness_improvement_percent - a.fairness_improvement_percent);

        // Calculate total potential improvement
        const totalPotentialImprovement = swapRecommendations.reduce(
            (sum, rec) => sum + rec.fairness_improvement_percent, 0
        );

        // AI recommendations (mock data for now)
        const aiRecommendations = swapRecommendations.slice(0, 2).map((rec, idx) => ({
            swap_id: `ai_swap_${idx}`,
            teacher_from: rec.teacher_a.name,
            teacher_to: rec.teacher_b.name,
            exam: "Recommended exam",
            reasoning: rec.reason,
            expected_improvement: rec.fairness_improvement_percent,
            feasibility: rec.fairness_improvement_percent > 10 ? "high" : "medium"
        }));

        return res.json({
            success: true,
            data: {
                current_fairness: currentFairness,
                overloaded_teachers: overloadedTeachers,
                underloaded_teachers: underloadedTeachers,
                top_swap_recommendations: swapRecommendations.slice(0, 10),
                total_potential_improvement: totalPotentialImprovement,
                ai_recommendations: aiRecommendations
            }
        });

    } catch (error) {
        console.error('Swap recommendation error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * POST /api/swaps/request
 * Create a swap request
 */
exports.createSwapRequest = async (req, res) => {
    try {
        const {
            institution_id,
            teacher_a_id,
            teacher_b_id,
            type,
            reason,
            fairness_improvement
        } = req.body;

        if (!institution_id || !teacher_a_id || !teacher_b_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: institution_id, teacher_a_id, teacher_b_id'
            });
        }

        // Get teacher details
        const teacherA = await Teacher.findById(teacher_a_id);
        const teacherB = await Teacher.findById(teacher_b_id);

        if (!teacherA || !teacherB) {
            return res.status(404).json({
                success: false,
                message: 'One or both teachers not found'
            });
        }

        // Find duties for both teachers
        const dutiesA = await DutyAllocation.find({
            teacher_id: teacher_a_id,
            institution_id,
            status: 'assigned'
        }).populate('exam_id', 'subject exam_date start_time end_time');

        const dutiesB = await DutyAllocation.find({
            teacher_id: teacher_b_id,
            institution_id,
            status: 'assigned'
        }).populate('exam_id', 'subject exam_date start_time end_time');

        // Create swap request
        const swapRequest = new SwapRequest({
            institution_id,
            requester_id: req.user?.id || teacher_a_id,
            requester_name: teacherA.name,
            requester_email: teacherA.email,
            teacher_a_id,
            teacher_a_name: teacherA.name,
            teacher_b_id,
            teacher_b_name: teacherB.name,
            duties_a: dutiesA.map(d => ({
                exam_id: d.exam_id._id,
                role: d.role,
                date: d.exam_id?.exam_date
            })),
            duties_b: dutiesB.map(d => ({
                exam_id: d.exam_id._id,
                role: d.role,
                date: d.exam_id?.exam_date
            })),
            fairness_improvement: {
                current_variance: 0,
                post_swap_variance: 0,
                improvement_percent: fairness_improvement || 0,
                reason: reason
            },
            status: type === 'admin_suggested' ? 'pending_admin_approval' : 'pending_teacher_b_approval',
            request_type: type || 'auto_recommended',
            message: reason,
            requested_at: new Date()
        });

        await swapRequest.save();

        return res.json({
            success: true,
            message: 'Swap request created successfully',
            data: {
                swap_id: swapRequest._id,
                status: swapRequest.status,
                created_at: swapRequest.requested_at
            }
        });

    } catch (error) {
        console.error('Create swap request error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * GET /api/swaps/pending/:institution_id
 * Get pending swap requests
 */
exports.getPendingSwaps = async (req, res) => {
    try {
        const { institution_id } = req.params;

        const pendingSwaps = await SwapRequest.find({
            institution_id,
            status: { $in: ['pending_teacher_b_approval', 'pending_admin_approval'] }
        })
            .populate('teacher_a_id', 'name email department')
            .populate('teacher_b_id', 'name email department')
            .sort({ requested_at: -1 });

        return res.json({
            success: true,
            data: pendingSwaps
        });

    } catch (error) {
        console.error('Get pending swaps error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * PATCH /api/swaps/:swap_id/approve
 * Approve a swap request
 */
exports.approveSwap = async (req, res) => {
    try {
        const { swap_id } = req.params;
        const { user_id, user_type, reason } = req.body;

        const swapRequest = await SwapRequest.findById(swap_id);

        if (!swapRequest) {
            return res.status(404).json({
                success: false,
                message: 'Swap request not found'
            });
        }

        if (user_type === 'teacher') {
            swapRequest.teacher_b_approval = {
                approved: true,
                approved_at: new Date(),
                response: reason || 'Approved'
            };
            swapRequest.status = 'pending_admin_approval';
        } else if (user_type === 'admin') {
            swapRequest.admin_approval = {
                admin_id: user_id,
                admin_name: 'Admin',
                approved: true,
                approved_at: new Date(),
                reason: reason || 'Approved'
            };
            swapRequest.status = 'approved';
        }

        await swapRequest.save();

        // If fully approved, execute the swap
        if (swapRequest.status === 'approved') {
            await executeSwap(swapRequest);
        }

        return res.json({
            success: true,
            message: 'Swap request approved',
            data: swapRequest
        });

    } catch (error) {
        console.error('Approve swap error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * PATCH /api/swaps/:swap_id/reject
 * Reject a swap request
 */
exports.rejectSwap = async (req, res) => {
    try {
        const { swap_id } = req.params;
        const { reason } = req.body;

        const swapRequest = await SwapRequest.findByIdAndUpdate(
            swap_id,
            {
                status: 'rejected',
                message: reason || 'Rejected by admin'
            },
            { new: true }
        );

        if (!swapRequest) {
            return res.status(404).json({
                success: false,
                message: 'Swap request not found'
            });
        }

        return res.json({
            success: true,
            message: 'Swap request rejected',
            data: swapRequest
        });

    } catch (error) {
        console.error('Reject swap error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Execute a swap (internal function)
 */
async function executeSwap(swapRequest) {
    try {
        // Get duties to swap
        const dutiesA = await DutyAllocation.find({
            teacher_id: swapRequest.teacher_a_id,
            'exam_id': { $in: swapRequest.duties_a.map(d => d.exam_id) }
        });

        const dutiesB = await DutyAllocation.find({
            teacher_id: swapRequest.teacher_b_id,
            'exam_id': { $in: swapRequest.duties_b.map(d => d.exam_id) }
        });

        // Swap duties
        for (const duty of dutiesA) {
            duty.teacher_id = swapRequest.teacher_b_id;
            duty.allocation_method = 'swap';
            await duty.save();
        }

        for (const duty of dutiesB) {
            duty.teacher_id = swapRequest.teacher_a_id;
            duty.allocation_method = 'swap';
            await duty.save();
        }

        // Update teacher duty counts
        await Teacher.findByIdAndUpdate(swapRequest.teacher_a_id, {
            $inc: { totalDuties: dutiesB.length - dutiesA.length }
        });

        await Teacher.findByIdAndUpdate(swapRequest.teacher_b_id, {
            $inc: { totalDuties: dutiesA.length - dutiesB.length }
        });

        swapRequest.executed_at = new Date();
        swapRequest.execution_method = 'automated';
        await swapRequest.save();

        console.log(`Swap executed successfully: ${swapRequest._id}`);

    } catch (error) {
        console.error('Execute swap error:', error);
        throw error;
    }
}