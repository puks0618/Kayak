/**
 * Flight Model
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
  }
};

module.exports = FlightModel;

