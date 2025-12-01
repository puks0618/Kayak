/**
 * API Gateway Routes Configuration
 * Maps incoming requests to appropriate microservices
 */

const routes = {
  '/api/auth': {
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    changeOrigin: true,
    description: 'Authentication service - JWT issue/verify'
  },
  '/api/users': {
    target: process.env.USER_SERVICE_URL || 'http://user-service:3002',
    changeOrigin: true,
    description: 'User management and profiles'
  },
  '/api/listings': {
    target: process.env.LISTING_SERVICE_URL || 'http://listing-service:3003',
    changeOrigin: true,
    description: 'Flights, hotels, and cars listings'
  },
  '/api/search': {
    target: process.env.SEARCH_SERVICE_URL || 'http://search-service:3004',
    changeOrigin: true,
    description: 'Search service with caching'
  },
  '/api/bookings': {
    target: process.env.BOOKING_SERVICE_URL || 'http://booking-service:3005',
    changeOrigin: true,
    pathRewrite: { '^/api/bookings': '/bookings' },
    description: 'Booking, payment, and billing'
  },
  '/api/analytics': {
    target: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3006',
    changeOrigin: true,
    description: 'Analytics and reporting'
  },
  '/api/admin': {
    target: process.env.ADMIN_SERVICE_URL || 'http://admin-service:3007',
    changeOrigin: true,
    description: 'Admin operations with RBAC'
  },
  '/api/billing': {
    target: process.env.BILLING_SERVICE_URL || 'http://billing-service:4000',
    changeOrigin: true,
    pathRewrite: { '^/api/billing': '/api/billing' },
    description: 'User billing portal - invoices, logs, PDF generation'
  },
  '/api/ai': {
    target: process.env.AI_AGENT_URL || 'http://ai-agent:8000',
    changeOrigin: true,
    description: 'AI-powered deals and concierge'
  }
};

module.exports = routes;

