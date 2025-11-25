/**
 * Flight Controller
 */

/**
 * Flight Controller
 */

const FlightModel = require('./model');

class FlightController {
  async getAll(req, res) {
    try {
      const { origin, destination, date, class: flightClass } = req.query;
      const flights = await FlightModel.findAll({ origin, destination, date, class: flightClass });

      res.json({
        flights,
        total: flights.length,
        page: 1
      });
    } catch (error) {
      console.error('Get flights error:', error);
      res.status(500).json({ error: 'Failed to get flights' });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const flight = await FlightModel.findById(id);

      if (!flight) {
        return res.status(404).json({ error: 'Flight not found' });
      }

      // TODO: Fetch reviews from MongoDB

      res.json(flight);
    } catch (error) {
      console.error('Get flight error:', error);
      res.status(500).json({ error: 'Failed to get flight' });
    }
  }

  async create(req, res) {
    try {
      const flightData = req.body;

      // Basic validation
      if (!flightData.airline || !flightData.price) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newFlight = await FlightModel.create(flightData);

      // TODO: Publish listing.created event

      res.status(201).json({
        message: 'Flight created successfully',
        flight: newFlight
      });
    } catch (error) {
      console.error('Create flight error:', error);
      res.status(500).json({ error: 'Failed to create flight' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedFlight = await FlightModel.update(id, updates);

      if (!updatedFlight) {
        return res.status(404).json({ error: 'Flight not found' });
      }

      res.json({
        message: 'Flight updated successfully',
        flight: updatedFlight
      });
    } catch (error) {
      console.error('Update flight error:', error);
      res.status(500).json({ error: 'Failed to update flight' });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await FlightModel.delete(id);
      res.json({ message: 'Flight deleted successfully' });
    } catch (error) {
      console.error('Delete flight error:', error);
      res.status(500).json({ error: 'Failed to delete flight' });
    }
  }
}

module.exports = new FlightController();

