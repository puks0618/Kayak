/**
 * Analytics Controller
 * Provides comprehensive analytics for admin dashboard
 */

const mysql = require('mysql2/promise');

// When running in Docker, use service name. Otherwise, use localhost
const getDBHost = () => {
  return process.env.DB_HOST || 'mysql';  // 'mysql' is the Docker service name
};

const dbConfig = {
  host: getDBHost(),
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Somalwar1!',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

class AnalyticsController {
  async topPropertiesByRevenue(req, res) {
    let connection;
    try {
      connection = await mysql.createConnection({
        ...dbConfig,
        database: 'kayak_bookings'
      });

      const query = `
        SELECT 
          b.listing_id,
          h.hotel_name as name,
          h.city,
          COUNT(b.id) as booking_count,
          SUM(b.owner_earnings) as total_revenue,
          ROUND(AVG(b.owner_earnings), 2) as avg_booking_value,
          YEAR(b.created_at) as year
        FROM bookings b
        LEFT JOIN kayak_listings.hotels h ON b.listing_id = h.hotel_id AND b.listing_type = 'hotel'
        WHERE b.status IN ('completed', 'confirmed')
        GROUP BY b.listing_id, h.hotel_name, h.city, YEAR(b.created_at)
        ORDER BY total_revenue DESC
        LIMIT 10
      `;

      const [rows] = await connection.execute(query);
      res.json({
        success: true,
        data: rows.map(row => ({
          ...row,
          total_revenue: parseFloat(row.total_revenue || 0).toFixed(2),
          avg_booking_value: parseFloat(row.avg_booking_value || 0).toFixed(2)
        }))
      });
    } catch (error) {
      console.error('Top properties error:', error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      if (connection) await connection.end();
    }
  }

  async cityWiseRevenue(req, res) {
    let connection;
    try {
      connection = await mysql.createConnection({
        ...dbConfig,
        database: 'kayak_bookings'
      });

      const query = `
        SELECT 
          h.city,
          COUNT(b.id) as booking_count,
          COUNT(DISTINCT b.listing_id) as property_count,
          SUM(b.owner_earnings) as total_revenue,
          ROUND(AVG(b.owner_earnings), 2) as avg_booking_value,
          YEAR(b.created_at) as year
        FROM bookings b
        LEFT JOIN kayak_listings.hotels h ON b.listing_id = h.hotel_id AND b.listing_type = 'hotel'
        WHERE b.status IN ('completed', 'confirmed')
        GROUP BY h.city, YEAR(b.created_at)
        ORDER BY total_revenue DESC
        LIMIT 15
      `;

      const [rows] = await connection.execute(query);
      res.json({
        success: true,
        data: rows.map(row => ({
          ...row,
          total_revenue: parseFloat(row.total_revenue || 0).toFixed(2),
          avg_booking_value: parseFloat(row.avg_booking_value || 0).toFixed(2)
        }))
      });
    } catch (error) {
      console.error('City revenue error:', error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      if (connection) await connection.end();
    }
  }

  async topHostsByRevenue(req, res) {
    let connection;
    try {
      connection = await mysql.createConnection({
        ...dbConfig,
        database: 'kayak_bookings'
      });

      const query = `
        SELECT 
          b.owner_id,
          u.email as host_email,
          u.first_name,
          u.last_name,
          COUNT(DISTINCT h.hotel_id) as property_count,
          COUNT(b.id) as booking_count,
          SUM(b.owner_earnings) as total_revenue,
          ROUND(AVG(b.owner_earnings), 2) as avg_booking_value,
          DATE(MAX(b.created_at)) as last_booking_date
        FROM bookings b
        JOIN kayak_auth.users u ON b.owner_id = u.id
        LEFT JOIN kayak_listings.hotels h ON b.listing_id = h.hotel_id AND b.listing_type = 'hotel'
        WHERE b.status IN ('completed', 'confirmed')
          AND MONTH(b.created_at) = MONTH(NOW())
          AND YEAR(b.created_at) = YEAR(NOW())
        GROUP BY b.owner_id, u.email, u.first_name, u.last_name
        ORDER BY total_revenue DESC, property_count DESC
        LIMIT 10
      `;

      const [rows] = await connection.execute(query);
      res.json({
        success: true,
        data: rows.map(row => ({
          ...row,
          total_revenue: parseFloat(row.total_revenue || 0).toFixed(2),
          avg_booking_value: parseFloat(row.avg_booking_value || 0).toFixed(2)
        }))
      });
    } catch (error) {
      console.error('Top hosts error:', error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      if (connection) await connection.end();
    }
  }

  async dashboardMetrics(req, res) {
    let bookingsConn, authConn;
    try {
      bookingsConn = await mysql.createConnection({
        ...dbConfig,
        database: 'kayak_bookings'
      });
      authConn = await mysql.createConnection({
        ...dbConfig,
        database: 'kayak_auth'
      });

      // Total users by role
      const [users] = await authConn.execute(`
        SELECT role, COUNT(*) as count FROM users GROUP BY role
      `);

      // Booking metrics
      const [bookings] = await bookingsConn.execute(`
        SELECT 
          COUNT(*) as total_bookings,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          SUM(owner_earnings) as total_revenue,
          SUM(platform_commission) as platform_revenue
        FROM bookings WHERE status IN ('completed', 'confirmed')
      `);

      // Monthly metrics
      const [monthlyMetrics] = await bookingsConn.execute(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as booking_count,
          SUM(owner_earnings) as owner_revenue,
          SUM(platform_commission) as platform_revenue
        FROM bookings
        WHERE status IN ('completed', 'confirmed')
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month DESC
        LIMIT 12
      `);

      // Top performing hotels this month
      const [topHotels] = await bookingsConn.execute(`
        SELECT 
          h.hotel_name,
          h.city,
          COUNT(b.id) as booking_count,
          SUM(b.owner_earnings) as revenue
        FROM bookings b
        JOIN kayak_listings.hotels h ON b.listing_id = h.hotel_id
        WHERE b.status IN ('completed', 'confirmed')
          AND MONTH(b.created_at) = MONTH(NOW())
        GROUP BY b.listing_id, h.hotel_name, h.city
        ORDER BY revenue DESC
        LIMIT 5
      `);

      res.json({
        success: true,
        data: {
          users: users.reduce((acc, u) => ({ ...acc, [u.role]: u.count }), {}),
          bookings: {
            ...bookings[0],
            total_revenue: parseFloat(bookings[0].total_revenue || 0).toFixed(2),
            platform_revenue: parseFloat(bookings[0].platform_revenue || 0).toFixed(2)
          },
          monthly: monthlyMetrics.map(m => ({
            ...m,
            owner_revenue: parseFloat(m.owner_revenue || 0).toFixed(2),
            platform_revenue: parseFloat(m.platform_revenue || 0).toFixed(2)
          })),
          topHotels: topHotels.map(h => ({
            ...h,
            revenue: parseFloat(h.revenue || 0).toFixed(2)
          }))
        }
      });
    } catch (error) {
      console.error('Dashboard metrics error:', error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      if (bookingsConn) await bookingsConn.end();
      if (authConn) await authConn.end();
    }
  }
}

module.exports = new AnalyticsController();
