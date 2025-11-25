const redis = require('redis');

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;

const client = redis.createClient({
    url: `redis://${redisHost}:${redisPort}`
});

client.on('error', (err) => console.log('Redis Client Error', err));

let isConnected = false;

const RedisClient = {
    async connect() {
        if (!isConnected) {
            await client.connect();
            isConnected = true;
            console.log('Redis Client connected');
        }
    },

    async get(key) {
        if (!isConnected) await this.connect();
        const value = await client.get(key);
        return value ? JSON.parse(value) : null;
    },

    async set(key, value, ttlSeconds = 3600) {
        if (!isConnected) await this.connect();
        await client.set(key, JSON.stringify(value), {
            EX: ttlSeconds
        });
    },

    async del(key) {
        if (!isConnected) await this.connect();
        await client.del(key);
    }
};

module.exports = RedisClient;
