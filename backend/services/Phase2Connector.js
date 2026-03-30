const axios = require('axios');

/**
 * Phase 2 Connector Service (Node.js Backend)
 * Bridges Node.js backend with Python scheduling engine
 * Handles HTTP communication with Python Flask API
 */

class Phase2Connector {
    constructor(pythonEngineUrl = process.env.PHASE2_API_URL || 'http://localhost:5000') {
        this.pythonEngineUrl = pythonEngineUrl;
        this.client = axios.create({
            baseURL: pythonEngineUrl,
            timeout: 60000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`Phase 2 Connector initialized with URL: ${this.pythonEngineUrl}`);
    }

    /**
     * Check if Python engine is healthy
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/api/health');
            return response.status === 200;
        } catch (error) {
            console.error('Phase 2 health check failed:', error.message);
            return false;
        }
    }

    /**
     * Run allocation optimization using Phase 2 engine
     */
    async runOptimization(inputData, options = {}) {
        try {
            console.log('Calling Phase 2 optimizer...');

            const response = await this.client.post('/api/optimize', {
                allocation_input: inputData,
                use_cp_sat: options.use_optimization !== false,
                time_limit_seconds: options.time_limit_seconds || 60,
                random_seed: options.random_seed || null
            });

            return {
                success: true,
                allocation: response.data.allocation || [],
                fairness_metrics: response.data.fairness_metrics || {},
                optimization_stats: response.data.stats || {},
                execution_time_ms: response.data.execution_time_ms || 0
            };
        } catch (error) {
            console.error('Phase 2 optimization failed:', error.message);
            throw new Error(
                `Optimization failed: ${error.response?.data?.error || error.message}`
            );
        }
    }

    /**
     * Analyze fairness of an allocation
     */
    async analyzeFairness(allocationData) {
        try {
            console.log('Calling Phase 2 fairness analyzer...');

            const response = await this.client.post('/api/analyze-fairness', {
                allocation: allocationData
            });

            return {
                success: true,
                fairness_score: response.data.fairness_score || 0,
                workload_stats: response.data.workload_stats || {},
                department_analysis: response.data.department_analysis || {},
                problem_areas: response.data.problem_areas || []
            };
        } catch (error) {
            console.error('Phase 2 fairness analysis failed:', error.message);
            throw new Error(
                `Fairness analysis failed: ${error.response?.data?.error || error.message}`
            );
        }
    }

    /**
     * Generate swap recommendations
     */
    async findSwaps(allocationData, options = {}) {
        try {
            console.log('Calling Phase 2 swap engine...');

            const response = await this.client.post('/api/find-swaps', {
                allocation: allocationData,
                max_suggestions: options.limit || 15,
                min_improvement_threshold: options.min_improvement || 1.0
            });

            return {
                success: true,
                swaps: response.data.swaps || [],
                total_potential_improvement: response.data.total_improvement || 0,
                execution_time_ms: response.data.execution_time_ms || 0
            };
        } catch (error) {
            console.error('Phase 2 swap finding failed:', error.message);
            throw new Error(
                `Swap finding failed: ${error.response?.data?.error || error.message}`
            );
        }
    }

    /**
     * Apply a single swap
     */
    async applySwap(allocationData, dutyId, newTeacherId) {
        try {
            console.log(`Applying swap for duty ${dutyId}`);

            const response = await this.client.post('/api/apply-swap', {
                allocation: allocationData,
                duty_id: dutyId,
                new_teacher_id: newTeacherId
            });

            return {
                success: true,
                new_allocation: response.data.new_allocation || [],
                fairness_delta: response.data.fairness_delta || 0,
                workload_delta: response.data.workload_delta || 0
            };
        } catch (error) {
            console.error('Phase 2 swap apply failed:', error.message);
            throw new Error(
                `Swap apply failed: ${error.response?.data?.error || error.message}`
            );
        }
    }

    /**
     * Handle emergency reschedule
     */
    async handleEmergency(allocationData, unavailableTeacherId, affectedDuties) {
        try {
            console.log(`Handling emergency for teacher ${unavailableTeacherId}`);

            const response = await this.client.post('/api/emergency-reschedule', {
                allocation: allocationData,
                unavailable_teacher_id: unavailableTeacherId,
                affected_duties: affectedDuties,
                time_limit_seconds: 30
            });

            return {
                success: true,
                new_allocation: response.data.new_allocation || [],
                replacements: response.data.replacements || {},
                fairness_delta: response.data.fairness_delta || 0
            };
        } catch (error) {
            console.error('Phase 2 emergency handling failed:', error.message);
            throw new Error(
                `Emergency handling failed: ${error.response?.data?.error || error.message}`
            );
        }
    }

    /**
     * Find replacement options for emergency
     */
    async findReplacements(allocationData, unavailableTeacherId, dutyIds) {
        try {
            console.log(`Finding replacements for teacher ${unavailableTeacherId}`);

            const response = await this.client.post('/api/find-replacements', {
                allocation: allocationData,
                unavailable_teacher_id: unavailableTeacherId,
                duty_ids: dutyIds
            });

            return {
                success: true,
                options: response.data.options || []
            };
        } catch (error) {
            console.error('Phase 2 replacement finding failed:', error.message);
            throw new Error(
                `Replacement finding failed: ${error.response?.data?.error || error.message}`
            );
        }
    }

    /**
     * Get Gemini AI fairness review
     */
    async getGeminiReview(allocationData, fairnessMetrics) {
        try {
            console.log('Calling Gemini fairness reviewer...');

            const response = await this.client.post('/api/gemini-review', {
                allocation: allocationData,
                fairness_metrics: fairnessMetrics
            });

            return {
                success: true,
                is_fair: response.data.is_fair || false,
                concerns: response.data.concerns || [],
                recommendations: response.data.recommendations || [],
                fairness_score: response.data.fairness_score || 0
            };
        } catch (error) {
            console.error('Phase 2 Gemini review failed:', error.message);
            // Don't throw - Gemini is optional
            return {
                success: false,
                message: 'Gemini review unavailable'
            };
        }
    }

    /**
     * Get explanation for teacher allocation
     */
    async explainAllocation(allocationData, teacherId) {
        try {
            console.log(`Getting explanation for teacher ${teacherId}`);

            const response = await this.client.post('/api/explain-allocation', {
                allocation: allocationData,
                teacher_id: teacherId
            });

            return {
                success: true,
                explanation: response.data.explanation || '',
                factors: response.data.factors || [],
                fairness_context: response.data.fairness_context || {}
            };
        } catch (error) {
            console.error('Phase 2 allocation explanation failed:', error.message);
            throw new Error(
                `Allocation explanation failed: ${error.response?.data?.error || error.message}`
            );
        }
    }

    /**
     * Set new base URL
     */
    setBaseUrl(newUrl) {
        this.pythonEngineUrl = newUrl;
        this.client = axios.create({
            baseURL: newUrl,
            timeout: 60000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}

// Create and export singleton
const phase2Connector = new Phase2Connector();

module.exports = {
    Phase2Connector,
    phase2Connector
};
