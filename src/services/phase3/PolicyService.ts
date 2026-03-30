/**
 * Policy Editor Service
 * File: frontend/src/services/phase3/PolicyService.ts
 */

import axios from 'axios';

interface PolicyRequest {
    policy_name: string;
    description?: string;
    policy_type: 'fairness' | 'availability' | 'emergency' | 'load_balance' | 'custom';
    rules?: Array<Record<string, unknown>>;
    parameters?: Record<string, unknown>;
}

interface PolicyResponse {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
}

class PolicyService {
    private baseURL = '/api/phase3';

    /**
     * List all policies
     */
    async listPolicies() {
        try {
            const response = await axios.get<PolicyResponse>(
                `${this.baseURL}/policies`
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Create new policy
     */
    async createPolicy(request: PolicyRequest) {
        try {
            const response = await axios.post<PolicyResponse>(
                `${this.baseURL}/policies`,
                request
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Get policy by ID
     */
    async getPolicyById(policyId: string) {
        try {
            const response = await axios.get<PolicyResponse>(
                `${this.baseURL}/policies/${policyId}`
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Update policy
     */
    async updatePolicy(policyId: string, updates: Partial<PolicyRequest>) {
        try {
            const response = await axios.put<PolicyResponse>(
                `${this.baseURL}/policies/${policyId}`,
                updates
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Delete policy
     */
    async deletePolicy(policyId: string) {
        try {
            const response = await axios.delete<PolicyResponse>(
                `${this.baseURL}/policies/${policyId}`
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Toggle policy active/inactive
     */
    async togglePolicy(policyId: string) {
        try {
            const response = await axios.post<PolicyResponse>(
                `${this.baseURL}/policies/${policyId}/toggle`,
                {}
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Validate policy
     */
    async validatePolicy(policyId: string) {
        try {
            const response = await axios.post<PolicyResponse>(
                `${this.baseURL}/policies/${policyId}/validate`,
                {}
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Test policy against allocation
     */
    async testPolicy(policyId: string, allocationId: string) {
        try {
            const response = await axios.post<PolicyResponse>(
                `${this.baseURL}/policies/${policyId}/test`,
                { allocation_id: allocationId }
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

export default new PolicyService();
