/**
 * Admin Dashboard Routes
 * File: backend/routes/adminDashboardRoutes.js
 */

const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const { verifyToken, verifyAdminRole } = require('../utils/authMiddleware');

// Dashboard stats
router.get('/dashboard/stats', verifyToken, verifyAdminRole, AdminController.getDashboardStats);

// Overview
router.get('/overview', verifyToken, verifyAdminRole, AdminController.getAdminOverview);

// Teachers
router.get('/teachers', verifyToken, verifyAdminRole, AdminController.getTeachersList);
router.get('/teachers/:teacher_id', verifyToken, verifyAdminRole, AdminController.getTeacherDetail);

// Duties
router.get('/duties', verifyToken, verifyAdminRole, AdminController.getAllDuties);

// Leaves
router.get('/leaves', verifyToken, verifyAdminRole, AdminController.getTeachersOnLeave);

module.exports = router;
