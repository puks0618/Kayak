/**
 * Redux Store Configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import flightsReducer from './slices/flightsSlice';
import staysReducer from './slices/staysSlice';
import bookingReducer from './slices/bookingSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    flights: flightsReducer,
    stays: staysReducer,
    booking: bookingReducer,
  },
});

export default store;

