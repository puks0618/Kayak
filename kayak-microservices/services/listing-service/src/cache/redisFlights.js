/**
 * Redis Cache for Flight Service
 * Uses Redis DB 1 for flight-specific caching
 */

const redis = require('redis');

class RedisFlightCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = process.env.REDIS_PORT || 6379;
      const redisUrl = `redis://${redisHost}:${redisPort}`;
      
      this.client = redis.createClient({
        url: redisUrl,
        password: process.env.REDIS_PASSWORD,
        database: 1, // Use DB 1 for flight searches
        socket: {
          family: 4, // Force IPv4
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.log('Redis Flight Cache: Max reconnection attempts reached');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      // Handle errors gracefully
      this.client.on('error', (err) => {
        console.error('Redis Flight Cache client error:', err.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('Redis connected for flight searches (DB 1)');
      });

      await this.client.connect();
    } catch (error) {
      console.error('Redis Flight Cache connection error:', error.message);
      this.isConnected = false;
    }
  }

  async get(key) {
    try {
      if (!this.isConnected) return null;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis Flight Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 600) { // 10 minutes default for flight searches
    try {
      if (!this.isConnected) return false;
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis Flight Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.isConnected) return false;
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis Flight Cache delete error:', error);
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

module.exports = new RedisFlightCache();
