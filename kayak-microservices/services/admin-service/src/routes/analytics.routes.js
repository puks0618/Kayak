/**
 * Analytics Routes
 * Routes for admin analytics and reporting
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

// Main analytics reports
router.get('/top-properties', analyticsController.getTopProperties);
router.get('/city-revenue', analyticsController.getCityRevenue);
router.get('/top-providers', analyticsController.getTopProviders);

// Dashboard overview - combines multiple metrics
router.get('/overview', analyticsController.getOverview);

module.exports = router;

