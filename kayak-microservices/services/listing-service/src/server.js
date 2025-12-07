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
const cacheStatsRoutes = require('./routes/cache-stats.routes');
const redisCache = require('./cache/redis');
const redisFlightCache = require('./cache/redisFlights');
const redisHotelCache = require('./cache/redisHotels');
const mongoAtlas = require('./database/mongodb-atlas');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware - CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5175',  // Web client
    'http://localhost:5180',  // Owner portal
    'http://localhost:5176',  // Admin portal
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Trace-ID', 'X-User-ID', 'X-User-Email', 'X-User-Role']
};

app.use(cors(corsOptions));
app.use(express.json());

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

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
    redis: {
      db0_cars: redisCache.isConnected,
      db1_flights: redisFlightCache.isConnected,
      db4_hotels: redisHotelCache.isConnected
    },
    mongodb: mongoAtlas.isConnected
  });
});

// Owner routes (protected by isOwner middleware at API Gateway)
app.use('/api/owner', ownerRoutes);

// Admin routes for listings (protected by isAdmin middleware at API Gateway)
app.use('/api/admin/listings', adminListingsRoutes);

// Cache statistics routes (admin access) - MUST come before /api/listings
app.use('/api/listings/admin/cache', cacheStatsRoutes);

// Public routes (for searching approved listings)
app.use('/api/listings/flights', flightRoutes);
app.use('/api/listings/hotels', hotelRoutes);
app.use('/api/listings/cars', carRoutes);

// Airline reviews routes (public access)
app.use('/api/listings/reviews', airlineReviewsRoutes);

app.use('/api/listings', listingsRoutes); // Admin unified listings route

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Initialize connections
async function initialize() {
  try {
    await redisCache.connect(); // DB 0 for cars only
    await redisFlightCache.connect(); // DB 1 for flights
    await redisHotelCache.connect(); // DB 4 for hotels
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

