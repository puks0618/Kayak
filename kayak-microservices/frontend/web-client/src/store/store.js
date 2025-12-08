/**
 * Redux Store Configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import flightsReducer from './slices/flightsSlice';
import staysReducer from './slices/staysSlice';
import bookingReducer from './slices/bookingSlice';
import flightBookingReducer from './slices/flightBookingSlice';
import carBookingReducer from './slices/carBookingSlice';
import stayBookingReducer from './slices/stayBookingSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    flights: flightsReducer,
    stays: staysReducer,
    booking: bookingReducer,
    flightBooking: flightBookingReducer,
    carBooking: carBookingReducer,
    stayBooking: stayBookingReducer,
  },
});

export default store;

