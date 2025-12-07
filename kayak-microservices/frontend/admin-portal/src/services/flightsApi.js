/**
 * Flights API Service
 * Handles flight CRUD operations for admin
 */

import api from './api';

/**
 * Get all flights with pagination and filters
 */
export const getFlights = async (params = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      airline,
      flightNumber,
      origin,
      destination,
      sortBy = 'departure_time',
      sortOrder = 'asc'
    } = params;

    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: ((page - 1) * limit).toString(),
      sortBy,
      sortOrder
    });

    if (airline) queryParams.append('airline', airline);
    if (flightNumber) queryParams.append('flightNumber', flightNumber);
    if (origin) queryParams.append('origin', origin);
    if (destination) queryParams.append('destination', destination);

    const response = await api.get(`/listings/flights?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching flights:', error);
    throw error;
  }
};

/**
 * Get single flight by ID
 */
export const getFlightById = async (id) => {
  try {
    const response = await api.get(`/listings/flights/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching flight:', error);
    throw error;
  }
};

/**
 * Create new flight
 */
export const createFlight = async (flightData) => {
  try {
    const response = await api.post('/listings/flights', flightData);
    return response.data;
  } catch (error) {
    console.error('Error creating flight:', error);
    throw error;
  }
};

/**
 * Update existing flight
 */
export const updateFlight = async (id, flightData) => {
  try {
    const response = await api.patch(`/listings/flights/${id}`, flightData);
    return response.data;
  } catch (error) {
    console.error('Error updating flight:', error);
    throw error;
  }
};

/**
 * Delete flight
 */
export const deleteFlight = async (id) => {
  try {
    const response = await api.delete(`/listings/flights/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting flight:', error);
    throw error;
  }
};

/**
 * Get unique airlines for filter dropdown
 */
export const getAirlines = async () => {
  try {
    // Use dedicated airlines endpoint for efficiency
    const response = await api.get('/listings/flights/airlines');
    return response.data.airlines || [];
  } catch (error) {
    console.error('Error fetching airlines:', error);
    return [];
  }
};

export default {
  getFlights,
  getFlightById,
  createFlight,
  updateFlight,
  deleteFlight,
  getAirlines
};
