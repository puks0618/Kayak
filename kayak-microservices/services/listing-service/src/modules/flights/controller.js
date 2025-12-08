/**
 * Flight Controller - Enhanced for Kayak Flight Search
 */

const FlightModel = require('./model');
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Somalwar1!',
  database: process.env.DB_NAME || 'kayak_listings',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

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

      const deals = await FlightModel.findDeals({
        origin,
        limit: parseInt(limit),
        cabinClass: cabinClass.toLowerCase()
      });

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
      res.status(500).json({ error: 'Failed to get deals' });
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
      const { origin, destination, date, class: flightClass, airline, flightNumber, limit = 20, offset = 0 } = req.query;
      
      // Build query with filters
      let query = 'SELECT * FROM flights WHERE 1=1';
      const params = [];

      if (airline) {
        query += ' AND airline = ?';
        params.push(airline);
      }
      if (flightNumber) {
        query += ' AND flight_code LIKE ?';
        params.push(`%${flightNumber}%`);
      }
      if (origin) {
        query += ' AND departure_airport = ?';
        params.push(origin);
      }
      if (destination) {
        query += ' AND arrival_airport = ?';
        params.push(destination);
      }
      if (date) {
        query += ' AND DATE(departure_time) = ?';
        params.push(date);
      }
      if (flightClass) {
        query += ' AND cabin_class = ?';
        params.push(flightClass);
      }

      // Add LIMIT and OFFSET directly (not as prepared statement params)
      query += ` ORDER BY departure_time ASC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

      const [flights] = await pool.execute(query, params);

      // Get total count with same filters
      let countQuery = 'SELECT COUNT(*) as total FROM flights WHERE 1=1';
      const countParams = [];
      
      if (airline) {
        countQuery += ' AND airline = ?';
        countParams.push(airline);
      }
      if (flightNumber) {
        countQuery += ' AND flight_code LIKE ?';
        countParams.push(`%${flightNumber}%`);
      }
      if (origin) {
        countQuery += ' AND departure_airport = ?';
        countParams.push(origin);
      }
      if (destination) {
        countQuery += ' AND arrival_airport = ?';
        countParams.push(destination);
      }
      if (date) {
        countQuery += ' AND DATE(departure_time) = ?';
        countParams.push(date);
      }
      if (flightClass) {
        countQuery += ' AND cabin_class = ?';
        countParams.push(flightClass);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const totalCount = countResult[0].total;

      res.json({
        flights,
        total: flights.length,
        totalCount: totalCount,
        page: Math.floor(parseInt(offset) / parseInt(limit)) + 1
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

  /**
   * Get list of all airlines
   * GET /api/listings/flights/airlines
   */
  async getAirlines(req, res) {
    try {
      const [rows] = await pool.query(
        'SELECT DISTINCT airline FROM flights WHERE airline IS NOT NULL ORDER BY airline'
      );
      
      const airlines = rows.map(row => row.airline);
      
      res.json({
        success: true,
        airlines,
        total: airlines.length
      });
    } catch (error) {
      console.error('Get airlines error:', error);
      res.status(500).json({ error: 'Failed to fetch airlines' });
    }
  }
}

module.exports = new FlightController();

