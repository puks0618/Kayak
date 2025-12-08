/**
 * MongoDB Atlas Connection for Listing Service
 * Manages connection to MongoDB Atlas for airline reviews
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster1.0ssglwi.mongodb.net/';
const DB_NAME = 'kayak_listings';

class MongoDBAtlas {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.isConnected && this.client) {
        return this.db;
      }

      console.log('Connecting to MongoDB Atlas...');
      this.client = new MongoClient(MONGO_URI, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      await this.client.connect();
      this.db = this.client.db(DB_NAME);
      this.isConnected = true;
      
      console.log(`✓ MongoDB Atlas connected to ${DB_NAME}`);
      return this.db;
    } catch (error) {
      console.error('✗ MongoDB Atlas connection error:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  getDb() {
    if (!this.isConnected || !this.db) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }
    return this.db;
  }

  getCollection(name) {
    return this.getDb().collection(name);
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('✓ MongoDB Atlas connection closed');
    }
  }
}

// Singleton instance
const mongoAtlas = new MongoDBAtlas();

module.exports = mongoAtlas;
