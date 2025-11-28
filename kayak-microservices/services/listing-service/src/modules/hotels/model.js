/**
 * Hotel Model
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

const HotelModel = {
  async create(hotelData) {
    const {
      name, address, city, state, zip_code, star_rating,
      price_per_night, num_rooms, room_type, amenities
    } = hotelData;

    const id = uuidv4();
    const query = `
      INSERT INTO hotels 
      (id, name, address, city, state, zip_code, star_rating, price_per_night, num_rooms, room_type, amenities) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.execute(query, [
      id, name, address, city, state, zip_code, star_rating,
      price_per_night, num_rooms, room_type, JSON.stringify(amenities)
    ]);

    return { id, ...hotelData };
  },

  async findAll(filters = {}) {
    let query = 'SELECT * FROM hotels WHERE 1=1';
    const params = [];

    if (filters.city) {
      query += ' AND city = ?';
      params.push(filters.city);
    }
    if (filters.state) {
      query += ' AND state = ?';
      params.push(filters.state);
    }
    if (filters.price_min) {
      query += ' AND price_per_night >= ?';
      params.push(filters.price_min);
    }
    if (filters.price_max) {
      query += ' AND price_per_night <= ?';
      params.push(filters.price_max);
    }
    if (filters.stars) {
      query += ' AND star_rating >= ?';
      params.push(filters.stars);
    }

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM hotels WHERE id = ?', [id]);
    return rows[0];
  },

  async update(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates).map(val =>
      (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val
    );
    values.push(id);

    if (fields.length === 0) return null;

    const query = `UPDATE hotels SET ${fields} WHERE id = ?`;
    await pool.execute(query, values);

    return this.findById(id);
  },

  async delete(id) {
    await pool.execute('DELETE FROM hotels WHERE id = ?', [id]);
    return true;
  }
};

module.exports = HotelModel;

