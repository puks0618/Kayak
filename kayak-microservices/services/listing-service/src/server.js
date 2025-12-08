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
const ownerRoutes = require('./routes/owner.routes');
const adminListingsRoutes = require('./routes/admin.routes');
const airlineReviewsRoutes = require('./routes/airline-reviews.routes');
const redisCache = require('./cache/redis');
const mongoAtlas = require('./database/mongodb-atlas');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware to attach user from JWT (populated by API Gateway)
// API Gateway forwards user info in req headers after JWT verification
app.use((req, res, next) => {
  // If API Gateway added user info to headers, parse it
  if (req.headers['x-user-id']) {
    req.user = {
      id: req.headers['x-user-id'],
      email: req.headers['x-user-email'],
      role: req.headers['x-user-role']
    };
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'listing-service',
    redis: redisCache.isConnected,
    mongodb: mongoAtlas.isConnected
  });
});

// Owner routes (protected by isOwner middleware at API Gateway)
app.use('/api/owner', ownerRoutes);

// Admin routes for listings (protected by isAdmin middleware at API Gateway)
app.use('/api/admin/listings', adminListingsRoutes);

// Public routes (for searching approved listings)
app.use('/api/listings/flights', flightRoutes);
app.use('/api/listings/hotels', hotelRoutes);
app.use('/api/listings/cars', carRoutes);
app.use('/api/listings', listingsRoutes); // Admin unified listings route

// Airline reviews routes (public access)
app.use('/api/listings/reviews', airlineReviewsRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Initialize connections
async function initialize() {
  try {
    await redisCache.connect();
    await mongoAtlas.connect();
    // TODO: Initialize MySQL connection
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

