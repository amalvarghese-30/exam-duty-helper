/**
 * Swap Management Routes
 * Endpoints for swap requests, approvals, and management
 */

const express = require("express");
const router = express.Router();
const SwapRequest = require("../models/SwapRequest");
const DutyAllocation = require("../models/DutyAllocation");
const Teacher = require("../models/Teacher");
const AuditLogger = require("../utils/auditLogger");
const axios = require("axios");

/**
 * POST /api/swaps/recommend
 * Get swap recommendations for an institution
 * Body: { institution_id }
 */
router.post("/recommend", async (req, res) => {
    try {
        const { institution_id } = req.body;

        if (!institution_id) {
            return res
                .status(400)
                .json({ message: "institution_id is required" });
        }

        // Fetch current allocations
        const allocations = await DutyAllocation.find({
            institution_id,
            status: "assigned",
        });

        const teachers = await Teacher.find({
            institution_id,
            is_active: true,
        });

        if (!allocations.length || !teachers.length) {
            return res.status(400).json({
                error: "No allocations or teachers found",
            });
        }

        // Build current allocation structure for Python engine
        const currentAllocation = {};
        for (const allocation of allocations) {
            const examId = allocation.exam_id.toString();
            if (!currentAllocation[examId]) {
                currentAllocation[examId] = {
                    exam_id: examId,
                    roles: {},
                };
            }

            const role = allocation.role;
            if (!currentAllocation[examId].roles[role]) {
                currentAllocation[examId].roles[role] = [];
            }

            currentAllocation[examId].roles[role].push({
                teacher_id: allocation.teacher_id.toString(),
                teacher_name: allocation.teacher_id.name || "",
                role: role,
            });
        }

        // Call Python swap engine
        const response = await axios.post(
            "http://localhost:5000/api/swaps/recommendations",
            {
                current_allocation: currentAllocation,
                teachers: teachers.map((t) => ({
                    _id: t._id.toString(),
                    name: t.name,
                    email: t.email,
                    department: t.department,
                })),
            }
        );

        return res.status(200).json({
            status: "success",
            message: "Swap recommendations generated",
            data: response.data,
        });
    } catch (error) {
        console.error("Swap recommendation error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

/**
 * POST /api/swaps/request
 * Create a swap request from a teacher or admin
 * Body: {
 *    institution_id,
 *    requester_id,
 *    teacher_a_id,
 *    teacher_b_id,
 *    duties_a: [ { exam_id, role, date } ],
 *    duties_b: [ { exam_id, role, date } ],
 *    message,
 *    request_type: teacher_requested | admin_suggested
 * }
 */
router.post("/request", async (req, res) => {
    try {
        const {
            institution_id,
            requester_id,
            teacher_a_id,
            teacher_b_id,
            duties_a,
            duties_b,
            message,
            request_type,
        } = req.body;

        if (!institution_id || !teacher_a_id || !teacher_b_id) {
            return res.status(400).json({
                message: "Missing required fields",
            });
        }

        // Create swap request
        const swapRequest = new SwapRequest({
            institution_id,
            requester_id,
            teacher_a_id,
            teacher_b_id,
            duties_a,
            duties_b,
            message,
            request_type: request_type || "teacher_requested",
            status:
                request_type === "admin_suggested"
                    ? "pending_admin_approval"
                    : "pending_teacher_b_approval",
        });

        await swapRequest.save();

        // Populate names
        await swapRequest.populate("teacher_a_id", "name email");
        await swapRequest.populate("teacher_b_id", "name email");

        swapRequest.teacher_a_name = swapRequest.teacher_a_id.name;
        swapRequest.teacher_b_name = swapRequest.teacher_b_id.name;
        await swapRequest.save();

        // Log audit
        await AuditLogger.logAllocationChange(
            requester_id,
            "duty_swapped",
            "swap_request",
            swapRequest._id,
            {
                after: {
                    teacher_a: swapRequest.teacher_a_name,
                    teacher_b: swapRequest.teacher_b_name,
                    status: swapRequest.status,
                },
                fields_changed: ["swap_request_created"],
                change_summary: `Swap request created between ${swapRequest.teacher_a_name} and ${swapRequest.teacher_b_name}`,
            },
            {
                ip_address: req.ip,
                api_endpoint: req.path,
                http_method: "POST",
            }
        );

        return res.status(201).json({
            status: "success",
            message: "Swap request created",
            data: swapRequest,
        });
    } catch (error) {
        console.error("Swap request error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

/**
 * PATCH /api/swaps/:swap_id/approve
 * Teacher or admin approves a swap request
 */
router.patch("/:swap_id/approve", async (req, res) => {
    try {
        const { swap_id } = req.params;
        const { user_id, user_type, reason } = req.body; // user_type: teacher or admin

        const swapRequest = await SwapRequest.findById(swap_id);

        if (!swapRequest) {
            return res.status(404).json({ message: "Swap request not found" });
        }

        if (user_type === "teacher") {
            swapRequest.teacher_b_approval = {
                approved: true,
                approved_at: new Date(),
                response: reason || "Approved",
            };

            // Move to admin approval
            if (swapRequest.status === "pending_teacher_b_approval") {
                swapRequest.status = "pending_admin_approval";
            }
        } else if (user_type === "admin") {
            swapRequest.admin_approval = {
                admin_id: user_id,
                approved: true,
                approved_at: new Date(),
                reason: reason || "Approved",
            };

            swapRequest.status = "approved";
        }

        await swapRequest.save();

        // Log audit
        await AuditLogger.logAllocationChange(
            user_id,
            "duty_swapped",
            "swap_request",
            swap_id,
            {
                after: { status: swapRequest.status },
                fields_changed: [`${user_type}_approval`],
                change_summary: `Swap request approved by ${user_type}`,
            },
            {
                ip_address: req.ip,
                api_endpoint: req.path,
                http_method: "PATCH",
            }
        );

        return res.status(200).json({
            status: "success",
            message: "Swap request approved",
            data: swapRequest,
        });
    } catch (error) {
        console.error("Approve error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

/**
 * PATCH /api/swaps/:swap_id/reject
 * Reject a swap request
 */
router.patch("/:swap_id/reject", async (req, res) => {
    try {
        const { swap_id } = req.params;
        const { user_id, reason } = req.body;

        const swapRequest = await SwapRequest.findByIdAndUpdate(
            swap_id,
            {
                status: "rejected",
            },
            { new: true }
        );

        if (!swapRequest) {
            return res.status(404).json({ message: "Swap request not found" });
        }

        // Log audit
        await AuditLogger.logAllocationChange(
            user_id,
            "duty_swapped",
            "swap_request",
            swap_id,
            {
                after: { status: "rejected" },
                fields_changed: ["status"],
                change_summary: `Swap request rejected: ${reason || "No reason provided"}`,
            },
            {
                ip_address: req.ip,
                api_endpoint: req.path,
                http_method: "PATCH",
            }
        );

        return res.status(200).json({
            status: "success",
            message: "Swap request rejected",
            data: swapRequest,
        });
    } catch (error) {
        console.error("Reject error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

/**
 * GET /api/swaps/:institution_id/pending
 * Get all pending swap requests for an institution
 */
router.get("/:institution_id/pending", async (req, res) => {
    try {
        const { institution_id } = req.params;

        const swapRequests = await SwapRequest.find({
            institution_id,
            status: { $in: ["pending_teacher_b_approval", "pending_admin_approval"] },
        })
            .populate("teacher_a_id", "name email department")
            .populate("teacher_b_id", "name email department")
            .sort({ requested_at: -1 });

        return res.status(200).json({
            status: "success",
            data: swapRequests,
        });
    } catch (error) {
        console.error("Get pending swaps error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

/**
 * GET /api/swaps/:institution_id/history
 * Get swap request history
 */
router.get("/:institution_id/history", async (req, res) => {
    try {
        const { institution_id } = req.params;
        const limit = parseInt(req.query.limit) || 50;

        const swapRequests = await SwapRequest.find({
            institution_id,
        })
            .populate("teacher_a_id", "name email")
            .populate("teacher_b_id", "name email")
            .sort({ createdAt: -1 })
            .limit(limit);

        return res.status(200).json({
            status: "success",
            data: swapRequests,
        });
    } catch (error) {
        console.error("Get swap history error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

module.exports = router;
