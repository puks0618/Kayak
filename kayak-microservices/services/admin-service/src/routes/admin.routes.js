/**
 * Admin Routes
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const analyticsController = require('../controllers/analytics.controller');

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User management
router.post('/users/manage', adminController.manageUser);

// Listing management
router.post('/listings/manage', adminController.manageListing);

// Reports
router.get('/reports', adminController.getReports);

// Analytics Endpoints
router.get('/analytics/dashboard', analyticsController.dashboardMetrics);
router.get('/analytics/top-properties', analyticsController.topPropertiesByRevenue);
router.get('/analytics/city-revenue', analyticsController.cityWiseRevenue);
router.get('/analytics/top-hosts', analyticsController.topHostsByRevenue);

module.exports = router;
