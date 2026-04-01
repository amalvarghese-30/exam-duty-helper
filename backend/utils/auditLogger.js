/**
 * Audit Logger Utility
 * Centralized logging of all allocation changes for compliance
 */

const AuditLog = require("../models/AuditLog");

class AuditLogger {
    /**
     * Log an allocation change
     */
    static async logAllocationChange(
        userId,
        action,
        resourceType,
        resourceId,
        changes = {},
        context = {}
    ) {
        try {
            const auditEntry = new AuditLog({
                user_id: userId,
                action,
                resource_type: resourceType,
                resource_id: resourceId,
                changes: changes || {},
                context: {
                    ip_address: context.ip_address || "unknown",
                    api_endpoint: context.api_endpoint || "unknown",
                    http_method: context.http_method || "unknown",
                    request_id: context.request_id || "",
                },
                status: "success",
            });

            await auditEntry.save();
            console.log(
                `✅ Audit logged: ${action} on ${resourceType} ${resourceId}`
            );
            return auditEntry;
        } catch (error) {
            console.error(`❌ Failed to log audit: ${error.message}`);
            // Don't throw - audit logging should not break the main operation
            return null;
        }
    }

    /**
     * Log allocation locking
     */
    static async logAllocationLock(
        userId,
        allocationId,
        reason = "",
        context = {}
    ) {
        return this.logAllocationChange(
            userId,
            "allocation_updated",
            "allocation",
            allocationId,
            {
                before: { is_locked: false },
                after: { is_locked: true, override_reason: reason },
                fields_changed: ["is_locked", "override_reason"],
                change_summary: `Allocation locked: ${reason}`,
            },
            context
        );
    }

    /**
     * Log allocation unlocking
     */
    static async logAllocationUnlock(userId, allocationId, context = {}) {
        return this.logAllocationChange(
            userId,
            "allocation_updated",
            "allocation",
            allocationId,
            {
                before: { is_locked: true },
                after: { is_locked: false },
                fields_changed: ["is_locked"],
                change_summary: "Allocation unlocked",
            },
            context
        );
    }

    /**
     * Log allocation accept
     */
    static async logAllocationAccept(userId, allocationId, context = {}) {
        return this.logAllocationChange(
            userId,
            "allocation_approved",
            "allocation",
            allocationId,
            {
                before: { status: "assigned" },
                after: { status: "accepted" },
                fields_changed: ["status"],
                change_summary: "Teacher accepted allocation",
            },
            context
        );
    }

    /**
     * Log allocation reject
     */
    static async logAllocationReject(userId, allocationId, context = {}) {
        return this.logAllocationChange(
            userId,
            "allocation_rejected",
            "allocation",
            allocationId,
            {
                before: { status: "assigned" },
                after: { status: "rejected" },
                fields_changed: ["status"],
                change_summary: "Teacher rejected allocation",
            },
            context
        );
    }

    /**
     * Log bulk allocation creation
     */
    static async logBulkAllocation(
        userId,
        allocations,
        allocationResult,
        context = {}
    ) {
        try {
            const auditEntry = new AuditLog({
                user_id: userId,
                action: "allocation_created",
                resource_type: "allocation",
                changes: {
                    before: {},
                    after: {
                        allocated_exams: allocationResult.statistics?.allocated_exams,
                        total_exams: allocationResult.statistics?.total_exams,
                        success_rate: allocationResult.statistics?.success_rate_percent,
                    },
                    fields_changed: ["allocations_created"],
                    change_summary: `Bulk allocation: ${allocationResult.statistics?.allocated_exams}/${allocationResult.statistics?.total_exams} exams allocated`,
                },
                context: {
                    ip_address: context.ip_address || "unknown",
                    api_endpoint: context.api_endpoint || "/api/allocations/run",
                    http_method: context.http_method || "POST",
                    request_id: context.request_id || "",
                },
                status: "success",
            });

            await auditEntry.save();
            console.log(
                `✅ Bulk allocation audit logged: ${allocationResult.statistics?.allocated_exams}/${allocationResult.statistics?.total_exams} exams`
            );
            return auditEntry;
        } catch (error) {
            console.error(`❌ Failed to log bulk allocation audit: ${error.message}`);
            return null;
        }
    }

    /**
     * Get audit history for a resource
     */
    static async getAuditHistory(resourceId, limit = 50) {
        try {
            const history = await AuditLog.find({ resource_id: resourceId })
                .sort({ createdAt: -1 })
                .limit(limit)
                .select(
                    "user_name action changes status createdAt"
                );

            return history;
        } catch (error) {
            console.error(`❌ Failed to fetch audit history: ${error.message}`);
            return [];
        }
    }

    /**
     * Get all audits for a date range
     */
    static async getAuditsByDateRange(startDate, endDate, limit = 100) {
        try {
            const audits = await AuditLog.find({
                createdAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
            })
                .sort({ createdAt: -1 })
                .limit(limit);

            return audits;
        } catch (error) {
            console.error(
                `❌ Failed to fetch audits by date range: ${error.message}`
            );
            return [];
        }
    }
}

module.exports = AuditLogger;
