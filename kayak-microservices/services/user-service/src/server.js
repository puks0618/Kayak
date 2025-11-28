/**
 * User Service Server
 */

// Load environment variables FIRST before any other imports
require('dotenv').config();

const express = require('express');
const userRoutes = require('./routes/user.routes');
const redisCache = require('./cache/redis');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'user-service',
    redis: redisCache.isConnected
  });
});

// Routes
app.use('/api/users', userRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Initialize connections
async function initialize() {
  try {
    // Try to connect to Redis (optional - service will work without it)
    try {
      await redisCache.connect();
    } catch (redisError) {
      console.warn('Redis connection failed (continuing without cache):', redisError.message);
    }
    
    // TODO: Initialize Kafka producers/consumers
    // Database connection is initialized when UserModel is required
    
    app.listen(PORT, () => {
      console.log(`User Service running on port ${PORT}`);
      console.log(`Redis cache: ${redisCache.isConnected ? 'Connected' : 'Disabled'}`);
    });
  } catch (error) {
    console.error('Failed to initialize service:', error);
    process.exit(1);
  }
}

initialize();

module.exports = app;

