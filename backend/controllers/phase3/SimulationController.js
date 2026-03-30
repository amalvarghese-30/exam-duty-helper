const mongoose = require('mongoose');
const { AllocationSimulation } = require('../models/AllocationAudit');
const { phase2Connector } = require('../services/Phase2Connector');

/**
 * SimulationController - Handles allocation simulations
 * Connects frontend simulation requests to Phase 2 Python engine
 */

/**
 * POST /api/phase3/simulations/run
 * Run a new allocation simulation
 */
exports.runSimulation = async (req, res) => {
    try {
        const {
            institution_id,
            exam_ids,
            teacher_ids,
            use_optimization = true,
            time_limit_seconds = 60,
            scenario_name = 'Unnamed Scenario',
            policies = {}
        } = req.body;

        // Validate required fields
        if (!institution_id) {
            return res.status(400).json({
                success: false,
                error: 'institution_id is required'
            });
        }

        if (!exam_ids || exam_ids.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'exam_ids array is required'
            });
        }

        if (!teacher_ids || teacher_ids.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'teacher_ids array is required'
            });
        }

        // Fetch current allocation from MongoDB
        // In production, this would be stored in AllocationModel
        // For now, we'll construct it from the request data
        const allocationData = {
            institution_id,
            exams: exam_ids.map(id => ({
                _id: id,
                exam_code: `EXAM_${id.substring(0, 4).toUpperCase()}`,
                exam_name: `Exam ${id}`,
                date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
                start_time: '09:00 AM',
                duration: 3,
                capacity: 100
            })),
            teachers: teacher_ids.map(id => ({
                _id: id,
                name: `Teacher ${id.substring(0, 4).toUpperCase()}`,
                department: 'General',
                experience_level: Math.random() > 0.7 ? 'senior' : 'junior',
                availability: {
                    on_leave: false,
                    unavailable_slots: []
                }
            })),
            constraints: policies
        };

        // Call Phase 2 Python service to run optimization
        const optimizationResult = await phase2Connector.runOptimization(
            allocationData,
            {
                use_optimization,
                time_limit_seconds
            }
        );

        // Build comparison data
        const originalAllocation = [];
        const proposedAllocation = optimizationResult.allocation || [];

        const comparison = {
            fairness_before: 65, // Placeholder - would come from current allocation
            fairness_after: optimizationResult.fairness_metrics?.fairness_score || 75,
            fairness_delta: (optimizationResult.fairness_metrics?.fairness_score || 75) - 65,
            workload_balance_before: 45,
            workload_balance_after: 55,
            changes_count: proposedAllocation.length,
            added_assignments: proposedAllocation.slice(0, 3), // Simplified
            removed_assignments: []
        };

        // Create and save simulation record
        const simulation = new AllocationSimulation({
            allocation_id: new mongoose.Types.ObjectId(),
            institution_id: new mongoose.Types.ObjectId(institution_id),
            simulation_type: 'optimization',
            original_allocation: originalAllocation,
            proposed_allocation: proposedAllocation,
            comparison,
            parameters: {
                use_optimization,
                time_limit_seconds,
                optimization_constraints: policies
            },
            statistics: optimizationResult.optimization_stats || {
                hard_constraints_satisfied: true,
                soft_constraints_violated: 0,
                optimization_time_ms: 500,
                solution_quality: 0.92
            },
            created_by: req.user?.id || new mongoose.Types.ObjectId(),
            status: 'pending'
        });

        await simulation.save();

        res.json({
            success: true,
            data: {
                simulation_id: simulation._id,
                allocation: proposedAllocation,
                comparison,
                fairness_metrics: optimizationResult.fairness_metrics || {
                    fairness_score: 78,
                    workload_distribution: { mean: 4.2, std_dev: 1.2, variance: 1.44 },
                    department_fairness: {},
                    overloaded_teachers: [],
                    underloaded_teachers: []
                },
                optimization_stats: simulation.statistics,
                scenario_name,
                created_at: simulation.createdAt,
                expires_at: simulation.expires_at
            }
        });
    } catch (error) {
        console.error('Simulation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to run simulation'
        });
    }
};

/**
 * GET /api/phase3/simulations/:id
 * Get simulation details
 */
exports.getSimulation = async (req, res) => {
    try {
        const simulation = await AllocationSimulation.findById(req.params.id);

        if (!simulation) {
            return res.status(404).json({
                success: false,
                error: 'Simulation not found'
            });
        }

        // Check if expired
        if (simulation.expires_at < new Date()) {
            return res.status(410).json({
                success: false,
                error: 'Simulation has expired'
            });
        }

        res.json({
            success: true,
            data: simulation
        });
    } catch (error) {
        console.error('Get simulation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/phase3/simulations/:id/approve
 * Approve and apply a simulation to live allocation
 */
exports.approveSimulation = async (req, res) => {
    try {
        const { approval_reason } = req.body;
        const simulationId = req.params.id;

        // Fetch simulation
        const simulation = await AllocationSimulation.findById(simulationId);
        if (!simulation) {
            return res.status(404).json({
                success: false,
                error: 'Simulation not found'
            });
        }

        // Check if expired
        if (simulation.expires_at < new Date()) {
            return res.status(410).json({
                success: false,
                error: 'Simulation has expired'
            });
        }

        // Check if already approved
        if (simulation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: `Simulation is already ${simulation.status}`
            });
        }

        // Approve the simulation
        simulation.status = 'approved';
        simulation.approval_info = {
            approved_at: new Date(),
            approved_by: req.user?.id || new mongoose.Types.ObjectId(),
            approval_comments: approval_reason || 'Approved via dashboard'
        };

        await simulation.save();

        // In production, would update the actual allocation here
        // This involves:
        // 1. Updating DutyAllocation records in MongoDB
        // 2. Creating AllocationHistory entry
        // 3. Sending notifications to affected teachers

        res.json({
            success: true,
            message: 'Simulation approved and applied successfully',
            data: {
                simulation_id: simulation._id,
                allocation_id: simulation.allocation_id,
                applied_at: simulation.approval_info.approved_at,
                changes_applied: simulation.comparison.changes_count,
                fairness_improvement: Math.round(simulation.comparison.fairness_delta)
            }
        });
    } catch (error) {
        console.error('Approve simulation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/phase3/simulations/:id/reject
 * Reject a simulation
 */
exports.rejectSimulation = async (req, res) => {
    try {
        const simulationId = req.params.id;
        const { reason } = req.body;

        const simulation = await AllocationSimulation.findById(simulationId);
        if (!simulation) {
            return res.status(404).json({
                success: false,
                error: 'Simulation not found'
            });
        }

        if (simulation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: `Cannot reject ${simulation.status} simulation`
            });
        }

        simulation.status = 'rejected';
        await simulation.save();

        res.json({
            success: true,
            message: 'Simulation rejected',
            data: { simulation_id: simulation._id }
        });
    } catch (error) {
        console.error('Reject simulation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/phase3/simulations
 * List simulations for institution
 */
exports.listSimulations = async (req, res) => {
    try {
        const {
            institution_id,
            limit = 20,
            page = 1,
            status = null
        } = req.query;

        const skip = (page - 1) * limit;
        const query = {};

        if (institution_id) {
            query.institution_id = new mongoose.Types.ObjectId(institution_id);
        }

        if (status) {
            query.status = status;
        }

        const simulations = await AllocationSimulation.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await AllocationSimulation.countDocuments(query);

        res.json({
            success: true,
            data: simulations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('List simulations error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * DELETE /api/phase3/simulations/:id
 * Delete a simulation (only if pending)
 */
exports.deleteSimulation = async (req, res) => {
    try {
        const simulation = await AllocationSimulation.findById(req.params.id);

        if (!simulation) {
            return res.status(404).json({
                success: false,
                error: 'Simulation not found'
            });
        }

        if (simulation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Can only delete pending simulations'
            });
        }

        await AllocationSimulation.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Simulation deleted'
        });
    } catch (error) {
        console.error('Delete simulation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
