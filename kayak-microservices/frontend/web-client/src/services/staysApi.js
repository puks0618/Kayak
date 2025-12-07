/**
 * Stays API Service
 * Connects frontend to backend hotel search APIs
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const STAYS_API = `${API_BASE_URL}/api/listings/hotels`;

/**
 * Search for hotels with filters
 * @param {Object} searchParams - Search parameters
 * @returns {Promise<Object>} Search results with hotels and pagination
 */
export const searchStays = async (searchParams) => {
  try {
    const {
      cities = [],
      checkIn,
      checkOut,
      rooms = 1,
      guests = 2,
      priceMin,
      priceMax,
      starRating,
      amenities = [],
      propertyType,
      sortBy = 'price_asc',
      page = 1,
      limit = 20
    } = searchParams;

    const requestBody = {
      cities,
      checkIn,
      checkOut,
      rooms,
      guests,
      sortBy,
      page,
      limit
    };

    // Add optional filters
    if (priceMin) requestBody.priceMin = priceMin;
    if (priceMax) requestBody.priceMax = priceMax;
    if (starRating) requestBody.starRating = starRating;
    if (amenities.length > 0) requestBody.amenities = amenities;
    if (propertyType) requestBody.propertyType = propertyType;

    const response = await fetch(`${STAYS_API}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching stays:', error);
    throw error;
  }
};

/**
 * Get hotel details by ID
 * @param {string} hotelId - Hotel ID
 * @returns {Promise<Object>} Hotel details with reviews and amenities
 */
export const getStayDetails = async (hotelId) => {
  try {
    const response = await fetch(`${STAYS_API}/${hotelId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching stay details:', error);
    throw error;
  }
};

/**
 * Get popular cities for stays
 * @returns {Array<string>} List of popular city names
 */
export const getPopularCities = () => {
  return [
    'New York',
    'Los Angeles',
    'San Francisco',
    'Miami',
    'Las Vegas',
    'Chicago',
    'Seattle',
    'Boston',
    'Austin',
    'Denver',
    'Portland',
    'San Diego'
  ];
};

/**
 * Get popular neighborhoods (based on our data)
 * @returns {Array<string>} List of popular neighborhood names with city context
 */
export const getPopularNeighborhoods = () => {
  return [
    'Williamsburg, Brooklyn, New York',
    'Harlem, Manhattan, New York',
    'Upper West Side, Manhattan, New York',
    'East Village, Manhattan, New York',
    'Brooklyn Heights, Brooklyn, New York',
    'SoHo, Manhattan, New York',
    'Chelsea, Manhattan, New York',
    'Greenwich Village, Manhattan, New York',
    'Upper East Side, Manhattan, New York',
    'DUMBO, Brooklyn, New York',
    'Beverly Hills, Los Angeles, California',
    'Santa Monica, Los Angeles, California',
    'Hollywood, Los Angeles, California',
    'Venice, Los Angeles, California',
    'Downtown, Los Angeles, California',
    'West Hollywood, Los Angeles, California'
  ];
};

export default {
  searchStays,
  getStayDetails,
  getPopularCities,
  getPopularNeighborhoods
};
