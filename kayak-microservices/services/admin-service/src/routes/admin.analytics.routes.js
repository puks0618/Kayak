const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const adminAnalyticsController = require('../controllers/adminAnalytics.controller');

router.use(verifyToken);
router.use(requireAdmin);

router.get('/top-properties', adminAnalyticsController.getTopProperties);
router.get('/city-revenue', adminAnalyticsController.getCityRevenue);
router.get('/top-hosts', adminAnalyticsController.getTopHosts);

module.exports = router;
