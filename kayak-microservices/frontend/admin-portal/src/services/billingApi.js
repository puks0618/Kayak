/**
 * Billing Management API Service
 */

import api from './api';

const ADMIN_BASE = '/admin';

export const billingApi = {
  /**
   * Search bills with filters (using new dedicated bills endpoint)
   */
  searchBills: async (filters = {}) => {
    const response = await api.get(`${ADMIN_BASE}/bills`, {
      params: filters
    });
    return response.data;
  },

  /**
   * Get bill by ID (using new dedicated bills endpoint)
   */
  getBillById: async (id) => {
    const response = await api.get(`${ADMIN_BASE}/bills/${id}`);
    return response.data;
  },

  /**
   * Get billing statistics
   */
  getBillingStats: async (year, month) => {
    const response = await api.get(`${ADMIN_BASE}/billing/stats`, {
      params: { year, month }
    });
    return response.data;
  },

  /**
   * Get monthly revenue report
   */
  getMonthlyRevenue: async (year = new Date().getFullYear()) => {
    const response = await api.get(`${ADMIN_BASE}/billing/monthly-revenue`, {
      params: { year }
    });
    return response.data;
  }
};

export default billingApi;
