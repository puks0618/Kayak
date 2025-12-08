/**
 * Hotel Controller
 */

const HotelModel = require('./model');
const cache = require('../../cache/redisHotels');
const cacheMetrics = require('../../cache/metrics');
const crypto = require('crypto');

class HotelController {
  /**
   * Advanced search endpoint
   * GET /api/listings/hotels/search or POST /api/listings/hotels/search
   */
  async search(req, res) {
    try {
      // Support both GET (query params) and POST (body) requests
      let searchParams;
      
      if (req.method === 'GET') {
        // Parse query parameters for GET requests
        searchParams = {
          cities: req.query.cities ? (Array.isArray(req.query.cities) ? req.query.cities : [req.query.cities]) : [],
          checkIn: req.query.checkIn,
          checkOut: req.query.checkOut,
          rooms: req.query.rooms ? parseInt(req.query.rooms) : 1,
          guests: req.query.guests ? parseInt(req.query.guests) : 2,
          priceMin: req.query.priceMin ? parseFloat(req.query.priceMin) : undefined,
          priceMax: req.query.priceMax ? parseFloat(req.query.priceMax) : undefined,
          starRating: req.query.starRating ? parseInt(req.query.starRating) : undefined,
          amenities: req.query.amenities ? (Array.isArray(req.query.amenities) ? req.query.amenities : [req.query.amenities]) : [],
          propertyType: req.query.propertyType,
          sortBy: req.query.sortBy || 'price_asc',
          page: req.query.page ? parseInt(req.query.page) : 1,
          limit: req.query.limit ? parseInt(req.query.limit) : 20
        };
      } else {
        // Use body for POST requests
        searchParams = req.body;
      }
      
      // Generate cache key from search parameters
      const cacheKey = `hotel_search:${crypto
        .createHash('md5')
        .update(JSON.stringify(searchParams))
        .digest('hex')}`;

      // Check cache first
      const startTime = Date.now();
      const cachedResult = await cache.get(cacheKey);
      if (cachedResult) {
        const responseTime = Date.now() - startTime;
        cacheMetrics.recordHit('hotels', responseTime);
        return res.json({
          ...cachedResult,
          cached: true
        });
      }

      // Perform search
      const result = await HotelModel.search(searchParams);
      const responseTime = Date.now() - startTime;
      cacheMetrics.recordMiss('hotels', responseTime);

      // Cache results for 10 minutes
      await cache.set(cacheKey, result, 600);

      res.json({
        ...result,
        cached: false
      });
    } catch (error) {
      console.error('Hotel search error:', error);
      res.status(500).json({ error: 'Failed to search hotels' });
    }
  }
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
      
      // Check cache first
      const cacheKey = `hotel:${id}`;
      const cachedHotel = await cache.get(cacheKey);
      
      if (cachedHotel) {
        return res.json({ ...cachedHotel, cached: true });
      }

      const hotel = await HotelModel.findByIdWithDetails(id);

      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      // Cache for 30 minutes
      await cache.set(cacheKey, hotel, 1800);

      res.json({ ...hotel, cached: false });
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

  // ===== OWNER-SPECIFIC FUNCTIONS =====

  /**
   * Get all hotels owned by the authenticated owner
   * Requires: req.user.id (from JWT middleware)
   */
  async getMyListings(req, res) {
    try {
      // Get owner_id from query params or req.user
      const owner_id = req.query.ownerId || req.user?.id;
      if (!owner_id) {
        return res.status(400).json({ error: 'Owner ID required' });
      }
      const hotels = await HotelModel.findByOwner(owner_id);

      res.json({
        hotels,
        total: hotels.length
      });
    } catch (error) {
      console.error('Get my hotel listings error:', error);
      res.status(500).json({ error: 'Failed to get your hotel listings' });
    }
  }

  /**
   * Create a new hotel listing as owner
   * Listing starts with approval_status: 'pending'
   */
  async createListing(req, res) {
    try {
      const owner_id = req.user.id;
      
      // Validate required fields
      if (!req.body.name || !req.body.city || !req.body.price_per_night || !req.body.num_rooms) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          required: ['name', 'city', 'price_per_night', 'num_rooms']
        });
      }

      const hotelData = {
        ...req.body,
        owner_id,
        approval_status: 'pending' // New listings require admin approval
      };

      const newHotel = await HotelModel.create(hotelData);

      res.status(201).json({
        message: 'Hotel listing created successfully. Pending admin approval.',
        hotel: newHotel,
        status: 'pending'
      });

      // TODO: Publish listing.created event to notify admins
    } catch (error) {
      console.error('Create hotel listing error:', error);
      res.status(500).json({ error: 'Failed to create hotel listing' });
    }
  }

  /**
   * Update owner's own hotel listing
   * Only allows updating if hotel belongs to authenticated owner
   * Resets approval_status to 'pending' after update
   */
  async updateMyListing(req, res) {
    try {
      const owner_id = req.user.id;
      const hotel_id = req.params.id;
      
      // Verify ownership
      const hotel = await HotelModel.findById(hotel_id);
      
      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      if (hotel.owner_id !== owner_id) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You can only update your own listings'
        });
      }
      
      // Update and reset approval status
      const updatedData = {
        ...req.body,
        approval_status: 'pending' // Re-require admin approval after edit
      };
      
      await HotelModel.update(hotel_id, updatedData);
      
      res.json({ 
        message: 'Hotel listing updated successfully. Pending re-approval.',
        hotel_id,
        status: 'pending'
      });

      // TODO: Publish listing.updated event
    } catch (error) {
      console.error('Update hotel listing error:', error);
      res.status(500).json({ error: 'Failed to update hotel listing' });
    }
  }

  /**
   * Delete owner's own hotel listing
   * Only allows deletion if hotel belongs to authenticated owner
   */
  async deleteMyListing(req, res) {
    try {
      const owner_id = req.user.id;
      const hotel_id = req.params.id;
      
      // Verify ownership
      const hotel = await HotelModel.findById(hotel_id);
      
      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      if (hotel.owner_id !== owner_id) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You can only delete your own listings'
        });
      }
      
      await HotelModel.delete(hotel_id);
      
      res.json({ 
        message: 'Hotel listing deleted successfully',
        hotel_id
      });

      // TODO: Publish listing.deleted event
    } catch (error) {
      console.error('Delete hotel listing error:', error);
      res.status(500).json({ error: 'Failed to delete hotel listing' });
    }
  }
}

module.exports = new HotelController();

