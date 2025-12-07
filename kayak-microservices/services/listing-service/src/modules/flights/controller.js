/**
 * Flight Controller - Enhanced for Kayak Flight Search
 */

const FlightModel = require('./model');

class FlightController {
  /**
   * Search flights with advanced filters
   * GET /api/listings/flights/search
   */
  async search(req, res) {
    try {
      const {
        origin,
        destination,
        departureDate,
        returnDate,
        adults = 1,
        cabinClass = 'economy',
        directOnly = false,
        maxPrice,
        sortBy = 'price', // price, duration, departure_time
        sortOrder = 'asc',
        limit = 50,
        offset = 0
      } = req.query;

      // Validate required fields
      if (!origin || !destination || !departureDate) {
        return res.status(400).json({ 
          error: 'Missing required fields: origin, destination, departureDate' 
        });
      }

      const filters = {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departureDate,
        returnDate,
        cabinClass: cabinClass.toLowerCase(),
        directOnly: directOnly === 'true',
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        sortBy,
        sortOrder,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      const result = await FlightModel.search(filters);

      console.log('Search result:', {
        outboundCount: result.flights?.length,
        returnCount: result.returnFlights?.length,
        isRoundTrip: result.isRoundTrip,
        hasReturnDate: !!filters.returnDate
      });

      const response = {
        success: true,
        flights: result.flights,
        total: result.total,
        filters: {
          origin,
          destination,
          departureDate,
          returnDate,
          cabinClass,
          directOnly
        },
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          hasMore: result.total > (filters.offset + filters.limit)
        }
      };

      // Add return flights if round trip
      if (result.isRoundTrip && result.returnFlights) {
        response.returnFlights = result.returnFlights;
        response.isRoundTrip = true;
      }

      res.json(response);
    } catch (error) {
      console.error('Search flights error:', error);
      res.status(500).json({ error: 'Failed to search flights', message: error.message });
    }
  }

  /**
   * Get flight deals (for "Travel deals under $X" section)
   * GET /api/listings/flights/deals
   * Returns the cheapest unique destinations from origin
   */
  async getDeals(req, res) {
    try {
      const { 
        origin,
        limit = 12,
        cabinClass = 'economy'
      } = req.query;

      // Proxy to AI Agent deals endpoint
      const aiAgentUrl = process.env.AI_AGENT_URL || 'http://ai-agent:8000';
      const axios = require('axios');
      
      const response = await axios.get(`${aiAgentUrl}/api/ai/deals`, {
        params: {
          deal_type: 'flight',
          limit: parseInt(limit)
        }
      });

      const flightDeals = response.data || [];
      
      // Calculate duration between departure and arrival
      const calculateDuration = (departure, arrival) => {
        if (!departure || !arrival) return 90; // Default 1.5 hours
        const dep = new Date(departure);
        const arr = new Date(arrival);
        return Math.round((arr - dep) / (1000 * 60)); // Duration in minutes
      };
      
      // Transform AI Agent format to listing service format expected by frontend
      const deals = flightDeals.map(deal => ({
        id: deal.deal_id,
        // Frontend expects these field names
        departure_airport: deal.metadata?.origin || 'N/A',
        arrival_airport: deal.metadata?.destination || 'N/A',
        departure_city: deal.metadata?.origin || 'N/A',
        arrival_city: deal.metadata?.destination || 'N/A',
        airline: deal.metadata?.airline || 'Unknown',
        price: deal.price,
        originalPrice: deal.original_price,
        discountPercent: deal.discount_percent,
        departure_time: deal.metadata?.departure,
        arrival_time: deal.metadata?.arrival,
        duration: calculateDuration(deal.metadata?.departure, deal.metadata?.arrival),
        stops: 0, // AI Agent data doesn't have stops info
        cabin_class: deal.metadata?.cabin_class || 'economy',
        flight_code: deal.metadata?.flight_code,
        title: deal.title,
        description: deal.description,
        // Keep original names for compatibility
        origin: deal.metadata?.origin || 'N/A',
        destination: deal.metadata?.destination || 'N/A',
        cabinClass: deal.metadata?.cabin_class || 'economy',
        flightCode: deal.metadata?.flight_code,
        departure: deal.metadata?.departure,
        arrival: deal.metadata?.arrival
      }));

      // Calculate max price from the deals
      const maxPrice = deals.length > 0 
        ? Math.max(...deals.map(d => parseFloat(d.price))) 
        : 0;

      res.json({
        success: true,
        deals,
        total: deals.length,
        maxPrice,
        origin
      });
    } catch (error) {
      console.error('Get deals error:', error);
      res.status(500).json({ error: 'Failed to get deals', message: error.message });
    }
  }

  /**
   * Get popular routes with pricing
   * GET /api/listings/flights/routes
   */
  async getRoutes(req, res) {
    try {
      const { 
        origin,
        limit = 50
      } = req.query;

      const routes = await FlightModel.getRouteSummaries({
        origin: origin ? origin.toUpperCase() : null,
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        routes,
        total: routes.length
      });
    } catch (error) {
      console.error('Get routes error:', error);
      res.status(500).json({ error: 'Failed to get routes' });
    }
  }

  /**
   * Get all flights (basic list)
   * GET /api/listings/flights
   */
  async getAll(req, res) {
    try {
      const { origin, destination, date, class: flightClass, limit = 20 } = req.query;
      const flights = await FlightModel.findAll({ 
        origin, 
        destination, 
        date, 
        class: flightClass,
        limit: parseInt(limit)
      });

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

