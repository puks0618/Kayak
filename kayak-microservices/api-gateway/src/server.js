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
const { authenticate, isOwner, isAdmin, isTraveller } = require('./middleware/rbac');
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

// ===== ROLE-BASED PROTECTED ROUTES =====

// Owner routes - require owner role
app.use(
  '/api/owner',
  authenticate,
  isOwner,
  createProxyMiddleware({
    target: 'http://listing-service:3003',
    changeOrigin: true,
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader('X-Trace-ID', req.id);
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-User-Email', req.user.email);
        proxyReq.setHeader('X-User-Role', req.user.role);
      }
    },
    onError: (err, req, res) => {
      console.error('Proxy error for /api/owner:', err.message);
      res.status(502).json({
        error: 'Bad Gateway',
        message: 'Listing service temporarily unavailable'
      });
    }
  })
);

// Admin listings routes - require admin role
app.use(
  '/api/admin/listings',
  authenticate,
  isAdmin,
  createProxyMiddleware({
    target: 'http://listing-service:3003',
    changeOrigin: true,
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader('X-Trace-ID', req.id);
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-User-Email', req.user.email);
        proxyReq.setHeader('X-User-Role', req.user.role);
      }
    },
    onError: (err, req, res) => {
      console.error('Proxy error for /api/admin/listings:', err.message);
      res.status(502).json({
        error: 'Bad Gateway',
        message: 'Listing service temporarily unavailable'
      });
    }
  })
);

// Admin service routes - require admin role
app.use(
  '/api/admin',
  authenticate,
  isAdmin,
  createProxyMiddleware({
    target: 'http://admin-service:3007',
    changeOrigin: true,
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader('X-Trace-ID', req.id);
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-User-Email', req.user.email);
        proxyReq.setHeader('X-User-Role', req.user.role);
      }
    },
    onError: (err, req, res) => {
      console.error('Proxy error for /api/admin:', err.message);
      res.status(502).json({
        error: 'Bad Gateway',
        message: 'Admin service temporarily unavailable'
      });
    }
  })
);

// ===== EXISTING ROUTES (WITH OLD AUTH) =====

// Setup proxy routes
Object.entries(routes).forEach(([path, config]) => {
  // Skip routes we've already defined with RBAC
  if (path.startsWith('/api/owner') || path.startsWith('/api/admin')) {
    return;
  }

  // Create proxy with optional auth middleware
  const middlewares = [];
  
  // Apply auth middleware to protected routes
  if (shouldAuthenticate(path)) {
    middlewares.push(authMiddleware);
  }

  // Create proxy
  app.use(
    path,
    ...middlewares,
    createProxyMiddleware({
      target: config.target,
      changeOrigin: config.changeOrigin,
      pathRewrite: config.stripApiPrefix !== false ? (pathStr, req) => {
        // Strip /api prefix only if stripApiPrefix is not explicitly false
        return pathStr.replace('/api', '');
      } : undefined,
      onProxyReq: (proxyReq, req) => {
        // Forward trace ID
        proxyReq.setHeader('X-Trace-ID', req.id);
        if (req.user) {
          proxyReq.setHeader('X-User-ID', req.user.id);
          proxyReq.setHeader('X-User-Email', req.user.email || '');
          proxyReq.setHeader('X-User-Role', req.user.role || '');
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

