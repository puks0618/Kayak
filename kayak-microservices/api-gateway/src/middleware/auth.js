/**
 * Authentication Middleware
 * Verifies JWT tokens on protected routes
 */

const jwt = require('jsonwebtoken');

// TODO: Load JWT secret from environment or secret manager
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired'
      });
    }
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

// Routes that require authentication
const protectedRoutes = [
  '/api/users',
  '/api/bookings',
  '/api/admin'
];

const shouldAuthenticate = (path) => {
  return protectedRoutes.some(route => path.startsWith(route));
};

module.exports = {
  authMiddleware,
  shouldAuthenticate
};

