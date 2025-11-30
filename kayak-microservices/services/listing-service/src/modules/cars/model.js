/**
 * Car Rental Model
 */

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Somalwar1!',
  database: process.env.DB_NAME || 'kayak_listings',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const CarModel = {
  async create(carData) {
    const {
      company_name, brand, model, year, type, transmission,
      seats, daily_rental_price, location, availability_status,
      owner_id, approval_status, images
    } = carData;

    const id = uuidv4();
    const query = `
      INSERT INTO cars 
      (id, owner_id, company_name, brand, model, year, type, transmission, seats, daily_rental_price, location, availability_status, approval_status, images) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.execute(query, [
      id, 
      owner_id || null,
      company_name, 
      brand, 
      model, 
      year, 
      type, 
      transmission,
      seats, 
      daily_rental_price, 
      location, 
      availability_status !== undefined ? availability_status : true,
      approval_status || 'pending',
      images ? JSON.stringify(images) : null
    ]);

    return { id, ...carData };
  },

  async findAll(filters = {}) {
    let query = 'SELECT * FROM cars WHERE deleted_at IS NULL';
    const params = [];

    // Only show approved listings to public (unless admin view)
    if (filters.approval_status) {
      query += ' AND approval_status = ?';
      params.push(filters.approval_status);
    } else {
      // Default: only show approved listings for public search
      query += ' AND approval_status = "approved"';
    }

    if (filters.location) {
      query += ' AND location = ?';
      params.push(filters.location);
    }
    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }
    if (filters.price_max) {
      query += ' AND daily_rental_price <= ?';
      params.push(filters.price_max);
    }
    if (filters.available) {
      query += ' AND availability_status = true';
    }

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM cars WHERE id = ? AND deleted_at IS NULL', 
      [id]
    );
    return rows[0];
  },

  /**
   * Find all cars owned by a specific owner
   */
  async findByOwner(owner_id) {
    const [rows] = await pool.execute(
      'SELECT * FROM cars WHERE owner_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
      [owner_id]
    );
    return rows;
  },

  async update(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];

    if (fields.length === 0) return null;

    const query = `UPDATE cars SET ${fields} WHERE id = ?`;
    await pool.execute(query, values);

    return this.findById(id);
  },

  async delete(id) {
    await pool.execute('UPDATE cars SET deleted_at = NOW() WHERE id = ?', [id]);
    return true;
  },

  async updateStatus(id, status) {
    const query = status === 'active'
      ? 'UPDATE cars SET deleted_at = NULL WHERE id = ?'
      : 'UPDATE cars SET deleted_at = NOW() WHERE id = ?';
    
    await pool.execute(query, [id]);
    return this.findById(id);
  }
};

module.exports = CarModel;

