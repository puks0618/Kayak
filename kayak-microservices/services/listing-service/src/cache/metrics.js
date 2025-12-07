/**
 * Cache Metrics Tracker
 * Tracks cache hit/miss rates and performance metrics
 */

class CacheMetrics {
  constructor() {
    this.metrics = {
      cars: { hits: 0, misses: 0, totalTime: 0, requests: 0 },
      flights: { hits: 0, misses: 0, totalTime: 0, requests: 0 },
      hotels: { hits: 0, misses: 0, totalTime: 0, requests: 0 }
    };
    this.startTime = Date.now();
  }

  /**
   * Record a cache hit
   */
  recordHit(type, responseTime) {
    if (this.metrics[type]) {
      this.metrics[type].hits++;
      this.metrics[type].totalTime += responseTime;
      this.metrics[type].requests++;
    }
  }

  /**
   * Record a cache miss
   */
  recordMiss(type, responseTime) {
    if (this.metrics[type]) {
      this.metrics[type].misses++;
      this.metrics[type].totalTime += responseTime;
      this.metrics[type].requests++;
    }
  }

  /**
   * Get hit rate for a specific cache type
   */
  getHitRate(type) {
    const metrics = this.metrics[type];
    if (!metrics || metrics.requests === 0) return 0;
    return (metrics.hits / metrics.requests) * 100;
  }

  /**
   * Get average response time for a cache type
   */
  getAverageResponseTime(type) {
    const metrics = this.metrics[type];
    if (!metrics || metrics.requests === 0) return 0;
    return metrics.totalTime / metrics.requests;
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    
    return {
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      timestamp: new Date().toISOString(),
      caches: {
        cars: {
          hits: this.metrics.cars.hits,
          misses: this.metrics.cars.misses,
          total: this.metrics.cars.requests,
          hitRate: `${this.getHitRate('cars').toFixed(2)}%`,
          avgResponseTime: `${this.getAverageResponseTime('cars').toFixed(2)}ms`
        },
        flights: {
          hits: this.metrics.flights.hits,
          misses: this.metrics.flights.misses,
          total: this.metrics.flights.requests,
          hitRate: `${this.getHitRate('flights').toFixed(2)}%`,
          avgResponseTime: `${this.getAverageResponseTime('flights').toFixed(2)}ms`
        },
        hotels: {
          hits: this.metrics.hotels.hits,
          misses: this.metrics.hotels.misses,
          total: this.metrics.hotels.requests,
          hitRate: `${this.getHitRate('hotels').toFixed(2)}%`,
          avgResponseTime: `${this.getAverageResponseTime('hotels').toFixed(2)}ms`
        }
      },
      overall: {
        totalRequests: this.metrics.cars.requests + this.metrics.flights.requests + this.metrics.hotels.requests,
        totalHits: this.metrics.cars.hits + this.metrics.flights.hits + this.metrics.hotels.hits,
        totalMisses: this.metrics.cars.misses + this.metrics.flights.misses + this.metrics.hotels.misses,
        overallHitRate: this.getOverallHitRate()
      }
    };
  }

  /**
   * Get overall hit rate across all cache types
   */
  getOverallHitRate() {
    const totalHits = this.metrics.cars.hits + this.metrics.flights.hits + this.metrics.hotels.hits;
    const totalRequests = this.metrics.cars.requests + this.metrics.flights.requests + this.metrics.hotels.requests;
    
    if (totalRequests === 0) return '0.00%';
    return `${((totalHits / totalRequests) * 100).toFixed(2)}%`;
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      cars: { hits: 0, misses: 0, totalTime: 0, requests: 0 },
      flights: { hits: 0, misses: 0, totalTime: 0, requests: 0 },
      hotels: { hits: 0, misses: 0, totalTime: 0, requests: 0 }
    };
    this.startTime = Date.now();
  }
}

module.exports = new CacheMetrics();
