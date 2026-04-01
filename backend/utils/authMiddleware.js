/**
 * Authentication Middleware
 * File: backend/utils/authMiddleware.js
 */

const jwt = require('jsonwebtoken');

/**
 * Verify JWT token
 */
exports.verifyToken = (req, res, next) => {
    // Get token from headers
    const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'No token provided'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
};

/**
 * Verify admin role
 */
exports.verifyAdminRole = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
    next();
};

/**
 * Verify teacher role
 */
exports.verifyTeacherRole = (req, res, next) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({
            success: false,
            error: 'Teacher access required'
        });
    }
    next();
};
