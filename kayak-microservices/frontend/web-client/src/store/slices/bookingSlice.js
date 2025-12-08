/**
 * Booking Redux Slice
 * Manages booking state - preserves selected items during login flow and completed bookings
 */

import { createSlice } from '@reduxjs/toolkit';

// Load bookings from localStorage for persistence
const loadBookingsFromStorage = () => {
  try {
    const saved = localStorage.getItem('bookings');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading bookings:', error);
    return [];
  }
};

// Save bookings to localStorage
const saveBookingsToStorage = (bookings) => {
  try {
    localStorage.setItem('bookings', JSON.stringify(bookings));
  } catch (error) {
    console.error('Error saving bookings:', error);
  }
};

const initialState = {
  selectedFlight: null,
  selectedHotel: null,
  selectedCar: null,
  searchParams: {},
  bookingInProgress: false,
  bookings: loadBookingsFromStorage() // Array of completed bookings
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setSelectedFlight: (state, action) => {
      state.selectedFlight = action.payload;
    },
    setSelectedHotel: (state, action) => {
      state.selectedHotel = action.payload;
    },
    setSelectedCar: (state, action) => {
      state.selectedCar = action.payload;
    },
    setSearchParams: (state, action) => {
      state.searchParams = action.payload;
    },
    setBookingInProgress: (state, action) => {
      state.bookingInProgress = action.payload;
    },
    clearBooking: (state) => {
      state.selectedFlight = null;
      state.selectedHotel = null;
      state.selectedCar = null;
      state.bookingInProgress = false;
    },
    // Add completed booking
    addBooking: (state, action) => {
      const newBooking = {
        ...action.payload,
        createdAt: new Date().toISOString()
      };
      
      // Check if booking already exists (prevent duplicates)
      const existingIndex = state.bookings.findIndex(b => b.id === newBooking.id);
      if (existingIndex !== -1) {
        // Update existing booking instead of adding duplicate
        state.bookings[existingIndex] = newBooking;
      } else {
        // Add new booking to beginning
        state.bookings.unshift(newBooking);
        // Keep only last 100 bookings
        if (state.bookings.length > 100) {
          state.bookings = state.bookings.slice(0, 100);
        }
      }
      saveBookingsToStorage(state.bookings);
    },
    // Remove booking
    removeBooking: (state, action) => {
      state.bookings = state.bookings.filter(booking => booking.id !== action.payload);
      saveBookingsToStorage(state.bookings);
    },
    // Update booking
    updateBooking: (state, action) => {
      const index = state.bookings.findIndex(booking => booking.id === action.payload.id);
      if (index !== -1) {
        state.bookings[index] = { ...state.bookings[index], ...action.payload };
        saveBookingsToStorage(state.bookings);
      }
    },
    // Clear all bookings
    clearAllBookings: (state) => {
      state.bookings = [];
      localStorage.removeItem('bookings');
    },
    // Load bookings from localStorage (for sync)
    loadBookings: (state) => {
      state.bookings = loadBookingsFromStorage();
    }
  }
});

export const {
  setSelectedFlight,
  setSelectedHotel,
  setSelectedCar,
  setSearchParams,
  setBookingInProgress,
  clearBooking,
  addBooking,
  removeBooking,
  updateBooking,
  clearAllBookings,
  loadBookings
} = bookingSlice.actions;

export default bookingSlice.reducer;
