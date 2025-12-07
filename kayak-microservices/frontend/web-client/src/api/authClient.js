/**
 * Authenticated API Client
 * Axios instance with automatic token attachment and error handling
 */

import axios from 'axios';

const AUTH_SERVICE_URL = 'http://localhost:3001/api/auth';
const API_GATEWAY_URL = 'http://localhost:3000/api';

// Create axios instance for auth service
export const authClient = axios.create({
  baseURL: AUTH_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

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

authClient.interceptors.request.use(
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
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

authClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API methods
export const authAPI = {
  login: (email, password) => 
    authClient.post('/login', { email, password }),
  
  register: (userData) => 
    authClient.post('/register', userData),
  
  validateSession: () => 
    authClient.get('/validate'),
  
  getUserInfo: () => 
    authClient.get('/user'),
  
  updateUser: (userData) => 
    authClient.put('/user', userData),
};

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
