/**
 * Users API Service
 * Handles all API calls related to user management
 */

const API_BASE_URL = 'http://localhost:3000/api/users';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export const usersApi = {
  // Get all users with filters
  getUsers: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);

    const response = await fetch(`${API_BASE_URL}?${queryParams}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  // Update user status (activate/deactivate)
  updateUserStatus: async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update user status');
    return response.json();
  },

  // Delete user (soft delete)
  deleteUser: async (id) => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return response.json();
  }
};
