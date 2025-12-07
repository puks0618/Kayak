/**
 * Cache Statistics Routes
 * Admin endpoints for monitoring cache performance
 */

const express = require('express');
const router = express.Router();
const cacheStatsController = require('../controllers/cache-stats.controller');

// Get comprehensive cache statistics
router.get('/stats', cacheStatsController.getStats.bind(cacheStatsController));

// Reset cache metrics
router.post('/reset', cacheStatsController.resetMetrics.bind(cacheStatsController));

// Get cache health status
router.get('/health', cacheStatsController.getHealth.bind(cacheStatsController));

module.exports = router;
