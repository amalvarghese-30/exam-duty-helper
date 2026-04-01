/**
 * Allocation Routes
 * Endpoints for duty allocation and management
 */

const express = require("express");
const router = express.Router();
const AllocationService = require("../services/AllocationService");
const IncrementalRescheduler = require("../services/IncrementalRescheduler");
const DutyAllocation = require("../models/DutyAllocation");
const Exam = require("../models/Exam");
const AuditLogger = require("../utils/auditLogger");

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
 * POST /api/allocations/simulate
 * Simulate allocation without saving to database
 * Body: { institution_id }
 */
router.post("/simulate", async (req, res) => {
    try {
        const { institution_id } = req.body;

        if (!institution_id) {
            return res
                .status(400)
                .json({ message: "institution_id is required" });
        }

        const result = await allocationService.simulateAllocationForInstitution(
            institution_id
        );

        return res.status(200).json(result);
    } catch (error) {
        console.error("Simulation error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

/**
 * POST /api/allocations/reschedule/teacher
 * Incremental reschedule for a single teacher (absence, availability change)
 * Body: { institution_id, teacher_id, change_reason }
 */
router.post("/reschedule/teacher", async (req, res) => {
    try {
        const { institution_id, teacher_id, change_reason } = req.body;

        if (!institution_id || !teacher_id) {
            return res.status(400).json({
                message: "institution_id and teacher_id are required",
            });
        }

        const rescheduler = new IncrementalRescheduler();
        const result = await rescheduler.rescheduleForTeacher(
            institution_id,
            teacher_id,
            change_reason || "Teacher unavailable"
        );

        return res.status(200).json(result);
    } catch (error) {
        console.error("Teacher reschedule error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

/**
 * POST /api/allocations/reschedule/exam
 * Incremental reschedule for a single exam (date/time change)
 * Body: { institution_id, exam_id }
 */
router.post("/reschedule/exam", async (req, res) => {
    try {
        const { institution_id, exam_id } = req.body;

        if (!institution_id || !exam_id) {
            return res.status(400).json({
                message: "institution_id and exam_id are required",
            });
        }

        const rescheduler = new IncrementalRescheduler();
        const result = await rescheduler.rescheduleForExam(
            institution_id,
            exam_id
        );

        return res.status(200).json(result);
    } catch (error) {
        console.error("Exam reschedule error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

/**
 * POST /api/allocations/reschedule/day
 * Incremental reschedule for all exams on a given day
 * Body: { institution_id, date }
 */
router.post("/reschedule/day", async (req, res) => {
    try {
        const { institution_id, date } = req.body;

        if (!institution_id || !date) {
            return res.status(400).json({
                message: "institution_id and date are required",
            });
        }

        const rescheduler = new IncrementalRescheduler();
        const result = await rescheduler.rescheduleForDay(
            institution_id,
            date
        );

        return res.status(200).json(result);
    } catch (error) {
        console.error("Day reschedule error:", error);
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
        const { reason, user_id } = req.body;

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

        // Log to audit trail
        await AuditLogger.logAllocationLock(
            user_id || "system",
            allocation_id,
            reason || "No reason provided",
            {
                ip_address: req.ip,
                api_endpoint: req.path,
                http_method: "PATCH",
            }
        );

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
 * PATCH /api/allocations/:allocation_id/unlock
 * Admin unlocks allocation (allows changes)
 */
router.patch("/:allocation_id/unlock", async (req, res) => {
    try {
        const { allocation_id } = req.params;
        const { user_id } = req.body;

        const allocation = await DutyAllocation.findByIdAndUpdate(
            allocation_id,
            {
                is_locked: false,
                override_reason: "",
            },
            { new: true }
        );

        if (!allocation) {
            return res.status(404).json({ message: "Allocation not found" });
        }

        // Log to audit trail
        await AuditLogger.logAllocationUnlock(user_id || "system", allocation_id, {
            ip_address: req.ip,
            api_endpoint: req.path,
            http_method: "PATCH",
        });

        return res.status(200).json({
            status: "success",
            message: "Allocation unlocked",
            data: allocation,
        });
    } catch (error) {
        console.error("Unlock error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

/**
 * GET /api/allocations/:institution_id/locked
 * Get all locked allocations for an institution
 */
router.get("/:institution_id/locked", async (req, res) => {
    try {
        const { institution_id } = req.params;

        const lockedAllocations = await DutyAllocation.find({
            institution_id,
            is_locked: true,
        })
            .populate("teacher_id", "name email")
            .populate("exam_id", "subject exam_date");

        return res.status(200).json({
            status: "success",
            data: lockedAllocations,
        });
    } catch (error) {
        console.error("Get locked allocations error:", error);
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

/**
 * GET /api/allocations/:allocation_id/audit-history
 * Get audit history for a specific allocation
 */
router.get("/:allocation_id/audit-history", async (req, res) => {
    try {
        const { allocation_id } = req.params;

        const history = await AuditLogger.getAuditHistory(allocation_id, 100);

        return res.status(200).json({
            status: "success",
            data: history,
        });
    } catch (error) {
        console.error("Get audit history error:", error);
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
