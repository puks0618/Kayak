/**
 * Bookings Model for Owner Service
 * Direct database access for reliable data retrieval
 */

const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Somalwar1!',
  database: 'kayak', // Main kayak database with bookings
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const BookingsModel = {
  /**
   * Get all bookings for a specific owner
   * Filters by owner_id extracted from user headers
   */
  async getOwnerBookings(ownerEmail) {
    try {
      // Get owner's user_id from kayak_users database
      const [ownerResult] = await pool.execute(
        'SELECT id FROM kayak_users.users WHERE email = ? AND role = "owner"',
        [ownerEmail]
      );

      if (!ownerResult || ownerResult.length === 0) {
        console.log(`Owner not found: ${ownerEmail}`);
        return [];
      }

      const ownerId = ownerResult[0].id;

      // Get all listings owned by this owner
      const [hotelListings] = await pool.execute(
        'SELECT id FROM kayak_listings.hotels WHERE owner_id = ?',
        [ownerId]
      );

      const [carListings] = await pool.execute(
        'SELECT id FROM kayak_listings.cars WHERE owner_id = ?',
        [ownerId]
      );

      const listingIds = [
        ...hotelListings.map(h => h.id),
        ...carListings.map(c => c.id)
      ];

      if (listingIds.length === 0) {
        console.log(`No listings found for owner: ${ownerEmail}`);
        return [];
      }

      // Get all bookings for these listings with property details
      const placeholders = listingIds.map(() => '?').join(',');
      const query = `
        SELECT 
          b.id as booking_id,
          b.user_id,
          b.listing_id,
          b.listing_type,
          b.status,
          b.booking_date,
          b.travel_date,
          b.return_date,
          b.rental_days,
          b.total_amount,
          b.created_at,
          CASE 
            WHEN b.listing_type = 'hotel' THEN h.name

            WHEN b.listing_type = 'car' THEN CONCAT(c.brand, ' ', c.model, ' (', c.year, ')')
            WHEN b.listing_type = 'flight' THEN CONCAT(f.airline, ' ', f.flight_code)
          END as listing_name,
          CASE 
            WHEN b.listing_type = 'hotel' THEN CONCAT(h.city, ', ', h.state)
            WHEN b.listing_type = 'car' THEN c.location
            WHEN b.listing_type = 'flight' THEN CONCAT(f.departure_airport, ' → ', f.arrival_airport)
          END as listing_city,
          h.address as hotel_address,
          c.type as car_type,
          c.company_name as car_company,
          f.departure_time as flight_departure,
          f.arrival_time as flight_arrival,
          f.cabin_class as flight_class,
          dep_airport.name as departure_airport_name,
          arr_airport.name as arrival_airport_name
        FROM kayak_bookings.bookings b
        LEFT JOIN kayak_listings.hotels h ON b.listing_type = 'hotel' AND b.listing_id = h.id
        LEFT JOIN kayak_listings.cars c ON b.listing_type = 'car' AND b.listing_id = c.id
        LEFT JOIN kayak_listings.flights f ON b.listing_type = 'flight' AND b.listing_id = f.id
        LEFT JOIN kayak_listings.airports dep_airport ON f.departure_airport = dep_airport.iata_code
        LEFT JOIN kayak_listings.airports arr_airport ON f.arrival_airport = arr_airport.iata_code
        WHERE b.listing_id IN (${placeholders})
        ORDER BY b.booking_date DESC
      `;

      const [bookings] = await pool.execute(query, listingIds);
      return bookings;
    } catch (error) {
      console.error('Error fetching owner bookings:', error);
      throw error;
    }
  },

  /**
   * Get booking statistics for an owner
   */
  async getOwnerStats(ownerEmail) {
    try {
      // Get owner's user_id
      const [ownerResult] = await pool.execute(
        'SELECT id FROM kayak_users.users WHERE email = ? AND role = "owner"',
        [ownerEmail]
      );

      if (!ownerResult || ownerResult.length === 0) {
        return {
          totalBookings: 0,
          totalRevenue: 0,
          totalHotels: 0,
          totalCars: 0,
          byStatus: {}
        };
      }

      const ownerId = ownerResult[0].id;

      // Get hotel and car counts
      const [hotelCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM kayak_listings.hotels WHERE owner_id = ?',
        [ownerId]
      );

      const [carCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM kayak_listings.cars WHERE owner_id = ?',
        [ownerId]
      );

      // Get all listings
      const [hotelIds] = await pool.execute(
        'SELECT id FROM kayak_listings.hotels WHERE owner_id = ?',
        [ownerId]
      );

      const [carIds] = await pool.execute(
        'SELECT id FROM kayak_listings.cars WHERE owner_id = ?',
        [ownerId]
      );

      const listingIds = [
        ...hotelIds.map(h => h.id),
        ...carIds.map(c => c.id)
      ];

      if (listingIds.length === 0) {
        return {
          totalBookings: 0,
          totalRevenue: 0,
          totalHotels: hotelCount[0].count,
          totalCars: carCount[0].count,
          byStatus: {}
        };
      }

      // Get booking stats
      const placeholders = listingIds.map(() => '?').join(',');
      
      const [bookingStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_bookings,
          SUM(total_amount) as total_revenue,
          status,
          COUNT(*) as status_count
        FROM kayak_bookings.bookings
        WHERE listing_id IN (${placeholders})
        GROUP BY status
      `, listingIds);

      const [totalStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_bookings,
          SUM(total_amount) as total_revenue
        FROM kayak_bookings.bookings
        WHERE listing_id IN (${placeholders})
      `, listingIds);

      const byStatus = {};
      bookingStats.forEach(stat => {
        byStatus[stat.status] = stat.status_count;
      });

      return {
        totalBookings: totalStats[0]?.total_bookings || 0,
        totalRevenue: parseFloat(totalStats[0]?.total_revenue || 0),
        totalHotels: hotelCount[0].count,
        totalCars: carCount[0].count,
        byStatus
      };
    } catch (error) {
      console.error('Error fetching owner stats:', error);
      throw error;
    }
  }
};

module.exports = BookingsModel;

