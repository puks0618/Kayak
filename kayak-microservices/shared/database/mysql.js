/**
 * MySQL Connection Pool Manager
 */

const mysql = require('mysql2/promise');
const { mysqlConfig, databases } = require('../config/database');

class MySQLConnection {
  constructor(database) {
    this.database = database;
    this.pool = null;
  }

  async connect() {
    if (this.pool) return this.pool;

    try {
      this.pool = mysql.createPool({
        ...mysqlConfig,
        database: this.database
      });

      // Test connection
      const connection = await this.pool.getConnection();
      console.log(`✓ MySQL connected to ${this.database}`);
      connection.release();

      return this.pool;
    } catch (error) {
      console.error(`✗ MySQL connection error for ${this.database}:`, error.message);
      throw error;
    }
  }

  async query(sql, params) {
    if (!this.pool) await this.connect();
    try {
      const [results] = await this.pool.execute(sql, params);
      return results;
    } catch (error) {
      console.error('MySQL query error:', error.message);
      throw error;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log(`✓ MySQL connection to ${this.database} closed`);
    }
  }
}

// Service-specific connections
const connections = {
  auth: new MySQLConnection(databases.mysql.auth),
  users: new MySQLConnection(databases.mysql.users),
  listings: new MySQLConnection(databases.mysql.listings),
  bookings: new MySQLConnection(databases.mysql.bookings)
};

module.exports = {
  MySQLConnection,
  connections
};
