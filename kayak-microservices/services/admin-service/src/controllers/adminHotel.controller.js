/**
 * Admin Hotel Controller
 * Handles admin CRUD operations for hotels
 */

const axios = require('axios');

const LISTING_SERVICE_URL = process.env.LISTING_SERVICE_URL || 'http://localhost:3003';

class AdminHotelController {
  /**
   * Get all hotels with search filters
   * GET /api/admin/hotels?search=Grand&city=San Francisco&page=1&limit=20
   */
  async getAllHotels(req, res) {
    try {
      const {
        search,
        city,
        state,
        name,
        minPrice,
        maxPrice,
        stars,
        page = 1,
        limit = 20
      } = req.query;

      const params = { page, limit };

      if (search) params.search = search;
      if (city) params.city = city;
      if (state) params.state = state;
      if (name) params.name = name;
      if (minPrice) params.price_min = minPrice;
      if (maxPrice) params.price_max = maxPrice;
      if (stars) params.stars = stars;

      const response = await axios.get(
        `${LISTING_SERVICE_URL}/api/listings/hotels`,
        {
          params,
          headers: { Authorization: req.headers.authorization }
        }
      );

      res.json({
        success: true,
        hotels: response.data.hotels || response.data,
        total: response.data.total || response.data.length,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      console.error('Get all hotels error:', error.message);
      res.status(error.response?.status || 500).json({
        error: 'Failed to retrieve hotels',
        details: error.response?.data || error.message
      });
    }
  }

  /**
   * Get hotel by ID
   * GET /api/admin/hotels/:id
   */
  async getHotelById(req, res) {
    try {
      const { id } = req.params;

      const response = await axios.get(
        `${LISTING_SERVICE_URL}/api/listings/hotels/${id}`,
        { headers: { Authorization: req.headers.authorization } }
      );

      res.json({
        success: true,
        hotel: response.data
      });
    } catch (error) {
      console.error('Get hotel error:', error.message);
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'Hotel not found' });
      }
      res.status(error.response?.status || 500).json({
        error: 'Failed to retrieve hotel'
      });
    }
  }

  /**
   * Create new hotel
   * POST /api/admin/hotels
   */
  async createHotel(req, res) {
    try {
      const hotelData = req.body;

      // Validate required fields
      const required = ['name', 'address', 'city', 'state', 'zip_code', 'price_per_night', 'num_rooms'];
      const missing = required.filter(field => !hotelData[field]);

      if (missing.length > 0) {
        return res.status(400).json({
          error: 'Missing required fields',
          missingFields: missing
        });
      }

      // Validate state code
      if (hotelData.state.length !== 2) {
        return res.status(400).json({
          error: 'State must be 2-letter code (e.g., CA)'
        });
      }

      // Validate price
      if (hotelData.price_per_night <= 0) {
        return res.status(400).json({
          error: 'Price per night must be greater than 0'
        });
      }

      const response = await axios.post(
        `${LISTING_SERVICE_URL}/api/listings/hotels`,
        hotelData,
        {
          headers: {
            Authorization: req.headers.authorization,
            'Content-Type': 'application/json'
          }
        }
      );

      res.status(201).json({
        success: true,
        message: 'Hotel created successfully',
        hotel: response.data.hotel || response.data
      });
    } catch (error) {
      console.error('Create hotel error:', error.message);
      res.status(error.response?.status || 500).json({
        error: 'Failed to create hotel',
        details: error.response?.data || error.message
      });
    }
  }

  /**
   * Update hotel
   * PUT /api/admin/hotels/:id
   */
  async updateHotel(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: 'No update data provided'
        });
      }

      // Validate state if provided
      if (updates.state && updates.state.length !== 2) {
        return res.status(400).json({
          error: 'State must be 2-letter code'
        });
      }

      // Validate price if provided
      if (updates.price_per_night !== undefined && updates.price_per_night <= 0) {
        return res.status(400).json({
          error: 'Price per night must be greater than 0'
        });
      }

      const response = await axios.patch(
        `${LISTING_SERVICE_URL}/api/listings/hotels/${id}`,
        updates,
        {
          headers: {
            Authorization: req.headers.authorization,
            'Content-Type': 'application/json'
          }
        }
      );

      res.json({
        success: true,
        message: 'Hotel updated successfully',
        hotel: response.data.hotel || response.data
      });
    } catch (error) {
      console.error('Update hotel error:', error.message);
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'Hotel not found' });
      }
      res.status(error.response?.status || 500).json({
        error: 'Failed to update hotel'
      });
    }
  }

  /**
   * Delete hotel
   * DELETE /api/admin/hotels/:id
   */
  async deleteHotel(req, res) {
    try {
      const { id } = req.params;

      await axios.delete(
        `${LISTING_SERVICE_URL}/api/listings/hotels/${id}`,
        { headers: { Authorization: req.headers.authorization } }
      );

      res.json({
        success: true,
        message: 'Hotel deleted successfully'
      });
    } catch (error) {
      console.error('Delete hotel error:', error.message);
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'Hotel not found' });
      }
      res.status(error.response?.status || 500).json({
        error: 'Failed to delete hotel'
      });
    }
  }
}

module.exports = new AdminHotelController();
