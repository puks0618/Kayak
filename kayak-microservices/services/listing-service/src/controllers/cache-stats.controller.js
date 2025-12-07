/**
 * Cache Statistics Controller
 * Provides cache metrics and monitoring endpoints
 */

const cacheMetrics = require('../cache/metrics');
const redis = require('../cache/redis');
const redisFlights = require('../cache/redisFlights');
const redisHotels = require('../cache/redisHotels');

class CacheStatsController {
  /**
   * Get comprehensive cache statistics
   * GET /api/listings/admin/cache/stats
   */
  async getStats(req, res) {
    try {
      const stats = cacheMetrics.getStats();
      
      // Get Redis database sizes
      const db0Size = await this.getDbSize(redis);
      const db1Size = await this.getDbSize(redisFlights);
      const db4Size = await this.getDbSize(redisHotels);
      
      const response = {
        ...stats,
        redis: {
          db0: {
            name: 'Cars Only',
            keys: db0Size,
            pattern: 'car_search:*'
          },
          db1: {
            name: 'Flights',
            keys: db1Size,
            pattern: 'flight_search:*'
          },
          db4: {
            name: 'Hotels',
            keys: db4Size,
            pattern: 'hotel_search:*'
          }
        }
      };
      
      res.json(response);
    } catch (error) {
      console.error('Get cache stats error:', error);
      res.status(500).json({ error: 'Failed to get cache statistics' });
    }
  }

  /**
   * Get database size from Redis client
   */
  async getDbSize(redisClient) {
    try {
      if (!redisClient.isConnected || !redisClient.client) return 0;
      const size = await redisClient.client.dbSize();
      return size;
    } catch (error) {
      console.error('Get DB size error:', error);
      return 0;
    }
  }

  /**
   * Reset cache metrics
   * POST /api/listings/admin/cache/reset
   */
  async resetMetrics(req, res) {
    try {
      cacheMetrics.reset();
      res.json({ 
        success: true,
        message: 'Cache metrics have been reset' 
      });
    } catch (error) {
      console.error('Reset metrics error:', error);
      res.status(500).json({ error: 'Failed to reset metrics' });
    }
  }

  /**
   * Get cache health status
   * GET /api/listings/admin/cache/health
   */
  async getHealth(req, res) {
    try {
      const isDb0Connected = redis.isConnected;
      const isDb1Connected = redisFlights.isConnected;
      const isDb4Connected = redisHotels.isConnected;
      
      const health = {
        status: isDb0Connected && isDb1Connected && isDb4Connected ? 'healthy' : 'degraded',
        databases: {
          db0: {
            name: 'Cars Only',
            connected: isDb0Connected,
            status: isDb0Connected ? 'up' : 'down'
          },
          db1: {
            name: 'Flights',
            connected: isDb1Connected,
            status: isDb1Connected ? 'up' : 'down'
          },
          db4: {
            name: 'Hotels',
            connected: isDb4Connected,
            status: isDb4Connected ? 'up' : 'down'
          }
        },
        timestamp: new Date().toISOString()
      };
      
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      console.error('Get cache health error:', error);
      res.status(500).json({ 
        status: 'error',
        error: 'Failed to check cache health' 
      });
    }
  }
}

module.exports = new CacheStatsController();
