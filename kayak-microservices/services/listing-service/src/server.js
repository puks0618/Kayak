/**
 * Listing Service Server
 * Manages flights, hotels, and car rentals
 */

const express = require('express');
const cors = require('cors');
const flightRoutes = require('./modules/flights/route');
const hotelRoutes = require('./modules/hotels/route');
const carRoutes = require('./modules/cars/route');
const listingsRoutes = require('./routes/listings.routes');
const redisCache = require('./cache/redis');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
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
app.use('/api/listings', listingsRoutes); // Admin unified listings route

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

