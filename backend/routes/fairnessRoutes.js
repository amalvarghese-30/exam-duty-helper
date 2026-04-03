console.log("✅ fairnessRoutes.js loaded");
const express = require("express");
const router = express.Router();

const fairnessController = require("../controllers/phase3/FairnessAnalyticsController");

// Test route (IMPORTANT for debugging)
router.get("/test", (req, res) => {
    res.json({ message: "Fairness routes working ✅" });
});

// Main analytics route
router.get(
    "/analytics/:allocation_id",
    fairnessController.getAnalytics
);

router.post(
    "/analytics/:allocation_id/recalculate",
    fairnessController.recalculateAnalytics
);

router.get(
    "/analytics/:allocation_id/trends",
    fairnessController.getTrends
);

router.post(
    "/analytics/compare",
    fairnessController.compareAllocations
);

router.get(
    "/analytics/department/:dept_id",
    fairnessController.getDepartmentAnalytics
);

module.exports = router;