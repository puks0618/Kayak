/**
 * Car Rental Controller - Kayak.com-style API
 */

const CarModel = require('./model');

class CarController {
  /**
   * Advanced car search endpoint
   * GET /api/listings/cars/search
   * Query params: location, pickupDate, dropoffDate, type, transmission, seats, minPrice, maxPrice, company, sortBy, sortOrder, limit, offset
   */
  async search(req, res) {
    try {
      const searchParams = {
        location: req.query.location,
        pickupDate: req.query.pickupDate,
        dropoffDate: req.query.dropoffDate,
        type: req.query.type,
        transmission: req.query.transmission,
        seats: req.query.seats,
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice,
        company: req.query.company,
        sortBy: req.query.sortBy || 'price',
        sortOrder: req.query.sortOrder || 'asc',
        limit: req.query.limit || 50,
        offset: req.query.offset || 0
      };

      // Validate required fields
      if (!searchParams.location) {
        return res.status(400).json({ 
          error: 'Location is required for car search',
          example: '/api/listings/cars/search?location=Los Angeles&pickupDate=2025-12-14&dropoffDate=2025-12-18'
        });
      }

      const cars = await CarModel.search(searchParams);

      // Calculate rental duration if dates provided
      let rentalDays = 1;
      if (searchParams.pickupDate && searchParams.dropoffDate) {
        const pickup = new Date(searchParams.pickupDate);
        const dropoff = new Date(searchParams.dropoffDate);
        rentalDays = Math.ceil((dropoff - pickup) / (1000 * 60 * 60 * 24));
      }

      // Add total price calculation
      const enrichedCars = cars.map(car => ({
        ...car,
        rental_days: rentalDays,
        total_price: (car.daily_rental_price * rentalDays).toFixed(2)
      }));

      res.json({
        success: true,
        cars: enrichedCars,
        count: cars.length,
        filters: searchParams,
        rental_days: rentalDays
      });
    } catch (error) {
      console.error('Car search error:', error);
      res.status(500).json({ 
        error: 'Failed to search cars',
        message: error.message 
      });
    }
  }

  /**
   * Get available car types for a location
   * GET /api/listings/cars/types
   */
  async getTypes(req, res) {
    try {
      const { location, pickupDate, dropoffDate } = req.query;

      if (!location) {
        return res.status(400).json({ error: 'Location is required' });
      }

      const types = await CarModel.getAvailableTypes(location, pickupDate, dropoffDate);

      res.json({
        success: true,
        types,
        location
      });
    } catch (error) {
      console.error('Get car types error:', error);
      res.status(500).json({ error: 'Failed to get car types' });
    }
  }

  /**
   * Get all rental companies
   * GET /api/listings/cars/companies
   */
  async getCompanies(req, res) {
    try {
      const { location } = req.query;
      const companies = await CarModel.getCompanies(location);

      res.json({
        success: true,
        companies,
        count: companies.length
      });
    } catch (error) {
      console.error('Get companies error:', error);
      res.status(500).json({ error: 'Failed to get companies' });
    }
  }

  /**
   * Get car by ID with full details
   * GET /api/listings/cars/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const car = await CarModel.findById(id);

      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }

      res.json({
        success: true,
        car
      });
    } catch (error) {
      console.error('Get car error:', error);
      res.status(500).json({ error: 'Failed to get car' });
    }
  }

  /**
   * Check car availability for specific dates
   * POST /api/listings/cars/:id/check-availability
   */
  async checkAvailability(req, res) {
    try {
      const { id } = req.params;
      const { pickupDate, dropoffDate } = req.body;

      if (!pickupDate || !dropoffDate) {
        return res.status(400).json({ 
          error: 'Both pickupDate and dropoffDate are required' 
        });
      }

      const car = await CarModel.findById(id);
      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }

      const isAvailable = await CarModel.checkAvailability(id, pickupDate, dropoffDate);

      res.json({
        success: true,
        car_id: id,
        available: isAvailable,
        pickup_date: pickupDate,
        dropoff_date: dropoffDate
      });
    } catch (error) {
      console.error('Check availability error:', error);
      res.status(500).json({ error: 'Failed to check availability' });
    }
  }

  /**
   * Get price statistics for a location
   * GET /api/listings/cars/price-stats
   */
  async getPriceStats(req, res) {
    try {
      const { location } = req.query;

      if (!location) {
        return res.status(400).json({ error: 'Location is required' });
      }

      const stats = await CarModel.getPriceStats(location);

      res.json({
        success: true,
        location,
        stats
      });
    } catch (error) {
      console.error('Get price stats error:', error);
      res.status(500).json({ error: 'Failed to get price statistics' });
    }
  }

  // ===== ADMIN FUNCTIONS =====

  /**
   * Create a new car (Admin only)
   * POST /api/listings/cars
   */
  async create(req, res) {
    try {
      const carData = req.body;

      // Validate required fields
      const requiredFields = ['company_name', 'brand', 'model', 'year', 'type', 'transmission', 'seats', 'daily_rental_price', 'location'];
      const missingFields = requiredFields.filter(field => !carData[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          missing: missingFields
        });
      }

      const newCar = await CarModel.create(carData);

      res.status(201).json({
        success: true,
        message: 'Car created successfully',
        car: newCar
      });
    } catch (error) {
      console.error('Create car error:', error);
      res.status(500).json({ error: 'Failed to create car' });
    }
  }

  /**
   * Update a car (Admin only)
   * PATCH /api/listings/cars/:id
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedCar = await CarModel.update(id, updates);

      if (!updatedCar) {
        return res.status(404).json({ error: 'Car not found' });
      }

      res.json({
        success: true,
        message: 'Car updated successfully',
        car: updatedCar
      });
    } catch (error) {
      console.error('Update car error:', error);
      res.status(500).json({ error: 'Failed to update car' });
    }
  }

  /**
   * Delete a car (Admin only)
   * DELETE /api/listings/cars/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      await CarModel.delete(id);
      
      res.json({ 
        success: true,
        message: 'Car deleted successfully' 
      });
    } catch (error) {
      console.error('Delete car error:', error);
      res.status(500).json({ error: 'Failed to delete car' });
    }
  }

  // ===== OWNER-SPECIFIC FUNCTIONS =====

  /**
   * Get all cars owned by the authenticated owner
   * GET /api/owner/cars
   * Requires: req.user.id (from JWT middleware)
   */
  async getMyListings(req, res) {
    try {
      const owner_id = req.user.id;
      const cars = await CarModel.findByOwner(owner_id);

      res.json({
        success: true,
        cars,
        total: cars.length
      });
    } catch (error) {
      console.error('Get my listings error:', error);
      res.status(500).json({ error: 'Failed to get your listings' });
    }
  }

  /**
   * Create a new car listing as owner
   * POST /api/owner/cars
   * Listing starts with approval_status: 'pending'
   */
  async createListing(req, res) {
    try {
      const owner_id = req.user.id;
      
      // Validate required fields
      const requiredFields = ['company_name', 'brand', 'model', 'year', 'type', 'transmission', 'seats', 'daily_rental_price', 'location'];
      const missingFields = requiredFields.filter(field => !req.body[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          missing: missingFields
        });
      }

      const carData = {
        ...req.body,
        owner_id,
        approval_status: 'pending' // New listings require admin approval
      };

      const newCar = await CarModel.create(carData);

      res.status(201).json({
        success: true,
        message: 'Car listing created successfully. Pending admin approval.',
        car: newCar,
        status: 'pending'
      });
    } catch (error) {
      console.error('Create listing error:', error);
      res.status(500).json({ error: 'Failed to create listing' });
    }
  }

  /**
   * Update owner's own car listing
   * PATCH /api/owner/cars/:id
   * Only allows updating if car belongs to authenticated owner
   */
  async updateMyListing(req, res) {
    try {
      const owner_id = req.user.id;
      const car_id = req.params.id;
      
      // Verify ownership
      const car = await CarModel.findById(car_id);
      
      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }

      if (car.owner_id !== owner_id) {
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
      
      const updatedCar = await CarModel.update(car_id, updatedData);
      
      res.json({ 
        success: true,
        message: 'Listing updated successfully. Pending re-approval.',
        car: updatedCar,
        status: 'pending'
      });
    } catch (error) {
      console.error('Update listing error:', error);
      res.status(500).json({ error: 'Failed to update listing' });
    }
  }

  /**
   * Delete owner's own car listing
   * DELETE /api/owner/cars/:id
   * Only allows deletion if car belongs to authenticated owner
   */
  async deleteMyListing(req, res) {
    try {
      const owner_id = req.user.id;
      const car_id = req.params.id;
      
      // Verify ownership
      const car = await CarModel.findById(car_id);
      
      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }

      if (car.owner_id !== owner_id) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You can only delete your own listings'
        });
      }
      
      await CarModel.delete(car_id);
      
      res.json({ 
        success: true,
        message: 'Listing deleted successfully',
        car_id
      });
    } catch (error) {
      console.error('Delete listing error:', error);
      res.status(500).json({ error: 'Failed to delete listing' });
    }
  }
}

module.exports = new CarController();

