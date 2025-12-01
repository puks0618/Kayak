/**
 * Users API Service
 * Handles all API calls related to user management
 */

import api from './api';

export const usersApi = {
  // Get all users with filters
  getUsers: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);

    const response = await api.get(`/admin/users?${queryParams}`);
    return response.data;
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.patch(`/admin/users/${id}`, userData);
    return response.data;
  },

  // Update user status (activate/deactivate)
  updateUserStatus: async (id, status) => {
    const response = await api.put(`/admin/users/${id}/status`, { status });
    return response.data;
  },

  // Delete user (soft delete)
  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  }
};
