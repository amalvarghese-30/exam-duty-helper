/**
 * Export Service
 * File: frontend/src/services/phase3/ExportService.ts
 */

import axios from 'axios';

interface ExportRequest {
    allocation_id: string;
    options?: Record<string, unknown>;
}

interface ExportResponse {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
}

class ExportService {
    private baseURL = '/api/phase3';

    /**
     * Generate Excel export
     */
    async exportToExcel(request: ExportRequest) {
        try {
            const response = await axios.post<ExportResponse>(
                `${this.baseURL}/exports/excel`,
                request
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Generate PDF export
     */
    async exportToPDF(request: ExportRequest) {
        try {
            const response = await axios.post<ExportResponse>(
                `${this.baseURL}/exports/pdf`,
                request
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Generate iCalendar export
     */
    async exportToICS(request: ExportRequest) {
        try {
            const response = await axios.post<ExportResponse>(
                `${this.baseURL}/exports/ics`,
                request
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * List exports
     */
    async listExports(allocationId?: string, limit?: number) {
        try {
            const params: Record<string, unknown> = {};
            if (allocationId) params.allocation_id = allocationId;
            if (limit) params.limit = limit;

            const response = await axios.get<ExportResponse>(
                `${this.baseURL}/exports`,
                { params }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Download export file
     */
    async downloadFile(filename: string) {
        try {
            const response = await axios.get(
                `${this.baseURL}/exports/files/${filename}`,
                {
                    responseType: 'blob'
                }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Delete export
     */
    async deleteExport(exportId: string) {
        try {
            const response = await axios.delete<ExportResponse>(
                `${this.baseURL}/exports/${exportId}`
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Resend export link via email
     */
    async resendExport(exportId: string, email: string) {
        try {
            const response = await axios.post<ExportResponse>(
                `${this.baseURL}/exports/${exportId}/resend`,
                { email }
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

export default new ExportService();
