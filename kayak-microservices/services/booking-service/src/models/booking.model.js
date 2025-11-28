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

