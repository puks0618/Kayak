/**
 * Owner Routes
 * Owners can create, read, update, and delete their own listings
 * All routes protected by isOwner middleware at API Gateway level
 */

const express = require('express');
const router = express.Router();
const carsController = require('../modules/cars/controller');
const hotelsController = require('../modules/hotels/controller');

// Note: req.user is already populated by API Gateway's authenticate + isOwner middleware
// req.user contains: { id, email, role }

// ===== OWNER DASHBOARD =====

/**
 * GET /api/owner/stats
 * Get dashboard statistics for the owner
 */
router.get('/stats', async (req, res) => {
  try {
    const ownerId = req.user.id;
    
    // Get basic stats (mock data for now - can be enhanced later)
    const stats = {
      totalCars: 0,
      activeBookings: 0,
      totalRevenue: 0,
      averageRating: 0,
      recentBookings: []
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching owner stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// ===== OWNER CAR MANAGEMENT =====

/**
 * GET /api/owner/cars
 * Get all cars owned by the authenticated owner
 */
router.get('/cars', carsController.getMyListings);

/**
 * POST /api/owner/cars
 * Create a new car listing (status: pending)
 * Body: { company_name, brand, model, year, type, transmission, seats, daily_rental_price, location, images }
 */
router.post('/cars', carsController.createListing);

/**
 * PUT /api/owner/cars/:id
 * Update own car listing (resets to pending status)
 * Params: { id: car_id }
 * Body: Any car fields to update
 */
router.put('/cars/:id', carsController.updateMyListing);

/**
 * DELETE /api/owner/cars/:id
 * Delete own car listing (soft delete)
 * Params: { id: car_id }
 */
router.delete('/cars/:id', carsController.deleteMyListing);

// ===== OWNER HOTEL MANAGEMENT =====
// TODO: Implement hotel owner methods in hotels.controller.js

/**
 * GET /api/owner/hotels
 * Get all hotels owned by the authenticated owner
 */
// router.get('/hotels', hotelsController.getMyListings);

/**
 * POST /api/owner/hotels
 * Create a new hotel listing (status: pending)
 * Body: { name, city, state, price_per_night, star_rating, amenities, images }
 */
// router.post('/hotels', hotelsController.createListing);

/**
 * PUT /api/owner/hotels/:id
 * Update own hotel listing (resets to pending status)
 * Params: { id: hotel_id }
 * Body: Any hotel fields to update
 */
// router.put('/hotels/:id', hotelsController.updateMyListing);

/**
 * DELETE /api/owner/hotels/:id
 * Delete own hotel listing (soft delete)
 * Params: { id: hotel_id }
 */
// router.delete('/hotels/:id', hotelsController.deleteMyListing);

// ===== OWNER DASHBOARD STATS =====

/**
 * GET /api/owner/stats
 * Get owner's dashboard statistics
 * Returns: total listings, approved count, pending count, rejected count, total bookings, total revenue
 */
router.get('/stats', async (req, res) => {
  try {
    const mysql = require('mysql2/promise');
    const owner_id = req.user.id;

    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Somalwar1!',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

    const pool = mysql.createPool(dbConfig);

    // Count cars by status
    const [carStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM kayak_listings.cars 
      WHERE owner_id = ? AND deleted_at IS NULL
    `, [owner_id]);

    // Count hotels by status
    const [hotelStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM kayak_listings.hotels 
      WHERE owner_id = ? AND deleted_at IS NULL
    `, [owner_id]);

    // Get booking stats and revenue
    const [bookingStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_bookings,
        COALESCE(SUM(owner_earnings), 0) as total_revenue
      FROM kayak_bookings.bookings 
      WHERE owner_id = ?
    `, [owner_id]);

    res.json({
      cars: {
        total: carStats[0].total,
        approved: carStats[0].approved,
        pending: carStats[0].pending,
        rejected: carStats[0].rejected
      },
      hotels: {
        total: hotelStats[0].total,
        approved: hotelStats[0].approved,
        pending: hotelStats[0].pending,
        rejected: hotelStats[0].rejected
      },
      bookings: {
        total: bookingStats[0].total_bookings,
        revenue: parseFloat(bookingStats[0].total_revenue)
      }
    });

  } catch (error) {
    console.error('Get owner stats error:', error);
    res.status(500).json({ error: 'Failed to get owner statistics' });
  }
});

module.exports = router;
