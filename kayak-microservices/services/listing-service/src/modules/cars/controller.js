/**
 * Car Rental Controller
 */

/**
 * Car Rental Controller
 */

const CarModel = require('./model');

class CarController {
  async getAll(req, res) {
    try {
      const { location, type, price_max, available } = req.query;
      const cars = await CarModel.findAll({ location, type, price_max, available });

      res.json({
        cars,
        total: cars.length,
        page: 1
      });
    } catch (error) {
      console.error('Get cars error:', error);
      res.status(500).json({ error: 'Failed to get cars' });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const car = await CarModel.findById(id);

      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }

      res.json(car);
    } catch (error) {
      console.error('Get car error:', error);
      res.status(500).json({ error: 'Failed to get car' });
    }
  }

  async create(req, res) {
    try {
      const carData = req.body;

      if (!carData.brand || !carData.model || !carData.daily_rental_price) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newCar = await CarModel.create(carData);

      // TODO: Publish listing.created event

      res.status(201).json({
        message: 'Car created successfully',
        car: newCar
      });
    } catch (error) {
      console.error('Create car error:', error);
      res.status(500).json({ error: 'Failed to create car' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedCar = await CarModel.update(id, updates);

      if (!updatedCar) {
        return res.status(404).json({ error: 'Car not found' });
      }

      res.json({
        message: 'Car updated successfully',
        car: updatedCar
      });
    } catch (error) {
      console.error('Update car error:', error);
      res.status(500).json({ error: 'Failed to update car' });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await CarModel.delete(id);
      res.json({ message: 'Car deleted successfully' });
    } catch (error) {
      console.error('Delete car error:', error);
      res.status(500).json({ error: 'Failed to delete car' });
    }
  }
}

module.exports = new CarController();

