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
 * GET /api/owner/hotels
 * Get all hotels owned by the authenticated owner
 */
router.get('/hotels', async (req, res) => {
  try {
    const mysql = require('mysql2/promise');
    const owner_id = req.user.id;

    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Somalwar1!',
      database: 'kayak_listings',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

    const pool = mysql.createPool(dbConfig);
    
    const [hotels] = await pool.execute(
      'SELECT * FROM hotels WHERE owner_id = ? ORDER BY created_at DESC',
      [owner_id]
    );

    res.json(hotels);
  } catch (error) {
    console.error('Get owner hotels error:', error);
    res.status(500).json({ error: 'Failed to get hotels' });
  }
});

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
router.delete('/hotels/:id', async (req, res) => {
  try {
    const mysql = require('mysql2/promise');
    const owner_id = req.user.id;
    const hotel_id = req.params.id;

    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Somalwar1!',
      database: 'kayak_listings',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

    const pool = mysql.createPool(dbConfig);

    // Verify ownership
    const [hotels] = await pool.execute(
      'SELECT id FROM hotels WHERE id = ? AND owner_id = ?',
      [hotel_id, owner_id]
    );

    if (hotels.length === 0) {
      return res.status(404).json({ error: 'Hotel not found or you do not own this hotel' });
    }

    // Check for active bookings in kayak_bookings database
    const bookingsDbConfig = {
      ...dbConfig,
      database: 'kayak_bookings'
    };
    const bookingsPool = mysql.createPool(bookingsDbConfig);

    const [activeBookings] = await bookingsPool.execute(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE listing_id = ? 
       AND listing_type = 'hotel' 
       AND status IN ('pending', 'confirmed')
       AND travel_date >= CURDATE()`,
      [hotel_id]
    );

    if (activeBookings[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete hotel with active bookings',
        message: `This hotel has ${activeBookings[0].count} active booking(s). Please wait for them to complete or contact support to cancel them first.`,
        activeBookings: activeBookings[0].count
      });
    }

    // Delete the hotel
    await pool.execute('DELETE FROM hotels WHERE id = ?', [hotel_id]);

    res.json({ message: 'Hotel deleted successfully' });
  } catch (error) {
    console.error('Delete hotel error:', error);
    res.status(500).json({ error: 'Failed to delete hotel' });
  }
});

/**
 * GET /api/owner/bookings
 * Get all bookings for owner's properties
 */
router.get('/bookings', async (req, res) => {
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

    // Get bookings for cars
    const [carBookings] = await pool.execute(`
      SELECT 
        b.*,
        c.model as listing_name,
        c.location as listing_city,
        u.email as user_email
      FROM kayak_bookings.bookings b
      INNER JOIN kayak_listings.cars c ON b.listing_id = c.id AND b.listing_type = 'car'
      LEFT JOIN kayak_auth.users u ON b.user_id = u.id
      WHERE c.owner_id = ?
      ORDER BY b.created_at DESC
    `, [owner_id]);

    // Get bookings for hotels
    const [hotelBookings] = await pool.execute(`
      SELECT 
        b.*,
        h.name as listing_name,
        h.city as listing_city,
        u.email as user_email
      FROM kayak_bookings.bookings b
      INNER JOIN kayak_listings.hotels h ON b.listing_id = h.id AND b.listing_type = 'hotel'
      LEFT JOIN kayak_auth.users u ON b.user_id = u.id
      WHERE h.owner_id = ?
      ORDER BY b.created_at DESC
    `, [owner_id]);

    // Combine and sort by date
    const allBookings = [...carBookings, ...hotelBookings].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    res.json(allBookings);
  } catch (error) {
    console.error('Get owner bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

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
      WHERE owner_id = ?
    `, [owner_id]);

    // Count hotels by status
    const [hotelStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM kayak_listings.hotels 
      WHERE owner_id = ?
    `, [owner_id]);

    // Get booking stats and revenue
    const [bookingStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_bookings,
        COALESCE(SUM(b.total_amount), 0) as total_revenue
      FROM kayak_bookings.bookings b
      LEFT JOIN kayak_listings.hotels h ON b.listing_id = h.id AND b.listing_type = 'hotel'
      LEFT JOIN kayak_listings.cars c ON b.listing_id = c.id AND b.listing_type = 'car'
      WHERE (h.owner_id = ? OR c.owner_id = ?)
    `, [owner_id, owner_id]);

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
