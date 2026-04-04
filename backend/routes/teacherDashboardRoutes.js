/**
 * Teacher Dashboard Routes
 * File: backend/routes/teacherDashboardRoutes.js
 */

const express = require('express');
const router = express.Router();
const TeacherDashboardController = require('../controllers/TeacherDashboardController');
const { verifyToken } = require('../utils/authMiddleware');

// Dashboard stats - GET endpoint
router.get('/stats', verifyToken, TeacherDashboardController.getTeacherStats);

// Profile
router.get('/profile', verifyToken, TeacherDashboardController.getTeacherProfile);

// Duties
router.get('/duties', verifyToken, TeacherDashboardController.getTeacherDuties);
router.get('/duties/upcoming', verifyToken, TeacherDashboardController.getUpcomingDuties);

// Leaves
router.get('/leaves', verifyToken, TeacherDashboardController.getTeacherLeaves);

module.exports = router;