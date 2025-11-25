/**
 * Admin Controller
 * Handles administrative operations with RBAC
 */

/**
 * Admin Controller
 * Handles administrative operations with RBAC
 */

const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Somalwar1!',
  database: process.env.DB_NAME || 'kayak_users', // Default DB
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

class AdminController {
  async getDashboard(req, res) {
    try {
      const [users] = await pool.execute('SELECT COUNT(*) as count FROM kayak_users.users');
      const [bookings] = await pool.execute('SELECT COUNT(*) as count FROM kayak_bookings.bookings');
      const [revenue] = await pool.execute('SELECT SUM(total_amount) as total FROM kayak_bookings.bookings WHERE status = "confirmed"');

      res.json({
        dashboard: {
          users: users[0].count,
          bookings: bookings[0].count,
          revenue: revenue[0].total || 0
        }
      });
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({ error: 'Failed to get dashboard' });
    }
  }

  async manageUser(req, res) {
    try {
      const { userId, action, updates } = req.body;

      if (action === 'update') {
        // Dynamic update
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), userId];
        await pool.execute(`UPDATE kayak_users.users SET ${fields} WHERE id = ?`, values);
      } else if (action === 'delete') {
        await pool.execute('DELETE FROM kayak_users.users WHERE id = ?', [userId]);
      }

      res.json({ message: `User ${action} successfully` });
    } catch (error) {
      console.error('Manage user error:', error);
      res.status(500).json({ error: 'Failed to manage user' });
    }
  }

  async getReports(req, res) {
    try {
      const { type } = req.query;
      let results = [];

      if (type === 'top_properties') {
        // Top 10 properties with revenue per year
        const query = `
          SELECT listing_id, listing_type, SUM(total_amount) as revenue 
          FROM kayak_bookings.bookings 
          WHERE status = 'confirmed' 
          GROUP BY listing_id, listing_type 
          ORDER BY revenue DESC 
          LIMIT 10
        `;
        const [rows] = await pool.execute(query);
        results = rows;
      } else if (type === 'city_revenue') {
        // City-wise revenue (Requires joining with listings, simplified here assuming we can get city from billing/invoice or join)
        // For MVP, we'll use a simplified query or mock if cross-db join is too complex without federation
        // Assuming we can join across DBs on same host:
        const query = `
          SELECT h.city, SUM(b.total_amount) as revenue
          FROM kayak_bookings.bookings b
          JOIN kayak_listings.hotels h ON b.listing_id = h.id
          WHERE b.listing_type = 'hotel' AND b.status = 'confirmed'
          GROUP BY h.city
        `;
        const [rows] = await pool.execute(query);
        results = rows;
      } else if (type === 'top_hosts') {
        // 10 hosts/providers with max properties sold last month
        const query = `
          SELECT h.name as provider, COUNT(*) as sold
          FROM kayak_bookings.bookings b
          JOIN kayak_listings.hotels h ON b.listing_id = h.id
          WHERE b.listing_type = 'hotel' 
          AND b.booking_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
          GROUP BY h.name
          ORDER BY sold DESC
          LIMIT 10
        `;
        const [rows] = await pool.execute(query);
        results = rows;
      }

      res.json({ report: results });
    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({ error: 'Failed to get reports' });
    }
  }
}

module.exports = new AdminController();

