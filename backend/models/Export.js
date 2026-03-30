const mongoose = require('mongoose');

/**
 * Export Schema - Tracks generated exports (Excel, PDF, ICS)
 * Manages export history and file metadata
 */
const ExportSchema = new mongoose.Schema(
    {
        // Export identification
        allocation_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Allocation',
            required: true,
            index: true
        },

        exam_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exam',
            required: true
        },

        // Export details
        export_type: {
            type: String,
            enum: ['excel', 'pdf', 'ics', 'csv', 'json'],
            required: true
        },

        filename: {
            type: String,
            required: true
        },

        file_path: String,

        // Metadata
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        export_format_version: {
            type: String,
            default: '1.0'
        },

        // File information
        file_info: {
            file_size_kb: Number,
            file_size_bytes: Number,
            mime_type: String,
            encoding: String,
            checksum: String
        },

        // Export contents
        export_contents: {
            include_allocation_summary: {
                type: Boolean,
                default: true
            },
            include_teacher_details: {
                type: Boolean,
                default: true
            },
            include_exam_schedule: {
                type: Boolean,
                default: true
            },
            include_room_assignments: {
                type: Boolean,
                default: true
            },
            include_fairness_report: {
                type: Boolean,
                default: true
            },
            include_statistics: {
                type: Boolean,
                default: true
            },
            include_compliance_info: {
                type: Boolean,
                default: true
            },
            custom_fields: [String]
        },

        // PDF/Excel specific
        format_options: {
            page_orientation: String,
            include_charts: Boolean,
            include_graphs: Boolean,
            color_scheme: String,
            include_cover_page: Boolean,
            include_toc: Boolean
        },

        // ICS specific (calendar)
        calendar_options: {
            include_reminders: {
                type: Boolean,
                default: true
            },
            reminder_minutes_before: {
                type: Number,
                default: 60
            },
            include_location: {
                type: Boolean,
                default: true
            },
            include_teacher_contact: {
                type: Boolean,
                default: false
            },
            events_count: Number
        },

        // Distribution
        distribution: {
            email_recipients: [
                {
                    email: String,
                    sent_at: Date,
                    delivery_status: {
                        type: String,
                        enum: ['pending', 'sent', 'failed', 'bounced'],
                        default: 'pending'
                    }
                }
            ],
            download_url: String,
            download_count: {
                type: Number,
                default: 0
            },
            last_downloaded_at: Date,
            download_history: [
                {
                    downloaded_at: Date,
                    downloaded_by: mongoose.Schema.Types.ObjectId,
                    ip_address: String
                }
            ]
        },

        // Expiry and lifecycle
        expires_at: {
            type: Date,
            required: true
        },

        is_expired: {
            type: Boolean,
            default: false
        },

        is_archived: {
            type: Boolean,
            default: false
        },

        archived_at: Date,

        // Status tracking
        status: {
            type: String,
            enum: ['generating', 'ready', 'failed', 'expired', 'deleted'],
            default: 'generating'
        },

        generation_status: {
            start_time: Date,
            completion_time: Date,
            duration_ms: Number,
            progress_percentage: Number,
            error_message: String
        },

        // Phase 3 tracking
        phase3_info: {
            simulation_based: {
                type: Boolean,
                default: false
            },
            simulation_id: mongoose.Schema.Types.ObjectId,
            includes_simulated_data: Boolean,
            fairness_report_version: String
        },

        // Audit trail
        access_log: [
            {
                accessed_at: Date,
                accessed_by: mongoose.Schema.Types.ObjectId,
                action: String,
                ip_address: String
            }
        ],

        // Tags and categorization
        tags: [String],
        export_reason: String,
        notes: String
    },
    {
        timestamps: true,
        collection: 'exports'
    }
);

// Indexes for performance
ExportSchema.index({ allocation_id: 1 });
ExportSchema.index({ exam_id: 1 });
ExportSchema.index({ created_by: 1 });
ExportSchema.index({ export_type: 1 });
ExportSchema.index({ status: 1 });
ExportSchema.index({ expires_at: 1 });
ExportSchema.index({ createdAt: -1 });
ExportSchema.index({ 'distribution.download_url': 1 });

module.exports = mongoose.model('Export', ExportSchema);
