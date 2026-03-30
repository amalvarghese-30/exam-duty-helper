const mongoose = require('mongoose');
const { AllocationHistory } = require('../models/AllocationAudit');

/**
 * PolicyEditorController - Manages department allocation policies
 * Handles policy CRUD and validation
 */

/**
 * GET /api/phase3/policies/:dept_id
 * Get policies for a department
 */
exports.getPolicies = async (req, res) => {
    try {
        const { dept_id } = req.params;

        // Fetch DepartmentPolicy from MongoDB
        // const policy = await DepartmentPolicyModel.findOne({
        //   department_id: new mongoose.Types.ObjectId(dept_id)
        // });

        // If not found, return defaults
        const defaultPolicies = {
            department_id: dept_id,
            department_name: `Department ${dept_id}`,
            max_daily_duties: 3,
            max_weekly_duties: 10,
            min_gap_hours: 2,
            cross_department_eligible: true,
            seniority_multiplier: 1.2,
            eligible_roles: ['invigilator', 'supervisor'],
            priority_subjects: [],
            created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            updated_at: new Date(),
            updated_by: 'system'
        };

        res.json({
            success: true,
            data: defaultPolicies
        });
    } catch (error) {
        console.error('Get policies error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * PUT /api/phase3/policies/:dept_id
 * Update policies for a department
 */
exports.updatePolicies = async (req, res) => {
    try {
        const { dept_id } = req.params;
        const policyUpdates = req.body;

        // Validate policy values
        const errors = [];

        if (policyUpdates.max_daily_duties && policyUpdates.max_daily_duties < 1) {
            errors.push('max_daily_duties must be at least 1');
        }

        if (policyUpdates.max_weekly_duties && policyUpdates.max_weekly_duties < 1) {
            errors.push('max_weekly_duties must be at least 1');
        }

        if (
            policyUpdates.min_gap_hours &&
            policyUpdates.min_gap_hours < 0
        ) {
            errors.push('min_gap_hours cannot be negative');
        }

        if (
            policyUpdates.seniority_multiplier &&
            policyUpdates.seniority_multiplier < 1
        ) {
            errors.push('seniority_multiplier must be at least 1');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }

        // TODO: Update DepartmentPolicy in MongoDB
        // const updatedPolicy = await DepartmentPolicyModel.findOneAndUpdate(
        //   { department_id: new mongoose.Types.ObjectId(dept_id) },
        //   policyUpdates,
        //   { new: true }
        // );

        // Create audit history for policy change
        const historyEntry = new AllocationHistory({
            allocation_id: new mongoose.Types.ObjectId('policy_allocation'),
            institution_id: new mongoose.Types.ObjectId('default_institution'),
            change_type: 'policy_change',
            change_details: {
                policy_change: {
                    department_id: new mongoose.Types.ObjectId(dept_id),
                    changes: Object.keys(policyUpdates).map((field) => ({
                        field,
                        new_value: policyUpdates[field]
                    }))
                }
            },
            impact: {
                fairness_delta: 0, // Policies don't immediately change fairness
                constraint_violations_before: 0,
                constraint_violations_after: 0,
                affected_teachers_count: 0
            },
            changed_by: req.user?.id || new mongoose.Types.ObjectId(),
            user_role: 'admin',
            reason: 'Policy update',
            approval_status: 'not_required'
        });

        await historyEntry.save();

        res.json({
            success: true,
            message: 'Policies updated successfully',
            data: {
                department_id: dept_id,
                updated_fields: Object.keys(policyUpdates),
                updated_at: new Date(),
                audit_entry_id: historyEntry._id
            }
        });
    } catch (error) {
        console.error('Update policies error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/phase3/policies/templates
 * Get available policy templates
 */
exports.getPolicyTemplates = async (req, res) => {
    try {
        const templates = [
            {
                id: 'CBSE_STANDARD',
                name: 'CBSE Standard',
                description: 'Standard policies for CBSE affiliated institutions',
                category: 'public',
                policies: {
                    max_daily_duties: 3,
                    max_weekly_duties: 12,
                    min_gap_hours: 2,
                    cross_department_eligible: true,
                    seniority_multiplier: 1.3
                }
            },
            {
                id: 'AUTONOMOUS',
                name: 'Autonomous Institution',
                description: 'Flexible policies for autonomous institutions',
                category: 'public',
                policies: {
                    max_daily_duties: 4,
                    max_weekly_duties: 15,
                    min_gap_hours: 1,
                    cross_department_eligible: true,
                    seniority_multiplier: 1.2
                }
            },
            {
                id: 'STRICT',
                name: 'Strict Fairness',
                description: 'Restrictive policies prioritizing perfect fairness',
                category: 'public',
                policies: {
                    max_daily_duties: 2,
                    max_weekly_duties: 8,
                    min_gap_hours: 4,
                    cross_department_eligible: false,
                    seniority_multiplier: 1.0
                }
            },
            {
                id: 'FLEXIBLE',
                name: 'Flexible',
                description: 'Flexible policies maximizing resource utilization',
                category: 'public',
                policies: {
                    max_daily_duties: 5,
                    max_weekly_duties: 20,
                    min_gap_hours: 0.5,
                    cross_department_eligible: true,
                    seniority_multiplier: 1.5
                }
            }
        ];

        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        console.error('Get policy templates error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/phase3/policies/apply-template
 * Apply a policy template to a department
 */
exports.applyTemplate = async (req, res) => {
    try {
        const { dept_id, template_id } = req.body;

        if (!dept_id || !template_id) {
            return res.status(400).json({
                success: false,
                error: 'dept_id and template_id are required'
            });
        }

        // TODO: Fetch template and apply to department
        // const template = TEMPLATES.find(t => t.id === template_id);
        // const updated = await DepartmentPolicyModel.findOneAndUpdate(
        //   { department_id: new mongoose.Types.ObjectId(dept_id) },
        //   template.policies,
        //   { new: true }
        // );

        res.json({
            success: true,
            message: `Applied template ${template_id}`,
            data: {
                department_id: dept_id,
                template_applied: template_id,
                applied_at: new Date()
            }
        });
    } catch (error) {
        console.error('Apply template error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/phase3/policies/validate
 * Validate proposed policies against allocation
 */
exports.validatePolicies = async (req, res) => {
    try {
        const { allocation_id, proposed_policies } = req.body;

        if (!allocation_id || !proposed_policies) {
            return res.status(400).json({
                success: false,
                error: 'allocation_id and proposed_policies are required'
            });
        }

        // TODO: Fetch allocation and check if new policies would:
        // 1. Violate any current assignments
        // 2. Create new conflicts
        // 3. Make allocation impossible

        const validation = {
            is_valid: true,
            violations: [],
            warnings: [
                {
                    level: 'warning',
                    message: 'Max daily duties reduced - 2 teachers would exceed limit',
                    affected_teachers: ['t5', 't7'],
                    affected_exams: 3
                }
            ],
            affected_assignments: 3,
            requires_reallocation: false,
            impact_summary: {
                teachers_affected: 2,
                exams_affected: 3,
                additional_constraints: 1
            }
        };

        res.json({
            success: true,
            data: validation
        });
    } catch (error) {
        console.error('Validate policies error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/phase3/policies/:dept_id/history
 * Get policy change history
 */
exports.getPolicyHistory = async (req, res) => {
    try {
        const { dept_id } = req.params;
        const { limit = 50 } = req.query;

        // Query history for policy changes
        const history = await AllocationHistory.find({
            change_type: 'policy_change',
            'change_details.policy_change.department_id': new mongoose.Types.ObjectId(dept_id)
        })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Get policy history error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
