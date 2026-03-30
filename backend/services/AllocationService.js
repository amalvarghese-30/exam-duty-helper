/**
 * Allocation Service
 * Orchestrates duty allocation using the Python scheduler engine
 * 
 * Responsibilities:
 * - Fetch data from MongoDB
 * - Call Python scheduler API
 * - Store results back to MongoDB
 * - Handle errors and conflicts
 */

const axios = require("axios");
const mongoose = require("mongoose");

const Teacher = require("../models/Teacher");
const Exam = require("../models/Exam");
const DutyAllocation = require("../models/DutyAllocation");
const TeacherLeave = require("../models/TeacherLeave");
const DepartmentPolicy = require("../models/DepartmentPolicy");

class AllocationService {
    constructor(pythonSchedulerUrl = "http://localhost:5000/api/allocate") {
        this.pythonSchedulerUrl = pythonSchedulerUrl;
    }

    /**
     * Perform complete allocation for an institution
     */
    async allocateForInstitution(institutionId, options = {}) {
        try {
            const startTime = Date.now();

            // Stage 1: Fetch all required data from MongoDB
            console.log("Fetching data from MongoDB...");
            const data = await this._fetchAllocationData(institutionId);

            // Stage 2: Prepare payload for Python scheduler
            const payload = this._prepareSchedulerPayload(data);

            // Stage 3: Call Python scheduler
            console.log("Calling Python scheduler...");
            const allocationResult = await this._callPythonScheduler(payload);

            if (allocationResult.status === "error") {
                throw new Error(
                    `Scheduler error: ${allocationResult.message}`
                );
            }

            // Stage 4: Save allocation results to MongoDB
            console.log("Saving allocation results...");
            await this._saveAllocationResults(
                institutionId,
                allocationResult
            );

            // Stage 5: Compute and log statistics
            const statistics = allocationResult.statistics || {};
            const duration = Date.now() - startTime;

            return {
                status: "success",
                message: `Allocated ${statistics.allocated_exams}/${statistics.total_exams} exams`,
                data: {
                    allocated_exams: statistics.allocated_exams,
                    total_exams: statistics.total_exams,
                    success_rate: statistics.success_rate_percent,
                    unallocated_exams: allocationResult.unallocated_exams || [],
                    workload_statistics: statistics.workload_statistics || {},
                    conflicts: allocationResult.conflicts || [],
                    duration_ms: duration,
                },
            };
        } catch (error) {
            console.error("Allocation error:", error);
            return {
                status: "error",
                message: error.message,
                error: error.toString(),
            };
        }
    }

    /**
     * Fetch all data required for allocation
     */
    async _fetchAllocationData(institutionId) {
        const [teachers, exams, leaves, policies] = await Promise.all([
            Teacher.find({ institution_id: institutionId, is_active: true }),
            Exam.find({ institution_id: institutionId }),
            TeacherLeave.find(
                { institution_id: institutionId },
                "teacher_id leave_date reason type"
            ),
            DepartmentPolicy.find({ institution_id: institutionId, is_active: true }),
        ]);

        return {
            teachers,
            exams,
            leaves,
            policies,
            institution_id: institutionId,
        };
    }

    /**
     * Transform MongoDB documents to scheduler payload format
     */
    _prepareSchedulerPayload(data) {
        const { teachers, exams, leaves, policies } = data;

        // Transform teachers
        const transformedTeachers = teachers.map((teacher) => ({
            _id: teacher._id.toString(),
            name: teacher.name,
            email: teacher.email,
            department: teacher.department || "",
            subject: teacher.subject || "",
            seniority_years: teacher.seniority_years || 0,
            reliability_score: teacher.reliability_score || 0.8,
            total_duties: teacher.totalDuties || 0,
            is_active: teacher.is_active,
            availability: teacher.availability || [],
            allowed_roles: teacher.allowed_roles || ["invigilator"],
        }));

        // Transform exams
        const transformedExams = exams.map((exam) => ({
            _id: exam._id.toString(),
            subject: exam.subject,
            department: exam.department || "",
            exam_date: exam.exam_date,
            start_time: exam.start_time,
            end_time: exam.end_time,
            room_number: exam.room_number || "",
            required_roles: exam.required_roles || { invigilator: 1 },
            category: exam.category || "regular",
        }));

        // Transform leaves
        const transformedLeaves = leaves.map((leave) => ({
            teacher_id: leave.teacher_id.toString(),
            leave_date: leave.leave_date,
            reason: leave.reason || "",
            type: leave.type || "leave",
        }));

        // Transform policies
        const transformedPolicies = policies.map((policy) => ({
            department: policy.department,
            max_daily_duties: policy.max_daily_duties || 3,
            allow_external_allocation: policy.allow_external_allocation,
            priority_subjects: policy.priority_subjects || [],
            min_gap_between_duties_hours: policy.min_gap_between_duties_hours || 1,
            seniority_override: policy.seniority_override || false,
            min_seniority_years: policy.min_seniority_years || 0,
        }));

        return {
            teachers: transformedTeachers,
            exams: transformedExams,
            teacher_leaves: transformedLeaves,
            policies: transformedPolicies,
        };
    }

    /**
     * Call Python scheduler API
     */
    async _callPythonScheduler(payload) {
        try {
            const response = await axios.post(this.pythonSchedulerUrl, payload, {
                timeout: 60000, // 60 second timeout
            });
            return response.data;
        } catch (error) {
            if (error.response) {
                throw new Error(
                    `Scheduler API error: ${error.response.status} - ${error.response.data?.message || error.message
                    }`
                );
            }
            throw new Error(`Failed to call scheduler: ${error.message}`);
        }
    }

    /**
     * Save allocation results to MongoDB
     */
    async _saveAllocationResults(institutionId, allocationResult) {
        const allocations = [];

        // Extract allocations from result
        const allocatedDuties = allocationResult.allocated_duties || {};

        for (const [examId, allocation] of Object.entries(allocatedDuties)) {
            const roles = allocation.roles || {};

            for (const [role, teachers] of Object.entries(roles)) {
                for (const assignment of teachers) {
                    allocations.push({
                        institution_id: new mongoose.Types.ObjectId(institutionId),
                        teacher_id: new mongoose.Types.ObjectId(assignment.teacher_id),
                        exam_id: new mongoose.Types.ObjectId(examId),
                        role: role,
                        allocation_score: assignment.score || 0,
                        allocation_method: "scoring",
                        status: "assigned",
                    });
                }
            }
        }

        // Clear previous allocations for this institution
        await DutyAllocation.deleteMany({ institution_id: institutionId });

        // Insert new allocations
        if (allocations.length > 0) {
            await DutyAllocation.insertMany(allocations);
        }

        console.log(`Saved ${allocations.length} allocations to MongoDB`);
    }

    /**
     * Get allocation statistics for an institution
     */
    async getAllocationStats(institutionId) {
        try {
            const allocations = await DutyAllocation.find({
                institution_id: institutionId,
            });

            const teachers = await Teacher.find({ institution_id: institutionId });
            const exams = await Exam.find({ institution_id: institutionId });

            // Group by teacher
            const teacherDuties = {};
            for (const alloc of allocations) {
                const teacherId = alloc.teacher_id.toString();
                teacherDuties[teacherId] = (teacherDuties[teacherId] || 0) + 1;
            }

            // Compute statistics
            const duties = Object.values(teacherDuties);
            const mean = duties.length > 0 ? duties.reduce((a, b) => a + b) / duties.length : 0;
            const variance =
                duties.length > 0
                    ? duties.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) /
                    duties.length
                    : 0;

            return {
                total_exams: exams.length,
                allocated_exams: new Set([
                    ...allocations.map((a) => a.exam_id.toString()),
                ]).size,
                unallocated_exams:
                    exams.length -
                    new Set([...allocations.map((a) => a.exam_id.toString())]).size,
                total_teachers: teachers.length,
                total_allocations: allocations.length,
                workload_distribution: {
                    mean: Math.round(mean * 100) / 100,
                    std_dev: Math.round(Math.sqrt(variance) * 100) / 100,
                    min: Math.min(...duties),
                    max: Math.max(...duties),
                },
                allocations_by_role: this._groupByRole(allocations),
                allocations_by_status: this._groupByStatus(allocations),
            };
        } catch (error) {
            throw new Error(`Failed to get allocation stats: ${error.message}`);
        }
    }

    /**
     * Get detailed allocation report for a specific teacher
     */
    async getTeacherAllocationReport(
        institutionId,
        teacherId
    ) {
        try {
            const allocations = await DutyAllocation.find({
                institution_id: institutionId,
                teacher_id: teacherId,
            })
                .populate("exam_id", "subject exam_date start_time end_time")
                .sort({ "exam_id.exam_date": 1 });

            const teacher = await Teacher.findById(teacherId);

            return {
                teacher: {
                    name: teacher.name,
                    email: teacher.email,
                    department: teacher.department,
                    seniority_years: teacher.seniority_years,
                    total_duties: teacher.totalDuties,
                },
                allocations: allocations.map((alloc) => ({
                    exam_subject: alloc.exam_id.subject,
                    exam_date: alloc.exam_id.exam_date,
                    start_time: alloc.exam_id.start_time,
                    role: alloc.role,
                    status: alloc.status,
                    score: alloc.allocation_score,
                })),
                total_allocated: allocations.length,
            };
        } catch (error) {
            throw new Error(
                `Failed to get teacher report: ${error.message}`
            );
        }
    }

    _groupByRole(allocations) {
        const byRole = {};
        for (const alloc of allocations) {
            byRole[alloc.role] = (byRole[alloc.role] || 0) + 1;
        }
        return byRole;
    }

    _groupByStatus(allocations) {
        const byStatus = {};
        for (const alloc of allocations) {
            byStatus[alloc.status] = (byStatus[alloc.status] || 0) + 1;
        }
        return byStatus;
    }
}

module.exports = AllocationService;
