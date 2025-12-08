/**
 * Analytics Controller
 * Handles all analytics and reporting endpoints for admin dashboard
 */

const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Somalwar1!',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
};

const pool = mysql.createPool(dbConfig);

class AnalyticsController {
  /**
   * Report 1: Top 10 Properties (Hotels/Stays) with Revenue per Year
   * GET /api/admin/analytics/top-properties?year=2025
   * NOTE: "Properties" specifically refers to hotels/stays only
   * Cars and flights are not considered "properties" in real estate/hospitality terms
   */
  async getTopProperties(req, res) {
    try {
      const { year } = req.query;
      const currentYear = year || new Date().getFullYear();

      // Query to get top 10 HOTEL properties ONLY
      // "Properties" = Hotels/Stays (physical real estate)
      // Uses LEFT JOIN to include bookings even if hotel details are missing
      const query = `
        SELECT 
          'hotel' as property_type,
          COALESCE(h.name, CONCAT('Property ID: ', SUBSTRING(b.listing_id, 1, 8), '...')) as property_name,
          COALESCE(CONCAT(h.city, ', ', h.state), 'Location Not Available') as location,
          b.listing_id,
          COUNT(b.id) as total_bookings,
          SUM(b.total_amount) as total_revenue,
          AVG(b.total_amount) as avg_booking_value,
          COALESCE(h.star_rating, 0) as star_rating,
          COALESCE(h.rating, 0.0) as review_rating
        FROM kayak_bookings.bookings b
        LEFT JOIN kayak_listings.hotels h ON b.listing_id = h.id
        WHERE b.listing_type = 'hotel' 
          AND b.status IN ('confirmed', 'completed')
          AND YEAR(b.booking_date) = ?
        GROUP BY b.listing_id, h.name, h.city, h.state, h.star_rating, h.rating
        ORDER BY total_revenue DESC
        LIMIT 10
      `;

      const [results] = await pool.execute(query, [currentYear]);

      // Format revenue for display
      const formattedResults = results.map(row => ({
        ...row,
        total_revenue: parseFloat(row.total_revenue).toFixed(2),
        avg_booking_value: parseFloat(row.avg_booking_value).toFixed(2)
      }));

      res.json({
        success: true,
        year: currentYear,
        report_type: 'top_properties',
        count: results.length,
        data: formattedResults,
        summary: {
          total_revenue: results.reduce((sum, row) => sum + parseFloat(row.total_revenue), 0).toFixed(2),
          total_bookings: results.reduce((sum, row) => sum + parseInt(row.total_bookings), 0)
        }
      });
    } catch (error) {
      console.error('Get top properties error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get top properties report',
        message: error.message 
      });
    }
  }

  /**
   * Report 2: City-wise Revenue per Year
   * GET /api/admin/analytics/city-revenue?year=2025
   */
  async getCityRevenue(req, res) {
    try {
      const { year } = req.query;
      const currentYear = year || new Date().getFullYear();

      // Query to get city-wise revenue for hotels and cars
      // Flights are excluded as they span multiple cities
      const query = `
        SELECT 
          h.city,
          h.state,
          COUNT(b.id) as total_bookings,
          SUM(b.total_amount) as total_revenue,
          'hotel' as primary_type
        FROM kayak_bookings.bookings b
        INNER JOIN kayak_listings.hotels h ON b.listing_id = h.id
        WHERE b.listing_type = 'hotel'
          AND b.status IN ('confirmed', 'completed')
          AND YEAR(b.booking_date) = ?
        GROUP BY h.city, h.state
        
        UNION ALL
        
        SELECT 
          c.location as city,
          '' as state,
          COUNT(b.id) as total_bookings,
          SUM(b.total_amount) as total_revenue,
          'car' as primary_type
        FROM kayak_bookings.bookings b
        INNER JOIN kayak_listings.cars c ON b.listing_id = c.id
        WHERE b.listing_type = 'car'
          AND b.status IN ('confirmed', 'completed')
          AND YEAR(b.booking_date) = ?
        GROUP BY c.location
        
        ORDER BY total_revenue DESC
      `;

      const [results] = await pool.execute(query, [currentYear, currentYear]);

      // Consolidate cities that might appear in both hotel and car results
      const cityMap = new Map();
      results.forEach(row => {
        const key = row.city;
        if (cityMap.has(key)) {
          const existing = cityMap.get(key);
          existing.total_bookings += row.total_bookings;
          existing.total_revenue = parseFloat(existing.total_revenue) + parseFloat(row.total_revenue);
        } else {
          cityMap.set(key, {
            city: row.city,
            state: row.state,
            total_bookings: row.total_bookings,
            total_revenue: parseFloat(row.total_revenue)
          });
        }
      });

      const consolidatedResults = Array.from(cityMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .map(row => ({
          ...row,
          total_revenue: row.total_revenue.toFixed(2)
        }));

      res.json({
        success: true,
        year: currentYear,
        report_type: 'city_revenue',
        count: consolidatedResults.length,
        data: consolidatedResults,
        summary: {
          total_cities: consolidatedResults.length,
          total_revenue: consolidatedResults.reduce((sum, row) => sum + parseFloat(row.total_revenue), 0).toFixed(2),
          total_bookings: consolidatedResults.reduce((sum, row) => sum + row.total_bookings, 0)
        }
      });
    } catch (error) {
      console.error('Get city revenue error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get city revenue report',
        message: error.message 
      });
    }
  }

  /**
   * Report 3: Top 10 Hosts/Providers with Maximum Properties Sold Last Month
   * GET /api/admin/analytics/top-providers?period=last_month
   */
  async getTopProviders(req, res) {
    try {
      const { period } = req.query;
      
      // Determine date range
      let dateCondition;
      if (period === 'last_month') {
        dateCondition = 'b.booking_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
      } else if (period === 'last_3_months') {
        dateCondition = 'b.booking_date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)';
      } else {
        dateCondition = 'b.booking_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)'; // Default
      }

      // For now, we'll work with airline names for flights
      // Hotels and cars would need owner_id if available
      const query = `
        SELECT 
          f.airline as provider_name,
          'flight' as provider_type,
          COUNT(DISTINCT b.id) as properties_sold,
          SUM(b.total_amount) as total_revenue,
          COUNT(DISTINCT f.id) as unique_properties
        FROM kayak_bookings.bookings b
        INNER JOIN kayak_listings.flights f ON b.listing_id = f.id
        WHERE b.listing_type = 'flight'
          AND b.status IN ('confirmed', 'completed')
          AND ${dateCondition}
        GROUP BY f.airline
        
        UNION ALL
        
        SELECT 
          h.name as provider_name,
          'hotel' as provider_type,
          COUNT(b.id) as properties_sold,
          SUM(b.total_amount) as total_revenue,
          1 as unique_properties
        FROM kayak_bookings.bookings b
        INNER JOIN kayak_listings.hotels h ON b.listing_id = h.id
        WHERE b.listing_type = 'hotel'
          AND b.status IN ('confirmed', 'completed')
          AND ${dateCondition}
        GROUP BY h.id, h.name
        
        UNION ALL
        
        SELECT 
          c.company_name as provider_name,
          'car' as provider_type,
          COUNT(b.id) as properties_sold,
          SUM(b.total_amount) as total_revenue,
          COUNT(DISTINCT c.id) as unique_properties
        FROM kayak_bookings.bookings b
        INNER JOIN kayak_listings.cars c ON b.listing_id = c.id
        WHERE b.listing_type = 'car'
          AND b.status IN ('confirmed', 'completed')
          AND ${dateCondition}
        GROUP BY c.company_name
        
        ORDER BY properties_sold DESC, total_revenue DESC
        LIMIT 10
      `;

      const [results] = await pool.execute(query);

      const formattedResults = results.map(row => ({
        ...row,
        total_revenue: parseFloat(row.total_revenue).toFixed(2)
      }));

      res.json({
        success: true,
        period: period || 'last_month',
        report_type: 'top_providers',
        count: results.length,
        data: formattedResults,
        summary: {
          total_properties_sold: results.reduce((sum, row) => sum + parseInt(row.properties_sold), 0),
          total_revenue: results.reduce((sum, row) => sum + parseFloat(row.total_revenue), 0).toFixed(2)
        }
      });
    } catch (error) {
      console.error('Get top providers error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get top providers report',
        message: error.message 
      });
    }
  }

  /**
   * Get all analytics reports in one call (dashboard overview)
   * GET /api/admin/analytics/overview
   */
  async getOverview(req, res) {
    try {
      const { year } = req.query;
      const currentYear = year || new Date().getFullYear();

      // Get summary stats for the dashboard
      const summaryQuery = `
        SELECT 
          COUNT(DISTINCT b.id) as total_bookings,
          SUM(b.total_amount) as total_revenue,
          COUNT(DISTINCT b.user_id) as unique_customers,
          AVG(b.total_amount) as avg_booking_value
        FROM kayak_bookings.bookings b
        WHERE b.status IN ('confirmed', 'completed')
          AND YEAR(b.booking_date) = ?
      `;

      const [summaryResults] = await pool.execute(summaryQuery, [currentYear]);

      // Get booking breakdown by type
      const typeBreakdownQuery = `
        SELECT 
          b.listing_type,
          COUNT(b.id) as count,
          SUM(b.total_amount) as revenue
        FROM kayak_bookings.bookings b
        WHERE b.status IN ('confirmed', 'completed')
          AND YEAR(b.booking_date) = ?
        GROUP BY b.listing_type
      `;

      const [typeResults] = await pool.execute(typeBreakdownQuery, [currentYear]);

      // Get monthly trend
      const monthlyTrendQuery = `
        SELECT 
          MONTH(b.booking_date) as month,
          MONTHNAME(b.booking_date) as month_name,
          COUNT(b.id) as bookings,
          SUM(b.total_amount) as revenue
        FROM kayak_bookings.bookings b
        WHERE b.status IN ('confirmed', 'completed')
          AND YEAR(b.booking_date) = ?
        GROUP BY MONTH(b.booking_date), MONTHNAME(b.booking_date)
        ORDER BY month
      `;

      const [monthlyResults] = await pool.execute(monthlyTrendQuery, [currentYear]);

      res.json({
        success: true,
        year: currentYear,
        summary: {
          total_bookings: summaryResults[0].total_bookings || 0,
          total_revenue: parseFloat(summaryResults[0].total_revenue || 0).toFixed(2),
          unique_customers: summaryResults[0].unique_customers || 0,
          avg_booking_value: parseFloat(summaryResults[0].avg_booking_value || 0).toFixed(2)
        },
        booking_breakdown: typeResults.map(row => ({
          type: row.listing_type,
          count: row.count,
          revenue: parseFloat(row.revenue).toFixed(2)
        })),
        monthly_trend: monthlyResults.map(row => ({
          month: row.month,
          month_name: row.month_name,
          bookings: row.bookings,
          revenue: parseFloat(row.revenue).toFixed(2)
        }))
      });
    } catch (error) {
      console.error('Get analytics overview error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get analytics overview',
        message: error.message 
      });
    }
  }
}

module.exports = new AnalyticsController();

