/**
 * Auth Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Public routes (no authentication required)
// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/verify
router.post('/verify', authController.verify);

// POST /api/auth/refresh
router.post('/refresh', authController.refresh);

// Protected routes (authentication required)
// GET /api/auth/user - Get current user information
router.get('/user', verifyToken, authController.getUserInfo);

// PUT /api/auth/user - Update user information
router.put('/user', verifyToken, authController.updateUser);

// DELETE /api/auth/user - Delete user (soft delete)
router.delete('/user', verifyToken, authController.deleteUser);

module.exports = router;

