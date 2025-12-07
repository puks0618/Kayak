/**
 * Flight Model
 */

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Somalwar1!',
  database: process.env.DB_NAME || 'kayak_listings',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const FlightModel = {
  /**
   * Convert duration string (e.g., "5h 30m") to minutes
   * or return the value if already a number
   */
  parseDuration(duration, departure_time, arrival_time) {
    // If duration is already a number, return it
    if (typeof duration === 'number') {
      return duration;
    }

    // If duration is provided as string, parse it
    if (typeof duration === 'string' && duration.trim()) {
      const hourMatch = duration.match(/(\d+)h/);
      const minMatch = duration.match(/(\d+)m/);
      const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
      const mins = minMatch ? parseInt(minMatch[1]) : 0;
      return hours * 60 + mins;
    }

    // Calculate from departure and arrival times if available
    if (departure_time && arrival_time) {
      const departure = new Date(departure_time);
      const arrival = new Date(arrival_time);
      return Math.round((arrival - departure) / (1000 * 60)); // milliseconds to minutes
    }

    // Default fallback
    return 0;
  },

  async create(flightData) {
    const {
      flight_code, airline, departure_airport, arrival_airport,
      departure_time, arrival_time, duration, price, total_seats,
      class: flightClass
    } = flightData;

    const id = uuidv4();
    
    // Convert duration to minutes
    const durationMinutes = this.parseDuration(duration, departure_time, arrival_time);

    const query = `
      INSERT INTO flights 
      (id, flight_code, airline, departure_airport, arrival_airport, departure_time, arrival_time, duration, price, total_seats, class) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.execute(query, [
      id, flight_code, airline, departure_airport, arrival_airport,
      departure_time, arrival_time, durationMinutes, price, total_seats, flightClass
    ]);

    return { id, ...flightData, duration: durationMinutes };
  },

  async findAll(filters = {}) {
    let query = 'SELECT * FROM flights WHERE 1=1';
    const params = [];

    if (filters.origin) {
      query += ' AND departure_airport = ?';
      params.push(filters.origin);
    }
    if (filters.destination) {
      query += ' AND arrival_airport = ?';
      params.push(filters.destination);
    }
    if (filters.date) {
      query += ' AND DATE(departure_time) = ?';
      params.push(filters.date);
    }
    if (filters.class) {
      query += ' AND cabin_class = ?';
      params.push(filters.class);
    }

    // Add limit to prevent timeout
    const limit = parseInt(filters.limit) || 20;
    query += ` LIMIT ${limit}`;

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM flights WHERE id = ?', [id]);
    return rows[0];
  },

  async update(id, updates) {
    // Convert duration if present
    if (updates.duration !== undefined) {
      updates.duration = this.parseDuration(
        updates.duration, 
        updates.departure_time, 
        updates.arrival_time
      );
    }

    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];

    if (fields.length === 0) return null;

    const query = `UPDATE flights SET ${fields} WHERE id = ?`;
    await pool.execute(query, values);

    return this.findById(id);
  },

  async delete(id) {
    await pool.execute('UPDATE flights SET deleted_at = NOW() WHERE id = ?', [id]);
    return true;
  },

  async updateStatus(id, status) {
    const query = status === 'active'
      ? 'UPDATE flights SET deleted_at = NULL WHERE id = ?'
      : 'UPDATE flights SET deleted_at = NOW() WHERE id = ?';
    
    await pool.execute(query, [id]);
    return this.findById(id);
  },

  /**
   * Advanced search with filters, sorting, and pagination
   * Handles both one-way and round-trip searches
   */
  async search(filters) {
    // Search outbound flights
    let query = `
      SELECT 
        f.*, 'outbound' as flight_type
      FROM flights f
      WHERE 1=1
    `;
    const params = [];

    // Required filters for outbound
    if (filters.origin) {
      query += ' AND f.departure_airport = ?';
      params.push(filters.origin);
    }
    if (filters.destination) {
      query += ' AND f.arrival_airport = ?';
      params.push(filters.destination);
    }
    if (filters.departureDate) {
      query += ' AND DATE(f.departure_time) = ?';
      params.push(filters.departureDate);
    }

    // Optional filters
    if (filters.cabinClass) {
      query += ' AND f.cabin_class = ?';
      params.push(filters.cabinClass);
    }
    if (filters.maxPrice) {
      query += ' AND f.price <= ?';
      params.push(filters.maxPrice);
    }

    // Get total count for outbound
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Add sorting
    const validSortFields = ['price', 'duration', 'departure_time', 'rating'];
    const sortBy = validSortFields.includes(filters.sortBy) ? filters.sortBy : 'price';
    const sortOrder = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY f.${sortBy} ${sortOrder}`;

    // Add pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(filters.limit, filters.offset);

    const [outboundFlights] = await pool.query(query, params);

    // If round trip, also search return flights (destination -> origin)
    let returnFlights = [];
    if (filters.returnDate) {
      let returnQuery = `
        SELECT 
          f.*, 'return' as flight_type
        FROM flights f
        WHERE 1=1
      `;
      const returnParams = [];

      // Swap origin and destination for return flights
      if (filters.destination) {
        returnQuery += ' AND f.departure_airport = ?';
        returnParams.push(filters.destination);
      }
      if (filters.origin) {
        returnQuery += ' AND f.arrival_airport = ?';
        returnParams.push(filters.origin);
      }
      if (filters.returnDate) {
        returnQuery += ' AND DATE(f.departure_time) = ?';
        returnParams.push(filters.returnDate);
      }

      // Same optional filters
      if (filters.cabinClass) {
        returnQuery += ' AND f.cabin_class = ?';
        returnParams.push(filters.cabinClass);
      }
      if (filters.maxPrice) {
        returnQuery += ' AND f.price <= ?';
        returnParams.push(filters.maxPrice);
      }

      returnQuery += ` ORDER BY f.${sortBy} ${sortOrder}`;
      returnQuery += ' LIMIT ? OFFSET ?';
      returnParams.push(filters.limit, filters.offset);

      const [returnResults] = await pool.query(returnQuery, returnParams);
      returnFlights = returnResults;
    }

    return {
      flights: outboundFlights,
      returnFlights: returnFlights,
      total,
      isRoundTrip: !!filters.returnDate
    };
  },

  /**
   * Find flight deals (cheapest flights)
   * Returns cheapest unique destinations from a specific origin
   * Only returns routes with available future flights
   */
  async findDeals(options) {
    const { origin, limit, cabinClass } = options;
    
    // Get cheapest flight per unique destination with available future flights
    let query = `
      SELECT 
        f.*,
        (SELECT COUNT(*) 
         FROM flights 
         WHERE departure_airport = f.departure_airport 
           AND arrival_airport = f.arrival_airport 
           AND departure_time >= NOW()
           AND cabin_class = ?) as available_flights
      FROM flights f
      INNER JOIN (
        SELECT 
          arrival_airport,
          MIN(price) as min_price,
          COUNT(*) as route_count
        FROM flights
        WHERE cabin_class = ?
          AND departure_time >= NOW()
          ${origin ? 'AND departure_airport = ?' : ''}
        GROUP BY arrival_airport
        HAVING route_count >= 5
        ORDER BY min_price ASC
        LIMIT ?
      ) AS unique_dest ON f.arrival_airport = unique_dest.arrival_airport 
        AND f.price = unique_dest.min_price
      WHERE f.departure_time >= NOW()
        AND f.cabin_class = ?
      ORDER BY f.price ASC
      LIMIT ?
    `;

    // Build parameters array based on whether origin is provided
    const params = origin 
      ? [cabinClass, cabinClass, origin, limit, cabinClass, limit]
      : [cabinClass, cabinClass, limit, cabinClass, limit];

    const [deals] = await pool.query(query, params);
    return deals;
  },

  /**
   * Get route summaries for popular destinations
   */
  async getRouteSummaries(options) {
    let query = `
      SELECT 
        departure_airport as origin_airport,
        arrival_airport as destination_airport,
        MIN(price) as min_price,
        COUNT(*) as flight_count
      FROM flights
      WHERE departure_time >= NOW()
    `;
    const params = [];

    if (options.origin) {
      query += ' AND departure_airport = ?';
      params.push(options.origin);
    }

    query += ' GROUP BY departure_airport, arrival_airport';
    query += ' ORDER BY min_price ASC LIMIT ?';
    params.push(options.limit);

    const [routes] = await pool.query(query, params);
    return routes;
  }
};

module.exports = FlightModel;

