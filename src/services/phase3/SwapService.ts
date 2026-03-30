/**
 * Swap Recommendations Service
 * File: frontend/src/services/phase3/SwapService.ts
 */

import axios from 'axios';

interface SwapRequest {
    teacher1_id: string;
    teacher2_id: string;
    duty1_id: string;
    duty2_id: string;
    reason: string;
}

interface SwapResponse {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
}

class SwapService {
    private baseURL = '/api/phase3';

    /**
     * Get swap recommendations
     */
    async getSwapRecommendations(
        allocationId: string,
        options?: Record<string, unknown>
    ) {
        try {
            const response = await axios.post<SwapResponse>(
                `${this.baseURL}/swaps/recommendations`,
                {
                    allocation_id: allocationId,
                    ...options
                }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Create swap request
     */
    async createSwap(request: SwapRequest) {
        try {
            const response = await axios.post<SwapResponse>(
                `${this.baseURL}/swaps`,
                request
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Get pending swaps for allocation
     */
    async getPendingSwaps(allocationId: string) {
        try {
            const response = await axios.get<SwapResponse>(
                `${this.baseURL}/swaps/${allocationId}`
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Get swap transaction details
     */
    async getSwapDetail(swapId: string) {
        try {
            const response = await axios.get<SwapResponse>(
                `${this.baseURL}/swaps/detail/${swapId}`
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Approve swap
     */
    async approveSwap(swapId: string, notes?: string) {
        try {
            const response = await axios.post<SwapResponse>(
                `${this.baseURL}/swaps/${swapId}/approve`,
                { approval_notes: notes }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Reject swap
     */
    async rejectSwap(swapId: string, reason: string) {
        try {
            const response = await axios.post<SwapResponse>(
                `${this.baseURL}/swaps/${swapId}/reject`,
                { rejection_reason: reason }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Execute swap
     */
    async executeSwap(swapId: string) {
        try {
            const response = await axios.post<SwapResponse>(
                `${this.baseURL}/swaps/${swapId}/execute`,
                {}
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Reverse swap
     */
    async reverseSwap(swapId: string, reason?: string) {
        try {
            const response = await axios.post<SwapResponse>(
                `${this.baseURL}/swaps/${swapId}/reverse`,
                { reason }
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

export default new SwapService();
