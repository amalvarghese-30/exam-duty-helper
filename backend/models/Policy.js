const mongoose = require('mongoose');

/**
 * Policy Schema - Stores allocation policies and constraints
 * Used for Emergency Handler and Policy Editor
 */
const PolicySchema = new mongoose.Schema(
    {
        // Policy identification
        policy_name: {
            type: String,
            required: true,
            unique: true
        },

        description: String,

        policy_type: {
            type: String,
            enum: ['fairness', 'availability', 'emergency', 'load_balance', 'custom'],
            required: true
        },

        // Policy status
        is_active: {
            type: Boolean,
            default: true
        },

        priority: {
            type: Number,
            default: 1,
            description: 'Higher number = higher priority'
        },

        // Version control
        version: {
            type: Number,
            default: 1
        },

        previous_versions: [
            {
                version: Number,
                policy_config: mongoose.Schema.Types.Mixed,
                created_at: Date,
                created_by: mongoose.Schema.Types.ObjectId
            }
        ],

        // Policy rules
        rules: [
            {
                rule_id: String,
                rule_name: String,
                rule_type: {
                    type: String,
                    enum: ['constraint', 'preference', 'objective', 'penalty'],
                    description: 'Type of rule'
                },
                condition: {
                    parameter: String,
                    operator: { type: String, enum: ['equals', 'gt', 'lt', 'gte', 'lte', 'contains', 'in'] },
                    value: mongoose.Schema.Types.Mixed
                },
                action: {
                    type: String,
                    description: 'What happens when rule is triggered'
                },
                severity: {
                    type: String,
                    enum: ['low', 'medium', 'high', 'critical'],
                    default: 'medium'
                },
                enabled: {
                    type: Boolean,
                    default: true
                }
            }
        ],

        // Policy parameters and weights
        parameters: {
            fairness_weight: {
                type: Number,
                min: 0,
                max: 1,
                default: 0.3
            },
            availability_weight: {
                type: Number,
                min: 0,
                max: 1,
                default: 0.3
            },
            load_balance_weight: {
                type: Number,
                min: 0,
                max: 1,
                default: 0.2
            },
            constraint_weight: {
                type: Number,
                min: 0,
                max: 1,
                default: 0.2
            },
            custom_parameters: mongoose.Schema.Types.Mixed
        },

        // Scope of applicability
        scope: {
            applicable_to_exams: [mongoose.Schema.Types.ObjectId],
            applicable_to_departments: [String],
            applicable_to_teachers: [mongoose.Schema.Types.ObjectId],
            date_range_start: Date,
            date_range_end: Date
        },

        // Emergency policy specifics
        emergency_config: {
            is_emergency_policy: Boolean,
            trigger_conditions: [String],
            fallback_action: String,
            override_other_policies: Boolean,
            emergency_contacts: [
                {
                    name: String,
                    role: String,
                    email: String,
                    phone: String
                }
            ]
        },

        // Creation and modification
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        modified_by: mongoose.Schema.Types.ObjectId,

        modification_history: [
            {
                modified_at: Date,
                modified_by: mongoose.Schema.Types.ObjectId,
                change_description: String,
                version_before: Number,
                version_after: Number
            }
        ],

        // Testing and validation
        test_results: {
            last_tested_at: Date,
            last_tested_by: mongoose.Schema.Types.ObjectId,
            test_status: String,
            test_failures: [String],
            validation_score: Number
        },

        // Usage statistics
        usage_stats: {
            times_applied: {
                type: Number,
                default: 0
            },
            times_triggered: {
                type: Number,
                default: 0
            },
            success_rate: Number,
            last_applied_at: Date,
            allocations_affected: [mongoose.Schema.Types.ObjectId]
        },

        // Notes and documentation
        documentation: String,
        examples: [String],
        warnings: [String],

        tags: [String]
    },
    {
        timestamps: true,
        collection: 'policies'
    }
);

// Indexes
PolicySchema.index({ policy_type: 1 });
PolicySchema.index({ is_active: 1 });
PolicySchema.index({ priority: -1 });
PolicySchema.index({ created_by: 1 });

module.exports = mongoose.model('Policy', PolicySchema);
