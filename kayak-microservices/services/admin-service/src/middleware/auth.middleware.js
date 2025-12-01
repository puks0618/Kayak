/**
 * Authentication Middleware
 * Verifies JWT tokens and checks admin roles
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Verify JWT token from Authorization header
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Check if user has admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

/**
 * Check if user has specific access level
 */
const requireAccessLevel = (levels) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const allowedLevels = Array.isArray(levels) ? levels : [levels];
    
    if (!allowedLevels.includes(req.user.accessLevel) && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedLevels,
        current: req.user.accessLevel
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireAccessLevel
};
