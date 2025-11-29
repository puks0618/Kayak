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
      query += ' AND class = ?';
      params.push(filters.class);
    }

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
   */
  async search(filters) {
    let query = `
      SELECT 
        f.*
      FROM flights f
      WHERE 1=1
    `;
    const params = [];

    // Required filters
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
      query += ' AND f.class = ?';
      params.push(filters.cabinClass);
    }
    if (filters.maxPrice) {
      query += ' AND f.price <= ?';
      params.push(filters.maxPrice);
    }

    // Get total count
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

    const [flights] = await pool.query(query, params);

    return {
      flights,
      total
    };
  },

  /**
   * Find flight deals (discounted flights)
   */
  async findDeals(options) {
    const { maxPrice, limit, cabinClass } = options;
    
    const query = `
      SELECT 
        f.*
      FROM flights f
      WHERE f.price <= ?
        AND f.class = ?
        AND f.departure_time >= NOW()
      ORDER BY f.price ASC
      LIMIT ?
    `;

    const [deals] = await pool.query(query, [maxPrice, cabinClass, limit]);
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

