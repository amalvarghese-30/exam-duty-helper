const mongoose = require('mongoose');

/**
 * AuditLog Schema - Comprehensive audit trail for compliance and tracking
 * Records all significant actions and changes in the system
 */
const AuditLogSchema = new mongoose.Schema(
    {
        // Core audit information
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        user_name: String,
        user_email: String,
        user_role: String,

        // Action details
        action: {
            type: String,
            enum: [
                'allocation_created',
                'allocation_updated',
                'allocation_approved',
                'allocation_rejected',
                'duty_assigned',
                'duty_swapped',
                'duty_cancelled',
                'fairness_analysis_run',
                'export_generated',
                'policy_updated',
                'emergency_handled',
                'simulation_run',
                'explanation_generated',
                'analytics_viewed'
            ],
            required: true,
            index: true
        },

        // Resource identification
        resource_type: {
            type: String,
            enum: ['allocation', 'duty', 'exam', 'teacher', 'fairness_metric', 'policy'],
            required: true
        },

        resource_id: mongoose.Schema.Types.ObjectId,

        // Changes made
        changes: {
            before: mongoose.Schema.Types.Mixed,
            after: mongoose.Schema.Types.Mixed,
            fields_changed: [String],
            change_summary: String
        },

        // Environmental context
        context: {
            ip_address: String,
            user_agent: String,
            session_id: String,
            request_id: String,
            api_endpoint: String,
            http_method: String
        },

        // Status and outcome
        status: {
            type: String,
            enum: ['success', 'failure', 'partial_success', 'warning'],
            default: 'success'
        },

        status_code: Number,
        error_message: String,
        error_details: String,

        // Compliance information
        compliance: {
            is_compliant: Boolean,
            compliance_checks: [
                {
                    check_name: String,
                    passed: Boolean,
                    details: String
                }
            ],
            gdpr_relevant: Boolean,
            pii_involved: Boolean,
            sensitive_data_touched: [String]
        },

        // Detailed audit data
        audit_data: {
            affected_teachers: [
                {
                    teacher_id: mongoose.Schema.Types.ObjectId,
                    teacher_name: String,
                    impact: String
                }
            ],
            affected_exams: [
                {
                    exam_id: mongoose.Schema.Types.ObjectId,
                    exam_name: String
                }
            ],
            departments_affected: [String],
            severity_level: {
                type: String,
                enum: ['informational', 'warning', 'critical']
            }
        },

        // Phase 3 specific
        phase3_info: {
            simulation_id: mongoose.Schema.Types.ObjectId,
            swap_operation_id: String,
            algorithm_run_id: String,
            fairness_impact: Number
        },

        // Approval trail
        approvals: [
            {
                approved_at: Date,
                approved_by: mongoose.Schema.Types.ObjectId,
                approval_level: String,
                approval_notes: String
            }
        ],

        // Related events
        related_events: [mongoose.Schema.Types.ObjectId],
        parent_event_id: mongoose.Schema.Types.ObjectId,

        // Additional metadata
        tags: [String],
        notes: String,
        attachments: [
            {
                filename: String,
                url: String,
                file_type: String
            }
        ]
    },
    {
        timestamps: true,
        collection: 'audit_logs'
    }
);

// Indexes for audit queries
AuditLogSchema.index({ user_id: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ resource_type: 1, resource_id: 1 });
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ 'compliance.gdpr_relevant': 1 });
AuditLogSchema.index({ 'compliance.pii_involved': 1 });
AuditLogSchema.index({ 'audit_data.severity_level': 1 });
AuditLogSchema.index({ 'phase3_info.simulation_id': 1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
