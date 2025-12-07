/**
 * Booking Redux Slice
 * Manages booking state - preserves selected items during login flow
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedFlight: null,
  selectedHotel: null,
  selectedCar: null,
  searchParams: {},
  bookingInProgress: false
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
    }
  }
});

export const {
  setSelectedFlight,
  setSelectedHotel,
  setSelectedCar,
  setSearchParams,
  setBookingInProgress,
  clearBooking
} = bookingSlice.actions;

export default bookingSlice.reducer;
