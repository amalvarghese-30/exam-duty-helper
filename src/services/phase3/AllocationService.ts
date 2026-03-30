/**
 * Phase 3 API Integration Layer
 * Service classes for frontend API calls
 * File: frontend/src/services/phase3/AllocationService.ts
 */

import axios, { AxiosError } from 'axios';

interface CreateAllocationRequest {
    exam_id: string;
    policies?: Record<string, unknown>;
    use_optimization?: boolean;
    fairness_weight?: number;
}

interface AllocationResponse {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
}

class AllocationService {
    private baseURL = '/api/phase3';

    /**
     * Get all allocations for an exam
     */
    async getAllocations(examId?: string) {
        try {
            const params = examId ? { exam_id: examId } : {};
            const response = await axios.get<AllocationResponse>(
                `${this.baseURL}/allocations`,
                { params }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Get allocation by ID
     */
    async getAllocationById(allocationId: string) {
        try {
            const response = await axios.get<AllocationResponse>(
                `${this.baseURL}/allocations/${allocationId}`
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Create new allocation
     */
    async createAllocation(request: CreateAllocationRequest) {
        try {
            const response = await axios.post<AllocationResponse>(
                `${this.baseURL}/allocations`,
                request
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Update allocation
     */
    async updateAllocation(allocationId: string, updates: Record<string, unknown>) {
        try {
            const response = await axios.put<AllocationResponse>(
                `${this.baseURL}/allocations/${allocationId}`,
                updates
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Approve allocation
     */
    async approveAllocation(allocationId: string, reason?: string) {
        try {
            const response = await axios.post<AllocationResponse>(
                `${this.baseURL}/allocations/${allocationId}/approve`,
                { approval_reason: reason }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Reject allocation
     */
    async rejectAllocation(allocationId: string, reason: string) {
        try {
            const response = await axios.post<AllocationResponse>(
                `${this.baseURL}/allocations/${allocationId}/reject`,
                { rejection_reason: reason }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Finalize allocation
     */
    async finalizeAllocation(allocationId: string) {
        try {
            const response = await axios.post<AllocationResponse>(
                `${this.baseURL}/allocations/${allocationId}/finalize`,
                {}
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Delete allocation
     */
    async deleteAllocation(allocationId: string) {
        try {
            const response = await axios.delete<AllocationResponse>(
                `${this.baseURL}/allocations/${allocationId}`
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Validate allocation
     */
    async validateAllocation(allocationId: string) {
        try {
            const response = await axios.post<AllocationResponse>(
                `${this.baseURL}/allocations/${allocationId}/validate`,
                {}
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    private handleError(error: unknown) {
        const axiosError = error as AxiosError;
        return {
            success: false,
            error: axiosError?.message || 'An error occurred',
            data: axiosError?.response?.data
        };
    }
}

export default new AllocationService();
