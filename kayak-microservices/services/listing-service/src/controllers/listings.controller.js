/**
 * Admin Listings Controller
 * Manages all listing types (flights, hotels, cars, cruises)
 */

const FlightModel = require('../modules/flights/model');
const HotelModel = require('../modules/hotels/model');
const CarModel = require('../modules/cars/model');

class ListingsController {
  /**
   * Get all listings with filtering and pagination
   * GET /api/listings?type=flight&status=active&page=1&limit=20&search=
   */
  async getAll(req, res) {
    try {
      const {
        type = 'all', // flight, hotel, car, cruise, or all
        status = 'all', // active, inactive, all
        page = 1,
        limit = 20,
        search = ''
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      let allListings = [];

      // Fetch from each type
      if (type === 'all' || type === 'flight') {
        const flights = await _getFlights({ status, search, page: pageNum, limit: type === 'flight' ? limitNum : 1000 });
        allListings.push(...flights.map(f => ({ ...f, listing_type: 'flight' })));
      }

      if (type === 'all' || type === 'hotel') {
        const hotels = await _getHotels({ status, search, page: pageNum, limit: type === 'hotel' ? limitNum : 1000 });
        allListings.push(...hotels.map(h => ({ ...h, listing_type: 'hotel' })));
      }

      if (type === 'all' || type === 'car') {
        const cars = await _getCars({ status, search, page: pageNum, limit: type === 'car' ? limitNum : 1000 });
        allListings.push(...cars.map(c => ({ ...c, listing_type: 'car' })));
      }

      // Apply pagination if fetching all types
      const total = allListings.length;
      if (type === 'all') {
        const offset = (pageNum - 1) * limitNum;
        allListings = allListings.slice(offset, offset + limitNum);
      }

      res.json({
        listings: allListings,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('Get all listings error:', error);
      res.status(500).json({ error: 'Failed to fetch listings' });
    }
  }

  /**
   * Update listing status
   * PUT /api/listings/:type/:id/status
   */
  async updateStatus(req, res) {
    try {
      const { type, id } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be "active" or "inactive"' });
      }

      let updatedListing;

      switch (type) {
        case 'flight':
          updatedListing = await FlightModel.updateStatus(id, status);
          break;
        case 'hotel':
          updatedListing = await HotelModel.updateStatus(id, status);
          break;
        case 'car':
          updatedListing = await CarModel.updateStatus(id, status);
          break;
        default:
          return res.status(400).json({ error: 'Invalid listing type' });
      }

      if (!updatedListing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      res.json({
        message: `Listing ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
        listing: updatedListing
      });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({ error: 'Failed to update listing status' });
    }
  }

  /**
   * Delete listing
   * DELETE /api/listings/:type/:id
   */
  async delete(req, res) {
    try {
      const { type, id } = req.params;

      switch (type) {
        case 'flight':
          await FlightModel.delete(id);
          break;
        case 'hotel':
          await HotelModel.delete(id);
          break;
        case 'car':
          await CarModel.delete(id);
          break;
        default:
          return res.status(400).json({ error: 'Invalid listing type' });
      }

      res.json({ message: 'Listing deleted successfully' });
    } catch (error) {
      console.error('Delete listing error:', error);
      res.status(500).json({ error: 'Failed to delete listing' });
    }
  }
}

// Private helper methods
async function _getFlights({ status, search, page, limit }) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM flights WHERE 1=1';
    const params = [];

    if (status === 'active') {
      query += ' AND deleted_at IS NULL';
    } else if (status === 'inactive') {
      query += ' AND deleted_at IS NOT NULL';
    }

    if (search) {
      query += ' AND (flight_code LIKE ? OR airline LIKE ? OR departure_airport LIKE ? OR arrival_airport LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const pool = FlightModel.getPool ? FlightModel.getPool() : require('mysql2/promise').createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Somalwar1!',
      database: process.env.DB_NAME || 'kayak_listings'
    });

    const [rows] = await pool.query(query, params);
    return rows;
}

async function _getHotels({ status, search, page, limit }) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM hotels WHERE 1=1';
    const params = [];

    if (status === 'active') {
      query += ' AND deleted_at IS NULL';
    } else if (status === 'inactive') {
      query += ' AND deleted_at IS NOT NULL';
    }

    if (search) {
      query += ' AND (name LIKE ? OR city LIKE ? OR address LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const pool = require('mysql2/promise').createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Somalwar1!',
      database: process.env.DB_NAME || 'kayak_listings'
    });

    const [rows] = await pool.query(query, params);
    return rows;
}

async function _getCars({ status, search, page, limit }) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM cars WHERE 1=1';
    const params = [];

    if (status === 'active') {
      query += ' AND deleted_at IS NULL';
    } else if (status === 'inactive') {
      query += ' AND deleted_at IS NOT NULL';
    }

    if (search) {
      query += ' AND (company_name LIKE ? OR brand LIKE ? OR model LIKE ? OR location LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const pool = require('mysql2/promise').createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Somalwar1!',
      database: process.env.DB_NAME || 'kayak_listings'
    });

    const [rows] = await pool.query(query, params);
    return rows;
}

module.exports = new ListingsController();
