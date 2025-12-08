/**
 * Owner Service Server
 * Manages hotel owner dashboards and consumes hotel booking events
 */

const express = require('express');
const ownerConsumer = require('./kafka/consumer');

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'owner-service' });
});

// Owner Dashboard Routes
app.get('/owner/bookings', (req, res) => {
  try {
    const { hotelId } = req.query;
    const bookings = ownerConsumer.getHotelBookings(hotelId);
    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.get('/owner/stats', (req, res) => {
  try {
    const { hotelId } = req.query;
    const stats = ownerConsumer.getHotelBookingStats(hotelId);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

app.get('/owner/bookings-by-hotel', (req, res) => {
  try {
    const bookingsByHotel = ownerConsumer.getBookingsByHotel();
    res.json({ success: true, data: bookingsByHotel });
  } catch (error) {
    console.error('Error fetching bookings by hotel:', error);
    res.status(500).json({ error: 'Failed to fetch bookings by hotel' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Kafka consumer
ownerConsumer.startConsuming().catch(error => {
  console.error('Failed to start Kafka consumer:', error);
});

// Start server
app.listen(PORT, () => {
  console.log(`🏨 Owner Service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down owner service...');
  await ownerConsumer.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down owner service...');
  await ownerConsumer.disconnect();
  process.exit(0);
});
