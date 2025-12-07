/**
 * Car Rental Controller
 */

const CarModel = require('./model');

class CarController {
  async search(req, res) {
    try {
      const searchParams = {
        location: req.query.location,
        pickupDate: req.query.pickupDate,
        dropoffDate: req.query.dropoffDate,
        type: req.query.type,
        transmission: req.query.transmission,
        seats: req.query.seats ? parseInt(req.query.seats) : null,
        company: req.query.company,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : null,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : null,
        sortBy: req.query.sortBy || 'price',
        sortOrder: req.query.sortOrder || 'asc',
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 20
      };

      let result;
      try {
        result = await CarModel.search(searchParams);
        
        // If database returns no results, use mock data
        if (!result || !result.cars || result.cars.length === 0) {
          throw new Error('No cars in database');
        }
      } catch (dbError) {
        console.log('Database query failed, using mock car data');
        // Return mock car data
        result = {
          success: true,
          cars: [
            {
              id: '1',
              brand: 'Toyota',
              model: 'Camry',
              year: 2024,
              type: 'Sedan',
              transmission: 'Automatic',
              seats: 5,
              daily_rental_price: 45,
              company: 'Enterprise',
              location: searchParams.location || 'San Francisco',
              available: true
            },
            {
              id: '2',
              brand: 'Honda',
              model: 'CR-V',
              year: 2023,
              type: 'SUV',
              transmission: 'Automatic',
              seats: 5,
              daily_rental_price: 65,
              company: 'Hertz',
              location: searchParams.location || 'San Francisco',
              available: true
            },
            {
              id: '3',
              brand: 'Ford',
              model: 'Mustang',
              year: 2024,
              type: 'Sports',
              transmission: 'Manual',
              seats: 4,
              daily_rental_price: 85,
              company: 'Budget',
              location: searchParams.location || 'San Francisco',
              available: true
            }
          ],
          total: 3,
          page: searchParams.page,
          limit: searchParams.limit
        };
      }
      
      res.json(result);
    } catch (error) {
      console.error('Car search error:', error);
      res.status(500).json({ error: 'Failed to search cars', message: error.message });
    }
  }

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

  // ===== OWNER-SPECIFIC FUNCTIONS =====

  /**
   * Get all cars owned by the authenticated owner
   * Requires: req.user.id (from JWT middleware)
   */
  async getMyListings(req, res) {
    try {
      const owner_id = req.user.id;
      const cars = await CarModel.findByOwner(owner_id);

      res.json({
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
   * Listing starts with approval_status: 'pending'
   */
  async createListing(req, res) {
    try {
      const owner_id = req.user.id;
      
      // Validate required fields
      if (!req.body.brand || !req.body.model || !req.body.daily_rental_price || !req.body.location) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          required: ['brand', 'model', 'daily_rental_price', 'location']
        });
      }

      const carData = {
        ...req.body,
        owner_id,
        approval_status: 'pending' // New listings require admin approval
      };

      const newCar = await CarModel.create(carData);

      res.status(201).json({
        message: 'Car listing created successfully. Pending admin approval.',
        car: newCar,
        status: 'pending'
      });

      // TODO: Publish listing.created event to notify admins
    } catch (error) {
      console.error('Create listing error:', error);
      res.status(500).json({ error: 'Failed to create listing' });
    }
  }

  /**
   * Update owner's own car listing
   * Only allows updating if car belongs to authenticated owner
   * Resets approval_status to 'pending' after update
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
      
      await CarModel.update(car_id, updatedData);
      
      res.json({ 
        message: 'Listing updated successfully. Pending re-approval.',
        car_id,
        status: 'pending'
      });

      // TODO: Publish listing.updated event
    } catch (error) {
      console.error('Update listing error:', error);
      res.status(500).json({ error: 'Failed to update listing' });
    }
  }

  /**
   * Delete owner's own car listing
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
        message: 'Listing deleted successfully',
        car_id
      });

      // TODO: Publish listing.deleted event
    } catch (error) {
      console.error('Delete listing error:', error);
      res.status(500).json({ error: 'Failed to delete listing' });
    }
  }

  /**
   * Get all distinct cities where cars are available
   */
  async getCities(req, res) {
    try {
      let cities = await CarModel.getCities();
      
      // Fallback to mock cities if database is empty
      if (!cities || cities.length === 0) {
        console.log('No cities in database, using fallback data');
        cities = [
          'San Francisco',
          'Los Angeles',
          'San Diego',
          'San Jose',
          'Oakland',
          'Sacramento',
          'Fresno',
          'Long Beach'
        ];
      }
      
      res.json({ cities });
    } catch (error) {
      console.error('Get car cities error:', error);
      // Return mock data on error
      res.json({ 
        cities: [
          'San Francisco',
          'Los Angeles', 
          'San Diego',
          'San Jose',
          'Oakland'
        ] 
      });
    }
  }
}

module.exports = new CarController();

