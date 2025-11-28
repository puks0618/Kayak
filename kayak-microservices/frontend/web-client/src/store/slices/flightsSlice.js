/**
 * Flights Redux Slice
 * Manages flight search state, results, and recent searches
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Mock flight data for development
const MOCK_FLIGHTS = [
  {
    id: 'flt_1',
    airline: 'Delta',
    flightNumber: 'DL123',
    origin: { code: 'SFO', city: 'San Francisco', name: 'San Francisco International' },
    destination: { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles International' },
    departureTime: '2025-12-14T09:30:00Z',
    arrivalTime: '2025-12-14T11:00:00Z',
    durationMinutes: 90,
    stops: 0,
    cabinClass: 'economy',
    price: 177.00,
    currency: 'USD',
    seatsLeft: 5,
    refundable: false
  },
  {
    id: 'flt_2',
    airline: 'United',
    flightNumber: 'UA456',
    origin: { code: 'SFO', city: 'San Francisco', name: 'San Francisco International' },
    destination: { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles International' },
    departureTime: '2025-12-14T14:15:00Z',
    arrivalTime: '2025-12-14T15:45:00Z',
    durationMinutes: 90,
    stops: 0,
    cabinClass: 'economy',
    price: 156.00,
    currency: 'USD',
    seatsLeft: 3,
    refundable: true
  },
  {
    id: 'flt_3',
    airline: 'American',
    flightNumber: 'AA789',
    origin: { code: 'SFO', city: 'San Francisco', name: 'San Francisco International' },
    destination: { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles International' },
    departureTime: '2025-12-14T18:00:00Z',
    arrivalTime: '2025-12-14T19:30:00Z',
    durationMinutes: 90,
    stops: 0,
    cabinClass: 'economy',
    price: 203.00,
    currency: 'USD',
    seatsLeft: 8,
    refundable: false
  }
];

// Async thunk to search flights
export const searchFlights = createAsyncThunk(
  'flights/search',
  async (searchParams, { rejectWithValue }) => {
    try {
      // Try real API first
      const response = await axios.get('http://localhost:3002/api/listings/flights/search', {
        params: searchParams
      });
      
      return {
        flights: response.data.flights || response.data,
        total: response.data.total || response.data.length
      };
    } catch (error) {
      console.warn('Backend not available, using mock data:', error.message);
      
      // Fallback to mock data
      // Filter mock data based on search params
      let filteredFlights = [...MOCK_FLIGHTS];
      
      if (searchParams.origin) {
        filteredFlights = filteredFlights.filter(f => 
          f.origin.code === searchParams.origin.toUpperCase()
        );
      }
      
      if (searchParams.destination) {
        filteredFlights = filteredFlights.filter(f => 
          f.destination.code === searchParams.destination.toUpperCase()
        );
      }
      
      // Sort by price
      filteredFlights.sort((a, b) => a.price - b.price);
      
      return {
        flights: filteredFlights,
        total: filteredFlights.length
      };
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
  totalResults: 0,
  isSearching: false,
  searchError: null,
  hasSearched: false,
  
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
      state.totalResults = 0;
      state.hasSearched = false;
      state.searchError = null;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Search flights pending
      .addCase(searchFlights.pending, (state) => {
        state.isSearching = true;
        state.searchError = null;
      })
      // Search flights fulfilled
      .addCase(searchFlights.fulfilled, (state, action) => {
        state.isSearching = false;
        state.results = action.payload.flights;
        state.totalResults = action.payload.total;
        state.hasSearched = true;
        state.searchError = null;
      })
      // Search flights rejected
      .addCase(searchFlights.rejected, (state, action) => {
        state.isSearching = false;
        state.searchError = action.error.message;
        state.hasSearched = true;
      });
  }
});

export const {
  updateSearchForm,
  resetSearchForm,
  addRecentSearch,
  updateFilters,
  resetFilters,
  clearResults
} = flightsSlice.actions;

export default flightsSlice.reducer;


