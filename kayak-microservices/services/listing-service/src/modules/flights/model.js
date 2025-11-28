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
  async create(flightData) {
    const {
      flight_code, airline, departure_airport, arrival_airport,
      departure_time, arrival_time, duration, price, total_seats,
      class: flightClass
    } = flightData;

    const id = uuidv4();
    const query = `
      INSERT INTO flights 
      (id, flight_code, airline, departure_airport, arrival_airport, departure_time, arrival_time, duration, price, total_seats, class) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.execute(query, [
      id, flight_code, airline, departure_airport, arrival_airport,
      departure_time, arrival_time, duration, price, total_seats, flightClass
    ]);

    return { id, ...flightData };
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
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];

    if (fields.length === 0) return null;

    const query = `UPDATE flights SET ${fields} WHERE id = ?`;
    await pool.execute(query, values);

    return this.findById(id);
  },

  async delete(id) {
    await pool.execute('DELETE FROM flights WHERE id = ?', [id]);
    return true;
  },

  /**
   * Advanced search with filters, sorting, and pagination
   */
  async search(filters) {
    let query = `
      SELECT 
        f.*,
        dep.name as departure_airport_name,
        dep.city as departure_city,
        arr.name as arrival_airport_name,
        arr.city as arrival_city
      FROM flights f
      LEFT JOIN airports dep ON f.departure_airport = dep.iata_code
      LEFT JOIN airports arr ON f.arrival_airport = arr.iata_code
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
      query += ' AND f.cabin_class = ?';
      params.push(filters.cabinClass);
    }
    if (filters.directOnly) {
      query += ' AND f.stops = 0';
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
        f.*,
        dep.name as departure_airport_name,
        dep.city as departure_city,
        arr.name as arrival_airport_name,
        arr.city as arrival_city
      FROM flights f
      LEFT JOIN airports dep ON f.departure_airport = dep.iata_code
      LEFT JOIN airports arr ON f.arrival_airport = arr.iata_code
      WHERE f.is_deal = 1
        AND f.price <= ?
        AND f.cabin_class = ?
        AND f.departure_time >= NOW()
      ORDER BY f.discount_percent DESC, f.price ASC
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
        frs.*,
        dep.name as origin_airport_name,
        dep.city as origin_city,
        arr.name as destination_airport_name
      FROM flight_routes_summary frs
      LEFT JOIN airports dep ON frs.origin_airport = dep.iata_code
      LEFT JOIN airports arr ON frs.destination_airport = arr.iata_code
      WHERE 1=1
    `;
    const params = [];

    if (options.origin) {
      query += ' AND frs.origin_airport = ?';
      params.push(options.origin);
    }

    query += ' ORDER BY frs.min_price ASC LIMIT ?';
    params.push(options.limit);

    const [routes] = await pool.query(query, params);
    return routes;
  }
};

module.exports = FlightModel;

