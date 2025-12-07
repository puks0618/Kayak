/**
 * Redis Cache Service
 * Read-through cache for user data
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
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          reconnectStrategy: false // Don't try to reconnect if connection fails
        },
        password: process.env.REDIS_PASSWORD
      });

      // Handle connection errors gracefully - don't crash the service
      this.client.on('error', (err) => {
        console.warn('Redis client error:', err.message);
        this.isConnected = false;
      });

      // Set a timeout for connection attempt
      const connectPromise = this.client.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis connection timeout')), 2000)
      );

      await Promise.race([connectPromise, timeoutPromise]);
      this.isConnected = true;
      console.log('Connected to Redis');
    } catch (error) {
      console.warn('Redis connection failed (continuing without cache):', error.message);
      this.isConnected = false;
      // Don't throw - allow service to continue without Redis
    }
  }

  async get(key) {
    try {
      if (!this.isConnected) return null;
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      if (!this.isConnected) return false;
      await this.client.setEx(key, ttl, value);
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.isConnected) return false;
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
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

