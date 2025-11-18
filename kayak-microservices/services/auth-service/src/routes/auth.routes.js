/**
 * Auth Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/verify
router.post('/verify', authController.verify);

// POST /api/auth/refresh
router.post('/refresh', authController.refresh);

module.exports = router;

