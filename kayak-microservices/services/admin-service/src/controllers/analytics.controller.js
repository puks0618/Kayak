/**
 * Analytics Controller
 * Admin dashboard analytics and reports
 */

const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Somalwar1!',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

class AnalyticsController {
  /**
   * Get top 10 properties with revenue per year
   */
  async getTopProperties(req, res) {
    try {
      const { year = new Date().getFullYear(), limit = 10 } = req.query;

      const query = `
        SELECT 
          bk.listing_type,
          bk.listing_id,
          COUNT(bk.id) as booking_count,
          SUM(b.total) as total_revenue,
          AVG(b.total) as avg_revenue
        FROM kayak_bookings.bookings bk
        JOIN kayak_bookings.billing b ON bk.id = b.booking_id
        WHERE YEAR(bk.booking_date) = ? 
          AND b.status = 'paid'
        GROUP BY bk.listing_type, bk.listing_id
        ORDER BY total_revenue DESC
        LIMIT ?
      `;

      const [properties] = await pool.query(query, [parseInt(year), parseInt(limit)]);

      // Enhance with property names (simplified - in production would join with listing tables)
      const enhanced = properties.map((p, index) => ({
        ...p,
        rank: index + 1,
        property_name: `${p.listing_type.charAt(0).toUpperCase() + p.listing_type.slice(1)} #${p.listing_id.substring(0, 8)}`
      }));

      res.json({
        year: parseInt(year),
        properties: enhanced
      });
    } catch (error) {
      console.error('Get top properties error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve top properties',
        details: error.message
      });
    }
  }

  /**
   * Get city-wise revenue per year
   */
  async getCityRevenue(req, res) {
    try {
      const { year = new Date().getFullYear() } = req.query;

      // This query would ideally join with hotels/flights/cars tables to get city info
      // For now, we'll use a simplified approach
      const query = `
        SELECT 
          'Sample City' as city,
          COUNT(bk.id) as booking_count,
          SUM(b.total) as total_revenue
        FROM kayak_bookings.bookings bk
        JOIN kayak_bookings.billing b ON bk.id = b.booking_id
        WHERE YEAR(bk.booking_date) = ? 
          AND b.status = 'paid'
        GROUP BY bk.listing_type
      `;

      const [cities] = await pool.query(query, [parseInt(year)]);

      // In a real scenario, we'd join with the listings database to get actual city data
      // For now, return aggregated data
      res.json({
        year: parseInt(year),
        cities: cities.length > 0 ? cities : [
          { city: 'San Francisco', booking_count: 0, total_revenue: 0 },
          { city: 'New York', booking_count: 0, total_revenue: 0 },
          { city: 'Los Angeles', booking_count: 0, total_revenue: 0 }
        ]
      });
    } catch (error) {
      console.error('Get city revenue error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve city revenue',
        details: error.message
      });
    }
  }

  /**
   * Get top 10 hosts/providers with maximum properties sold last month
   */
  async getTopHosts(req, res) {
    try {
      const { limit = 10 } = req.query;

      const query = `
        SELECT 
          bk.listing_type,
          bk.listing_id,
          COUNT(bk.id) as properties_sold,
          SUM(b.total) as total_revenue
        FROM kayak_bookings.bookings bk
        JOIN kayak_bookings.billing b ON bk.id = b.booking_id
        WHERE bk.booking_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
          AND b.status = 'paid'
        GROUP BY bk.listing_type, bk.listing_id
        ORDER BY properties_sold DESC, total_revenue DESC
        LIMIT ?
      `;

      const [hosts] = await pool.query(query, [parseInt(limit)]);

      const enhanced = hosts.map((h, index) => ({
        ...h,
        rank: index + 1,
        host_name: `Host ${h.listing_id.substring(0, 8)}`,
        provider_type: h.listing_type
      }));

      res.json({ hosts: enhanced });
    } catch (error) {
      console.error('Get top hosts error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve top hosts',
        details: error.message
      });
    }
  }

  /**
   * Get dashboard overview metrics
   */
  async getDashboardMetrics(req, res) {
    try {
      // Total users - use kayak_users database
      let totalUsers = 0;
      try {
        const [usersResult] = await pool.query(
          'SELECT COUNT(*) as count FROM kayak_users.users'
        );
        totalUsers = usersResult[0].count || 0;
      } catch (err) {
        console.log('Users table not found, using 0');
      }

      // Total bookings
      const [bookingsResult] = await pool.query(
        'SELECT COUNT(*) as count FROM kayak_bookings.bookings'
      );

      // Total revenue - use 'paid' status
      const [revenueResult] = await pool.query(
        `SELECT SUM(total) as revenue FROM kayak_bookings.billing 
         WHERE status = 'paid'`
      );

      // Total listings (flights, hotels, cars) - no deleted_at column
      const [flightsResult] = await pool.query(
        'SELECT COUNT(*) as count FROM kayak_listings.flights'
      );
      const [hotelsResult] = await pool.query(
        'SELECT COUNT(*) as count FROM kayak_listings.hotels'
      );
      const [carsResult] = await pool.query(
        'SELECT COUNT(*) as count FROM kayak_listings.cars'
      );

      // Recent activity (last 30 days)
      const [recentBookings] = await pool.query(
        `SELECT COUNT(*) as count FROM kayak_bookings.bookings 
         WHERE booking_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
      );

      res.json({
        metrics: {
          totalUsers: totalUsers,
          totalBookings: bookingsResult[0].count || 0,
          totalRevenue: parseFloat(revenueResult[0].revenue || 0),
          totalFlights: flightsResult[0].count || 0,
          totalHotels: hotelsResult[0].count || 0,
          totalCars: carsResult[0].count || 0,
          totalListings: (flightsResult[0].count || 0) + (hotelsResult[0].count || 0) + (carsResult[0].count || 0),
          recentBookings: recentBookings[0].count || 0
        }
      });
    } catch (error) {
      console.error('Get dashboard metrics error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve dashboard metrics',
        details: error.message
      });
    }
  }

  /**
   * Get page click analytics (mock data for now, would use actual analytics service)
   */
  async getPageClicks(req, res) {
    try {
      // In production, this would query the analytics service or analytics database
      // For now, return sample data structure
      const pageClicks = [
        { page: '/search', clicks: 1250, uniqueVisitors: 890 },
        { page: '/flights', clicks: 980, uniqueVisitors: 750 },
        { page: '/hotels', clicks: 865, uniqueVisitors: 620 },
        { page: '/cars', clicks: 420, uniqueVisitors: 310 },
        { page: '/booking', clicks: 650, uniqueVisitors: 580 },
        { page: '/profile', clicks: 320, uniqueVisitors: 280 }
      ];

      res.json({ pageClicks });
    } catch (error) {
      console.error('Get page clicks error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve page clicks',
        details: error.message
      });
    }
  }

  /**
   * Get property click analytics
   */
  async getPropertyClicks(req, res) {
    try {
      // Sample data - in production would track actual clicks
      const propertyClicks = [
        { property_id: '1', property_type: 'hotel', property_name: 'Grand Hotel', clicks: 450 },
        { property_id: '2', property_type: 'flight', property_name: 'AA1234', clicks: 380 },
        { property_id: '3', property_type: 'hotel', property_name: 'Beach Resort', clicks: 320 },
        { property_id: '4', property_type: 'car', property_name: 'Toyota Camry', clicks: 280 },
        { property_id: '5', property_type: 'flight', property_name: 'UA5678', clicks: 250 }
      ];

      res.json({ propertyClicks });
    } catch (error) {
      console.error('Get property clicks error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve property clicks',
        details: error.message
      });
    }
  }

  /**
   * Get user trace/journey data
   */
  async getUserTrace(req, res) {
    try {
      const { userId, city } = req.query;

      // Sample user journey data
      const traces = [
        {
          userId: userId || 'user123',
          city: city || 'San Jose, CA',
          journey: [
            { step: 1, action: 'homepage_visit', timestamp: '2025-11-29T10:00:00Z' },
            { step: 2, action: 'search_flights', timestamp: '2025-11-29T10:02:15Z' },
            { step: 3, action: 'view_flight_details', timestamp: '2025-11-29T10:05:30Z' },
            { step: 4, action: 'add_to_cart', timestamp: '2025-11-29T10:07:45Z' },
            { step: 5, action: 'checkout', timestamp: '2025-11-29T10:10:00Z' }
          ]
        }
      ];

      res.json({ traces });
    } catch (error) {
      console.error('Get user trace error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve user trace',
        details: error.message
      });
    }
  }

  /**
   * Get bidding/limited offers tracking
   */
  async getBiddingTrace(req, res) {
    try {
      // Sample bidding data
      const biddingTraces = [
        {
          itemId: 'item123',
          itemName: 'Premium Flight Upgrade',
          bids: [
            { userId: 'user1', amount: 100, timestamp: '2025-11-29T10:00:00Z' },
            { userId: 'user2', amount: 120, timestamp: '2025-11-29T10:05:00Z' },
            { userId: 'user1', amount: 135, timestamp: '2025-11-29T10:08:00Z' }
          ],
          currentBid: 135,
          status: 'active'
        }
      ];

      res.json({ biddingTraces });
    } catch (error) {
      console.error('Get bidding trace error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve bidding trace',
        details: error.message
      });
    }
  }

  /**
   * Get property reviews analytics
   */
  async getReviewsAnalytics(req, res) {
    try {
      // Sample reviews data - in production would query reviews database
      const reviewsData = [
        { property_type: 'hotel', avg_rating: 4.5, total_reviews: 320 },
        { property_type: 'flight', avg_rating: 4.2, total_reviews: 580 },
        { property_type: 'car', avg_rating: 4.3, total_reviews: 210 }
      ];

      res.json({ reviews: reviewsData });
    } catch (error) {
      console.error('Get reviews analytics error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve reviews analytics',
        details: error.message
      });
    }
  }

  /**
   * Get least viewed sections/areas
   */
  async getLeastViewedAreas(req, res) {
    try {
      // Sample data for least viewed areas
      const leastViewed = [
        { section: 'Help Center', views: 45, percentage: 2.1 },
        { section: 'Travel Insurance', views: 78, percentage: 3.5 },
        { section: 'Group Bookings', views: 92, percentage: 4.2 },
        { section: 'Corporate Travel', views: 110, percentage: 5.0 }
      ];

      res.json({ leastViewed });
    } catch (error) {
      console.error('Get least viewed areas error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve least viewed areas',
        details: error.message
      });
    }
  }
}

module.exports = new AnalyticsController();
