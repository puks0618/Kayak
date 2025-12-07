/**
 * Booking Redux Slice
 * Manages booking state - preserves selected items during login flow and completed bookings
 */

import { createSlice } from '@reduxjs/toolkit';

// Load bookings from localStorage
const loadBookings = () => {
  try {
    const saved = localStorage.getItem('bookings');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading bookings:', error);
    return [];
  }
};

// Save bookings to localStorage
const saveBookings = (bookings) => {
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
  completedBookings: loadBookings(),
  currentBooking: null // For BookingSuccess page
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
    // Save completed booking
    saveBooking: (state, action) => {
      const booking = action.payload;
      // Add booking to completed bookings
      state.completedBookings.push(booking);
      // Keep only last 100 bookings
      if (state.completedBookings.length > 100) {
        state.completedBookings = state.completedBookings.slice(-100);
      }
      // Set as current booking for success page
      state.currentBooking = booking;
      // Save to localStorage
      saveBookings(state.completedBookings);
    },
    // Set current booking (for BookingSuccess page)
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload;
    },
    // Clear current booking
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    },
    // Load bookings from localStorage
    loadBookings: (state) => {
      state.completedBookings = loadBookings();
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
  saveBooking,
  setCurrentBooking,
  clearCurrentBooking,
  loadBookings
} = bookingSlice.actions;

export default bookingSlice.reducer;
