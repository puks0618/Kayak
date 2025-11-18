/**
 * User Service Server
 */

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
    await redisCache.connect();
    // TODO: Initialize Kafka producers/consumers
    // TODO: Initialize database connection
    
    app.listen(PORT, () => {
      console.log(`User Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize service:', error);
    process.exit(1);
  }
}

initialize();

module.exports = app;

