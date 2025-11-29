/**
 * Admin Routes
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User management
router.post('/users/manage', adminController.manageUser);

// Listing management
router.post('/listings/manage', adminController.manageListing);

// Reports
router.get('/reports', adminController.getReports);

module.exports = router;

