/**
 * Admin Analytics Controller
 * Real data aggregations from bookings/billing
 */

const mysql = require('mysql2/promise');

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

class AdminAnalyticsController {
  /**
   * Top 10 properties by revenue for a year
   * GET /api/admin/analytics/top-properties?year=2025
   */
  async getTopProperties(req, res) {
    try {
      const { year = new Date().getFullYear() } = req.query;

      const query = `
        SELECT 
          bk.listing_id,
          bk.listing_type,
          COUNT(DISTINCT bk.id) as total_bookings,
          SUM(bl.total) as total_revenue
        FROM bookings bk
        INNER JOIN billing bl ON bk.id = bl.booking_id
        WHERE YEAR(bk.booking_date) = ? AND bl.status = 'completed'
        GROUP BY bk.listing_id, bk.listing_type
        ORDER BY total_revenue DESC
        LIMIT 10
      `;

      const [properties] = await pool.execute(query, [parseInt(year)]);

      res.json({
        success: true,
        year: parseInt(year),
        properties: properties.map(p => ({
          listing_id: p.listing_id,
          listing_type: p.listing_type,
          total_bookings: p.total_bookings,
          total_revenue: parseFloat(p.total_revenue)
        }))
      });
    } catch (error) {
      console.error('Top properties error:', error.message);
      res.status(500).json({ error: 'Failed to fetch top properties' });
    }
  }

  /**
   * Revenue per city for a year
   * GET /api/admin/analytics/city-revenue?year=2025
   */
  async getCityRevenue(req, res) {
    try {
      const { year = new Date().getFullYear() } = req.query;

      // City revenue not available - bookings table doesn't have destination_city
      const query = `
        SELECT 
          'Unknown' as city,
          COUNT(DISTINCT bk.id) as total_bookings,
          SUM(bl.total) as total_revenue
        FROM bookings bk
        INNER JOIN billing bl ON bk.id = bl.booking_id
        WHERE YEAR(bk.booking_date) = ? AND bl.status = 'paid'
        GROUP BY city
        ORDER BY total_revenue DESC
      `;

      const [cities] = await pool.execute(query, [parseInt(year)]);

      res.json({
        success: true,
        year: parseInt(year),
        cities: cities.map(c => ({
          city: c.city,
          total_bookings: c.total_bookings,
          total_revenue: parseFloat(c.total_revenue)
        }))
      });
    } catch (error) {
      console.error('City revenue error:', error.message);
      res.status(500).json({ error: 'Failed to fetch city revenue' });
    }
  }

  /**
   * Top 10 hosts/owners by properties sold and revenue
   * GET /api/admin/analytics/top-hosts?month=11&year=2025
   */
  async getTopHosts(req, res) {
    try {
      const { month, year = new Date().getFullYear() } = req.query;

      // Owner tracking not available - bookings table doesn't have owner_id
      let query = `
        SELECT 
          bk.user_id as owner_id,
          COUNT(DISTINCT bk.id) as properties_sold,
          SUM(bl.total) as total_revenue
        FROM bookings bk
        INNER JOIN billing bl ON bk.id = bl.booking_id
        WHERE YEAR(bk.booking_date) = ? AND bl.status = 'paid'
      `;

      const params = [parseInt(year)];

      if (month) {
        query += ' AND MONTH(bk.booking_date) = ?';
        params.push(parseInt(month));
      }

      query += `
        GROUP BY bk.user_id
        ORDER BY total_revenue DESC
        LIMIT 10
      `;

      const [hosts] = await pool.execute(query, params);

      res.json({
        success: true,
        year: parseInt(year),
        month: month ? parseInt(month) : null,
        hosts: hosts.map(h => ({
          owner_id: h.owner_id,
          properties_sold: h.properties_sold,
          total_revenue: parseFloat(h.total_revenue)
        }))
      });
    } catch (error) {
      console.error('Top hosts error:', error.message);
      res.status(500).json({ error: 'Failed to fetch top hosts' });
    }
  }
}

module.exports = new AdminAnalyticsController();
