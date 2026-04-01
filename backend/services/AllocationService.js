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
     * Simulate allocation without saving to database
     */
    async simulateAllocationForInstitution(institutionId, options = {}) {
        try {
            const startTime = Date.now();

            // Stage 1: Fetch all required data from MongoDB
            console.log("🧪 Fetching data for simulation...");
            const data = await this._fetchAllocationData(institutionId);

            // Stage 2: Prepare payload for Python scheduler
            const payload = this._prepareSchedulerPayload(data);

            // Stage 3: Call Python scheduler (simulation endpoint)
            console.log("🧪 Running simulation on Python scheduler...");
            const allocationResult = await axios.post(
                "http://localhost:5000/api/simulate",
                payload,
                { timeout: 60000 }
            ).then(res => res.data);

            if (allocationResult.status === "error") {
                throw new Error(
                    `Scheduler error: ${allocationResult.message}`
                );
            }

            // Stage 4: Return results WITHOUT saving
            const statistics = allocationResult.statistics || {};
            const duration = Date.now() - startTime;

            console.log(`✅ Simulation complete: ${statistics.allocated_exams}/${statistics.total_exams} exams`);

            return {
                status: "success",
                mode: "simulation",
                message: `Simulation: ${statistics.allocated_exams}/${statistics.total_exams} exams would be allocated`,
                data: {
                    allocated_exams: statistics.allocated_exams,
                    total_exams: statistics.total_exams,
                    success_rate: statistics.success_rate_percent,
                    unallocated_exams: allocationResult.unallocated_exams || [],
                    workload_statistics: statistics.workload_statistics || {},
                    conflicts: allocationResult.conflicts || [],
                    fix_suggestions: allocationResult.fix_suggestions || [],
                    comparison: allocationResult.comparison || {},
                    duration_ms: duration,
                },
            };
        } catch (error) {
            console.error("Simulation error:", error);
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
        const [teachers, exams, leaves, policies, lockedAllocations] = await Promise.all([
            Teacher.find({ institution_id: institutionId, is_active: true }),
            Exam.find({ institution_id: institutionId }),
            TeacherLeave.find(
                { institution_id: institutionId },
                "teacher_id leave_date reason type"
            ),
            DepartmentPolicy.find({ institution_id: institutionId, is_active: true }),
            DutyAllocation.find(
                { institution_id: institutionId, is_locked: true },
                "exam_id teacher_id role"
            ),
        ]);

        return {
            teachers,
            exams,
            leaves,
            policies,
            lockedAllocations,
            institution_id: institutionId,
        };
    }

    /**
     * Transform MongoDB documents to scheduler payload format
     */
    _prepareSchedulerPayload(data) {
        const { teachers, exams, leaves, policies, lockedAllocations } = data;

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

        // Create a map of locked allocations by exam_id
        const lockedByExam = {};
        (lockedAllocations || []).forEach((lock) => {
            const examId = lock.exam_id.toString();
            if (!lockedByExam[examId]) {
                lockedByExam[examId] = [];
            }
            lockedByExam[examId].push({
                teacher_id: lock.teacher_id.toString(),
                role: lock.role,
            });
        });

        // Transform exams with locked allocations attached
        const transformedExams = exams.map((exam) => {
            const examDate = new Date(exam.exam_date);
            const formattedDate = examDate.toISOString().split('T')[0];
            return {
                _id: exam._id.toString(),
                subject: exam.subject,
                department: exam.department || "",
                exam_date: formattedDate,
                start_time: exam.start_time,
                end_time: exam.end_time,
                room_number: exam.room_number || "",
                required_roles: exam.required_roles || { invigilator: 1 },
                category: exam.category || "regular",
                locked_allocations: lockedByExam[exam._id.toString()] || [],
            };
        });

        // Transform leaves (ensure dates are in YYYY-MM-DD format)
        const transformedLeaves = leaves.map((leave) => {
            const leaveDate = new Date(leave.leave_date);
            const formattedDate = leaveDate.toISOString().split('T')[0];
            return {
                teacher_id: leave.teacher_id.toString(),
                leave_date: formattedDate,
                reason: leave.reason || "",
                type: leave.type || "leave",
            };
        });

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
            const leaves = await TeacherLeave.find({ institution_id: institutionId });

            // Group by teacher to compute workload
            const teacherDuties = {};
            const overloadedList = [];
            const underloadedList = [];

            for (const teacher of teachers) {
                const teacherId = teacher._id.toString();
                const duties = allocations.filter((a) => a.teacher_id.toString() === teacherId).length;
                teacherDuties[teacherId] = duties;
            }

            // Compute statistics
            const duties = Object.values(teacherDuties);
            const mean = duties.length > 0 ? duties.reduce((a, b) => a + b) / duties.length : 0;
            const variance =
                duties.length > 0
                    ? duties.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / duties.length
                    : 0;
            const stdDev = Math.sqrt(variance);

            // Identify overloaded teachers (mean + 1.5 * std_dev)
            const overloadThreshold = mean + 1.5 * stdDev;
            const underloadThreshold = mean * 0.5;

            for (const teacher of teachers) {
                const teacherId = teacher._id.toString();
                const dutyCount = teacherDuties[teacherId] || 0;

                if (dutyCount > overloadThreshold) {
                    overloadedList.push({
                        teacher_id: teacherId,
                        name: teacher.name,
                        duties: dutyCount,
                    });
                }
                if (dutyCount < underloadThreshold && dutyCount < mean) {
                    underloadedList.push({
                        teacher_id: teacherId,
                        name: teacher.name,
                        duties: dutyCount,
                    });
                }
            }

            // Department distribution
            const deptDistribution = {};
            for (const teacher of teachers) {
                const dept = teacher.department || "Unassigned";
                if (!deptDistribution[dept]) {
                    deptDistribution[dept] = { duties: [], avg_duties: 0, min: 0, max: 0 };
                }
                const teacherId = teacher._id.toString();
                deptDistribution[dept].duties.push(teacherDuties[teacherId] || 0);
            }

            // Aggregate department stats
            for (const dept in deptDistribution) {
                const deptDuties = deptDistribution[dept].duties;
                const avg = deptDuties.length > 0 ? deptDuties.reduce((a, b) => a + b) / deptDuties.length : 0;
                deptDistribution[dept].avg_duties = Math.round(avg * 100) / 100;
                deptDistribution[dept].min = Math.min(...deptDuties);
                deptDistribution[dept].max = Math.max(...deptDuties);
                delete deptDistribution[dept].duties; // Remove intermediate data
            }

            // Daily distribution
            const dailyDistribution = {};
            for (const exam of exams) {
                const date = new Date(exam.exam_date).toISOString().split('T')[0];
                dailyDistribution[date] = (dailyDistribution[date] || 0) + 1;
            }

            // Compute fairness score (0-100)
            const allocationCount = allocations.length;
            const totalSlots = exams.length;
            const successRate = totalSlots > 0 ? (allocationCount / totalSlots) * 100 : 0;
            const fairnessScore = Math.min(100, Math.round(
                (successRate * 0.4) + // 40% success rate
                (stdDev < 1 ? 60 : stdDev < 2 ? 40 : 20) // 60% variance (lower is better)
            ));

            return {
                fairness_score: fairnessScore,
                workload_variance: Math.round(variance * 100) / 100,
                mean_workload: Math.round(mean * 100) / 100,
                std_dev: Math.round(stdDev * 100) / 100,
                overloaded_teachers: overloadedList,
                underloaded_teachers: underloadedList,
                department_distribution: deptDistribution,
                daily_distribution: dailyDistribution,
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
                    std_dev: Math.round(stdDev * 100) / 100,
                    min: Math.min(...duties, 0),
                    max: Math.max(...duties, 0),
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
