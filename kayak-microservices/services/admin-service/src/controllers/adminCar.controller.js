/**
 * Admin Car Controller
 * Handles admin CRUD operations for cars
 */

const axios = require('axios');

const LISTING_SERVICE_URL = process.env.LISTING_SERVICE_URL || 'http://localhost:3003';

class AdminCarController {
  /**
   * Get all cars with search filters
   * GET /api/admin/cars?search=Toyota&location=SFO&type=sedan
   */
  async getAllCars(req, res) {
    try {
      const { search, location, company_name, type, page = 1, limit = 20 } = req.query;
      
      const params = { page, limit };
      if (search) params.search = search;
      if (location) params.location = location;
      if (company_name) params.company_name = company_name;
      if (type) params.type = type;

      const response = await axios.get(
        `${LISTING_SERVICE_URL}/api/listings/cars`,
        {
          params,
          headers: { Authorization: req.headers.authorization }
        }
      );

      res.json({
        success: true,
        cars: response.data.cars || response.data,
        total: response.data.total || response.data.length,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      console.error('Get all cars error:', error.message);
      res.status(error.response?.status || 500).json({
        error: 'Failed to retrieve cars',
        details: error.response?.data || error.message
      });
    }
  }

  /**
   * Get car by ID
   * GET /api/admin/cars/:id
   */
  async getCarById(req, res) {
    try {
      const { id } = req.params;

      const response = await axios.get(
        `${LISTING_SERVICE_URL}/api/listings/cars/${id}`,
        { headers: { Authorization: req.headers.authorization } }
      );

      res.json({
        success: true,
        car: response.data
      });
    } catch (error) {
      console.error('Get car error:', error.message);
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'Car not found' });
      }
      res.status(error.response?.status || 500).json({
        error: 'Failed to retrieve car'
      });
    }
  }

  /**
   * Create new car
   * POST /api/admin/cars
   */
  async createCar(req, res) {
    try {
      const carData = req.body;

      // Validate required fields
      const required = ['company_name', 'brand', 'model', 'year', 'type', 'daily_rental_price', 'location'];
      const missing = required.filter(field => !carData[field]);

      if (missing.length > 0) {
        return res.status(400).json({
          error: 'Missing required fields',
          missingFields: missing
        });
      }

      // Validate daily rental price
      if (carData.daily_rental_price <= 0) {
        return res.status(400).json({
          error: 'Daily rental price must be greater than 0'
        });
      }

      const response = await axios.post(
        `${LISTING_SERVICE_URL}/api/listings/cars`,
        carData,
        {
          headers: {
            Authorization: req.headers.authorization,
            'Content-Type': 'application/json'
          }
        }
      );

      res.status(201).json({
        success: true,
        message: 'Car created successfully',
        car: response.data.car || response.data
      });
    } catch (error) {
      console.error('Create car error:', error.message);
      res.status(error.response?.status || 500).json({
        error: 'Failed to create car',
        details: error.response?.data || error.message
      });
    }
  }

  /**
   * Update car
   * PUT /api/admin/cars/:id
   */
  async updateCar(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: 'No update data provided'
        });
      }

      // Validate daily rental price if provided
      if (updates.daily_rental_price !== undefined && updates.daily_rental_price <= 0) {
        return res.status(400).json({
          error: 'Daily rental price must be greater than 0'
        });
      }

      const response = await axios.patch(
        `${LISTING_SERVICE_URL}/api/listings/cars/${id}`,
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
        message: 'Car updated successfully',
        car: response.data.car || response.data
      });
    } catch (error) {
      console.error('Update car error:', error.message);
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'Car not found' });
      }
      res.status(error.response?.status || 500).json({
        error: 'Failed to update car'
      });
    }
  }

  /**
   * Delete car
   * DELETE /api/admin/cars/:id
   */
  async deleteCar(req, res) {
    try {
      const { id } = req.params;

      await axios.delete(
        `${LISTING_SERVICE_URL}/api/listings/cars/${id}`,
        { headers: { Authorization: req.headers.authorization } }
      );

      res.json({
        success: true,
        message: 'Car deleted successfully'
      });
    } catch (error) {
      console.error('Delete car error:', error.message);
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'Car not found' });
      }
      res.status(error.response?.status || 500).json({
        error: 'Failed to delete car'
      });
    }
  }
}

module.exports = new AdminCarController();
