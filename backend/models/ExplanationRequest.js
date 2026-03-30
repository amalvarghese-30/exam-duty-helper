const mongoose = require('mongoose');

/**
 * ExplanationRequest Schema - Tracks teacher requests for allocation explanations
 * Stores Q&A interactions and AI-generated explanations
 */
const ExplanationRequestSchema = new mongoose.Schema(
    {
        // Request identification
        request_id: {
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

        exam_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exam'
        },

        // Requester information
        teacher_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Teacher',
            required: true
        },

        teacher_name: String,
        teacher_email: String,

        // Question details
        question_type: {
            type: String,
            enum: [
                'why_assigned',
                'why_not_assigned',
                'fairness_explanation',
                'duty_necessity',
                'swap_possibility',
                'workload_explanation',
                'schedule_explanation',
                'general_question'
            ],
            required: true
        },

        question_text: {
            type: String,
            required: true
        },

        related_duty_id: mongoose.Schema.Types.ObjectId,
        related_teacher_id: mongoose.Schema.Types.ObjectId,

        // Request metadata
        requested_at: {
            type: Date,
            default: Date.now
        },

        requested_format: {
            type: String,
            enum: ['text', 'structured', 'visual', 'detailed'],
            default: 'structured'
        },

        // AI-Generated Explanation
        explanation: {
            generated_at: Date,
            generated_by: {
                type: String,
                enum: ['ai', 'admin', 'system'],
                default: 'ai'
            },

            // Explainability components
            direct_answer: String,

            reasoning: [
                {
                    step: String,
                    logic: String,
                    supporting_data: mongoose.Schema.Types.Mixed
                }
            ],

            factors_considered: [
                {
                    factor_name: String,
                    factor_value: mongoose.Schema.Types.Mixed,
                    impact_on_decision: String,
                    weight: Number
                }
            ],

            fairness_justification: {
                fairness_score: Number,
                how_fairness_achieved: String,
                constraints_satisfied: [String],
                tradeoffs_made: [String]
            },

            alternative_options: [
                {
                    option_description: String,
                    why_not_selected: String,
                    fairness_impact: Number,
                    implementation_cost: String
                }
            ],

            personalizedMessage: {
                text: String,
                tone: String,
                empathy_level: String
            },

            // Supporting data for visualization
            related_metrics: {
                teacher_fairness_score: Number,
                teacher_workload_hours: Number,
                department_load: Number,
                peer_comparison: {
                    percentile: Number,
                    comparison_summary: String
                }
            },

            visual_explanation: {
                chart_type: String,
                chart_data: mongoose.Schema.Types.Mixed,
                visualization_url: String
            }
        },

        // Experience tracking (for continuous learning)
        ai_model_used: String,
        ai_model_version: String,
        temperature_setting: Number,

        // Feedback on explanation
        feedback: {
            received: Boolean,
            received_at: Date,
            teacher_rating: {
                type: Number,
                min: 1,
                max: 5,
                description: 'Rating of explanation quality'
            },
            clarity_rating: {
                type: Number,
                min: 1,
                max: 5
            },
            helpfulness_rating: {
                type: Number,
                min: 1,
                max: 5
            },
            teacher_comments: String,
            satisfied: Boolean,
            requested_further_explanation: Boolean
        },

        // Follow-up questions
        follow_up_questions: [
            {
                follow_up_id: String,
                follow_up_text: String,
                follow_up_answer: String,
                asked_at: Date,
                answered_at: Date
            }
        ],

        // Resolution status
        status: {
            type: String,
            enum: ['pending', 'answered', 'resolved', 'escalated', 'requires_human_review'],
            default: 'pending'
        },

        requires_human_review: Boolean,
        human_review_by: mongoose.Schema.Types.ObjectId,
        human_review_notes: String,

        escalation: {
            escalated: Boolean,
            escalated_to: mongoose.Schema.Types.ObjectId,
            escalation_reason: String,
            escalation_date: Date
        },

        // Privacy and compliance
        privacy_level: {
            type: String,
            enum: ['public', 'private', 'confidential']
        },

        contains_sensitive_info: Boolean,
        gdpr_compliant: Boolean,

        // Historical tracking
        similar_questions: [
            {
                previous_request_id: String,
                similarity_score: Number
            }
        ],

        // Insights for improvement
        system_insights: {
            common_misunderstanding: Boolean,
            misunderstanding_type: String,
            explanation_effectiveness: Number,
            improvement_suggestions: [String]
        },

        // Tags and metadata
        tags: [String],
        notes: String
    },
    {
        timestamps: true,
        collection: 'explanation_requests'
    }
);

// Indexes
ExplanationRequestSchema.index({ allocation_id: 1 });
ExplanationRequestSchema.index({ teacher_id: 1 });
ExplanationRequestSchema.index({ request_id: 1 });
ExplanationRequestSchema.index({ status: 1 });
ExplanationRequestSchema.index({ requested_at: -1 });
ExplanationRequestSchema.index({ question_type: 1 });

module.exports = mongoose.model('ExplanationRequest', ExplanationRequestSchema);
