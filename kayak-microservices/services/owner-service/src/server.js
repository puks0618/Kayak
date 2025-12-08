/**
 * Owner Service Server
 * Manages hotel owner dashboards with direct database access
 */

const express = require('express');
const BookingsModel = require('./models/bookings.model');

const app = express();
const PORT = process.env.PORT || 3008;

// Middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Transform booking object from DB format to frontend format
const transformBooking = (booking) => {
  return {
    id: booking.booking_id,
    booking_id: booking.booking_id,
    user_id: booking.user_id,
    listing_id: booking.listing_id,
    listing_type: booking.listing_type,
    listing_name: booking.listing_name,
    listing_city: booking.listing_city,
    status: booking.status,
    booking_date: booking.booking_date,
    travel_date: booking.travel_date,
    return_date: booking.return_date,
    rental_days: booking.rental_days,
    total_amount: booking.total_amount,
    created_at: booking.created_at,
    // Additional details
    hotel_address: booking.hotel_address,
    car_type: booking.car_type,
    car_company: booking.car_company,
    flight_departure: booking.flight_departure,
    flight_arrival: booking.flight_arrival,
    flight_class: booking.flight_class,
    departure_airport_name: booking.departure_airport_name,
    arrival_airport_name: booking.arrival_airport_name
  };
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'owner-service' });
});

// Owner Dashboard Routes
app.get('/owner/bookings', async (req, res) => {
  try {
    // Get owner email from headers (set by API Gateway)
    const ownerEmail = req.headers['x-user-email'];
    
    if (!ownerEmail) {
      return res.status(401).json({ error: 'Owner authentication required' });
    }

    console.log(`Fetching bookings for owner: ${ownerEmail}`);
    
    const bookings = await BookingsModel.getOwnerBookings(ownerEmail);
    const transformedBookings = bookings.map(transformBooking);
    
    console.log(`Found ${transformedBookings.length} bookings for ${ownerEmail}`);
    
    res.json({ success: true, bookings: transformedBookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.get('/owner/stats', async (req, res) => {
  try {
    const ownerEmail = req.headers['x-user-email'];
    
    console.log(`📊 Stats request from: ${ownerEmail}`);
    
    if (!ownerEmail) {
      console.log('❌ No owner email in headers');
      return res.status(401).json({ error: 'Owner authentication required' });
    }

    const stats = await BookingsModel.getOwnerStats(ownerEmail);
    console.log(`✅ Stats fetched for ${ownerEmail}:`, stats);
    
    // Format response to match frontend expectations
    res.json({
      success: true,
      data: {
        cars: {
          total: stats.totalCars,
          approved: stats.totalCars, // All existing cars are considered approved
          pending: 0,
          rejected: 0
        },
        hotels: {
          total: stats.totalHotels,
          approved: stats.totalHotels, // All existing hotels are considered approved
          pending: 0,
          rejected: 0
        },
        bookings: {
          total: stats.totalBookings,
          revenue: stats.totalRevenue,
          byStatus: stats.byStatus
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🏨 Owner Service running on port ${PORT}`);
  console.log('✅ Using direct database access for reliable data retrieval');
});
