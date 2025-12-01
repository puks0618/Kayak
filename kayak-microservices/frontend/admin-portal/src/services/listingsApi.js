/**
 * Listings API Service
 * Handles all API calls related to listings management
 */

import api from './api';

export const listingsApi = {
  // Get all listings with filters
  getListings: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.type) queryParams.append('type', params.type);
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);

    const response = await api.get(`/listings?${queryParams}`);
    return response.data;
  },

  // Update listing status (activate/deactivate)
  updateListingStatus: async (type, id, status) => {
    const response = await api.put(`/listings/${type}/${id}/status`, { status });
    return response.data;
  },

  // Delete listing (soft delete)
  deleteListing: async (type, id) => {
    const response = await api.delete(`/listings/${type}/${id}`);
    return response.data;
  }
};
