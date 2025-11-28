/**
 * API Gateway Server
 * Entry point for all API requests
 */

const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const routes = require('./config/routes');
const { corsConfig, requestIdMiddleware } = require('./config/security');
const { authMiddleware, shouldAuthenticate } = require('./middleware/auth');
const logger = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors(corsConfig));
// app.use(express.json()); // Removed to prevent body consumption before proxy
app.use(requestIdMiddleware);
app.use(logger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'api-gateway' });
});

// Setup proxy routes
Object.entries(routes).forEach(([path, config]) => {
  // Apply auth middleware to protected routes
  if (shouldAuthenticate(path)) {
    app.use(path, authMiddleware);
  }

  // Create proxy
  app.use(
    path,
    createProxyMiddleware({
      target: config.target,
      changeOrigin: config.changeOrigin,
      onProxyReq: (proxyReq, req) => {
        // Forward trace ID
        proxyReq.setHeader('X-Trace-ID', req.id);
        if (req.user) {
          proxyReq.setHeader('X-User-ID', req.user.id);
        }
      },
      onError: (err, req, res) => {
        console.error(`Proxy error for ${path}:`, err.message);
        res.status(502).json({
          error: 'Bad Gateway',
          message: 'Service temporarily unavailable'
        });
      }
    })
  );
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Configured routes:');
  Object.entries(routes).forEach(([path, config]) => {
    console.log(`  ${path} -> ${config.target}`);
  });
});

module.exports = app;

