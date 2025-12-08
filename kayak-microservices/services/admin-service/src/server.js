/**
 * Admin Service Server
 */

const express = require('express');
const cors = require('cors');
const adminRoutes = require('./routes/admin.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const flightConsumer = require('./kafka/consumer');

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'admin-service' });
});

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin/analytics', analyticsRoutes);

// Flight Booking Analytics Routes
app.get('/api/admin/flight-bookings', (req, res) => {
  try {
    const bookings = flightConsumer.getFlightBookings();
    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Error fetching flight bookings:', error);
    res.status(500).json({ error: 'Failed to fetch flight bookings' });
  }
});

app.get('/api/admin/flight-stats', (req, res) => {
  try {
    const stats = flightConsumer.getFlightBookingStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching flight stats:', error);
    res.status(500).json({ error: 'Failed to fetch flight statistics' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Kafka consumer for flight bookings
flightConsumer.startConsuming().catch(error => {
  console.error('Failed to start Kafka consumer:', error);
});

app.listen(PORT, () => {
  console.log(`✈️ Admin Service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down admin service...');
  await flightConsumer.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down admin service...');
  await flightConsumer.disconnect();
  process.exit(0);
});

module.exports = app;

