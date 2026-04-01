/**
 * Incremental Rescheduler Service
 * Recomputes only affected allocations instead of entire schedule
 *
 * Performance: O(affected) instead of O(total)
 * Useful for: emergency changes, single teacher absence, exam rescheduling
 */

const axios = require("axios");
const Exam = require("../models/Exam");
const Teacher = require("../models/Teacher");
const DutyAllocation = require("../models/DutyAllocation");
const TeacherLeave = require("../models/TeacherLeave");
const DepartmentPolicy = require("../models/DepartmentPolicy");

class IncrementalRescheduler {
    /**
     * Reschedule for a single teacher (absence, change in availability)
     */
    async rescheduleForTeacher(institutionId, teacherId, changeReason) {
        try {
            console.log(
                `♻️ Incremental rescheduling for teacher ${teacherId}: ${changeReason}`
            );

            // Step 1: Find all allocations for this teacher
            const teacherAllocations = await DutyAllocation.find({
                teacher_id: teacherId,
                is_locked: false, // Don't reschedule locked allocations
            }).populate("exam_id");

            if (!teacherAllocations.length) {
                return {
                    status: "success",
                    message: "No allocations to reschedule",
                    affected_count: 0,
                };
            }

            // Step 2: Get affected exam IDs
            const affectedExamIds = teacherAllocations.map((a) =>
                a.exam_id._id.toString()
            );

            console.log(
                `   Found ${teacherAllocations.length} allocations to reschedule`
            );

            // Step 3: Remove allocations for this teacher on affected exams
            await DutyAllocation.deleteMany({
                teacher_id: teacherId,
                exam_id: { $in: affectedExamIds },
                is_locked: false,
            });

            // Step 4: Fetch minimal data needed for reallocation
            const [
                teachers,
                exams,
                leaves,
                policies,
                lockedAllocations,
                currentAllocations,
            ] = await Promise.all([
                Teacher.find({ institution_id: institutionId, is_active: true }),
                Exam.find({ _id: { $in: affectedExamIds } }),
                TeacherLeave.find({ institution_id: institutionId }),
                DepartmentPolicy.find({
                    institution_id: institutionId,
                    is_active: true,
                }),
                DutyAllocation.find({
                    exam_id: { $in: affectedExamIds },
                    is_locked: true,
                }),
                DutyAllocation.find({
                    exam_id: { $in: affectedExamIds },
                    is_locked: false,
                    teacher_id: { $ne: teacherId },
                }),
            ]);

            console.log(`   Fetched ${exams.length} affected exams`);

            // Step 5: Call Python scheduler for only affected exams
            const payload = this._prepareIncrementalPayload(
                teachers,
                exams,
                leaves,
                policies,
                lockedAllocations,
                currentAllocations
            );

            const result = await axios.post(
                "http://localhost:5000/api/allocate",
                payload,
                { timeout: 30000 }
            );

            // Step 6: Save new allocations
            if (result.data.allocated_duties) {
                const newAllocations = this._extractAllocations(
                    result.data.allocated_duties,
                    institutionId
                );
                await DutyAllocation.insertMany(newAllocations);
                console.log(
                    `✅ Incremental reschedule complete: ${newAllocations.length} allocations created`
                );
            }

            return {
                status: "success",
                message: `Incremental reschedule completed for ${affectedExamIds.length} exams`,
                affected_count: affectedExamIds.length,
                allocated_count:
                    result.data.statistics?.allocated_exams || 0,
                duration_ms: result.data.duration_ms,
            };
        } catch (error) {
            console.error("Incremental reschedule error:", error);
            return {
                status: "error",
                message: error.message,
            };
        }
    }

    /**
     * Reschedule for a single exam (date/time change)
     */
    async rescheduleForExam(institutionId, examId) {
        try {
            console.log(`♻️ Incremental rescheduling for exam ${examId}`);

            // Step 1: Get the exam
            const exam = await Exam.findById(examId);
            if (!exam) {
                return {
                    status: "error",
                    message: "Exam not found",
                };
            }

            // Step 2: Find current allocations for this exam
            const currentAllocations = await DutyAllocation.find({
                exam_id: examId,
                is_locked: false,
            });

            console.log(
                `   Found ${currentAllocations.length} allocations to reschedule`
            );

            // Step 3: Remove unlocked allocations
            await DutyAllocation.deleteMany({
                exam_id: examId,
                is_locked: false,
            });

            // Step 4: Fetch data needed for reallocation
            const [
                teachers,
                leaves,
                policies,
                lockedAllocations,
            ] = await Promise.all([
                Teacher.find({ institution_id: institutionId, is_active: true }),
                TeacherLeave.find({ institution_id: institutionId }),
                DepartmentPolicy.find({
                    institution_id: institutionId,
                    is_active: true,
                }),
                DutyAllocation.find({
                    exam_id: examId,
                    is_locked: true,
                }),
            ]);

            // Step 5: Call Python scheduler for just this exam
            const payload = this._prepareIncrementalPayload(
                teachers,
                [exam],
                leaves,
                policies,
                lockedAllocations,
                []
            );

            const result = await axios.post(
                "http://localhost:5000/api/allocate",
                payload,
                { timeout: 30000 }
            );

            // Step 6: Save new allocations
            if (result.data.allocated_duties) {
                const newAllocations = this._extractAllocations(
                    result.data.allocated_duties,
                    institutionId
                );
                await DutyAllocation.insertMany(newAllocations);
                console.log(
                    `✅ Incremental reschedule complete: ${newAllocations.length} allocations created`
                );
            }

            return {
                status: "success",
                message: `Incremental reschedule completed for exam`,
                exam_id: examId,
                allocated_count:
                    result.data.statistics?.allocated_exams || 0,
                duration_ms: result.data.duration_ms,
            };
        } catch (error) {
            console.error("Exam reschedule error:", error);
            return {
                status: "error",
                message: error.message,
            };
        }
    }

    /**
     * Reschedule for a single day
     */
    async rescheduleForDay(institutionId, date) {
        try {
            console.log(`♻️ Incremental rescheduling for date ${date}`);

            // Find all exams on this day
            const exams = await Exam.find({
                institution_id: institutionId,
                exam_date: date,
            });

            if (!exams.length) {
                return {
                    status: "success",
                    message: "No exams on this date",
                    affected_count: 0,
                };
            }

            const examIds = exams.map((e) => e._id);

            // Remove unlocked allocations on this day
            const removed = await DutyAllocation.deleteMany({
                exam_id: { $in: examIds },
                is_locked: false,
            });

            console.log(
                `   Removed ${removed.deletedCount} unlocked allocations`
            );

            // Fetch data
            const [
                teachers,
                leaves,
                policies,
                lockedAllocations,
            ] = await Promise.all([
                Teacher.find({ institution_id: institutionId, is_active: true }),
                TeacherLeave.find({ institution_id: institutionId }),
                DepartmentPolicy.find({
                    institution_id: institutionId,
                    is_active: true,
                }),
                DutyAllocation.find({
                    exam_id: { $in: examIds },
                    is_locked: true,
                }),
            ]);

            // Call scheduler
            const payload = this._prepareIncrementalPayload(
                teachers,
                exams,
                leaves,
                policies,
                lockedAllocations,
                []
            );

            const result = await axios.post(
                "http://localhost:5000/api/allocate",
                payload,
                { timeout: 30000 }
            );

            // Save allocations
            if (result.data.allocated_duties) {
                const newAllocations = this._extractAllocations(
                    result.data.allocated_duties,
                    institutionId
                );
                await DutyAllocation.insertMany(newAllocations);
            }

            console.log(
                `✅ Incremental reschedule complete for ${exams.length} exams on ${date}`
            );

            return {
                status: "success",
                message: `Rescheduled ${exams.length} exams for ${date}`,
                affected_count: exams.length,
                allocated_count:
                    result.data.statistics?.allocated_exams || 0,
                duration_ms: result.data.duration_ms,
            };
        } catch (error) {
            console.error("Day reschedule error:", error);
            return {
                status: "error",
                message: error.message,
            };
        }
    }

    /**
     * Prepare payload for incremental scheduling
     * Only includes affected data
     */
    _prepareIncrementalPayload(
        teachers,
        exams,
        leaves,
        policies,
        lockedAllocations,
        currentAllocations
    ) {
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

        // Transform exams with locked allocations
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
            locked_allocations: lockedByExam[exam._id.toString()] || [],
        }));

        // Other transforms...
        const transformedLeaves = leaves.map((leave) => ({
            teacher_id: leave.teacher_id.toString(),
            leave_date: leave.leave_date,
            reason: leave.reason || "",
            type: leave.type || "leave",
        }));

        const transformedPolicies = policies.map((policy) => ({
            department: policy.department,
            max_daily_duties: policy.max_daily_duties || 3,
            allow_external_allocation: policy.allow_external_allocation,
            priority_subjects: policy.priority_subjects || [],
            min_gap_between_duties_hours:
                policy.min_gap_between_duties_hours || 1,
            seniority_override: policy.seniority_override || false,
            min_seniority_years: policy.min_seniority_years || 0,
        }));

        return {
            teachers: transformedTeachers,
            exams: transformedExams,
            teacher_leaves: transformedLeaves,
            policies: transformedPolicies,
            _mode: "incremental",
        };
    }

    /**
     * Extract allocated duties from Python result
     */
    _extractAllocations(allocatedDuties, institutionId) {
        const allocations = [];

        for (const [examId, allocation] of Object.entries(allocatedDuties)) {
            const roles = allocation.roles || {};

            for (const [role, assignments] of Object.entries(roles)) {
                for (const assignment of assignments) {
                    if (assignment.teacher_id) {
                        allocations.push({
                            institution_id: institutionId,
                            teacher_id: assignment.teacher_id,
                            exam_id: examId,
                            role: role,
                            status: "assigned",
                            allocation_score: assignment.score || 0,
                            allocation_method: "incremental_reschedule",
                            allocated_at: new Date(),
                        });
                    }
                }
            }
        }

        return allocations;
    }
}

module.exports = IncrementalRescheduler;
