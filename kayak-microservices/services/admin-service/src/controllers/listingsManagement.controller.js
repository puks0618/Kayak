/**
 * Listings Management Controller
 * Admin operations for managing hotels, flights, and cars
 */

const axios = require('axios');

const LISTING_SERVICE_URL = process.env.LISTING_SERVICE_URL || 'http://localhost:3003';

class ListingsManagementController {
  /**
   * Search listings (hotels, flights, cars) with filters
   */
  async searchListings(req, res) {
    try {
      const { type, search, city, state, page = 1, limit = 20 } = req.query;

      if (!type || !['hotels', 'flights', 'cars'].includes(type)) {
        return res.status(400).json({ 
          error: 'Invalid listing type',
          validTypes: ['hotels', 'flights', 'cars']
        });
      }

      const response = await axios.get(
        `${LISTING_SERVICE_URL}/api/${type}`,
        {
          params: { search, city, state, page, limit },
          headers: {
            Authorization: req.headers.authorization
          }
        }
      );

      res.json(response.data);
    } catch (error) {
      console.error('Search listings error:', error.message);
      res.status(error.response?.status || 500).json({ 
        error: 'Failed to search listings',
        details: error.response?.data
      });
    }
  }

  /**
   * Get listing by ID
   */
  async getListingById(req, res) {
    try {
      const { type, id } = req.params;

      if (!['hotels', 'flights', 'cars'].includes(type)) {
        return res.status(400).json({ 
          error: 'Invalid listing type',
          validTypes: ['hotels', 'flights', 'cars']
        });
      }

      const response = await axios.get(
        `${LISTING_SERVICE_URL}/api/${type}/${id}`,
        {
          headers: {
            Authorization: req.headers.authorization
          }
        }
      );

      res.json(response.data);
    } catch (error) {
      console.error('Get listing error:', error.message);
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'Listing not found' });
      }
      res.status(error.response?.status || 500).json({ 
        error: 'Failed to retrieve listing',
        details: error.response?.data
      });
    }
  }

  /**
   * Create a new listing
   */
  async createListing(req, res) {
    try {
      const { type } = req.params;
      const listingData = req.body;

      if (!['hotels', 'flights', 'cars'].includes(type)) {
        return res.status(400).json({ 
          error: 'Invalid listing type',
          validTypes: ['hotels', 'flights', 'cars']
        });
      }

      const response = await axios.post(
        `${LISTING_SERVICE_URL}/api/${type}`,
        listingData,
        {
          headers: {
            Authorization: req.headers.authorization
          }
        }
      );

      res.status(201).json({
        message: `${type.slice(0, -1)} created successfully`,
        ...response.data
      });
    } catch (error) {
      console.error('Create listing error:', error.message);
      res.status(error.response?.status || 500).json({ 
        error: `Failed to create ${type.slice(0, -1)}`,
        details: error.response?.data
      });
    }
  }

  /**
   * Update a listing
   */
  async updateListing(req, res) {
    try {
      const { type, id } = req.params;
      const updates = req.body;

      if (!['hotels', 'flights', 'cars'].includes(type)) {
        return res.status(400).json({ 
          error: 'Invalid listing type',
          validTypes: ['hotels', 'flights', 'cars']
        });
      }

      const response = await axios.put(
        `${LISTING_SERVICE_URL}/api/${type}/${id}`,
        updates,
        {
          headers: {
            Authorization: req.headers.authorization
          }
        }
      );

      res.json({
        message: `${type.slice(0, -1)} updated successfully`,
        ...response.data
      });
    } catch (error) {
      console.error('Update listing error:', error.message);
      res.status(error.response?.status || 500).json({ 
        error: `Failed to update ${type.slice(0, -1)}`,
        details: error.response?.data
      });
    }
  }

  /**
   * Delete a listing
   */
  async deleteListing(req, res) {
    try {
      const { type, id } = req.params;

      if (!['hotels', 'flights', 'cars'].includes(type)) {
        return res.status(400).json({ 
          error: 'Invalid listing type',
          validTypes: ['hotels', 'flights', 'cars']
        });
      }

      const response = await axios.delete(
        `${LISTING_SERVICE_URL}/api/${type}/${id}`,
        {
          headers: {
            Authorization: req.headers.authorization
          }
        }
      );

      res.json({
        message: `${type.slice(0, -1)} deleted successfully`,
        ...response.data
      });
    } catch (error) {
      console.error('Delete listing error:', error.message);
      res.status(error.response?.status || 500).json({ 
        error: `Failed to delete ${type.slice(0, -1)}`,
        details: error.response?.data
      });
    }
  }

  /**
   * Get listing statistics
   */
  async getListingStats(req, res) {
    try {
      const [hotelsRes, flightsRes, carsRes] = await Promise.allSettled([
        axios.get(`${LISTING_SERVICE_URL}/api/hotels/count`),
        axios.get(`${LISTING_SERVICE_URL}/api/flights/count`),
        axios.get(`${LISTING_SERVICE_URL}/api/cars/count`)
      ]);

      res.json({
        hotels: hotelsRes.status === 'fulfilled' ? hotelsRes.value.data : { count: 0 },
        flights: flightsRes.status === 'fulfilled' ? flightsRes.value.data : { count: 0 },
        cars: carsRes.status === 'fulfilled' ? carsRes.value.data : { count: 0 }
      });
    } catch (error) {
      console.error('Get listing stats error:', error.message);
      res.status(500).json({ 
        error: 'Failed to retrieve listing statistics'
      });
    }
  }
}

module.exports = new ListingsManagementController();
