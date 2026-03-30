const mongoose = require('mongoose');

/**
 * EmergencyIncident Schema - Tracks emergency situations and responses
 * Stores incident details, impact analysis, and resolution
 */
const EmergencyIncidentSchema = new mongoose.Schema(
    {
        // Incident identification
        incident_id: {
            type: String,
            unique: true,
            required: true
        },

        allocation_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Allocation',
            required: true,
            index: true
        },

        // Incident details
        incident_type: {
            type: String,
            enum: [
                'teacher_absence',
                'teacher_illness',
                'facility_issue',
                'schedule_conflict',
                'emergency_leave',
                'other'
            ],
            required: true
        },

        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium'
        },

        description: {
            type: String,
            required: true
        },

        // Affected parties
        affected_teacher: {
            teacher_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Teacher'
            },
            teacher_name: String,
            teacher_department: String
        },

        affected_duties: [
            {
                duty_id: mongoose.Schema.Types.ObjectId,
                exam_id: mongoose.Schema.Types.ObjectId,
                exam_name: String,
                duty_type: String,
                scheduled_date: Date,
                scheduled_time: String,
                location: String
            }
        ],

        affected_exams: [mongoose.Schema.Types.ObjectId],

        // Timeline
        reported_at: {
            type: Date,
            default: Date.now
        },

        reported_by: {
            user_id: mongoose.Schema.Types.ObjectId,
            user_name: String,
            user_role: String
        },

        time_until_affected: String,
        description: 'Time from incident report to affected duties',

        // Incident assessment
        assessment: {
            is_critical: Boolean,
            immediate_coverage_required: Boolean,
            impact_summary: String,
            number_of_affected_duties: Number,
            estimated_students_affected: Number
        },

        // Response options
        response_options: [
            {
                option_id: String,
                option_name: String,
                description: String,
                affected_teachers: [
                    {
                        teacher_id: mongoose.Schema.Types.ObjectId,
                        teacher_name: String,
                        impact_on_fairness: Number,
                        feasibility: String
                    }
                ],
                estimated_implementation_time: Number,
                estimated_success_rate: Number,
                risks: [String],
                benefits: [String],
                cost_impact: String
            }
        ],

        // Selected response
        selected_response: {
            option_id: String,
            selected_by: mongoose.Schema.Types.ObjectId,
            selected_at: Date,
            selection_notes: String
        },

        // Implementation
        implementation: {
            status: {
                type: String,
                enum: ['pending', 'in_progress', 'completed', 'failed', 'rolled_back'],
                default: 'pending'
            },

            started_at: Date,
            completed_at: Date,
            implemented_by: mongoose.Schema.Types.ObjectId,

            implementation_details: {
                swaps_executed: [
                    {
                        swap_id: mongoose.Schema.Types.ObjectId,
                        executed_at: Date
                    }
                ],
                new_assignments: [
                    {
                        duty_id: mongoose.Schema.Types.ObjectId,
                        new_teacher_id: mongoose.Schema.Types.ObjectId,
                        new_teacher_name: String,
                        assignment_details: String
                    }
                ],
                cancellations: [
                    {
                        duty_id: mongoose.Schema.Types.ObjectId,
                        cancellation_reason: String
                    }
                ],
                postponements: [
                    {
                        duty_id: mongoose.Schema.Types.ObjectId,
                        original_date: Date,
                        new_date: Date
                    }
                ],
                implementation_notes: String
            },

            success: Boolean,
            failure_reason: String
        },

        // Rollback capability
        rollback: {
            can_rollback: Boolean,
            rollback_deadline: Date,
            rolled_back: Boolean,
            rolled_back_at: Date,
            rolled_back_by: mongoose.Schema.Types.ObjectId
        },

        // Escalation
        escalation: {
            is_escalated: Boolean,
            escalated_to: [
                {
                    role: String,
                    contact_name: String,
                    email: String,
                    phone: String,
                    escalated_at: Date
                }
            ],
            escalation_reason: String
        },

        // Communication
        communications: [
            {
                communication_id: String,
                sent_at: Date,
                sent_to: [String],
                message_type: String,
                message_content: String,
                delivery_status: String
            }
        ],

        // Post-incident analysis
        post_incident_analysis: {
            analyzed_at: Date,
            analyzed_by: mongoose.Schema.Types.ObjectId,
            root_cause: String,
            prevention_measures: [String],
            process_improvements: [String],
            lessons_learned: String
        },

        // Related incidents
        related_incidents: [mongoose.Schema.Types.ObjectId],

        // Audit trail
        audit_trail: [
            {
                timestamp: Date,
                action: String,
                actor_id: mongoose.Schema.Types.ObjectId,
                details: String
            }
        ],

        // Tags and notes
        tags: [String],
        notes: String
    },
    {
        timestamps: true,
        collection: 'emergency_incidents'
    }
);

// Indexes
EmergencyIncidentSchema.index({ allocation_id: 1 });
EmergencyIncidentSchema.index({ incident_id: 1 });
EmergencyIncidentSchema.index({ 'affected_teacher.teacher_id': 1 });
EmergencyIncidentSchema.index({ severity: 1 });
EmergencyIncidentSchema.index({ 'implementation.status': 1 });
EmergencyIncidentSchema.index({ reported_at: -1 });

module.exports = mongoose.model('EmergencyIncident', EmergencyIncidentSchema);
