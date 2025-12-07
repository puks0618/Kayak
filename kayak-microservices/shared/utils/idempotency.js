/**
 * Idempotency Utilities
 * Ensures operations can be safely retried
 */

class IdempotencyService {
  constructor(cacheClient) {
    this.cache = cacheClient;
    this.ttl = 86400; // 24 hours
  }

  async checkIdempotencyKey(key) {
    if (!this.cache) return null;
    return await this.cache.get(`idempotency:${key}`);
  }

  async setIdempotencyKey(key, response) {
    if (!this.cache) return;
    await this.cache.set(`idempotency:${key}`, JSON.stringify(response), this.ttl);
  }

  async deleteIdempotencyKey(key) {
    if (!this.cache) return;
    await this.cache.del(`idempotency:${key}`);
  }
}

module.exports = IdempotencyService;

