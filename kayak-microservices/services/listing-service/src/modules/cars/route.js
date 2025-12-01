/**
 * Car Routes - Kayak.com Style Car Rental API
 */

const express = require('express');
const router = express.Router();
const carController = require('./controller');

// ===== PUBLIC SEARCH & BROWSE ENDPOINTS =====
// Main car search with filters (location, dates, type, price, etc.)
router.get('/search', carController.search);

// Get available car types for a location
router.get('/types', carController.getTypes);

// Get rental companies for a location
router.get('/companies', carController.getCompanies);

// Get price statistics by type and location
router.get('/price-stats', carController.getPriceStats);

// Get car details by ID
router.get('/:id', carController.getById);

// Check availability for specific dates
router.post('/:id/check-availability', carController.checkAvailability);

// ===== OWNER ENDPOINTS (Require Authentication) =====
// Note: These require JWT authentication middleware (to be added by auth team)
// router.get('/my/listings', authMiddleware, carController.getMyListings);
// router.post('/my/listings', authMiddleware, carController.createListing);
// router.patch('/my/listings/:id', authMiddleware, carController.updateListing);
// router.delete('/my/listings/:id', authMiddleware, carController.deleteListing);

// ===== ADMIN ENDPOINTS (Require Admin Role) =====
// Note: These require admin role middleware (to be added by auth team)
// router.post('/', adminMiddleware, carController.create);
// router.patch('/:id', adminMiddleware, carController.update);
// router.delete('/:id', adminMiddleware, carController.delete);

module.exports = router;

