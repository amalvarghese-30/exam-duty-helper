/**
 * Allocation Routes
 * Endpoints for duty allocation and management
 */

const express = require("express");
const router = express.Router();
const AllocationService = require("../services/AllocationService");
const DutyAllocation = require("../models/DutyAllocation");
const Exam = require("../models/Exam");

// Initialize allocation service
const allocationService = new AllocationService();

/**
 * POST /api/allocations/run
 * Run allocation for an institution
 * Body: { institution_id }
 */
router.post("/run", async (req, res) => {
    try {
        const { institution_id } = req.body;

        if (!institution_id) {
            return res
                .status(400)
                .json({ message: "institution_id is required" });
        }

        const result = await allocationService.allocateForInstitution(
            institution_id
        );

        return res.status(200).json(result);
    } catch (error) {
        console.error("Allocation error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

/**
 * GET /api/allocations/stats/:institution_id
 * Get allocation statistics
 */
router.get("/stats/:institution_id", async (req, res) => {
    try {
        const { institution_id } = req.params;

        const stats = await allocationService.getAllocationStats(institution_id);

        return res.status(200).json({
            status: "success",
            data: stats,
        });
    } catch (error) {
        console.error("Stats error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

/**
 * GET /api/allocations/teacher/:institution_id/:teacher_id
 * Get allocation report for a teacher
 */
router.get(
    "/teacher/:institution_id/:teacher_id",
    async (req, res) => {
        try {
            const { institution_id, teacher_id } = req.params;

            const report = await allocationService.getTeacherAllocationReport(
                institution_id,
                teacher_id
            );

            return res.status(200).json({
                status: "success",
                data: report,
            });
        } catch (error) {
            console.error("Teacher report error:", error);
            return res.status(500).json({
                status: "error",
                message: error.message,
            });
        }
    }
);

/**
 * GET /api/allocations/exam/:exam_id
 * Get all allocations for a specific exam
 */
router.get("/exam/:exam_id", async (req, res) => {
    try {
        const { exam_id } = req.params;

        const allocations = await DutyAllocation.find({ exam_id }).populate(
            "teacher_id",
            "name email department"
        );

        const exam = await Exam.findById(exam_id);

        return res.status(200).json({
            status: "success",
            data: {
                exam: {
                    subject: exam.subject,
                    exam_date: exam.exam_date,
                    start_time: exam.start_time,
                    end_time: exam.end_time,
                },
                allocations: allocations.map((a) => ({
                    teacher_id: a.teacher_id._id,
                    teacher_name: a.teacher_id.name,
                    teacher_email: a.teacher_id.email,
                    role: a.role,
                    status: a.status,
                    score: a.allocation_score,
                })),
            },
        });
    } catch (error) {
        console.error("Exam allocations error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

/**
 * PATCH /api/allocations/:allocation_id/accept
 * Teacher accepts allocation
 */
router.patch("/:allocation_id/accept", async (req, res) => {
    try {
        const { allocation_id } = req.params;

        const allocation = await DutyAllocation.findByIdAndUpdate(
            allocation_id,
            {
                status: "accepted",
                accepted_at: new Date(),
            },
            { new: true }
        );

        if (!allocation) {
            return res.status(404).json({ message: "Allocation not found" });
        }

        return res.status(200).json({
            status: "success",
            message: "Allocation accepted",
            data: allocation,
        });
    } catch (error) {
        console.error("Accept error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

/**
 * PATCH /api/allocations/:allocation_id/reject
 * Teacher rejects allocation
 */
router.patch("/:allocation_id/reject", async (req, res) => {
    try {
        const { allocation_id } = req.params;

        const allocation = await DutyAllocation.findByIdAndUpdate(
            allocation_id,
            {
                status: "rejected",
            },
            { new: true }
        );

        if (!allocation) {
            return res.status(404).json({ message: "Allocation not found" });
        }

        return res.status(200).json({
            status: "success",
            message: "Allocation rejected",
            data: allocation,
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
 * PATCH /api/allocations/:allocation_id/lock
 * Admin locks allocation (prevents changes)
 */
router.patch("/:allocation_id/lock", async (req, res) => {
    try {
        const { allocation_id } = req.params;
        const { reason } = req.body;

        const allocation = await DutyAllocation.findByIdAndUpdate(
            allocation_id,
            {
                is_locked: true,
                override_reason: reason || "",
            },
            { new: true }
        );

        if (!allocation) {
            return res.status(404).json({ message: "Allocation not found" });
        }

        return res.status(200).json({
            status: "success",
            message: "Allocation locked",
            data: allocation,
        });
    } catch (error) {
        console.error("Lock error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

/**
 * GET /api/allocations/:institution_id/summary
 * Get summary of all allocations for an institution
 */
router.get("/:institution_id/summary", async (req, res) => {
    try {
        const { institution_id } = req.params;

        const allocations = await DutyAllocation.find({
            institution_id,
        });

        const byStatus = {};
        const byRole = {};
        for (const alloc of allocations) {
            byStatus[alloc.status] = (byStatus[alloc.status] || 0) + 1;
            byRole[alloc.role] = (byRole[alloc.role] || 0) + 1;
        }

        return res.status(200).json({
            status: "success",
            data: {
                total_allocations: allocations.length,
                by_status: byStatus,
                by_role: byRole,
            },
        });
    } catch (error) {
        console.error("Summary error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

module.exports = router;
