/**
 * Dashboard API Service
 * Handles dashboard metrics and data fetching
 */

import api from './api';

/**
 * Get dashboard metrics (users, bookings, revenue, flights)
 */
export const getDashboardMetrics = async () => {
  try {
    // Get admin dashboard data
    const adminResponse = await api.get('/admin/dashboard');
    const { users, bookings, revenue } = adminResponse.data.dashboard;

    // Get flight count from listings service
    const flightsResponse = await api.get('/listings/flights?limit=1');
    const totalFlights = flightsResponse.data.total || 0;

    return {
      users,
      bookings,
      revenue,
      flights: totalFlights
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw error;
  }
};

/**
 * Get recent bookings (last 5)
 */
export const getRecentBookings = async () => {
  try {
    // TODO: When admin service has a dedicated endpoint, use that
    // For now, we'll need to get bookings from the booking service
    const response = await api.get('/bookings');
    
    // If response has array directly
    const bookings = Array.isArray(response.data) ? response.data : response.data.bookings || [];
    
    // Sort by booking date (most recent first) and take first 5
    const recentBookings = bookings
      .sort((a, b) => new Date(b.booking_date) - new Date(a.booking_date))
      .slice(0, 5);

    return recentBookings;
  } catch (error) {
    console.error('Error fetching recent bookings:', error);
    throw error;
  }
};

export default {
  getDashboardMetrics,
  getRecentBookings
};
