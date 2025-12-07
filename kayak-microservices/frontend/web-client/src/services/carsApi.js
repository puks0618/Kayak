/**
 * Cars API Service
 * Connects frontend to backend car rental search APIs
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const CARS_API = `${API_BASE_URL}/api/listings/cars`;

/**
 * Search for cars with filters
 * @param {Object} searchParams - Search parameters
 * @returns {Promise<Object>} Search results with cars and pagination
 */
export const searchCars = async (searchParams) => {
  try {
    const {
      location,
      pickupDate,
      dropoffDate,
      pickupTime,
      dropoffTime,
      dropoffLocation,
      type,
      transmission,
      seats,
      company,
      minPrice,
      maxPrice,
      sortBy = 'price',
      sortOrder = 'asc',
      page = 1,
      limit = 20
    } = searchParams;

    const params = new URLSearchParams();
    
    // Required params
    if (location) params.append('location', location);
    if (pickupDate) params.append('pickupDate', pickupDate);
    if (dropoffDate) params.append('dropoffDate', dropoffDate);
    
    // Optional params
    if (pickupTime) params.append('pickupTime', pickupTime);
    if (dropoffTime) params.append('dropoffTime', dropoffTime);
    if (dropoffLocation) params.append('dropoffLocation', dropoffLocation);
    if (type) params.append('type', type);
    if (transmission) params.append('transmission', transmission);
    if (seats) params.append('seats', seats);
    if (company) params.append('company', company);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);
    params.append('page', page);
    params.append('limit', limit);

    const response = await fetch(`${CARS_API}/search?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching cars:', error);
    throw error;
  }
};

/**
 * Get car details by ID
 * @param {string} carId - Car ID
 * @returns {Promise<Object>} Car details
 */
export const getCarDetails = async (carId) => {
  try {
    const response = await fetch(`${CARS_API}/${carId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching car details:', error);
    throw error;
  }
};

/**
 * Get available car cities
 * @returns {Promise<Array<string>>} List of available city names
 */
export const getCarCities = async () => {
  try {
    const response = await fetch(`${CARS_API}/cities`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.cities || [];
  } catch (error) {
    console.error('Error fetching car cities:', error);
    // Return default cities as fallback
    return [
      'Los Angeles, CA',
      'New York, NY',
      'Miami, FL',
      'Las Vegas, NV',
      'San Francisco, CA',
      'Chicago, IL',
      'Orlando, FL',
      'Seattle, WA',
      'Boston, MA',
      'Denver, CO'
    ];
  }
};

/**
 * Get popular cities for cars (static list)
 * @returns {Array<string>} List of popular city names
 */
export const getPopularCities = () => {
  return [
    'Los Angeles, CA',
    'New York, NY',
    'Miami, FL',
    'Las Vegas, NV',
    'San Francisco, CA',
    'Chicago, IL',
    'Orlando, FL',
    'Seattle, WA',
    'Boston, MA',
    'Denver, CO'
  ];
};

export default {
  searchCars,
  getCarDetails,
  getCarCities,
  getPopularCities
};

