/**
 * Cars API Service
 * Connects frontend to backend car rental search APIs
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const CARS_API = `${API_BASE_URL}/api/listings/cars`;

/**
 * Search for cars with filters
 * @param {Object} searchParams - Search parameters
 * @returns {Promise<Object>} Search results with cars
 */
export const searchCars = async (searchParams) => {
  try {
    const {
      location,
      pickupDate,
      dropoffDate,
      pickupTime = 'Noon',
      dropoffTime = 'Noon',
      dropoffLocation,
      type,
      minPrice,
      maxPrice,
      transmission,
      sortBy = 'price',
      sortOrder = 'asc',
      limit = 50,
      page = 1
    } = searchParams;

    const params = new URLSearchParams({
      location,
      pickupDate,
      dropoffDate,
      pickupTime,
      dropoffTime,
      sortBy,
      sortOrder,
      limit: limit.toString(),
      page: page.toString()
    });

    // Add optional filters
    if (dropoffLocation) params.append('dropoffLocation', dropoffLocation);
    if (type) params.append('type', type);
    if (minPrice) params.append('minPrice', minPrice.toString());
    if (maxPrice) params.append('maxPrice', maxPrice.toString());
    if (transmission) params.append('transmission', transmission);

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
 * @returns {Promise<Array>} List of available cities
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
    throw error;
  }
};

export default {
  searchCars,
  getCarDetails,
  getCarCities
};

