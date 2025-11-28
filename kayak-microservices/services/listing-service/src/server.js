/**
 * Listing Service Server
 * Manages flights, hotels, and car rentals
 */

const express = require('express');
const flightRoutes = require('./modules/flights/route');
const hotelRoutes = require('./modules/hotels/route');
const carRoutes = require('./modules/cars/route');
const redisCache = require('./cache/redis');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'listing-service',
    redis: redisCache.isConnected
  });
});

// Routes
app.use('/api/listings/flights', flightRoutes);
app.use('/api/listings/hotels', hotelRoutes);
app.use('/api/listings/cars', carRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Initialize connections
async function initialize() {
  try {
    await redisCache.connect();
    // TODO: Initialize MySQL connection
    // TODO: Initialize MongoDB connection
    // TODO: Initialize Kafka producers/consumers
    
    app.listen(PORT, () => {
      console.log(`Listing Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize service:', error);
    process.exit(1);
  }
}

initialize();

module.exports = app;

