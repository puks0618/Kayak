/**
 * Booking Service Server
 */

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'booking-service' });
});

// Routes
// TODO: Add booking and payment routes

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Booking Service running on port ${PORT}`);
});

module.exports = app;

