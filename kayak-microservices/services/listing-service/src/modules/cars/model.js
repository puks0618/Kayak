/**
 * Car Rental Model - Enhanced for Kayak.com-style search
 */

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Somalwar1!',
  database: process.env.DB_NAME || 'kayak_listings',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const CarModel = {
  /**
   * Advanced car search with Kayak.com-style filtering
   * Supports: location, dates, type, transmission, seats, price range, company, sorting
   */
  async search(searchParams) {
    const {
      location,
      pickupDate,
      dropoffDate,
      type, // sedan, suv, economy, luxury, compact, van
      transmission, // automatic, manual
      seats,
      minPrice,
      maxPrice,
      company,
      sortBy = 'price', // price, rating, brand
      sortOrder = 'asc', // asc, desc
      limit = 50,
      offset = 0
    } = searchParams;

    let query = `
      SELECT 
        c.*
      FROM cars c
      WHERE c.availability_status = ?
      AND c.approval_status = ?
    `;

    const params = [1, 'approved'];

    // Location filter (required)
    if (location) {
      query += ' AND c.location LIKE ?';
      params.push(`%${location}%`);
    }

    // Check availability for specific dates
    if (pickupDate && dropoffDate) {
      query += ` 
        AND c.id NOT IN (
          SELECT DISTINCT car_id FROM car_availability 
          WHERE blocked_date >= ? AND blocked_date <= ?
        )
      `;
      params.push(pickupDate, dropoffDate);
    }

    // Type filter
    if (type) {
      query += ' AND c.type = ?';
      params.push(type);
    }

    // Transmission filter
    if (transmission) {
      query += ' AND c.transmission = ?';
      params.push(transmission);
    }

    // Seats filter
    if (seats) {
      query += ' AND c.seats >= ?';
      params.push(parseInt(seats));
    }

    // Price range filter
    if (minPrice) {
      query += ' AND c.daily_rental_price >= ?';
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      query += ' AND c.daily_rental_price <= ?';
      params.push(parseFloat(maxPrice));
    }

    // Company filter
    if (company) {
      query += ' AND c.company_name = ?';
      params.push(company);
    }

    // Group by car id (removed since no aggregation)
    // query += ' GROUP BY c.id';

    // Sorting
    const validSortFields = {
      'price': 'c.daily_rental_price',
      'rating': 'c.rating',
      'brand': 'c.brand'
    };

    const sortField = validSortFields[sortBy] || 'c.daily_rental_price';
    const sortDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortField} ${sortDirection}`;

    // Pagination
    query += ' LIMIT ? OFFSET ?';
    const limitVal = parseInt(limit) || 50;
    const offsetVal = parseInt(offset) || 0;
    params.push(limitVal, offsetVal);

    console.log('[CARS DEBUG] Query:', query);
    console.log('[CARS DEBUG] Params:', JSON.stringify(params));
    console.log('[CARS DEBUG] Param types:', params.map(p => typeof p));

    // TEMPORARY TEST: Try hardcoded query first
    try {
      const [testRows] = await pool.query("SELECT COUNT(*) as total FROM cars");
      console.log('[CARS DEBUG] Test query result:', testRows[0].total, 'cars in database');
    } catch (err) {
      console.error('[CARS DEBUG] Test query failed:', err.message);
    }

    const [rows] = await pool.query(query, params);

    // Parse JSON fields (they might already be objects from mysql2)
    return rows.map(car => ({
      ...car,
      images: car.images ? (typeof car.images === 'string' ? JSON.parse(car.images) : car.images) : [],
      features: car.features ? (typeof car.features === 'string' ? JSON.parse(car.features) : car.features) : []
    }));
  },

  /**
   * Get available car types and count for a location
   */
  async getAvailableTypes(location, pickupDate, dropoffDate) {
    let query = `
      SELECT 
        type,
        COUNT(*) as count,
        MIN(daily_rental_price) as min_price,
        MAX(daily_rental_price) as max_price
      FROM cars
      WHERE availability_status = TRUE 
      AND approval_status = 'approved'
    `;

    const params = [];

    if (location) {
      query += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }

    if (pickupDate && dropoffDate) {
      query += ` 
        AND id NOT IN (
          SELECT car_id FROM car_availability 
          WHERE (blocked_from <= ? AND blocked_until >= ?)
          OR (blocked_from <= ? AND blocked_until >= ?)
        )
      `;
      params.push(dropoffDate, pickupDate, dropoffDate, pickupDate);
    }

    query += ' GROUP BY type ORDER BY count DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Get all rental companies with car count
   */
  async getCompanies(location) {
    let query = `
      SELECT 
        company_name,
        COUNT(*) as car_count,
        AVG(rating) as avg_rating
      FROM cars
      WHERE availability_status = TRUE 
      AND approval_status = 'approved'
    `;

    const params = [];

    if (location) {
      query += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }

    query += ' GROUP BY company_name ORDER BY car_count DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Create a new car listing
   */
  async create(carData) {
    const {
      company_name, brand, model, year, type, fuel_type, transmission,
      seats, doors, baggage_capacity, daily_rental_price, location, 
      availability_status, owner_id, approval_status, images, features,
      mileage_limit, insurance_included, cancellation_policy, description
    } = carData;

    const id = uuidv4();
    const query = `
      INSERT INTO cars 
      (id, owner_id, company_name, brand, model, year, type, fuel_type, transmission, 
       seats, doors, baggage_capacity, daily_rental_price, location, availability_status, 
       approval_status, images, features, mileage_limit, insurance_included, 
       cancellation_policy, description) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.execute(query, [
      id, 
      owner_id || null,
      company_name, 
      brand, 
      model, 
      year, 
      type,
      fuel_type || 'gasoline',
      transmission,
      seats,
      doors || 4,
      baggage_capacity || 2,
      daily_rental_price, 
      location, 
      availability_status !== undefined ? availability_status : true,
      approval_status || 'pending',
      images ? JSON.stringify(images) : null,
      features ? JSON.stringify(features) : null,
      mileage_limit || 0,
      insurance_included || false,
      cancellation_policy || 'Free cancellation up to 48 hours before pickup',
      description || null
    ]);

    return this.findById(id);
  },

  /**
   * Find car by ID
   */
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM cars WHERE id = ?', 
      [id]
    );

    if (rows.length === 0) return null;

    const car = rows[0];
    return {
      ...car,
      images: typeof car.images === 'string' ? JSON.parse(car.images) : (car.images || []),
      features: typeof car.features === 'string' ? JSON.parse(car.features) : (car.features || [])
    };
  },

  /**
   * Find all cars owned by a specific owner
   */
  async findByOwner(owner_id) {
    const [rows] = await pool.execute(
      'SELECT * FROM cars WHERE owner_id = ? ORDER BY created_at DESC',
      [owner_id]
    );

    return rows.map(car => ({
      ...car,
      images: car.images ? JSON.parse(car.images) : [],
      features: car.features ? JSON.parse(car.features) : []
    }));
  },

  /**
   * Update car details
   */
  async update(id, updates) {
    // Handle JSON fields
    if (updates.images && typeof updates.images === 'object') {
      updates.images = JSON.stringify(updates.images);
    }
    if (updates.features && typeof updates.features === 'object') {
      updates.features = JSON.stringify(updates.features);
    }

    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];

    if (fields.length === 0) return null;

    const query = `UPDATE cars SET ${fields} WHERE id = ?`;
    await pool.execute(query, values);

    return this.findById(id);
  },

  /**
   * Soft delete a car
   */
  async delete(id) {
    await pool.execute('DELETE FROM cars WHERE id = ?', [id]);
    return true;
  },

  /**
   * Check if car is available for specific dates
   */
  async checkAvailability(carId, pickupDate, dropoffDate) {
    const query = `
      SELECT COUNT(*) as conflicts
      FROM car_availability
      WHERE car_id = ?
      AND (
        (blocked_from <= ? AND blocked_until >= ?)
        OR (blocked_from <= ? AND blocked_until >= ?)
        OR (blocked_from >= ? AND blocked_until <= ?)
      )
    `;

    const [rows] = await pool.execute(query, [
      carId, dropoffDate, pickupDate, dropoffDate, pickupDate, pickupDate, dropoffDate
    ]);

    return rows[0].conflicts === 0;
  },

  /**
   * Block dates for a car (for booking or maintenance)
   */
  async blockDates(carId, fromDate, toDate, reason = 'booked', bookingId = null) {
    const id = uuidv4();
    const query = `
      INSERT INTO car_availability 
      (id, car_id, blocked_from, blocked_until, reason, booking_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await pool.execute(query, [id, carId, fromDate, toDate, reason, bookingId]);
    return { id, carId, fromDate, toDate, reason };
  },

  /**
   * Get price statistics for analytics
   */
  async getPriceStats(location) {
    const query = `
      SELECT 
        MIN(daily_rental_price) as min_price,
        MAX(daily_rental_price) as max_price,
        AVG(daily_rental_price) as avg_price,
        type
      FROM cars
      WHERE availability_status = TRUE
      AND approval_status = 'approved'
      AND location LIKE ?
      GROUP BY type
    `;

    const [rows] = await pool.execute(query, [`%${location}%`]);
    return rows;
  }
};

module.exports = CarModel;

