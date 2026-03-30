/**
 * Emergency Handler Service
 * File: frontend/src/services/phase3/EmergencyService.ts
 */

import axios from 'axios';

interface EmergencyRequest {
    allocation_id: string;
    incident_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affected_teacher_id?: string;
    reported_by?: string;
}

interface RespondToEmergencyRequest {
    incident_id: string;
    option_id: string;
    implementation_notes?: string;
}

interface EmergencyResponse {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
}

class EmergencyService {
    private baseURL = '/api/phase3';

    /**
     * Report emergency incident
     */
    async reportEmergency(request: EmergencyRequest) {
        try {
            const response = await axios.post<EmergencyResponse>(
                `${this.baseURL}/emergencies`,
                request
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Get emergency incidents for allocation
     */
    async getEmergencies(allocationId: string) {
        try {
            const response = await axios.get<EmergencyResponse>(
                `${this.baseURL}/emergencies/${allocationId}`
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Get emergency incident details
     */
    async getEmergencyDetail(incidentId: string) {
        try {
            const response = await axios.get<EmergencyResponse>(
                `${this.baseURL}/emergencies/detail/${incidentId}`
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Get response options for emergency
     */
    async getEmergencySolutions(incidentId: string) {
        try {
            const response = await axios.post<EmergencyResponse>(
                `${this.baseURL}/emergencies/${incidentId}/solutions`,
                {}
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Execute emergency response
     */
    async respondToEmergency(request: RespondToEmergencyRequest) {
        try {
            const response = await axios.post<EmergencyResponse>(
                `${this.baseURL}/emergencies/${request.incident_id}/respond`,
                {
                    option_id: request.option_id,
                    implementation_notes: request.implementation_notes
                }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Rollback emergency response
     */
    async rollbackEmergency(incidentId: string, reason?: string) {
        try {
            const response = await axios.post<EmergencyResponse>(
                `${this.baseURL}/emergencies/${incidentId}/rollback`,
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

export default new EmergencyService();
