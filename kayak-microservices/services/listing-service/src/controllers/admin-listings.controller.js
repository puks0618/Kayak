/**
 * Admin Listings Controller
 * Handles admin operations for approving/rejecting owner listings
 */

const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Somalwar1!',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

class AdminListingsController {
  /**
   * Get all pending car listings
   */
  async getPendingCars(req, res) {
    try {
      const [cars] = await pool.execute(`
        SELECT c.*, u.email as owner_email, u.first_name, u.last_name
        FROM kayak_listings.cars c
        LEFT JOIN kayak_users.users u ON c.owner_id = u.id
        WHERE c.approval_status = 'pending' AND c.deleted_at IS NULL
        ORDER BY c.created_at DESC
      `);
      
      res.json({ 
        cars,
        count: cars.length 
      });
    } catch (error) {
      console.error('Get pending cars error:', error);
      res.status(500).json({ error: 'Failed to get pending cars' });
    }
  }

  /**
   * Get all pending hotel listings
   */
  async getPendingHotels(req, res) {
    try {
      const [hotels] = await pool.execute(`
        SELECT h.*, u.email as owner_email, u.first_name, u.last_name
        FROM kayak_listings.hotels h
        LEFT JOIN kayak_users.users u ON h.owner_id = u.id
        WHERE h.approval_status = 'pending' AND h.deleted_at IS NULL
        ORDER BY h.created_at DESC
      `);
      
      res.json({ 
        hotels,
        count: hotels.length 
      });
    } catch (error) {
      console.error('Get pending hotels error:', error);
      res.status(500).json({ error: 'Failed to get pending hotels' });
    }
  }

  /**
   * Get all pending listings (cars + hotels combined)
   */
  async getAllPending(req, res) {
    try {
      const [cars] = await pool.execute(`
        SELECT c.*, 'car' as listing_type, u.email as owner_email, u.first_name, u.last_name
        FROM kayak_listings.cars c
        LEFT JOIN kayak_users.users u ON c.owner_id = u.id
        WHERE c.approval_status = 'pending' AND c.deleted_at IS NULL
      `);
      
      const [hotels] = await pool.execute(`
        SELECT h.*, 'hotel' as listing_type, u.email as owner_email, u.first_name, u.last_name
        FROM kayak_listings.hotels h
        LEFT JOIN kayak_users.users u ON h.owner_id = u.id
        WHERE h.approval_status = 'pending' AND h.deleted_at IS NULL
      `);
      
      const allPending = [...cars, ...hotels].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      res.json({ 
        pending_listings: allPending,
        count: allPending.length,
        breakdown: {
          cars: cars.length,
          hotels: hotels.length
        }
      });
    } catch (error) {
      console.error('Get all pending error:', error);
      res.status(500).json({ error: 'Failed to get pending listings' });
    }
  }

  /**
   * Approve or reject a car listing
   */
  async approveCarListing(req, res) {
    try {
      const car_id = req.params.id;
      const { status, admin_comment } = req.body;
      
      // Validate status
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ 
          error: 'Invalid status. Must be "approved" or "rejected"' 
        });
      }

      // Check if car exists
      const [cars] = await pool.execute(
        'SELECT id, owner_id FROM kayak_listings.cars WHERE id = ? AND deleted_at IS NULL',
        [car_id]
      );

      if (cars.length === 0) {
        return res.status(404).json({ error: 'Car listing not found' });
      }

      // Update approval status
      await pool.execute(`
        UPDATE kayak_listings.cars 
        SET 
          approval_status = ?,
          admin_comment = ?,
          approved_at = NOW(),
          approved_by = ?
        WHERE id = ?
      `, [status, admin_comment || null, req.user.id, car_id]);

      res.json({ 
        message: `Car listing ${status} successfully`,
        car_id,
        status
      });

      // TODO: Send notification to owner via Kafka
      // kafka.send('listing.status.updated', { car_id, status, owner_id: cars[0].owner_id })

    } catch (error) {
      console.error('Approve car error:', error);
      res.status(500).json({ error: 'Failed to approve car listing' });
    }
  }

  /**
   * Approve or reject a hotel listing
   */
  async approveHotelListing(req, res) {
    try {
      const hotel_id = req.params.id;
      const { status, admin_comment } = req.body;
      
      // Validate status
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ 
          error: 'Invalid status. Must be "approved" or "rejected"' 
        });
      }

      // Check if hotel exists
      const [hotels] = await pool.execute(
        'SELECT id, owner_id FROM kayak_listings.hotels WHERE id = ? AND deleted_at IS NULL',
        [hotel_id]
      );

      if (hotels.length === 0) {
        return res.status(404).json({ error: 'Hotel listing not found' });
      }

      // Update approval status
      await pool.execute(`
        UPDATE kayak_listings.hotels 
        SET 
          approval_status = ?,
          admin_comment = ?,
          approved_at = NOW(),
          approved_by = ?
        WHERE id = ?
      `, [status, admin_comment || null, req.user.id, hotel_id]);

      res.json({ 
        message: `Hotel listing ${status} successfully`,
        hotel_id,
        status
      });

      // TODO: Send notification to owner via Kafka

    } catch (error) {
      console.error('Approve hotel error:', error);
      res.status(500).json({ error: 'Failed to approve hotel listing' });
    }
  }

  /**
   * Get all cars (optionally filtered by status)
   */
  async getAllCars(req, res) {
    try {
      const { status } = req.query;
      
      let query = `
        SELECT c.*, u.email as owner_email, u.first_name, u.last_name
        FROM kayak_listings.cars c
        LEFT JOIN kayak_users.users u ON c.owner_id = u.id
        WHERE c.deleted_at IS NULL
      `;
      const params = [];
      
      if (status && ['approved', 'pending', 'rejected'].includes(status)) {
        query += ' AND c.approval_status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY c.created_at DESC';
      
      const [cars] = await pool.execute(query, params);
      
      res.json({ 
        cars,
        count: cars.length,
        filter: status || 'all'
      });
    } catch (error) {
      console.error('Get all cars error:', error);
      res.status(500).json({ error: 'Failed to get cars' });
    }
  }

  /**
   * Get all hotels (optionally filtered by status)
   */
  async getAllHotels(req, res) {
    try {
      const { status } = req.query;
      
      let query = `
        SELECT h.*, u.email as owner_email, u.first_name, u.last_name
        FROM kayak_listings.hotels h
        LEFT JOIN kayak_users.users u ON h.owner_id = u.id
        WHERE h.deleted_at IS NULL
      `;
      const params = [];
      
      if (status && ['approved', 'pending', 'rejected'].includes(status)) {
        query += ' AND h.approval_status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY h.created_at DESC';
      
      const [hotels] = await pool.execute(query, params);
      
      res.json({ 
        hotels,
        count: hotels.length,
        filter: status || 'all'
      });
    } catch (error) {
      console.error('Get all hotels error:', error);
      res.status(500).json({ error: 'Failed to get hotels' });
    }
  }

  /**
   * Get admin dashboard statistics
   */
  async getAdminStats(req, res) {
    try {
      // Car statistics
      const [carStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM kayak_listings.cars 
        WHERE deleted_at IS NULL
      `);

      // Hotel statistics
      const [hotelStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM kayak_listings.hotels 
        WHERE deleted_at IS NULL
      `);

      // Recent pending listings
      const [recentPending] = await pool.execute(`
        SELECT 'car' as type, id, brand, model, created_at, owner_id 
        FROM kayak_listings.cars 
        WHERE approval_status = 'pending' AND deleted_at IS NULL
        UNION ALL
        SELECT 'hotel' as type, id, name as brand, city as model, created_at, owner_id 
        FROM kayak_listings.hotels 
        WHERE approval_status = 'pending' AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 10
      `);

      // Total bookings and revenue
      const [bookingStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_bookings,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(SUM(platform_commission), 0) as platform_revenue
        FROM kayak_bookings.bookings 
        WHERE status = 'confirmed'
      `);

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
        pending_actions: recentPending,
        revenue: {
          total_bookings: bookingStats[0].total_bookings,
          total_revenue: parseFloat(bookingStats[0].total_revenue),
          platform_commission: parseFloat(bookingStats[0].platform_revenue)
        }
      });

    } catch (error) {
      console.error('Get admin stats error:', error);
      res.status(500).json({ error: 'Failed to get admin statistics' });
    }
  }
}

module.exports = new AdminListingsController();
