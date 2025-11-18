/**
 * Admin Service Server
 */

const express = require('express');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'admin-service' });
});

// Routes
app.use('/api/admin', adminRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Admin Service running on port ${PORT}`);
});

module.exports = app;

