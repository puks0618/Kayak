/**
 * Admin Routes
 * All administrative endpoints with authentication
 */

const express = require('express');
const router = express.Router();

// Middleware
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');

// Controllers
const administratorController = require('../controllers/administrator.controller');
const userManagementController = require('../controllers/userManagement.controller');
const listingsManagementController = require('../controllers/listingsManagement.controller');
const billingManagementController = require('../controllers/billingManagement.controller');
const analyticsController = require('../controllers/analytics.controller');

// Admin-specific routes
const adminFlightRoutes = require('./admin.flights.routes');
const adminHotelRoutes = require('./admin.hotels.routes');
const adminCarRoutes = require('./admin.cars.routes');
const adminUserRoutes = require('./admin.users.routes');

// Apply authentication to all admin routes
router.use(verifyToken);
router.use(requireAdmin);

// ============ Administrator Management Routes ============
router.post('/administrators', administratorController.create);
router.get('/administrators', administratorController.getAll);
router.get('/administrators/:id', administratorController.getById);
router.put('/administrators/:id', administratorController.update);
router.delete('/administrators/:id', administratorController.delete);
router.post('/administrators/:id/login', administratorController.updateLastLogin);

// ============ User Management Routes ============
router.get('/users', userManagementController.getAllUsers);
router.get('/users/stats', userManagementController.getUserStats);
router.get('/users/:id', userManagementController.getUserById);
router.put('/users/:id', userManagementController.updateUser);
router.patch('/users/:id/deactivate', userManagementController.deactivateUser);
router.patch('/users/:id/activate', userManagementController.activateUser);
router.patch('/users/:id/role', userManagementController.changeUserRole);

// ============ Listings Management Routes ============
router.get('/listings', listingsManagementController.searchListings);
router.get('/listings/stats', listingsManagementController.getListingStats);
router.get('/listings/:type/:id', listingsManagementController.getListingById);
router.post('/listings/:type', listingsManagementController.createListing);
router.put('/listings/:type/:id', listingsManagementController.updateListing);
router.delete('/listings/:type/:id', listingsManagementController.deleteListing);

// ============ Billing Management Routes ============
router.get('/billing/search', billingManagementController.searchBills);
router.get('/billing/stats', billingManagementController.getBillingStats);
router.get('/billing/monthly-revenue', billingManagementController.getMonthlyRevenue);
router.get('/billing/:id', billingManagementController.getBillById);

// ============ Analytics & Dashboard Routes ============
router.get('/analytics/dashboard', analyticsController.getDashboardMetrics);
router.get('/analytics/top-properties', analyticsController.getTopProperties);
router.get('/analytics/city-revenue', analyticsController.getCityRevenue);
router.get('/analytics/top-hosts', analyticsController.getTopHosts);
router.get('/analytics/page-clicks', analyticsController.getPageClicks);
router.get('/analytics/property-clicks', analyticsController.getPropertyClicks);
router.get('/analytics/user-trace', analyticsController.getUserTrace);
router.get('/analytics/bidding-trace', analyticsController.getBiddingTrace);
router.get('/analytics/reviews', analyticsController.getReviewsAnalytics);
router.get('/analytics/least-viewed', analyticsController.getLeastViewedAreas);

// ============ Admin CRUD Routes (Dedicated) ============
router.use('/flights', adminFlightRoutes);
router.use('/hotels', adminHotelRoutes);
router.use('/cars', adminCarRoutes);
router.use('/users', adminUserRoutes);

// Billing routes
const adminBillRoutes = require('./admin.bills.routes');
router.use('/bills', adminBillRoutes);

// Analytics routes
const adminAnalyticsRoutes = require('./admin.analytics.routes');
router.use('/analytics', adminAnalyticsRoutes);

module.exports = router;

