/**
 * Flights API Service
 * Connects frontend to backend flight APIs
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
const FLIGHTS_API = `${API_BASE_URL}/api/listings/flights`;

/**
 * Search for flights with filters
 */
export const searchFlights = async (searchParams) => {
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
      sortBy = 'price',
      sortOrder = 'asc',
      limit = 50,
      offset = 0
    } = searchParams;

    // Build query string
    const params = new URLSearchParams({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      adults: adults.toString(),
      cabinClass: cabinClass.toLowerCase(),
      directOnly: directOnly.toString(),
      sortBy,
      sortOrder,
      limit: limit.toString(),
      offset: offset.toString()
    });

    if (returnDate) {
      params.append('returnDate', returnDate);
    }
    if (maxPrice) {
      params.append('maxPrice', maxPrice.toString());
    }

    const response = await fetch(`${FLIGHTS_API}/search?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching flights:', error);
    throw error;
  }
};

/**
 * Get flight deals (for "Travel deals under $X" section)
 */
export const getFlightDeals = async (options = {}) => {
  try {
    const {
      maxPrice = 310,
      limit = 12,
      cabinClass = 'economy'
    } = options;

    const params = new URLSearchParams({
      maxPrice: maxPrice.toString(),
      limit: limit.toString(),
      cabinClass: cabinClass.toLowerCase()
    });

    const response = await fetch(`${FLIGHTS_API}/deals?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching flight deals:', error);
    throw error;
  }
};

/**
 * Get popular flight routes (for "Search cheap flights by destination" section)
 */
export const getFlightRoutes = async (options = {}) => {
  try {
    const {
      origin,
      limit = 50
    } = options;

    const params = new URLSearchParams({
      limit: limit.toString()
    });

    if (origin) {
      params.append('origin', origin.toUpperCase());
    }

    const response = await fetch(`${FLIGHTS_API}/routes?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching flight routes:', error);
    throw error;
  }
};

/**
 * Get flight by ID
 */
export const getFlightById = async (flightId) => {
  try {
    const response = await fetch(`${FLIGHTS_API}/${flightId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching flight:', error);
    throw error;
  }
};

/**
 * Format flight data for display
 */
export const formatFlightForDisplay = (flight) => {
  return {
    id: flight.id,
    flightCode: flight.flight_code,
    airline: flight.airline,
    origin: {
      code: flight.departure_airport,
      name: flight.departure_airport_name,
      city: flight.departure_city
    },
    destination: {
      code: flight.arrival_airport,
      name: flight.arrival_airport_name,
      city: flight.arrival_city
    },
    departureTime: new Date(flight.departure_time),
    arrivalTime: new Date(flight.arrival_time),
    duration: flight.duration,
    stops: flight.stops,
    price: parseFloat(flight.price),
    basePrice: parseFloat(flight.base_price),
    cabinClass: flight.cabin_class,
    isDeal: Boolean(flight.is_deal),
    discountPercent: flight.discount_percent,
    rating: parseFloat(flight.rating),
    seatsLeft: flight.seats_left,
    seatsTotal: flight.seats_total
  };
};

export default {
  searchFlights,
  getFlightDeals,
  getFlightRoutes,
  getFlightById,
  formatFlightForDisplay
};

