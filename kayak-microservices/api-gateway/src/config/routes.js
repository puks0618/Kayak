/**
 * API Gateway Routes Configuration
 * Maps incoming requests to appropriate microservices
 */

const routes = {
  '/api/auth': {
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    changeOrigin: true,
    stripApiPrefix: true, // Auth service expects /auth, not /api/auth
    description: 'Authentication service - JWT issue/verify'
  },
  '/api/users': {
    target: process.env.USER_SERVICE_URL || 'http://user-service:3002',
    changeOrigin: true,
    stripApiPrefix: false, // User service expects /api/users
    description: 'User management and profiles'
  },
  '/api/listings': {
    target: process.env.LISTING_SERVICE_URL || 'http://listing-service:3003',
    changeOrigin: true,
    stripApiPrefix: false, // Listing service expects /api/listings
    description: 'Flights, hotels, and cars listings'
  },
  '/api/reviews': {
    target: process.env.LISTING_SERVICE_URL || 'http://listing-service:3003',
    changeOrigin: true,
    stripApiPrefix: false, // Listing service expects /api/reviews
    description: 'Reviews for flights, hotels, and cars'
  },
  '/api/search': {
    target: process.env.SEARCH_SERVICE_URL || 'http://search-service:3004',
    changeOrigin: true,
    stripApiPrefix: true, // Search service expects /search, not /api/search
    description: 'Search service with caching'
  },
  '/api/bookings': {
    target: process.env.BOOKING_SERVICE_URL || 'http://booking-service:3005',
    changeOrigin: true,
    stripApiPrefix: true, // Booking service expects /bookings, not /api/bookings
    description: 'Booking, payment, and billing'
  },
  '/api/analytics': {
    target: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3006',
    changeOrigin: true,
    stripApiPrefix: true, // Analytics service expects /analytics, not /api/analytics
    description: 'Analytics and reporting'
  },
  '/api/admin': {
    target: process.env.ADMIN_SERVICE_URL || 'http://admin-service:3007',
    changeOrigin: true,
    stripApiPrefix: false, // Admin service expects /api/admin
    description: 'Admin operations with RBAC'
  },
  '/api/ai': {
    target: process.env.AI_AGENT_URL || 'http://ai-agent:8000',
    changeOrigin: true,
    stripApiPrefix: true, // AI service expects /ai, not /api/ai
    description: 'AI-powered deals and concierge'
  }
};

module.exports = routes;

