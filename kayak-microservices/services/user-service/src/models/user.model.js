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
  },

  async findAll(options = {}) {
    const { page = 1, limit = 20, status = 'all', search = '' } = options;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const params = [];

    // Status filter: 'active' = deleted_at IS NULL, 'inactive' = deleted_at IS NOT NULL
    if (status === 'active') {
      whereClause += ' AND deleted_at IS NULL';
    } else if (status === 'inactive') {
      whereClause += ' AND deleted_at IS NOT NULL';
    }

    // Search filter
    if (search) {
      whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Get paginated users
    const query = `
      SELECT id, ssn, first_name, last_name, email, phone, address, city, state, zip_code,
             profile_image_url, created_at, updated_at, deleted_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limitNum, offset);
    const [users] = await pool.query(query, params);

    return {
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  },

  async updateStatus(id, status) {
    // Status: 'active' = set deleted_at to NULL, 'inactive' = set deleted_at to NOW()
    const query = status === 'active' 
      ? 'UPDATE users SET deleted_at = NULL WHERE id = ?'
      : 'UPDATE users SET deleted_at = NOW() WHERE id = ?';
    
    await pool.execute(query, [id]);
    return this.findById(id);
  }
};

module.exports = UserModel;

