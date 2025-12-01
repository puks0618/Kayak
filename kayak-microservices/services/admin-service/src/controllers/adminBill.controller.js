/**
 * Admin Bill Controller
 * Search and view billing records
 */

const axios = require('axios');
const mysql = require('mysql2/promise');

const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:3005';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const LISTING_SERVICE_URL = process.env.LISTING_SERVICE_URL || 'http://localhost:3003';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Somalwar1!',
  database: 'kayak_bookings',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

class AdminBillController {
  /**
   * Search bills by date, month, or other filters
   * GET /api/admin/bills?date=2025-11-30
   * GET /api/admin/bills?month=11&year=2025
   * GET /api/admin/bills?status=paid
   */
  async searchBills(req, res) {
    try {
      const { date, month, year, status, userId, page = 1, limit = 20 } = req.query;

      // Simple query first - get all bills
      const countQuery = 'SELECT COUNT(*) as total FROM billing';
      const [countResult] = await pool.query(countQuery);
      const total = countResult[0].total;

      // Get all bills with pagination
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;
      const offset = (pageNum - 1) * limitNum;
      
      const query = `SELECT * FROM billing ORDER BY transaction_date DESC LIMIT ${limitNum} OFFSET ${offset}`;
      const [bills] = await pool.query(query);

      res.json({
        success: true,
        bills,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      });
    } catch (error) {
      console.error('Search bills error:', error.message);
      res.status(500).json({
        error: 'Failed to search bills',
        details: error.message
      });
    }
  }

  /**
   * Get full bill details with user and listing info
   * GET /api/admin/bills/:id
   */
  async getBillById(req, res) {
    try {
      const { id } = req.params;

      // Get bill from database
      const [bills] = await pool.execute('SELECT * FROM billing WHERE id = ?', [id]);
      if (bills.length === 0) {
        return res.status(404).json({ error: 'Bill not found' });
      }

      const bill = bills[0];

      // Get booking details
      let booking = null;
      try {
        const bookingResponse = await axios.get(
          `${BOOKING_SERVICE_URL}/api/bookings/${bill.booking_id}`,
          { headers: { Authorization: req.headers.authorization } }
        );
        booking = bookingResponse.data.booking || bookingResponse.data;
      } catch (err) {
        console.error('Failed to fetch booking:', err.message);
      }

      // Get user details
      let user = null;
      try {
        const userResponse = await axios.get(
          `${AUTH_SERVICE_URL}/api/auth/users/${bill.user_id}`,
          { headers: { Authorization: req.headers.authorization } }
        );
        user = userResponse.data.user || userResponse.data;
      } catch (err) {
        console.error('Failed to fetch user:', err.message);
      }

      // Get listing details if booking exists
      let listing = null;
      if (booking && booking.listing_id && booking.listing_type) {
        try {
          const listingResponse = await axios.get(
            `${LISTING_SERVICE_URL}/api/listings/${booking.listing_type}/${booking.listing_id}`,
            { headers: { Authorization: req.headers.authorization } }
          );
          listing = listingResponse.data;
        } catch (err) {
          console.error('Failed to fetch listing:', err.message);
        }
      }

      // Construct full bill detail
      const billDetail = {
        id: bill.id,
        amount: parseFloat(bill.amount),
        tax: parseFloat(bill.tax || 0),
        total: parseFloat(bill.total),
        payment_method: bill.payment_method,
        status: bill.status,
        payment_date: bill.created_at,
        invoice_details: bill.invoice_details ? JSON.parse(bill.invoice_details) : null,
        user: user ? {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email
        } : null,
        booking: booking ? {
          id: booking.id,
          listing_type: booking.listing_type,
          check_in_date: booking.check_in_date,
          check_out_date: booking.check_out_date,
          num_guests: booking.num_guests,
          status: booking.status
        } : null,
        listing: listing || null
      };

      res.json({
        success: true,
        bill: billDetail
      });
    } catch (error) {
      console.error('Get bill error:', error.message);
      res.status(500).json({
        error: 'Failed to retrieve bill',
        details: error.message
      });
    }
  }
}

module.exports = new AdminBillController();
