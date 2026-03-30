const mongoose = require('mongoose');
const { phase2Connector } = require('../services/Phase2Connector');

/**
 * TeacherExplanationController - Provides transparency to teachers
 * Explains why teachers received specific assignments
 */

/**
 * GET /api/phase3/explanations/:allocation_id/:teacher_id
 * Get detailed explanation of teacher's allocation
 */
exports.getExplanation = async (req, res) => {
    try {
        const { allocation_id, teacher_id } = req.params;

        // Fetch allocation
        // const allocation = await AllocationModel.findById(allocation_id);
        // const teacher = await Teacher.findById(teacher_id);

        // Mock allocation and teacher data
        const mockAllocation = {
            _id: allocation_id,
            duties: [
                { teacher_id, exam_id: 'e1' },
                { teacher_id, exam_id: 'e2' }
            ]
        };

        // Call Phase 2 to get detailed explanation
        const explanation = await phase2Connector.explainAllocation(
            mockAllocation,
            teacher_id
        );

        // Build comprehensive response
        const response = {
            teacher_id,
            teacher_name: `Teacher ${teacher_id}`,
            assigned_duties: [
                {
                    exam_name: 'Data Structures',
                    exam_code: 'CS201',
                    date: new Date().toISOString(),
                    start_time: '09:00 AM',
                    duration: 3
                },
                {
                    exam_name: 'Algorithms',
                    exam_code: 'CS301',
                    date: new Date().toISOString(),
                    start_time: '02:00 PM',
                    duration: 3
                }
            ],
            fairness_score: explanation.fairness_context?.fairness_score || 75,

            // Factors contributing to allocation
            factors: explanation.factors || [
                {
                    name: 'Availability',
                    contribution: 0.30,
                    weight: 0.30,
                    description: 'High availability during exam period'
                },
                {
                    name: 'Experience',
                    contribution: 0.25,
                    weight: 0.25,
                    description: 'Senior faculty with proven track record'
                },
                {
                    name: 'Department Balance',
                    contribution: 0.20,
                    weight: 0.20,
                    description: 'Fair distribution within department'
                },
                {
                    name: 'Workload Distribution',
                    contribution: 0.15,
                    weight: 0.15,
                    description: 'Balancing duties across team'
                },
                {
                    name: 'Subject Expertise',
                    contribution: 0.10,
                    weight: 0.10,
                    description: 'Matching qualifications with exams'
                }
            ],

            // Fairness context
            fairness_context: {
                your_duties: 2,
                average_duties: 4.2,
                your_percentile: 25, // Lower is better (fewer duties)
                department_average: 4.0,
                range_min: 1,
                range_max: 8,
                fair_assessment: 'Below average duties (good for you)'
            },

            // Similar teachers for comparison
            similar_teachers: explanation.similar_teachers || [
                {
                    teacher_id: 't2',
                    name: 'Dr. Jones',
                    department: 'CS',
                    duties: 4,
                    fairness_score: 72,
                    experience: 'Senior (8 years)',
                    reason_for_comparison: 'Similar experience level and department'
                },
                {
                    teacher_id: 't3',
                    name: 'Dr. Brown',
                    department: 'CS',
                    duties: 6,
                    fairness_score: 68,
                    experience: 'Senior (10 years)',
                    reason_for_comparison: 'Same seniority level'
                }
            ],

            // Appeal information
            can_appeal: true,
            appeal_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),

            // Explainability metrics
            explanation_confidence: explanation.confidence_score || 0.92
        };

        res.json({
            success: true,
            data: response
        });
    } catch (error) {
        console.error('Get explanation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/phase3/appeals/submit
 * Submit an appeal against allocation
 */
exports.submitAppeal = async (req, res) => {
    try {
        const { allocation_id, teacher_id, message, reason } = req.body;

        if (!allocation_id || !teacher_id || !message) {
            return res.status(400).json({
                success: false,
                error: 'allocation_id, teacher_id, and message are required'
            });
        }

        // TODO: Create Appeal record in MongoDB
        // const appeal = new AppealModel({
        //   allocation_id: new mongoose.Types.ObjectId(allocation_id),
        //   teacher_id: new mongoose.Types.ObjectId(teacher_id),
        //   message,
        //   reason,
        //   status: 'pending',
        //   submitted_by: req.user?.id || teacher_id,
        //   submitted_at: new Date()
        // });
        // await appeal.save();

        // TODO: Send notification to admin
        const appealId = `appeal_${Date.now()}`;

        res.json({
            success: true,
            message: 'Appeal submitted successfully',
            data: {
                appeal_id: appealId,
                teacher_id,
                allocation_id,
                status: 'pending_review',
                submitted_at: new Date(),
                next_steps: 'The admin team will review your appeal within 2-3 business days'
            }
        });
    } catch (error) {
        console.error('Submit appeal error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/phase3/appeals/:teacher_id
 * Get appeals submitted by a teacher
 */
exports.getTeacherAppeals = async (req, res) => {
    try {
        const { teacher_id } = req.params;
        const { limit = 20, status = null } = req.query;

        // TODO: Query Appeal collection
        // const appeals = await AppealModel.find({
        //   teacher_id: new mongoose.Types.ObjectId(teacher_id),
        //   ...(status && { status })
        // })
        // .sort({ submitted_at: -1 })
        // .limit(parseInt(limit));

        const mockAppeals = [
            {
                appeal_id: 'appeal_123',
                allocation_id: 'alloc_1',
                status: 'pending',
                submitted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                reason: 'Overloaded with duties',
                message: 'I was assigned 6 duties when average is 4...',
                admin_response: null,
                resolution: null
            }
        ];

        res.json({
            success: true,
            data: mockAppeals
        });
    } catch (error) {
        console.error('Get teacher appeals error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/phase3/appeals/:appeal_id
 * Get details of specific appeal
 */
exports.getAppeal = async (req, res) => {
    try {
        const { appeal_id } = req.params;

        // TODO: Fetch Appeal from MongoDB
        // const appeal = await AppealModel.findById(appeal_id);

        const mockAppeal = {
            appeal_id,
            teacher_id: 't1',
            teacher_name: 'Dr. Smith',
            allocation_id: 'alloc_1',
            status: 'pending',
            submitted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            reason: 'Overloaded with duties',
            message: 'I was assigned 6 duties when the average is 4. This seems unfair.',
            supporting_evidence: null,
            admin_notes: null,
            review_deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            assigned_to_admin: null
        };

        res.json({
            success: true,
            data: mockAppeal
        });
    } catch (error) {
        console.error('Get appeal error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/phase3/appeals/:appeal_id/review
 * Submit review/decision on an appeal (admin only)
 */
exports.reviewAppeal = async (req, res) => {
    try {
        const { appeal_id } = req.params;
        const { decision, comments, action_taken } = req.body;

        if (!decision || !['approved', 'rejected', 'pending_more_info'].includes(decision)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid decision. Must be: approved, rejected, or pending_more_info'
            });
        }

        // TODO: Update Appeal with review
        // Update allocation if approved

        res.json({
            success: true,
            message: `Appeal ${decision}`,
            data: {
                appeal_id,
                decision,
                reviewed_at: new Date(),
                reviewed_by: req.user?.id,
                action_taken: action_taken || null
            }
        });
    } catch (error) {
        console.error('Review appeal error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/phase3/explanations/:allocation_id/summary
 * Get summary of all explanations for allocation
 */
exports.getExplanationSummary = async (req, res) => {
    try {
        const { allocation_id } = req.params;

        // TODO: Aggregate explanation data for all teachers

        const summary = {
            allocation_id,
            total_teachers: 18,
            fairness_metrics: {
                average_fairness_score: 74.2,
                std_dev: 8.5,
                min: 56,
                max: 92,
                median: 75
            },
            appeals_submitted: 2,
            appeals_pending: 1,
            appeals_resolved: 1,
            confidence_in_explanations: 0.87,
            generated_at: new Date()
        };

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Get explanation summary error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
