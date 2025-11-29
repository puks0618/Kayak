/**
 * API Service Layer
 * Centralized axios instance for all API calls
 */

import axios from 'axios';

// API Gateway base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor (for adding auth tokens later)
api.interceptors.request.use(
  (config) => {
    // TODO: Add auth token when authentication is implemented
    // const token = localStorage.getItem('admin-token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (for error handling)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login when implemented
          console.error('Unauthorized access');
          break;
        case 403:
          // Forbidden - insufficient permissions
          console.error('Forbidden: Insufficient permissions');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error('API Error:', data?.message || error.message);
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network error: No response from server');
    } else {
      // Request setup error
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
