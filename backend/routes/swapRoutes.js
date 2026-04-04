/**
 * Swap Management Routes
 * Endpoints for swap requests, approvals, and management
 */

const express = require("express");
const router = express.Router();
const SwapController = require('../controllers/SwapController');
const { verifyToken, verifyAdminRole } = require('../utils/authMiddleware');

// Get swap recommendations
router.post("/recommend", verifyToken, SwapController.getSwapRecommendations);

// Create swap request
router.post("/request", verifyToken, SwapController.createSwapRequest);

// Get pending swaps for institution
router.get("/pending/:institution_id", verifyToken, SwapController.getPendingSwaps);

// Approve swap request
router.patch("/:swap_id/approve", verifyToken, SwapController.approveSwap);

// Reject swap request
router.patch("/:swap_id/reject", verifyToken, SwapController.rejectSwap);

module.exports = router;