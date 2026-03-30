const mongoose = require('mongoose');
const { AllocationHistory } = require('../models/AllocationAudit');
const { phase2Connector } = require('../services/Phase2Connector');

/**
 * SwapRecommendationsController - Handles duty swap recommendations
 * Generates and applies swaps to improve fairness
 */

/**
 * GET /api/phase3/swaps/:allocation_id
 * Get swap recommendations for an allocation
 */
exports.getSwapRecommendations = async (req, res) => {
    try {
        const { allocation_id } = req.params;
        const { limit = 15, filter_by = 'priority' } = req.query;

        // Fetch allocation from MongoDB
        // const allocation = await AllocationModel.findById(allocation_id);

        // Mock allocation data for now
        const mockAllocation = {
            _id: allocation_id,
            duties: [
                { teacher_id: 't1', exam_id: 'e1' },
                { teacher_id: 't2', exam_id: 'e2' },
                { teacher_id: 't1', exam_id: 'e3' }
            ],
            teachers: [
                { _id: 't1', name: 'Dr. Smith', department: 'CS' },
                { _id: 't2', name: 'Dr. Jones', department: 'Math' }
            ]
        };

        // Call Phase 2 to get swap recommendations
        const swapResult = await phase2Connector.findSwaps(mockAllocation, {
            limit: parseInt(limit) || 15,
            min_improvement: 1.0
        });

        // Filter by priority if requested
        const swaps = swapResult.swaps || [];
        let filtered = swaps;

        if (filter_by === 'priority') {
            filtered = swaps.sort((a, b) => b.swap_score - a.swap_score);
        } else if (filter_by === 'fairness') {
            filtered = swaps.sort(
                (a, b) => b.fairness_improvement - a.fairness_improvement
            );
        } else if (filter_by === 'impact') {
            filtered = swaps.sort((a, b) => b.workload_impact - a.workload_impact);
        }

        // Build response with properly formatted swap data
        const formattedSwaps = (filtered.slice(0, limit) || []).map((swap) => ({
            swap_id: swap.swap_id || `swap_${Math.random().toString(36).substr(2, 9)}`,
            duty_id: swap.duty_id || 'duty_1',
            current_teacher_id: swap.current_teacher_id || 't1',
            current_teacher_name: swap.current_teacher_name || 'Dr. Smith',
            suggested_teacher_id: swap.suggested_teacher_id || 't2',
            suggested_teacher_name: swap.suggested_teacher_name || 'Dr. Jones',
            exam_id: swap.exam_id || 'e1',
            exam_name: swap.exam_name || 'Data Structures',
            swap_score: swap.swap_score || 85,
            fairness_improvement: swap.fairness_improvement || 5.2,
            workload_delta: swap.workload_delta || -1,
            reason: swap.reason || 'Improves fairness and workload balance'
        }));

        res.json({
            success: true,
            data: {
                allocation_id,
                swaps: formattedSwaps,
                total_swaps_suggested: formattedSwaps.length,
                total_potential_improvement: swapResult.total_potential_improvement || 22.5,
                execution_time_ms: swapResult.execution_time_ms || 240,
                filter_applied: filter_by
            }
        });
    } catch (error) {
        console.error('Get swap recommendations error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/phase3/swaps/:allocation_id/:swap_id/apply
 * Apply a single swap recommendation
 */
exports.applySingleSwap = async (req, res) => {
    try {
        const { allocation_id, swap_id } = req.params;
        const { reason = 'Applied swap recommendation' } = req.body;

        // Fetch allocation
        // const allocation = await AllocationModel.findById(allocation_id);

        // Mock allocation
        const mockAllocation = { _id: allocation_id, duties: [] };

        // Call Phase 2 to apply swap
        // Returns new allocation with swap applied
        const swapResult = await phase2Connector.applySwap(
            mockAllocation,
            swap_id,
            'new_teacher_id'
        );

        // Create history entry for audit trail
        const historyEntry = new AllocationHistory({
            allocation_id: new mongoose.Types.ObjectId(allocation_id),
            institution_id: new mongoose.Types.ObjectId('default_institution'),
            change_type: 'manual_swap',
            change_details: {
                swap_details: {
                    exam_id: 'exam_from_swap',
                    teacher_from_id: 'old_teacher_id',
                    teacher_to_id: 'new_teacher_id',
                    swap_reason: reason
                }
            },
            impact: {
                fairness_delta: swapResult.fairness_delta || 5,
                workload_delta: swapResult.workload_delta || 0,
                constraint_violations_before: 0,
                constraint_violations_after: 0,
                affected_teachers_count: 2,
                affected_exams_count: 1
            },
            changed_by: req.user?.id || new mongoose.Types.ObjectId(),
            user_role: 'admin',
            reason: reason,
            approval_status: 'not_required'
        });

        await historyEntry.save();

        res.json({
            success: true,
            message: 'Swap applied successfully',
            data: {
                swap_id,
                allocation_id,
                new_allocation: swapResult.new_allocation || [],
                new_fairness_score: 80,
                improvement_percent: swapResult.fairness_delta || 5.2,
                applied_at: new Date()
            }
        });
    } catch (error) {
        console.error('Apply single swap error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/phase3/swaps/:allocation_id/batch-apply
 * Apply multiple swaps in optimal order
 */
exports.applyBatchSwaps = async (req, res) => {
    try {
        const { allocation_id } = req.params;
        const { swap_ids = [], reason = 'Batch swap application' } = req.body;

        if (!Array.isArray(swap_ids) || swap_ids.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'swap_ids must be a non-empty array'
            });
        }

        // Fetch allocation
        // const allocation = await AllocationModel.findById(allocation_id);

        // Mock allocation
        const mockAllocation = { _id: allocation_id, duties: [] };

        // Apply each swap in sequence
        // TODO: In production, handle failures and rollback
        let totalImprovement = 0;
        const appliedSwaps = [];

        for (const swapId of swap_ids) {
            try {
                const result = await phase2Connector.applySwap(
                    mockAllocation,
                    swapId,
                    'new_teacher_id'
                );
                totalImprovement += result.fairness_delta || 0;
                appliedSwaps.push(swapId);
            } catch (error) {
                console.warn(`Failed to apply swap ${swapId}:`, error.message);
                // Continue with next swap
            }
        }

        // Create history entry
        const historyEntry = new AllocationHistory({
            allocation_id: new mongoose.Types.ObjectId(allocation_id),
            institution_id: new mongoose.Types.ObjectId('default_institution'),
            change_type: 'automatic_swap',
            change_details: {
                swap_details: {
                    swaps_applied: appliedSwaps,
                    swap_reason: reason
                }
            },
            impact: {
                fairness_delta: totalImprovement,
                workload_delta: 0,
                constraint_violations_before: 0,
                constraint_violations_after: 0,
                affected_teachers_count: appliedSwaps.length * 2,
                affected_exams_count: appliedSwaps.length
            },
            changed_by: req.user?.id || new mongoose.Types.ObjectId(),
            user_role: 'admin',
            reason: reason,
            approval_status: 'not_required'
        });

        await historyEntry.save();

        res.json({
            success: true,
            message: `Applied ${appliedSwaps.length} swaps successfully`,
            data: {
                allocation_id,
                applied_count: appliedSwaps.length,
                failed_count: swap_ids.length - appliedSwaps.length,
                total_improvement: Math.round(totalImprovement * 100) / 100,
                applied_swaps: appliedSwaps,
                applied_at: new Date()
            }
        });
    } catch (error) {
        console.error('Apply batch swaps error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/phase3/swaps/:allocation_id/history
 * Get history of swap applications
 */
exports.getSwapHistory = async (req, res) => {
    try {
        const { allocation_id } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        // Query AllocationHistory for swaps
        const swapHistory = await AllocationHistory.find({
            allocation_id: new mongoose.Types.ObjectId(allocation_id),
            change_type: { $in: ['manual_swap', 'automatic_swap'] }
        })
            .sort({ createdAt: -1 })
            .skip(parseInt(offset))
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: swapHistory
        });
    } catch (error) {
        console.error('Get swap history error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/phase3/swaps/:allocation_id/validate
 * Validate a proposed swap before applying
 */
exports.validateSwap = async (req, res) => {
    try {
        const { allocation_id } = req.params;
        const { duty_id, new_teacher_id } = req.body;

        if (!duty_id || !new_teacher_id) {
            return res.status(400).json({
                success: false,
                error: 'duty_id and new_teacher_id are required'
            });
        }

        // TODO: Check constraints:
        // 1. New teacher has capacity
        // 2. No scheduling conflicts
        // 3. Qualifications match
        // 4. Doesn't violate policies

        const validation = {
            is_valid: true,
            violations: [],
            warnings: [],
            potential_improvements: {
                fairness_delta: 5.2,
                workload_delta: 0,
                quality_delta: 0
            }
        };

        res.json({
            success: true,
            data: validation
        });
    } catch (error) {
        console.error('Validate swap error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
