/**
 * Billing Management Controller
 * Admin operations for viewing and searching bills
 */

const axios = require('axios');
const mysql = require('mysql2/promise');

const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:3005';

// Direct DB connection for complex queries
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

class BillingManagementController {
  /**
   * Search bills with filters (by date, month, user, etc.)
   */
  async searchBills(req, res) {
    try {
      const { 
        date, 
        startDate, 
        endDate, 
        month, 
        year, 
        userId, 
        status,
        minAmount,
        maxAmount,
        page = 1, 
        limit = 20 
      } = req.query;

      let query = `
        SELECT 
          b.id,
          b.booking_id,
          b.user_id,
          b.amount,
          b.tax,
          b.total,
          b.payment_method,
          b.status,
          b.invoice_details,
          b.created_at,
          bk.listing_type,
          bk.listing_id
        FROM billing b
        LEFT JOIN bookings bk ON b.booking_id = bk.id
        WHERE 1=1
      `;
      
      const params = [];

      // Filter by specific date
      if (date) {
        query += ' AND DATE(b.created_at) = ?';
        params.push(date);
      }

      // Filter by date range
      if (startDate && endDate) {
        query += ' AND DATE(b.created_at) BETWEEN ? AND ?';
        params.push(startDate, endDate);
      } else if (startDate) {
        query += ' AND DATE(b.created_at) >= ?';
        params.push(startDate);
      } else if (endDate) {
        query += ' AND DATE(b.created_at) <= ?';
        params.push(endDate);
      }

      // Filter by month and year
      if (month && year) {
        query += ' AND MONTH(b.created_at) = ? AND YEAR(b.created_at) = ?';
        params.push(parseInt(month), parseInt(year));
      } else if (year) {
        query += ' AND YEAR(b.created_at) = ?';
        params.push(parseInt(year));
      }

      // Filter by user
      if (userId) {
        query += ' AND b.user_id = ?';
        params.push(userId);
      }

      // Filter by status
      if (status) {
        query += ' AND b.status = ?';
        params.push(status);
      }

      // Filter by amount range
      if (minAmount) {
        query += ' AND b.total >= ?';
        params.push(parseFloat(minAmount));
      }
      if (maxAmount) {
        query += ' AND b.total <= ?';
        params.push(parseFloat(maxAmount));
      }

      // Get total count
      const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
      const [countResult] = await pool.query(countQuery, params);
      const total = countResult[0].total;

      // Add ordering and pagination
      query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
      const offset = (parseInt(page) - 1) * parseInt(limit);
      params.push(parseInt(limit), offset);

      const [bills] = await pool.query(query, params);

      res.json({
        bills,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Search bills error:', error);
      res.status(500).json({ 
        error: 'Failed to search bills',
        details: error.message
      });
    }
  }

  /**
   * Get bill by ID with full details
   */
  async getBillById(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          b.*,
          bk.listing_type,
          bk.listing_id,
          bk.user_id,
          bk.booking_date,
          bk.check_in_date,
          bk.check_out_date,
          bk.num_guests,
          bk.status as booking_status,
          bk.total_amount as booking_total
        FROM billing b
        LEFT JOIN bookings bk ON b.booking_id = bk.id
        WHERE b.id = ?
      `;

      const [bills] = await pool.query(query, [id]);

      if (bills.length === 0) {
        return res.status(404).json({ error: 'Bill not found' });
      }

      const bill = bills[0];

      // Parse JSON fields if they exist
      if (bill.invoice_details && typeof bill.invoice_details === 'string') {
        try {
          bill.invoice_details = JSON.parse(bill.invoice_details);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }

      res.json({ bill });
    } catch (error) {
      console.error('Get bill error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve bill',
        details: error.message
      });
    }
  }

  /**
   * Get billing statistics
   */
  async getBillingStats(req, res) {
    try {
      const { year, month } = req.query;

      let dateFilter = '';
      const params = [];

      if (year && month) {
        dateFilter = 'WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?';
        params.push(parseInt(year), parseInt(month));
      } else if (year) {
        dateFilter = 'WHERE YEAR(created_at) = ?';
        params.push(parseInt(year));
      }

      const query = `
        SELECT 
          COUNT(*) as total_bills,
          SUM(total) as total_revenue,
          AVG(total) as average_bill,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bills,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bills,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_bills
        FROM billing
        ${dateFilter}
      `;

      const [stats] = await pool.query(query, params);

      res.json({ stats: stats[0] });
    } catch (error) {
      console.error('Get billing stats error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve billing statistics',
        details: error.message
      });
    }
  }

  /**
   * Get monthly revenue report
   */
  async getMonthlyRevenue(req, res) {
    try {
      const { year = new Date().getFullYear() } = req.query;

      const query = `
        SELECT 
          MONTH(created_at) as month,
          COUNT(*) as bill_count,
          SUM(total) as revenue,
          AVG(total) as avg_bill
        FROM billing
        WHERE YEAR(created_at) = ? AND status = 'completed'
        GROUP BY MONTH(created_at)
        ORDER BY month
      `;

      const [monthlyData] = await pool.query(query, [parseInt(year)]);

      // Fill in missing months with zero values
      const months = Array.from({ length: 12 }, (_, i) => {
        const monthData = monthlyData.find(m => m.month === i + 1);
        return {
          month: i + 1,
          monthName: new Date(year, i).toLocaleString('default', { month: 'long' }),
          bill_count: monthData?.bill_count || 0,
          revenue: monthData?.revenue || 0,
          avg_bill: monthData?.avg_bill || 0
        };
      });

      res.json({ year: parseInt(year), months });
    } catch (error) {
      console.error('Get monthly revenue error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve monthly revenue',
        details: error.message
      });
    }
  }
}

module.exports = new BillingManagementController();
