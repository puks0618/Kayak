/**
 * Authenticated API Client for Owner Portal
 * Axios instance with automatic token attachment and error handling
 */

import axios from 'axios';

const API_GATEWAY_URL = 'http://localhost:3000/api';

// Create axios instance for API gateway
export const apiClient = axios.create({
  baseURL: API_GATEWAY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to web-client login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'http://localhost:5175/login';
    }
    return Promise.reject(error);
  }
);

// Owner API methods
export const ownerAPI = {
  getStats: () => 
    apiClient.get('/owner/stats'),
  
  // Cars
  getCars: () => 
    apiClient.get('/owner/cars'),
  
  getCar: (id) => 
    apiClient.get(`/owner/cars/${id}`),
  
  createCar: (carData) => 
    apiClient.post('/owner/cars', carData),
  
  updateCar: (id, carData) => 
    apiClient.put(`/owner/cars/${id}`, carData),
  
  deleteCar: (id) => 
    apiClient.delete(`/owner/cars/${id}`),
  
  // Hotels
  getHotels: () => 
    apiClient.get('/owner/hotels'),
  
  getHotel: (id) => 
    apiClient.get(`/owner/hotels/${id}`),
  
  createHotel: (hotelData) => 
    apiClient.post('/owner/hotels', hotelData),
  
  updateHotel: (id, hotelData) => 
    apiClient.put(`/owner/hotels/${id}`, hotelData),
  
  deleteHotel: (id) => 
    apiClient.delete(`/owner/hotels/${id}`),
  
  // Bookings
  getBookings: () => 
    apiClient.get('/owner/bookings'),
  
  getBooking: (id) => 
    apiClient.get(`/owner/bookings/${id}`),
};

export default apiClient;
