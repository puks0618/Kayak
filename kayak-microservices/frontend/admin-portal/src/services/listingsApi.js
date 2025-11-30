/**
 * Listings API Service
 * Handles all API calls related to listings management
 */

const API_BASE_URL = 'http://localhost:3000/api/listings';

export const listingsApi = {
  // Get all listings with filters
  getListings: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.type) queryParams.append('type', params.type);
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);

    const response = await fetch(`${API_BASE_URL}?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch listings');
    return response.json();
  },

  // Update listing status (activate/deactivate)
  updateListingStatus: async (type, id, status) => {
    const response = await fetch(`${API_BASE_URL}/${type}/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update listing status');
    return response.json();
  },

  // Delete listing (soft delete)
  deleteListing: async (type, id) => {
    const response = await fetch(`${API_BASE_URL}/${type}/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete listing');
    return response.json();
  }
};
