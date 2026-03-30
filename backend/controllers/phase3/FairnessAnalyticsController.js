const mongoose = require('mongoose');
const { phase2Connector } = require('../services/Phase2Connector');

/**
 * FairnessAnalyticsController - Handles fairness analysis endpoints
 * Computes and caches fairness metrics for allocations
 */

/**
 * GET /api/phase3/analytics/:allocation_id
 * Get comprehensive fairness analytics for an allocation
 */
exports.getAnalytics = async (req, res) => {
    try {
        const { allocation_id } = req.params;
        const { use_cache = true } = req.query;

        // TODO: In production, check cache first
        // const cached = await FairnessAnalyticsCache.findById(allocation_id);

        // For now, compute fresh
        // Fetch allocation data from MongoDB
        // const allocation = await AllocationModel.findById(allocation_id);

        // Mock allocation data
        const mockAllocation = {
            _id: allocation_id,
            duties: [
                { teacher_id: 't1', exam_id: 'e1', date: new Date() },
                { teacher_id: 't2', exam_id: 'e2', date: new Date() },
                { teacher_id: 't1', exam_id: 'e3', date: new Date() }
            ],
            teachers: [
                { _id: 't1', name: 'Dr. Smith', department: 'CS' },
                { _id: 't2', name: 'Dr. Jones', department: 'Math' }
            ]
        };

        // Call Python fairness analyzer
        const fairnessAnalysis = await phase2Connector.analyzeFairness(mockAllocation);

        const analytics = {
            fairness_score: fairnessAnalysis.fairness_score || 75,
            fairness_assessment: fairnessAnalysis.fairness_score >= 70 ? 'Good' : 'Fair',
            workload_stats: fairnessAnalysis.workload_stats || {
                min_duties: 2,
                max_duties: 7,
                mean: 4.2,
                std_dev: 1.2,
                variance: 1.44,
                median: 4,
                distribution: [
                    { range: '1-2', count: 3 },
                    { range: '3-4', count: 8 },
                    { range: '5-6', count: 5 },
                    { range: '7+', count: 2 }
                ]
            },
            department_stats: fairnessAnalysis.department_analysis || {
                CS: {
                    department_name: 'Computer Science',
                    fairness_score: 78,
                    avg_duties_per_teacher: 4.3,
                    total_teachers: 5,
                    overload_risk: 'low'
                },
                Math: {
                    department_name: 'Mathematics',
                    fairness_score: 72,
                    avg_duties_per_teacher: 4.1,
                    total_teachers: 4,
                    overload_risk: 'medium'
                }
            },
            problem_areas: fairnessAnalysis.problem_areas || [],

            // Detailed teacher analysis
            overloaded_teachers: [
                {
                    teacher_id: 't3',
                    teacher_name: 'Dr. Brown',
                    duties_count: 7,
                    expected_avg: 4.2,
                    excess: 2.8,
                    severity: 'high'
                }
            ],
            underloaded_teachers: [
                {
                    teacher_id: 't5',
                    teacher_name: 'Dr. White',
                    duties_count: 2,
                    expected_avg: 4.2,
                    deficit: 2.2,
                    severity: 'medium'
                }
            ],

            // Pattern detection
            patterns: [
                {
                    pattern: 'Senior teachers receiving more duties',
                    count: 12,
                    impact: 'positive',
                    confidence: 0.85
                },
                {
                    pattern: 'Cross-department assignments concentrated',
                    count: 8,
                    impact: 'neutral',
                    confidence: 0.72
                }
            ],

            // Compliance metrics
            constraints_satisfied: {
                max_daily_duties: true,
                max_weekly_duties: true,
                min_gap_between_duties: false,
                department_limits: true
            },

            // Cache metadata
            cached: false,
            computed_at: new Date(),
            valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/phase3/analytics/:allocation_id/recalculate
 * Force recalculation of fairness metrics
 */
exports.recalculateAnalytics = async (req, res) => {
    try {
        const { allocation_id } = req.params;

        // TODO: Clear cache and recalculate
        // await FairnessAnalyticsCache.deleteOne({ _id: allocation_id });

        // Fetch allocation and recalculate
        const fairnessAnalysis = await phase2Connector.analyzeFairness({
            _id: allocation_id
        });

        res.json({
            success: true,
            message: 'Fairness metrics recalculated',
            data: {
                fairness_score: fairnessAnalysis.fairness_score,
                recalculated_at: new Date()
            }
        });
    } catch (error) {
        console.error('Recalculate analytics error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/phase3/analytics/:allocation_id/trends
 * Get historical fairness trends
 */
exports.getTrends = async (req, res) => {
    try {
        const { allocation_id } = req.params;
        const { days = 30 } = req.query;

        // TODO: Query AllocationHistory collection
        // Build fairness trend data over time

        const trends = {
            period_days: parseInt(days),
            data_points: [
                { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), score: 65 },
                { date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), score: 68 },
                { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), score: 72 },
                { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), score: 75 },
                { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), score: 78 },
                { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), score: 79 },
                { date: new Date(), score: 80 }
            ],
            min: 65,
            max: 80,
            average: 74.1,
            trend: 'improving'
        };

        res.json({
            success: true,
            data: trends
        });
    } catch (error) {
        console.error('Get trends error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/phase3/analytics/compare
 * Compare fairness between two allocations
 */
exports.compareAllocations = async (req, res) => {
    try {
        const { allocation_id_1, allocation_id_2 } = req.body;

        if (!allocation_id_1 || !allocation_id_2) {
            return res.status(400).json({
                success: false,
                error: 'Both allocation_id_1 and allocation_id_2 are required'
            });
        }

        // Fetch both allocations and compute fairness
        // const alloc1 = await AllocationModel.findById(allocation_id_1);
        // const alloc2 = await AllocationModel.findById(allocation_id_2);
        // const fair1 = await phase2Connector.analyzeFairness(alloc1);
        // const fair2 = await phase2Connector.analyzeFairness(alloc2);

        const comparison = {
            allocation_1: {
                id: allocation_id_1,
                fairness_score: 75,
                workload_std_dev: 1.2,
                overloaded_count: 2
            },
            allocation_2: {
                id: allocation_id_2,
                fairness_score: 82,
                workload_std_dev: 0.9,
                overloaded_count: 0
            },
            summary: {
                fairness_improvement: 7,
                fairness_improvement_percent: 9.3,
                recommendation: 'Allocation 2 is significantly more fair'
            }
        };

        res.json({
            success: true,
            data: comparison
        });
    } catch (error) {
        console.error('Compare allocations error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/phase3/analytics/department/:dept_id
 * Get analytics specific to a department
 */
exports.getDepartmentAnalytics = async (req, res) => {
    try {
        const { dept_id } = req.params;
        const { allocation_id } = req.query;

        // TODO: Query allocations filtered by department

        const deptAnalytics = {
            department_id: dept_id,
            department_name: 'Computer Science',
            teachers_count: 12,
            allocation_metrics: {
                fairness_score: 78,
                average_duties_per_teacher: 4.3,
                distribution: [
                    { name: 'Dr. Smith', duties: 5, expected: 4.3 },
                    { name: 'Dr. Jones', duties: 4, expected: 4.3 },
                    { name: 'Dr. Brown', duties: 6, expected: 4.3 }
                ]
            },
            workload_trends: [
                { week: 'Week 1', avg_duties: 4.1 },
                { week: 'Week 2', avg_duties: 4.3 },
                { week: 'Week 3', avg_duties: 4.2 }
            ],
            high_performers: [
                { name: 'Dr. Smith', score: 0.95 },
                { name: 'Dr. Johnson', score: 0.92 }
            ],
            concerns: [
                { teacher: 'Dr. White', issue: 'Overloaded', severity: 'high' }
            ]
        };

        res.json({
            success: true,
            data: deptAnalytics
        });
    } catch (error) {
        console.error('Get department analytics error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
