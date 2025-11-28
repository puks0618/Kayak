/**
 * Hotel Controller
 */

/**
 * Hotel Controller
 */

const HotelModel = require('./model');

class HotelController {
  async getAll(req, res) {
    try {
      const { city, state, price_min, price_max, stars } = req.query;
      const hotels = await HotelModel.findAll({ city, state, price_min, price_max, stars });

      res.json({
        hotels,
        total: hotels.length,
        page: 1
      });
    } catch (error) {
      console.error('Get hotels error:', error);
      res.status(500).json({ error: 'Failed to get hotels' });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const hotel = await HotelModel.findById(id);

      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      // TODO: Fetch reviews/images from MongoDB

      res.json(hotel);
    } catch (error) {
      console.error('Get hotel error:', error);
      res.status(500).json({ error: 'Failed to get hotel' });
    }
  }

  async create(req, res) {
    try {
      const hotelData = req.body;

      if (!hotelData.name || !hotelData.city || !hotelData.price_per_night) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newHotel = await HotelModel.create(hotelData);

      // TODO: Publish listing.created event

      res.status(201).json({
        message: 'Hotel created successfully',
        hotel: newHotel
      });
    } catch (error) {
      console.error('Create hotel error:', error);
      res.status(500).json({ error: 'Failed to create hotel' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedHotel = await HotelModel.update(id, updates);

      if (!updatedHotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      res.json({
        message: 'Hotel updated successfully',
        hotel: updatedHotel
      });
    } catch (error) {
      console.error('Update hotel error:', error);
      res.status(500).json({ error: 'Failed to update hotel' });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await HotelModel.delete(id);
      res.json({ message: 'Hotel deleted successfully' });
    } catch (error) {
      console.error('Delete hotel error:', error);
      res.status(500).json({ error: 'Failed to delete hotel' });
    }
  }
}

module.exports = new HotelController();

