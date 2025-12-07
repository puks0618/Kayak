/**
 * Billing Model
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

const BillingModel = {
  async create(billingData) {
    const {
      booking_id, user_id, amount, tax, total,
      payment_method, status, invoice_details
    } = billingData;

    const id = uuidv4();
    const query = `
      INSERT INTO billing 
      (id, booking_id, user_id, amount, tax, total, payment_method, status, invoice_details) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.execute(query, [
      id, booking_id, user_id, amount, tax, total,
      payment_method, status || 'pending', JSON.stringify(invoice_details)
    ]);

    return { id, ...billingData };
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM billing WHERE id = ?', [id]);
    return rows[0];
  },

  async findByBookingId(bookingId) {
    const [rows] = await pool.execute('SELECT * FROM billing WHERE booking_id = ?', [bookingId]);
    return rows[0];
  },

  async updateStatus(id, status) {
    await pool.execute('UPDATE billing SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  }
};

module.exports = BillingModel;

