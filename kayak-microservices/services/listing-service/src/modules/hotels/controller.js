/**
 * Hotel Controller
 */

const HotelModel = require('./model');
const cache = require('../../cache/redis');
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
      const cachedResult = await cache.get(cacheKey);
      if (cachedResult) {
        return res.json({
          ...cachedResult,
          cached: true
        });
      }

      let result;

      // Try MySQL/MongoDB first, but fallback to AI Agent on any error
      try {
        result = await HotelModel.search(searchParams);
        
        // If no results, fallback to AI Agent
        if (!result.hotels || result.hotels.length === 0) {
          throw new Error('No hotels found in database');
        }
      } catch (dbError) {
        console.log('Database query failed or returned no hotels, using AI Agent fallback:', dbError.message);
        const aiAgentUrl = process.env.AI_AGENT_URL || 'http://ai-agent:8000';
        const axios = require('axios');
        
        const aiResponse = await axios.get(`${aiAgentUrl}/api/ai/deals`, {
          params: {
            deal_type: 'hotel',
            limit: searchParams.limit || 20
          }
        });

        const hotelDeals = aiResponse.data || [];
        
        // Transform AI Agent format to listing service format
        const hotels = hotelDeals.map(deal => ({
          _id: deal.deal_id,
          name: deal.title,
          city: deal.metadata?.city || 'N/A',
          state: deal.metadata?.state || 'N/A',
          address: deal.metadata?.address || 'N/A',
          price_per_night: deal.price,
          originalPrice: deal.original_price,
          discountPercent: deal.discount_percent,
          stars: deal.metadata?.rating || 0,
          amenities: deal.metadata?.amenities || [],
          description: deal.description,
          images: []
        }));

        result = {
          success: true,
          hotels,
          total: hotels.length,
          page: searchParams.page || 1,
          totalPages: 1,
          filters: searchParams
        };
      }

      // Cache results for 10 minutes
      await cache.set(cacheKey, result, 600);

      res.json({
        ...result,
        cached: false
      });
    } catch (error) {
      console.error('Hotel search error:', error);
      res.status(500).json({ error: 'Failed to search hotels', message: error.message });
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
}

module.exports = new HotelController();

