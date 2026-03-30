import axios, { AxiosInstance } from 'axios';

/**
 * Phase2 Connector Service
 * Bridge between Node.js backend and Python scheduling engine (Phase 2)
 * Handles communication with Python modules for optimization, fairness analysis, and swaps
 */

export interface AllocationInput {
    allocation_id: string;
    exams: Array<{
        _id: string;
        code: string;
        name: string;
        date: Date;
        start_time: string;
        duration: number;
        capacity: number;
    }>;
    teachers: Array<{
        _id: string;
        name: string;
        department: string;
        experience_level: 'junior' | 'senior' | 'lead';
        availability: {
            on_leave: boolean;
            leave_from?: Date;
            leave_to?: Date;
            unavailable_slots?: Array<{ from: Date; to: Date }>;
        };
    }>;
    constraints: {
        max_daily_duties?: number;
        max_weekly_duties?: number;
        min_gap_hours?: number;
        cross_department_eligible?: boolean;
    };
}

export interface OptimizationResult {
    allocation: Array<{
        exam_id: string;
        teacher_id: string;
        score: number;
        conflicts: string[];
    }>;
    fairness_metrics: {
        fairness_score: number;
        workload_distribution: { [key: string]: number };
        department_fairness: { [key: string]: number };
        overloaded_teachers: string[];
        underloaded_teachers: string[];
    };
    optimization_stats: {
        hard_constraints_satisfied: boolean;
        soft_constraints_violated: number;
        optimization_time_ms: number;
        solution_quality: number;
    };
}

export interface SwapRecommendation {
    duty_id: string;
    current_teacher_id: string;
    suggested_teacher_id: string;
    swap_score: number;
    fairness_improvement: number;
    workload_impact: number;
    reason: string;
}

export interface FairnessAnalysis {
    fairness_score: number;
    workload_stats: {
        min_duties: number;
        max_duties: number;
        avg_duties: number;
        distribution: Array<{ range: string; count: number }>;
    };
    department_stats: {
        [key: string]: {
            fairness_score: number;
            avg_duties_per_teacher: number;
            overload_risk: 'low' | 'medium' | 'high';
        };
    };
    problematic_allocations: Array<{
        teacher_id: string;
        issue: string;
        severity: 'low' | 'medium' | 'high';
    }>;
}

export interface ReschedulingResult {
    success: boolean;
    new_allocation: Array<{
        allocation_id: string;
        exam_id: string;
        teacher_id: string;
    }>;
    affected_teachers: string[];
    fairness_delta: number;
    reschedule_reason: string;
}

export interface GeminiReviewResult {
    review: {
        is_fair: boolean;
        fairness_score: number;
        concerns: string[];
        recommendations: string[];
        factors_analysis: Array<{
            factor: string;
            assessment: string;
            impact: 'positive' | 'negative' | 'neutral';
        }>;
    };
    confidence_score: number;
}

class Phase2Connector {
    private pythonApiClient: AxiosInstance;
    private pythonEngineBaseUrl: string;
    private timeout: number = 60000; // 60 second timeout

    constructor(pythonEngineBaseUrl: string = 'http://localhost:5000') {
        this.pythonEngineBaseUrl = pythonEngineBaseUrl;
        this.pythonApiClient = axios.create({
            baseURL: pythonEngineBaseUrl,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Run optimization algorithm (OR-Tools CP-SAT)
     */
    async runOptimization(input: AllocationInput): Promise<OptimizationResult> {
        try {
            const response = await this.pythonApiClient.post('/api/optimize', {
                allocation_id: input.allocation_id,
                exams: input.exams,
                teachers: input.teachers,
                constraints: input.constraints,
                time_limit_seconds: 60
            });

            return response.data.data || response.data;
        } catch (error) {
            console.error('Phase 2 Optimization failed:', error);
            throw new Error(
                `Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Get fairness analysis for an allocation
     */
    async analyzeFairness(allocationId: string): Promise<FairnessAnalysis> {
        try {
            const response = await this.pythonApiClient.get(
                `/api/fairness/${allocationId}`
            );

            return response.data.data || response.data;
        } catch (error) {
            console.error('Phase 2 Fairness analysis failed:', error);
            throw new Error(
                `Fairness analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Generate swap recommendations
     */
    async getSwapRecommendations(
        allocationId: string,
        limit: number = 15
    ): Promise<SwapRecommendation[]> {
        try {
            const response = await this.pythonApiClient.get(
                `/api/swaps/${allocationId}`,
                { params: { limit } }
            );

            return response.data.data || response.data;
        } catch (error) {
            console.error('Phase 2 Swap recommendations failed:', error);
            throw new Error(
                `Swap recommendations failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Apply a single swap
     */
    async applySwap(
        allocationId: string,
        dutyId: string,
        newTeacherId: string
    ): Promise<{ success: boolean; fairness_delta: number }> {
        try {
            const response = await this.pythonApiClient.post(
                `/api/swaps/${allocationId}/apply`,
                {
                    duty_id: dutyId,
                    new_teacher_id: newTeacherId
                }
            );

            return response.data.data || response.data;
        } catch (error) {
            console.error('Phase 2 Swap apply failed:', error);
            throw new Error(
                `Swap apply failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Apply multiple swaps in batch
     */
    async applyBatchSwaps(
        allocationId: string,
        swaps: Array<{ duty_id: string; new_teacher_id: string }>
    ): Promise<{ success: boolean; totalFairnessImprovement: number }> {
        try {
            const response = await this.pythonApiClient.post(
                `/api/swaps/${allocationId}/batch-apply`,
                { swaps }
            );

            return response.data.data || response.data;
        } catch (error) {
            console.error('Phase 2 Batch swap failed:', error);
            throw new Error(
                `Batch swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Emergency rescheduling (handle unavailable teacher)
     */
    async rescheduleEmergency(
        allocationId: string,
        unavailableTeacherId: string,
        affectedDuties: string[]
    ): Promise<ReschedulingResult> {
        try {
            const response = await this.pythonApiClient.post(
                `/api/emergency/reschedule`,
                {
                    allocation_id: allocationId,
                    unavailable_teacher_id: unavailableTeacherId,
                    affected_duties: affectedDuties,
                    time_limit_seconds: 30
                }
            );

            return response.data.data || response.data;
        } catch (error) {
            console.error('Phase 2 Emergency reschedule failed:', error);
            throw new Error(
                `Emergency reschedule failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Find replacement teachers for emergency
     */
    async findReplacements(
        allocationId: string,
        unavailableTeacherId: string,
        dutyIds: string[]
    ): Promise<
        Array<{
            duty_id: string;
            suggestions: Array<{
                teacher_id: string;
                teacher_name: string;
                qualification_match: number;
                workload_delta: number;
            }>;
        }>
    > {
        try {
            const response = await this.pythonApiClient.post(
                `/api/emergency/find-replacements`,
                {
                    allocation_id: allocationId,
                    unavailable_teacher_id: unavailableTeacherId,
                    duty_ids: dutyIds
                }
            );

            return response.data.data || response.data;
        } catch (error) {
            console.error('Phase 2 Find replacements failed:', error);
            throw new Error(
                `Find replacements failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Get Gemini AI fairness review
     */
    async getGeminiReview(allocationId: string): Promise<GeminiReviewResult> {
        try {
            const response = await this.pythonApiClient.get(
                `/api/gemini/review/${allocationId}`
            );

            return response.data.data || response.data;
        } catch (error) {
            console.error('Phase 2 Gemini review failed:', error);
            throw new Error(
                `Gemini review failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Explain allocation allocation (why was this teacher assigned)
     */
    async explainAllocation(
        allocationId: string,
        teacherId: string
    ): Promise<{
        fairness_score: number;
        factors: Array<{
            name: string;
            contribution: number;
            description: string;
        }>;
        assigned_duties: Array<{
            exam_id: string;
            exam_name: string;
            date: Date;
            start_time: string;
            duration: number;
        }>;
        similar_teachers: Array<{
            teacher_id: string;
            name: string;
            duties: number;
            fairness_score: number;
        }>;
    }> {
        try {
            const response = await this.pythonApiClient.get(
                `/api/explain/${allocationId}/${teacherId}`
            );

            return response.data.data || response.data;
        } catch (error) {
            console.error('Phase 2 Explain allocation failed:', error);
            throw new Error(
                `Explain allocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Health check to verify connection
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.pythonApiClient.get('/api/health');
            return response.status === 200;
        } catch (error) {
            console.error('Phase 2 health check failed:', error);
            return false;
        }
    }

    /**
     * Set a new base URL for the Python engine (useful for environment-specific changes)
     */
    setBaseUrl(newUrl: string): void {
        this.pythonEngineBaseUrl = newUrl;
        this.pythonApiClient = axios.create({
            baseURL: newUrl,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}

// Export singleton instance
export const phase2Connector = new Phase2Connector(
    process.env.PHASE2_API_BASE_URL || 'http://localhost:5000'
);

export default Phase2Connector;
