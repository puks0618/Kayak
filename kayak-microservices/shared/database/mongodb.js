/**
 * MongoDB Connection Manager for DocumentDB
 */

const { MongoClient } = require('mongodb');
const { buildMongoUri, databases } = require('../config/database');
const fs = require('fs');
const path = require('path');

class MongoDBConnection {
  constructor(database) {
    this.database = database;
    this.client = null;
    this.db = null;
  }

  async connect() {
    if (this.client && this.db) return this.db;

    try {
      const uri = buildMongoUri(this.database);
      
      // DocumentDB SSL/TLS configuration
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        ssl: true,
        sslValidate: false, // Set to true in production with proper CA certificate
        retryWrites: false,
        readPreference: 'secondaryPreferred'
      };

      // Add CA certificate if available (for production)
      const caPath = path.join(__dirname, '../certs/rds-combined-ca-bundle.pem');
      if (fs.existsSync(caPath)) {
        options.sslCA = [fs.readFileSync(caPath)];
        options.sslValidate = true;
      }

      this.client = new MongoClient(uri, options);
      await this.client.connect();
      this.db = this.client.db(this.database);

      console.log(`✓ MongoDB connected to ${this.database}`);
      return this.db;
    } catch (error) {
      console.error(`✗ MongoDB connection error for ${this.database}:`, error.message);
      throw error;
    }
  }

  getCollection(collectionName) {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db.collection(collectionName);
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log(`✓ MongoDB connection to ${this.database} closed`);
    }
  }
}

// Service-specific connections
const connections = {
  listings: new MongoDBConnection(databases.mongodb.listings),
  analytics: new MongoDBConnection(databases.mongodb.analytics),
  logs: new MongoDBConnection(databases.mongodb.logs)
};

module.exports = {
  MongoDBConnection,
  connections
};
