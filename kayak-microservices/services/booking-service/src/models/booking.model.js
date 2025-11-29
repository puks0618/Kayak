/**
 * Booking Model
 */

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Somalwar1!',
  database: process.env.DB_NAME || 'kayak_bookings',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const BookingModel = {
  async create(bookingData) {
    const {
      user_id, listing_id, listing_type, status,
      travel_date, total_amount
    } = bookingData;

    const id = uuidv4();
    const query = `
      INSERT INTO bookings 
      (id, user_id, listing_id, listing_type, status, travel_date, total_amount) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.execute(query, [
      id, user_id, listing_id, listing_type, status || 'pending',
      travel_date, total_amount
    ]);

    return { id, ...bookingData };
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [id]);
    return rows[0];
  },

  async findByUserId(userId) {
    const [rows] = await pool.execute('SELECT * FROM bookings WHERE user_id = ? ORDER BY booking_date DESC', [userId]);
    return rows;
  },

  async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      user_id,
      listing_type,
      sortBy = 'booking_date',
      sortOrder = 'desc'
    } = options;

    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }

    if (listing_type) {
      query += ' AND listing_type = ?';
      params.push(listing_type);
    }

    query += ` ORDER BY ${sortBy} ${sortOrder}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const [rows] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM bookings WHERE 1=1';
    const countParams = [];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (user_id) {
      countQuery += ' AND user_id = ?';
      countParams.push(user_id);
    }
    if (listing_type) {
      countQuery += ' AND listing_type = ?';
      countParams.push(listing_type);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    return {
      bookings: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async updateStatus(id, status, paymentId = null) {
    let query = 'UPDATE bookings SET status = ?';
    const params = [status];

    if (paymentId) {
      query += ', payment_id = ?';
      params.push(paymentId);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await pool.execute(query, params);
    return this.findById(id);
  },

  async delete(id) {
    await pool.execute('DELETE FROM bookings WHERE id = ?', [id]);
    return true;
  }
};

module.exports = BookingModel;

