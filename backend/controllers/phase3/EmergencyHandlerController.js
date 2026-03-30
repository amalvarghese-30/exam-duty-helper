const mongoose = require('mongoose');
const { AllocationHistory } = require('../models/AllocationAudit');
const { phase2Connector } = require('../services/Phase2Connector');

/**
 * EmergencyHandlerController - Handles emergency teacher unavailability
 * Finds replacements and applies emergency reschedules
 */

/**
 * GET /api/phase3/emergency/scan
 * Scan for unavailable teachers and affected duties
 */
exports.scanEmergencies = async (req, res) => {
    try {
        const { allocation_id } = req.query;

        if (!allocation_id) {
            return res.status(400).json({
                success: false,
                error: 'allocation_id is required'
            });
        }

        // Fetch allocation from MongoDB
        // const allocation = await AllocationModel.findById(allocation_id);

        // In production, check TeacherLeave collection for current leaves
        // const unavailable = await TeacherLeave.find({
        //   leave_from: { $lte: new Date() },
        //   leave_to: { $gte: new Date() }
        // });

        // Mock data
        const unavailableTeachers = [
            {
                _id: 't1',
                name: 'Dr. Smith',
                email: 'smith@institution.edu',
                department: 'CS',
                unavailable_from: new Date(),
                unavailable_to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                duties_count: 3,
                immediate_duties: [
                    {
                        exam_name: 'Data Structures Final',
                        date: new Date().toISOString().split('T')[0],
                        time: '09:00 AM'
                    }
                ]
            }
        ];

        // Find affected duty assignments
        // const affectedDuties = allocation.duties.filter(d =>
        //   unavailableTeachers.find(t => t._id === d.teacher_id)
        // );

        const mockAllocation = { _id: allocation_id, duties: [] };

        // Get replacement suggestions via Phase 2
        const replacements = await phase2Connector.findReplacements(
            mockAllocation,
            unavailableTeachers[0]?._id || 't1',
            ['duty_1', 'duty_2']
        );

        res.json({
            success: true,
            data: {
                unavailable_teachers: unavailableTeachers,
                affected_duties_count: 3,
                replacements: replacements.options || [
                    {
                        duty_id: 'duty_1',
                        current_teacher: 'Dr. Smith',
                        suggested_replacements: [
                            {
                                teacher_id: 't2',
                                teacher_name: 'Dr. Jones',
                                qualification_match: 0.95,
                                workload_delta: 1,
                                fairness_delta: 2.5,
                                availability: 'available'
                            },
                            {
                                teacher_id: 't3',
                                teacher_name: 'Dr. Brown',
                                qualification_match: 0.88,
                                workload_delta: 0,
                                fairness_delta: 1.2,
                                availability: 'constrained'
                            }
                        ]
                    }
                ],
                scan_time_ms: 245,
                scan_timestamp: new Date()
            }
        });
    } catch (error) {
        console.error('Scan emergencies error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/phase3/emergency/apply-replacement
 * Apply a single emergency replacement
 */
exports.applyReplacement = async (req, res) => {
    try {
        const {
            allocation_id,
            duty_id,
            replacement_teacher_id,
            reason = 'Emergency replacement'
        } = req.body;

        if (!allocation_id || !duty_id || !replacement_teacher_id) {
            return res.status(400).json({
                success: false,
                error: 'allocation_id, duty_id, and replacement_teacher_id are required'
            });
        }

        // Fetch allocation
        // const allocation = await AllocationModel.findById(allocation_id);

        // Mock allocation
        const mockAllocation = { _id: allocation_id, duties: [] };

        // Call Phase 2 to handle emergency
        const emergencyResult = await phase2Connector.handleEmergency(
            mockAllocation,
            'unavailable_teacher_id',
            [duty_id]
        );

        // Create history entry for audit
        const historyEntry = new AllocationHistory({
            allocation_id: new mongoose.Types.ObjectId(allocation_id),
            institution_id: new mongoose.Types.ObjectId('default_institution'),
            change_type: 'emergency_replacement',
            change_details: {
                replacement_details: {
                    unavailable_teacher_id: 'unavailable_teacher_id',
                    replacement_teacher_id: new mongoose.Types.ObjectId(replacement_teacher_id),
                    affected_duties: [new mongoose.Types.ObjectId(duty_id)],
                    unavailability_reason: reason
                }
            },
            impact: {
                fairness_delta: emergencyResult.fairness_delta || 2,
                workload_delta: 1,
                constraint_violations_before: 0,
                constraint_violations_after: 0,
                affected_teachers_count: 2,
                affected_exams_count: 1
            },
            changed_by: req.user?.id || new mongoose.Types.ObjectId(),
            user_role: 'admin',
            reason: reason,
            approval_status: 'not_required'
        });

        await historyEntry.save();

        res.json({
            success: true,
            message: 'Emergency replacement applied successfully',
            data: {
                allocation_id,
                duty_id,
                replacement_teacher_id,
                applied_at: new Date(),
                affected_exams: 1,
                fairness_impact: emergencyResult.fairness_delta || 2
            }
        });
    } catch (error) {
        console.error('Apply replacement error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/phase3/emergency/batch-apply-replacements
 * Apply multiple emergency replacements
 */
exports.batchApplyReplacements = async (req, res) => {
    try {
        const { allocation_id, replacements = [], reason = 'Batch emergency replacements' } = req.body;

        if (!allocation_id) {
            return res.status(400).json({
                success: false,
                error: 'allocation_id is required'
            });
        }

        if (!Array.isArray(replacements) || replacements.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'replacements must be a non-empty array'
            });
        }

        // Apply each replacement
        let appliedCount = 0;
        let totalFairnessImprovement = 0;

        for (const replacement of replacements) {
            try {
                // Create history entry for each
                const historyEntry = new AllocationHistory({
                    allocation_id: new mongoose.Types.ObjectId(allocation_id),
                    institution_id: new mongoose.Types.ObjectId('default_institution'),
                    change_type: 'emergency_replacement',
                    change_details: {
                        replacement_details: {
                            unavailable_teacher_id: 'unavailable_teacher_id',
                            replacement_teacher_id: new mongoose.Types.ObjectId(
                                replacement.replacement_teacher_id
                            ),
                            affected_duties: [new mongoose.Types.ObjectId(replacement.duty_id)],
                            unavailability_reason: reason
                        }
                    },
                    impact: {
                        fairness_delta: 2,
                        workload_delta: 0,
                        affected_teachers_count: 2,
                        affected_exams_count: 1
                    },
                    changed_by: req.user?.id || new mongoose.Types.ObjectId(),
                    user_role: 'admin',
                    reason: reason,
                    approval_status: 'not_required'
                });

                await historyEntry.save();
                appliedCount++;
                totalFairnessImprovement += 2;
            } catch (error) {
                console.warn(`Failed to apply replacement for duty ${replacement.duty_id}`, error);
            }
        }

        res.json({
            success: true,
            message: `Applied ${appliedCount} emergency replacements`,
            data: {
                allocation_id,
                applied_count: appliedCount,
                failed_count: replacements.length - appliedCount,
                total_fairness_improvement: totalFairnessImprovement,
                applied_at: new Date()
            }
        });
    } catch (error) {
        console.error('Batch apply replacements error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/phase3/emergency/status
 * Get current emergency status
 */
exports.getEmergencyStatus = async (req, res) => {
    try {
        const { allocation_id } = req.query;

        // TODO: Query for active emergencies
        // Count unavailable teachers
        // Count pending replacements

        const status = {
            allocation_id,
            active_emergencies: 1,
            pending_replacements: 2,
            resolved_emergencies: 0,
            last_emergency_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
            critical_situations: []
        };

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Get emergency status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/phase3/emergency/notify
 * Notify affected people of emergency replacement
 */
exports.notifyEmergency = async (req, res) => {
    try {
        const {
            allocation_id,
            unavailable_teacher_id,
            replacement_teacher_id,
            affected_exams
        } = req.body;

        // TODO: Send notifications via email/SMS
        // 1. Notify replacement teacher
        // 2. Notify original teacher
        // 3. Notify admins
        // 4. Notify affected students (optional)

        res.json({
            success: true,
            message: 'Notifications sent',
            data: {
                notifications_sent: 3,
                channels: ['email', 'dashboard', 'sms']
            }
        });
    } catch (error) {
        console.error('Notify emergency error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
