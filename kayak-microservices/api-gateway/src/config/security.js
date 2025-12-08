/**
 * Security Configuration
 * Rate limiting, CORS, and request ID generation
 */

const rateLimit = require('express-rate-limit');

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
};

// CORS configuration
const corsConfig = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5175',  // Web client
    'http://localhost:5180',  // Owner portal
    'http://localhost:5174',  // Admin portal
    'http://localhost:8080',
    'http://localhost:8081'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Trace-ID']
};

// Request ID middleware
const requestIdMiddleware = (req, res, next) => {
  req.id = req.headers['x-request-id'] || generateRequestId();
  res.setHeader('X-Request-ID', req.id);
  next();
};

// Generate unique request ID
const generateRequestId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

module.exports = {
  rateLimitConfig,
  corsConfig,
  requestIdMiddleware
};

