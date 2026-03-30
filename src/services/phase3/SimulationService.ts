/**
 * Simulation Service
 * File: frontend/src/services/phase3/SimulationService.ts
 */

import axios from 'axios';

interface SimulationConfig {
    scenario: 'baseline' | 'what_if' | 'stress_test' | 'optimization' | 'fairness_improvement';
    parameters?: Record<string, unknown>;
    variables_modified?: Array<{
        variable_name: string;
        modified_value: unknown;
        reason?: string;
    }>;
}

interface SimulationResponse {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
}

class SimulationService {
    private baseURL = '/api/phase3';

    /**
     * Create new simulation
     */
    async createSimulation(
        allocationId: string,
        config: SimulationConfig
    ) {
        try {
            const response = await axios.post<SimulationResponse>(
                `${this.baseURL}/simulations`,
                {
                    allocation_id: allocationId,
                    ...config
                }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Get simulations for allocation
     */
    async getSimulations(allocationId: string) {
        try {
            const response = await axios.get<SimulationResponse>(
                `${this.baseURL}/simulations/${allocationId}`
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Get simulation details
     */
    async getSimulationDetail(simulationId: string) {
        try {
            const response = await axios.get<SimulationResponse>(
                `${this.baseURL}/simulations/detail/${simulationId}`
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Approve simulation
     */
    async approveSimulation(simulationId: string, notes?: string) {
        try {
            const response = await axios.post<SimulationResponse>(
                `${this.baseURL}/simulations/${simulationId}/approve`,
                { approval_notes: notes }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Implement simulation
     */
    async implementSimulation(simulationId: string) {
        try {
            const response = await axios.post<SimulationResponse>(
                `${this.baseURL}/simulations/${simulationId}/implement`,
                {}
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Cancel simulation
     */
    async cancelSimulation(simulationId: string) {
        try {
            const response = await axios.delete<SimulationResponse>(
                `${this.baseURL}/simulations/${simulationId}`
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

export default new SimulationService();
