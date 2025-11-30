/**
 * Role-Based Access Control Middleware
 * Verifies user roles for protected endpoints
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Base authentication middleware
 * Verifies JWT token and attaches user info to request
 */
const authenticate = (req, res, next) => {
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
    
    // Attach user info to request (contains: id, email, role)
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

/**
 * Check if user has owner role
 * Use this for endpoints that require owner permissions
 */
const isOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'owner') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'This endpoint requires owner role'
    });
  }

  next();
};

/**
 * Check if user has admin role
 * Use this for endpoints that require admin permissions
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'This endpoint requires admin role'
    });
  }

  next();
};

/**
 * Check if user has traveller role
 * Use this for endpoints that require traveller permissions
 */
const isTraveller = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'traveller') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'This endpoint requires traveller role'
    });
  }

  next();
};

/**
 * Check if user has owner OR admin role
 * Use this for endpoints that can be accessed by either role
 */
const isOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'This endpoint requires owner or admin role'
    });
  }

  next();
};

/**
 * Optional authentication
 * Attaches user info if token is present, but doesn't require it
 * Useful for endpoints that work differently for authenticated vs anonymous users
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user info
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    next();
  } catch (error) {
    // Invalid token, continue without user info
    req.user = null;
    next();
  }
};

module.exports = {
  authenticate,
  isOwner,
  isAdmin,
  isTraveller,
  isOwnerOrAdmin,
  optionalAuth
};
