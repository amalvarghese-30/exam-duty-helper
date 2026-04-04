

const express = require('express');
const router = express.Router();
const axios = require("axios");
const PolicyNLPController = require('../controllers/PolicyNLPController');
const { verifyToken, verifyAdminRole } = require('../utils/authMiddleware');

// Parse natural language rule
router.post("/parse", async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                error: "Rule text is required"
            });
        }

        console.log("📝 Parsing policy rule:", text.substring(0, 100));

        // Call Python AI engine
        const response = await axios.post(
            "http://localhost:5000/api/parse-rule",
            { text: text },
            { timeout: 30000 }
        );

        return res.json({
            success: true,
            parsed_rule: response.data.parsed_constraints?.[0] || response.data,
            original_text: text
        });

    } catch (error) {
        console.error("Policy parse error:", error.message);
        return res.status(500).json({
            success: false,
            error: error.response?.data?.message || error.message
        });
    }
});

// Batch parse multiple rules
router.post('/batch-parse', verifyToken, verifyAdminRole, PolicyNLPController.batchParseRules);

// Get policy suggestions
router.get('/suggestions', verifyToken, verifyAdminRole, PolicyNLPController.getPolicySuggestions);

module.exports = router;