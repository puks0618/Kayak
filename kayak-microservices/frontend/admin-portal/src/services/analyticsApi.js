/**
 * Admin Analytics API Service
 */

import api from './api';

const ADMIN_BASE = '/admin';

export const analyticsApi = {
  /**
   * Get dashboard metrics
   */
  getDashboardMetrics: async () => {
    const response = await api.get(`${ADMIN_BASE}/analytics/dashboard`);
    return response.data.metrics;
  },

  /**
   * Get top properties with revenue
   */
  getTopProperties: async (year = new Date().getFullYear(), limit = 10) => {
    const response = await api.get(`${ADMIN_BASE}/analytics/top-properties`, {
      params: { year, limit }
    });
    return response.data;
  },

  /**
   * Get city-wise revenue
   */
  getCityRevenue: async (year = new Date().getFullYear()) => {
    const response = await api.get(`${ADMIN_BASE}/analytics/city-revenue`, {
      params: { year }
    });
    return response.data;
  },

  /**
   * Get top hosts/providers by month and year
   */
  getTopHosts: async (month = null, year = new Date().getFullYear(), limit = 10) => {
    const params = { year, limit };
    if (month) params.month = month;
    const response = await api.get(`${ADMIN_BASE}/analytics/top-hosts`, { params });
    return response.data;
  },

  /**
   * Get page click analytics
   */
  getPageClicks: async () => {
    const response = await api.get(`${ADMIN_BASE}/analytics/page-clicks`);
    return response.data;
  },

  /**
   * Get property click analytics
   */
  getPropertyClicks: async () => {
    const response = await api.get(`${ADMIN_BASE}/analytics/property-clicks`);
    return response.data;
  },

  /**
   * Get user trace/journey
   */
  getUserTrace: async (userId, city) => {
    const response = await api.get(`${ADMIN_BASE}/analytics/user-trace`, {
      params: { userId, city }
    });
    return response.data;
  },

  /**
   * Get bidding trace
   */
  getBiddingTrace: async () => {
    const response = await api.get(`${ADMIN_BASE}/analytics/bidding-trace`);
    return response.data;
  },

  /**
   * Get reviews analytics
   */
  getReviewsAnalytics: async () => {
    const response = await api.get(`${ADMIN_BASE}/analytics/reviews`);
    return response.data;
  },

  /**
   * Get least viewed areas
   */
  getLeastViewedAreas: async () => {
    const response = await api.get(`${ADMIN_BASE}/analytics/least-viewed`);
    return response.data;
  }
};

export default analyticsApi;
