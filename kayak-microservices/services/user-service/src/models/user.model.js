/**
 * User Model
 * interacting with MySQL users table
 */

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

// Database configuration
// Use 127.0.0.1 instead of localhost to avoid DNS resolution issues
const dbConfig = {
  host: process.env.DB_HOST === 'localhost' ? '127.0.0.1' : (process.env.DB_HOST || '127.0.0.1'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Somalwar1!',
  database: process.env.DB_NAME || 'kayak_users',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const UserModel = {
  async create(userData) {
    const {
      ssn, first_name, last_name, address, city, state, zip_code,
      phone, email, password_hash, profile_image_url
    } = userData;

    const id = uuidv4();
    const query = `
      INSERT INTO users 
      (id, ssn, first_name, last_name, address, city, state, zip_code, phone, email, password_hash, profile_image_url) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      id, ssn, first_name, last_name, address, city, state, zip_code,
      phone, email, password_hash, profile_image_url
    ]);

    return { id, ...userData };
  },

  async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  },

  async update(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];

    if (fields.length === 0) return null;

    const query = `UPDATE users SET ${fields} WHERE id = ?`;
    await pool.execute(query, values);

    return this.findById(id);
  },

  async delete(id) {
    // Soft delete
    await pool.execute('UPDATE users SET deleted_at = NOW() WHERE id = ?', [id]);
    return true;
  }
};

module.exports = UserModel;

