/**
 * Flights Redux Slice
 * Manages flight search state, results, and recent searches
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { searchFlights, getFlightById } from '../../services/flightsApi';

// Async thunk for searching flights
export const searchFlightsAsync = createAsyncThunk(
  'flights/searchFlights',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await searchFlights(searchParams);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching flight details
export const getFlightDetailsAsync = createAsyncThunk(
  'flights/getFlightDetails',
  async (flightId, { rejectWithValue }) => {
    try {
      const response = await getFlightById(flightId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Load recent searches from localStorage
const loadRecentSearches = () => {
  try {
    const saved = localStorage.getItem('kayak_recent_flight_searches');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading recent searches:', error);
    return [];
  }
};

// Save recent searches to localStorage
const saveRecentSearches = (searches) => {
  try {
    localStorage.setItem('kayak_recent_flight_searches', JSON.stringify(searches));
  } catch (error) {
    console.error('Error saving recent searches:', error);
  }
};

const initialState = {
  // Search form state
  searchForm: {
    tripType: 'roundtrip', // 'roundtrip' | 'oneway'
    origin: null,
    destination: null,
    departureDate: null,
    returnDate: null,
    adults: 1,
    children: 0,
    cabinClass: 'economy',
    bags: 0,
    directOnly: false
  },
  
  // Search results
  results: [],
  returnFlights: [],
  isRoundTrip: false,
  selectedFlight: null,
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  },
  loading: false,
  error: null,
  cached: false,
  
  // Recent searches
  recentSearches: loadRecentSearches(),
  
  // Filters
  filters: {
    maxPrice: null,
    airlines: [],
    stops: null, // null, 0, 1, 2+
    sortBy: 'price_asc' // 'price_asc', 'duration_asc', 'departure_asc'
  }
};

const flightsSlice = createSlice({
  name: 'flights',
  initialState,
  reducers: {
    // Update search form
    updateSearchForm: (state, action) => {
      state.searchForm = { ...state.searchForm, ...action.payload };
    },
    
    // Reset search form
    resetSearchForm: (state) => {
      state.searchForm = initialState.searchForm;
    },
    
    // Add to recent searches
    addRecentSearch: (state, action) => {
      const newSearch = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...action.payload
      };
      
      // Remove duplicates (same origin + destination + dates)
      state.recentSearches = state.recentSearches.filter(search => 
        !(search.origin === newSearch.origin && 
          search.destination === newSearch.destination &&
          search.departureDate === newSearch.departureDate)
      );
      
      // Add to beginning
      state.recentSearches.unshift(newSearch);
      
      // Keep only last 5
      state.recentSearches = state.recentSearches.slice(0, 5);
      
      // Save to localStorage
      saveRecentSearches(state.recentSearches);
    },
    
    // Update filters
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    // Reset filters
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    // Clear search results
    clearResults: (state) => {
      state.results = [];
      state.returnFlights = [];
      state.pagination = initialState.pagination;
      state.error = null;
      state.cached = false;
    },
    
    // Set page for pagination
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Search flights
      .addCase(searchFlightsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.cached = false;
      })
      .addCase(searchFlightsAsync.fulfilled, (state, action) => {
        state.loading = false;
        const flights = action.payload.flights || action.payload || [];
        state.results = flights;
        state.returnFlights = action.payload.returnFlights || [];
        state.isRoundTrip = action.payload.isRoundTrip || false;
        
        // Handle pagination - API might return pagination object or we calculate it
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        } else {
          const total = action.payload.total || flights.length;
          state.pagination = {
            ...state.pagination,
            total: total,
            totalPages: action.payload.totalPages || Math.ceil(total / state.pagination.limit)
          };
        }
        state.cached = action.payload.cached || false;
        state.error = null;
      })
      .addCase(searchFlightsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to search flights';
        state.results = [];
        state.returnFlights = [];
      })
      // Get flight details
      .addCase(getFlightDetailsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFlightDetailsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedFlight = action.payload;
        state.error = null;
      })
      .addCase(getFlightDetailsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch flight details';
        state.selectedFlight = null;
      });
  }
});

export const {
  updateSearchForm,
  resetSearchForm,
  addRecentSearch,
  updateFilters,
  resetFilters,
  clearResults,
  setPage
} = flightsSlice.actions;

export default flightsSlice.reducer;


