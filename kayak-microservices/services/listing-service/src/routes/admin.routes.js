/**
 * Admin Listings Routes
 * Admins can approve/reject pending listings and view all listings
 * All routes protected by isAdmin middleware at API Gateway level
 */

const express = require('express');
const router = express.Router();
const adminListingsController = require('../controllers/admin-listings.controller');

// Note: req.user is already populated by API Gateway's authenticate + isAdmin middleware
// req.user contains: { id, email, role: 'admin' }

// ===== GET PENDING LISTINGS =====

/**
 * GET /api/admin/listings/cars/pending
 * Get all pending car listings
 */
router.get('/cars/pending', adminListingsController.getPendingCars);

/**
 * GET /api/admin/listings/hotels/pending
 * Get all pending hotel listings
 */
router.get('/hotels/pending', adminListingsController.getPendingHotels);

/**
 * GET /api/admin/listings/pending
 * Get all pending listings (cars + hotels combined)
 */
router.get('/pending', adminListingsController.getAllPending);

// ===== APPROVE/REJECT LISTINGS =====

/**
 * PUT /api/admin/listings/cars/:id/approve
 * Approve or reject a car listing
 * Params: { id: car_id }
 * Body: { status: 'approved' | 'rejected', admin_comment?: string }
 */
router.put('/cars/:id/approve', adminListingsController.approveCarListing);

/**
 * PUT /api/admin/listings/hotels/:id/approve
 * Approve or reject a hotel listing
 * Params: { id: hotel_id }
 * Body: { status: 'approved' | 'rejected', admin_comment?: string }
 */
router.put('/hotels/:id/approve', adminListingsController.approveHotelListing);

// ===== VIEW ALL LISTINGS (ADMIN DASHBOARD) =====

/**
 * GET /api/admin/listings/cars?status=approved|pending|rejected
 * Get all cars (optionally filtered by status)
 * Query: { status?: 'approved' | 'pending' | 'rejected' }
 */
router.get('/cars', adminListingsController.getAllCars);

/**
 * GET /api/admin/listings/hotels?status=approved|pending|rejected
 * Get all hotels (optionally filtered by status)
 * Query: { status?: 'approved' | 'pending' | 'rejected' }
 */
router.get('/hotels', adminListingsController.getAllHotels);

/**
 * GET /api/admin/listings/stats
 * Get admin dashboard statistics
 * Returns: total listings, pending count, approved count, rejected count per type
 */
router.get('/stats', adminListingsController.getAdminStats);

module.exports = router;
