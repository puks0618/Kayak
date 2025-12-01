/**
 * Administrator Management API Service
 */

import api from './api';

const ADMIN_BASE = '/admin';

export const administratorApi = {
  /**
   * Get all administrators
   */
  getAll: async (params = {}) => {
    const response = await api.get(`${ADMIN_BASE}/administrators`, { params });
    return response.data;
  },

  /**
   * Get administrator by ID
   */
  getById: async (id) => {
    const response = await api.get(`${ADMIN_BASE}/administrators/${id}`);
    return response.data;
  },

  /**
   * Create new administrator
   */
  create: async (data) => {
    const response = await api.post(`${ADMIN_BASE}/administrators`, data);
    return response.data;
  },

  /**
   * Update administrator
   */
  update: async (id, data) => {
    const response = await api.put(`${ADMIN_BASE}/administrators/${id}`, data);
    return response.data;
  },

  /**
   * Delete administrator
   */
  delete: async (id) => {
    const response = await api.delete(`${ADMIN_BASE}/administrators/${id}`);
    return response.data;
  }
};

export default administratorApi;
