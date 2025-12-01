/**
 * Admin Flight Controller
 * Handles admin CRUD operations for flights
 */

const axios = require('axios');

const LISTING_SERVICE_URL = process.env.LISTING_SERVICE_URL || 'http://localhost:3003';

class AdminFlightController {
  async getAllFlights(req, res) {
    try {
      const { search, departure, arrival, date, page = 1, limit = 20 } = req.query;
      
      const params = { page, limit };
      if (search) params.search = search;
      if (departure) params.departure_airport = departure;
      if (arrival) params.arrival_airport = arrival;
      if (date) params.date = date;

      const response = await axios.get(`${LISTING_SERVICE_URL}/api/listings/flights`, {
        params,
        headers: { Authorization: req.headers.authorization }
      });

      res.json({
        success: true,
        flights: response.data.flights || response.data,
        total: response.data.total || response.data.length,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      console.error('Get all flights error:', error.message);
      res.status(error.response?.status || 500).json({
        error: 'Failed to retrieve flights',
        details: error.response?.data || error.message
      });
    }
  }

  async getFlightById(req, res) {
    try {
      const response = await axios.get(
        `${LISTING_SERVICE_URL}/api/listings/flights/${req.params.id}`,
        { headers: { Authorization: req.headers.authorization } }
      );
      res.json({ success: true, flight: response.data });
    } catch (error) {
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'Flight not found' });
      }
      res.status(error.response?.status || 500).json({ error: 'Failed to retrieve flight' });
    }
  }

  async createFlight(req, res) {
    try {
      const required = ['flight_code', 'airline', 'departure_airport', 'arrival_airport', 'departure_time', 'arrival_time', 'price'];
      const missing = required.filter(field => !req.body[field]);
      if (missing.length > 0) {
        return res.status(400).json({ error: 'Missing required fields', missingFields: missing });
      }

      const response = await axios.post(
        `${LISTING_SERVICE_URL}/api/listings/flights`,
        req.body,
        { headers: { Authorization: req.headers.authorization, 'Content-Type': 'application/json' }}
      );

      res.status(201).json({
        success: true,
        message: 'Flight created successfully',
        flight: response.data.flight || response.data
      });
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: 'Failed to create flight' });
    }
  }

  async updateFlight(req, res) {
    try {
      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'No update data provided' });
      }

      const response = await axios.patch(
        `${LISTING_SERVICE_URL}/api/listings/flights/${req.params.id}`,
        req.body,
        { headers: { Authorization: req.headers.authorization, 'Content-Type': 'application/json' }}
      );

      res.json({
        success: true,
        message: 'Flight updated successfully',
        flight: response.data.flight || response.data
      });
    } catch (error) {
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'Flight not found' });
      }
      res.status(error.response?.status || 500).json({ error: 'Failed to update flight' });
    }
  }

  async deleteFlight(req, res) {
    try {
      await axios.delete(
        `${LISTING_SERVICE_URL}/api/listings/flights/${req.params.id}`,
        { headers: { Authorization: req.headers.authorization } }
      );
      res.json({ success: true, message: 'Flight deleted successfully' });
    } catch (error) {
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'Flight not found' });
      }
      res.status(error.response?.status || 500).json({ error: 'Failed to delete flight' });
    }
  }
}

module.exports = new AdminFlightController();
