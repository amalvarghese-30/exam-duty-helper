/**
 * Fairness Analytics Service
 * File: frontend/src/services/phase3/FairnessService.ts
 */

import axios from 'axios';

interface FairnessMetrics {
    fairness_score: number;
    fairness_assessment: string;
    workload_stats: {
        mean: number;
        std_dev: number;
        variance: number;
        min: number;
        max: number;
        median: number;
    };
    department_stats: Record<string, unknown>;
}

interface FairnessResponse {
    success: boolean;
    data?: FairnessMetrics | Record<string, unknown>;
    error?: string;
}

class FairnessService {
    private baseURL = '/api/phase3';

    /**
     * Get fairness metrics for allocation
     */
    async getFairnessMetrics(allocationId: string) {
        try {
            const response = await axios.get<FairnessResponse>(
                `${this.baseURL}/allocations/${allocationId}/fairness`
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Run fairness analysis
     */
    async analyzeFairness(allocationId: string, options?: Record<string, unknown>) {
        try {
            const response = await axios.post<FairnessResponse>(
                `${this.baseURL}/allocations/${allocationId}/fairness/analyze`,
                options || {}
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Get fairness concerns
     */
    async getFairnessConcerns(allocationId: string) {
        try {
            const response = await axios.get<FairnessResponse>(
                `${this.baseURL}/allocations/${allocationId}/fairness/concerns`
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Generate fairness report
     */
    async generateFairnessReport(allocationId: string) {
        try {
            const response = await axios.get<FairnessResponse>(
                `${this.baseURL}/allocations/${allocationId}/fairness/report`
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Compare fairness between allocations
     */
    async compareFairness(allocation1: string, allocation2: string) {
        try {
            const response = await axios.post<FairnessResponse>(
                `${this.baseURL}/fairness/compare`,
                { allocation1, allocation2 }
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

export default new FairnessService();
