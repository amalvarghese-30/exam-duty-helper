/**
 * Audit Service
 * File: frontend/src/services/phase3/AuditService.ts
 */

import axios from 'axios';

interface AuditResponse {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
}

class AuditService {
    private baseURL = '/api/phase3';

    /**
     * Get audit logs
     */
    async getAuditLogs(options?: {
        limit?: number;
        offset?: number;
        action?: string;
        user_id?: string;
    }) {
        try {
            const params = options || {};
            const response = await axios.get<AuditResponse>(
                `${this.baseURL}/audit/logs`,
                { params }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Get audit trail for allocation
     */
    async getAllocationAuditTrail(allocationId: string) {
        try {
            const response = await axios.get<AuditResponse>(
                `${this.baseURL}/audit/allocation/${allocationId}`
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Get audit logs for specific user
     */
    async getUserAuditTrail(userId: string) {
        try {
            const response = await axios.get<AuditResponse>(
                `${this.baseURL}/audit/user/${userId}`
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Get compliance report
     */
    async getComplianceReport(options?: {
        start_date?: string;
        end_date?: string;
        department_id?: string;
    }) {
        try {
            const params = options || {};
            const response = await axios.get<AuditResponse>(
                `${this.baseURL}/audit/compliance`,
                { params }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Export audit logs
     */
    async exportAuditLogs(format: 'csv' | 'xlsx' | 'json' = 'csv') {
        try {
            const response = await axios.get(
                `${this.baseURL}/audit/export`,
                {
                    params: { format },
                    responseType: 'blob'
                }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    private handleError(error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An error occurred'
        };
    }
}

export default new AuditService();
