/**
 * Redis Configuration for Search Service
 */

module.exports = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 1,
  keyPrefix: 'search:',
  ttl: 300 // 5 minutes for search results
};

