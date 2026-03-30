/**
 * Teacher Explanation Service
 * File: frontend/src/services/phase3/ExplanationService.ts
 */

import axios from 'axios';

interface ExplanationRequest {
    allocation_id: string;
    teacher_id: string;
    question_type: string;
    question_text: string;
    requested_format?: 'text' | 'structured' | 'visual' | 'detailed';
}

interface FeedbackRequest {
    request_id: string;
    rating: number;
    clarity_rating: number;
    helpfulness_rating: number;
    comments?: string;
    satisfied: boolean;
}

interface FollowUpRequest {
    request_id: string;
    follow_up_text: string;
}

interface ExplanationResponse {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
}

class ExplanationService {
    private baseURL = '/api/phase3';

    /**
     * Request allocation explanation
     */
    async requestExplanation(request: ExplanationRequest) {
        try {
            const response = await axios.post<ExplanationResponse>(
                `${this.baseURL}/explanations`,
                request
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Get explanations for allocation
     */
    async getAllocationExplanations(allocationId: string) {
        try {
            const response = await axios.get<ExplanationResponse>(
                `${this.baseURL}/explanations/${allocationId}`
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Get explanation request details
     */
    async getExplanationDetail(requestId: string) {
        try {
            const response = await axios.get<ExplanationResponse>(
                `${this.baseURL}/explanations/request/${requestId}`
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Submit feedback on explanation
     */
    async submitExplanationFeedback(feedback: FeedbackRequest) {
        try {
            const response = await axios.post<ExplanationResponse>(
                `${this.baseURL}/explanations/${feedback.request_id}/feedback`,
                {
                    rating: feedback.rating,
                    clarity_rating: feedback.clarity_rating,
                    helpfulness_rating: feedback.helpfulness_rating,
                    comments: feedback.comments,
                    satisfied: feedback.satisfied
                }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Ask follow-up question
     */
    async askFollowUpQuestion(followUp: FollowUpRequest) {
        try {
            const response = await axios.post<ExplanationResponse>(
                `${this.baseURL}/explanations/${followUp.request_id}/followup`,
                {
                    follow_up_text: followUp.follow_up_text
                }
            );
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Get explanation template
     */
    async getExplanationTemplate(questionType: string) {
        try {
            const response = await axios.get<ExplanationResponse>(
                `${this.baseURL}/explanations/template/${questionType}`
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

export default new ExplanationService();
