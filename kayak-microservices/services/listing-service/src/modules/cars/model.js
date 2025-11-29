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
      seats, daily_rental_price, location, availability_status
    } = carData;

    const id = uuidv4();
    const query = `
      INSERT INTO cars 
      (id, company_name, brand, model, year, type, transmission, seats, daily_rental_price, location, availability_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.execute(query, [
      id, company_name, brand, model, year, type, transmission,
      seats, daily_rental_price, location, availability_status !== undefined ? availability_status : true
    ]);

    return { id, ...carData };
  },

  async findAll(filters = {}) {
    let query = 'SELECT * FROM cars WHERE 1=1';
    const params = [];

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
    // Note: Date availability check would require checking bookings table, which is in a different service/DB.
    // For MVP, we just check the 'availability_status' flag on the car itself.
    if (filters.available) {
      query += ' AND availability_status = true';
    }

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM cars WHERE id = ?', [id]);
    return rows[0];
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

