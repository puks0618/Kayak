/**
 * Bookings API Service
 * Handles booking CRUD operations for admin
 */

import api from './api';

/**
 * Get all bookings with pagination and filters
 */
export const getBookings = async (params = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      user_id,
      listing_type,
      sortBy = 'booking_date',
      sortOrder = 'desc'
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });

    if (status) queryParams.append('status', status);
    if (user_id) queryParams.append('user_id', user_id);
    if (listing_type) queryParams.append('listing_type', listing_type);

    const response = await api.get(`/bookings?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
};

/**
 * Get single booking by ID
 */
export const getBookingById = async (id) => {
  try {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }
};

/**
 * Get bookings by user ID
 */
export const getBookingsByUserId = async (userId) => {
  try {
    const response = await api.get(`/bookings/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (id, status) => {
  try {
    const response = await api.put(`/bookings/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

/**
 * Cancel booking
 */
export const cancelBooking = async (id) => {
  try {
    const response = await api.delete(`/bookings/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

/**
 * Create new booking (admin override)
 */
export const createBooking = async (bookingData) => {
  try {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};
