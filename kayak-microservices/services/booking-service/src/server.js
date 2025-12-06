/**
 * Booking Service Server
 */

const express = require('express');
const BookingController = require('./controllers/booking.controller');
const PaymentController = require('./controllers/payment.controller');

const app = express();
const PORT = process.env.PORT || 3005;

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
  res.json({ status: 'OK', service: 'booking-service' });
});

// Initialize controllers (already instances)
const bookingController = BookingController;
const paymentController = PaymentController;

// Booking Routes
app.post('/bookings', (req, res) => bookingController.create(req, res));
app.get('/bookings', (req, res) => bookingController.getAll(req, res));
app.get('/bookings/:id', (req, res) => bookingController.getById(req, res));
app.get('/bookings/user/:userId', (req, res) => bookingController.getUserBookings(req, res));
app.put('/bookings/:id/status', (req, res) => bookingController.updateStatus(req, res));
app.delete('/bookings/:id', (req, res) => bookingController.cancel(req, res));

// Payment Routes
app.post('/payments/process', (req, res) => paymentController.process(req, res));
app.get('/payments/:id', (req, res) => paymentController.getById(req, res));

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Booking Service running on port ${PORT}`);
});

module.exports = app;

