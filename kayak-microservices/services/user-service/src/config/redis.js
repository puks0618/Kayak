/**
 * Redis Configuration
 */

module.exports = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  keyPrefix: 'user:',
  ttl: 3600 // 1 hour default TTL
};

