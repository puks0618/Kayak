import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { searchCars, getCarDetails } from '../../services/carsApi';

// Load recent searches from localStorage
const loadRecentSearches = () => {
  try {
    const saved = localStorage.getItem('recentCarsSearches');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading recent searches:', error);
    return [];
  }
};

// Save recent searches to localStorage
const saveRecentSearches = (searches) => {
  try {
    localStorage.setItem('recentCarsSearches', JSON.stringify(searches));
  } catch (error) {
    console.error('Error saving recent searches:', error);
  }
};

// Async thunk for searching cars
export const searchCarsAsync = createAsyncThunk(
  'cars/searchCars',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await searchCars(searchParams);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching car details
export const getCarDetailsAsync = createAsyncThunk(
  'cars/getCarDetails',
  async (carId, { rejectWithValue }) => {
    try {
      const response = await getCarDetails(carId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  searchForm: {
    location: '',
    pickupDate: '',
    dropoffDate: '',
    pickupTime: 'Noon',
    dropoffTime: 'Noon',
    sameDropOff: true,
    dropoffLocation: '',
    type: '',
    transmission: '',
    seats: null,
    company: '',
    minPrice: null,
    maxPrice: null,
    sortBy: 'price',
    sortOrder: 'asc'
  },
  results: [],
  selectedCar: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  },
  loading: false,
  error: null,
  recentSearches: loadRecentSearches(),
  cached: false
};

const carsSlice = createSlice({
  name: 'cars',
  initialState,
  reducers: {
    updateSearchForm: (state, action) => {
      state.searchForm = { ...state.searchForm, ...action.payload };
    },
    resetSearchForm: (state) => {
      state.searchForm = initialState.searchForm;
    },
    clearResults: (state) => {
      state.results = [];
      state.pagination = initialState.pagination;
      state.error = null;
      state.cached = false;
    },
    addRecentSearch: (state, action) => {
      const newSearch = {
        ...action.payload,
        timestamp: new Date().toISOString()
      };
      
      // Remove duplicate searches (same location and dates)
      const filtered = state.recentSearches.filter(
        search => !(
          search.location === newSearch.location &&
          search.pickupDate === newSearch.pickupDate &&
          search.dropoffDate === newSearch.dropoffDate
        )
      );
      
      // Add new search at the beginning and keep only last 5
      const updated = [newSearch, ...filtered].slice(0, 5);
      state.recentSearches = updated;
      saveRecentSearches(updated);
    },
    removeRecentSearch: (state, action) => {
      const updated = state.recentSearches.filter((_, index) => index !== action.payload);
      state.recentSearches = updated;
      saveRecentSearches(updated);
    },
    clearRecentSearches: (state) => {
      state.recentSearches = [];
      localStorage.removeItem('recentCarsSearches');
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Search cars
      .addCase(searchCarsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.cached = false;
      })
      .addCase(searchCarsAsync.fulfilled, (state, action) => {
        state.loading = false;
        const cars = action.payload.cars || [];
        state.results = cars;
        // Handle pagination - API might return pagination object or we calculate it
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        } else {
          state.pagination = {
            ...state.pagination,
            total: action.payload.total || cars.length,
            totalPages: action.payload.totalPages || Math.ceil((action.payload.total || cars.length) / state.pagination.limit)
          };
        }
        state.cached = action.payload.cached || false;
        state.error = null;
      })
      .addCase(searchCarsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to search cars';
        state.results = [];
      })
      // Get car details
      .addCase(getCarDetailsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCarDetailsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCar = action.payload;
        state.error = null;
      })
      .addCase(getCarDetailsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch car details';
        state.selectedCar = null;
      });
  }
});

export const {
  updateSearchForm,
  resetSearchForm,
  clearResults,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  setPage
} = carsSlice.actions;

export default carsSlice.reducer;

