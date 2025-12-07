import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { searchStays, getStayDetails } from '../../services/staysApi';

// Load recent searches from localStorage
const loadRecentSearches = () => {
  try {
    const saved = localStorage.getItem('recentStaysSearches');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading recent searches:', error);
    return [];
  }
};

// Save recent searches to localStorage
const saveRecentSearches = (searches) => {
  try {
    localStorage.setItem('recentStaysSearches', JSON.stringify(searches));
  } catch (error) {
    console.error('Error saving recent searches:', error);
  }
};

// Async thunk for searching stays
export const searchStaysAsync = createAsyncThunk(
  'stays/searchStays',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await searchStays(searchParams);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching stay details
export const getStayDetailsAsync = createAsyncThunk(
  'stays/getStayDetails',
  async (hotelId, { rejectWithValue }) => {
    try {
      const response = await getStayDetails(hotelId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  searchForm: {
    cities: [],
    checkIn: '',
    checkOut: '',
    rooms: 1,
    guests: 2,
    priceMin: null,
    priceMax: null,
    starRating: null,
    amenities: [],
    propertyType: '',
    sortBy: 'price_asc'
  },
  results: [],
  selectedStay: null,
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

const staysSlice = createSlice({
  name: 'stays',
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
      
      // Remove duplicate searches (same cities and dates)
      const filtered = state.recentSearches.filter(
        search => !(
          JSON.stringify(search.cities?.sort()) === JSON.stringify(newSearch.cities?.sort()) &&
          search.checkIn === newSearch.checkIn &&
          search.checkOut === newSearch.checkOut
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
      localStorage.removeItem('recentStaysSearches');
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Search stays
      .addCase(searchStaysAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.cached = false;
      })
      .addCase(searchStaysAsync.fulfilled, (state, action) => {
        state.loading = false;
        const hotels = action.payload.hotels || [];
        // Debug logging
        if (hotels.length > 0) {
          console.log('Redux storing hotels:', {
            count: hotels.length,
            firstHotel: {
              hotel_id: hotels[0].hotel_id,
              id: hotels[0].id,
              name: hotels[0].hotel_name
            }
          });
        }
        state.results = hotels;
        state.pagination = action.payload.pagination || initialState.pagination;
        state.cached = action.payload.cached || false;
        state.error = null;
      })
      .addCase(searchStaysAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to search stays';
        state.results = [];
      })
      // Get stay details
      .addCase(getStayDetailsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStayDetailsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedStay = action.payload;
        state.error = null;
      })
      .addCase(getStayDetailsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch stay details';
        state.selectedStay = null;
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
} = staysSlice.actions;

export default staysSlice.reducer;
