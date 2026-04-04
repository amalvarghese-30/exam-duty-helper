/**
 * Policy NLP Controller - Handles natural language policy parsing
 * Connects frontend policy editor to Gemini NLP engine
 */

const axios = require('axios');

/**
 * POST /api/policies/parse
 * Parse natural language rule into structured constraints
 */
exports.parsePolicyRule = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Rule text is required'
            });
        }

        console.log(`📝 Parsing policy rule: ${text.substring(0, 100)}...`);

        const response = await axios.post(
            'http://localhost:5000/api/parse-rule',
            { text: text },
            { timeout: 30000 }
        );

        return res.json({
            success: true,
            data: response.data,
            original_text: text
        });

    } catch (error) {
        console.error('Policy parsing error:', error.message);
        return res.status(500).json({
            success: false,
            error: error.response?.data?.message || error.message
        });
    }
};

/**
 * POST /api/policies/batch-parse
 * Parse multiple rules at once
 */
exports.batchParseRules = async (req, res) => {
    try {
        const { rules } = req.body;

        if (!Array.isArray(rules) || rules.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Rules array is required'
            });
        }

        const results = [];

        for (const rule of rules) {
            try {
                const response = await axios.post(
                    'http://localhost:5000/api/parse-rule',
                    { text: rule },
                    { timeout: 30000 }
                );

                results.push({
                    original: rule,
                    parsed: response.data.parsed_constraints,
                    success: true
                });
            } catch (err) {
                results.push({
                    original: rule,
                    parsed: null,
                    success: false,
                    error: err.message
                });
            }
        }

        return res.json({
            success: true,
            data: {
                total: rules.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                results
            }
        });

    } catch (error) {
        console.error('Batch parse error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/policies/suggestions
 * Get suggested policy templates based on common patterns
 */
exports.getPolicySuggestions = async (req, res) => {
    try {
        const suggestions = [
            {
                id: 'max_daily_3',
                text: 'No teacher should have more than 3 duties per day',
                type: 'max_duties_per_day',
                value: 3
            },
            {
                id: 'no_same_dept',
                text: 'Teachers should not invigilate exams from their own department',
                type: 'no_same_department',
                value: true
            },
            {
                id: 'prefer_senior',
                text: 'Senior teachers with more than 10 years experience should get priority for coordinator roles',
                type: 'prefer_senior_teachers',
                value: 10
            },
            {
                id: 'avoid_monday',
                text: 'Avoid assigning Dr. Smith on Mondays',
                type: 'avoid_teacher',
                teacher_name: 'Dr. Smith',
                days: ['Monday']
            },
            {
                id: 'fair_distribution',
                text: 'Distribute duties fairly across all departments within 20% variance',
                type: 'fairness_target',
                max_variance_percent: 20
            }
        ];

        return res.json({
            success: true,
            data: suggestions
        });

    } catch (error) {
        console.error('Get suggestions error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};