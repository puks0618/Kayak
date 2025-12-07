import { createSlice } from '@reduxjs/toolkit';

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

const initialState = {
  recentSearches: loadRecentSearches(),
};

const carsSlice = createSlice({
  name: 'cars',
  initialState,
  reducers: {
    addRecentSearch: (state, action) => {
      const newSearch = {
        ...action.payload,
        timestamp: new Date().toISOString(),
        id: Date.now()
      };
      
      // Add to beginning of array
      state.recentSearches = [newSearch, ...state.recentSearches];
      
      // Keep only last 5 searches
      if (state.recentSearches.length > 5) {
        state.recentSearches = state.recentSearches.slice(0, 5);
      }
      
      // Save to localStorage
      saveRecentSearches(state.recentSearches);
    },
    
    removeRecentSearch: (state, action) => {
      state.recentSearches = state.recentSearches.filter(
        search => search.id !== action.payload
      );
      saveRecentSearches(state.recentSearches);
    },
    
    clearRecentSearches: (state) => {
      state.recentSearches = [];
      localStorage.removeItem('recentCarsSearches');
    }
  }
});

export const {
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches
} = carsSlice.actions;

export default carsSlice.reducer;
