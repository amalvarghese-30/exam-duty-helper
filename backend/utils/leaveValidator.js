/**
 * Leave Validation Service
 * File: backend/utils/leaveValidator.js
 */

const TeacherLeave = require('../models/TeacherLeave');

/**
 * Check if a teacher is on leave on a specific date
 * @param {string} teacher_id - Teacher's MongoDB ID
 * @param {Date} date - Date to check
 * @returns {Promise<{isOnLeave: boolean, leave: object|null}>}
 */
exports.checkTeacherLeaveOnDate = async (teacher_id, date) => {
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const leave = await TeacherLeave.findOne({
            teacher_id,
            leave_date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).lean();

        return {
            isOnLeave: !!leave,
            leave
        };
    } catch (error) {
        console.error('Leave validation error:', error);
        return {
            isOnLeave: false,
            leave: null
        };
    }
};

/**
 * Check if teacher is on leave during a date range
 * @param {string} teacher_id - Teacher's MongoDB ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<{isOnLeave: boolean, leaves: array}>}
 */
exports.checkTeacherLeaveDuringRange = async (teacher_id, startDate, endDate) => {
    try {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const leaves = await TeacherLeave.find({
            teacher_id,
            leave_date: {
                $gte: start,
                $lte: end
            }
        }).lean();

        return {
            isOnLeave: leaves.length > 0,
            leaves
        };
    } catch (error) {
        console.error('Leave range validation error:', error);
        return {
            isOnLeave: false,
            leaves: []
        };
    }
};

/**
 * Get all leave dates for a teacher
 * @param {string} teacher_id - Teacher's MongoDB ID
 * @returns {Promise<array>}
 */
exports.getTeacherLeaveDates = async (teacher_id) => {
    try {
        const leaves = await TeacherLeave.find({
            teacher_id
        })
            .select('leave_date reason')
            .lean();

        return leaves.map((l) => ({
            date: l.leave_date,
            reason: l.reason
        }));
    } catch (error) {
        console.error('Get leave dates error:', error);
        return [];
    }
};

/**
 * Filter teachers who are NOT on leave on a specific date
 * @param {array} teachers - Array of teacher objects/IDs
 * @param {Date} date - Date to check
 * @returns {Promise<array>} - Filtered teachers without leave on that date
 */
exports.filterAvailableTeachers = async (teachers, date) => {
    try {
        const availableTeachers = [];

        for (const teacher of teachers) {
            const teacher_id = teacher._id || teacher;
            const { isOnLeave } = await exports.checkTeacherLeaveOnDate(
                teacher_id,
                date
            );

            if (!isOnLeave) {
                availableTeachers.push(teacher);
            }
        }

        return availableTeachers;
    } catch (error) {
        console.error('Filter available teachers error:', error);
        return teachers; // Return all if error, fail safe
    }
};
