/**
 * Redis Cache for Search Service
 */

const redis = require('redis');

class RedisCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD
      });

      await this.client.connect();
      this.isConnected = true;
      console.log('Redis connected for search-service');
    } catch (error) {
      console.error('Redis connection error:', error);
    }
  }

  async get(key) {
    try {
      if (!this.isConnected) return null;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 300) { // 5 minutes default for search
    try {
      if (!this.isConnected) return false;
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async disconnect() {
    if (this.isConnected && this.client) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }
}

module.exports = new RedisCache();

