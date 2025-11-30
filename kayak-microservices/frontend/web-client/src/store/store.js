/**
 * Redux Store Configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import flightsReducer from './slices/flightsSlice';

// TODO: Import other reducers
// import authReducer from './slices/authSlice';
// import bookingReducer from './slices/bookingSlice';

export const store = configureStore({
  reducer: {
    flights: flightsReducer,
    // auth: authReducer,
    // booking: bookingReducer,
  },
});

export default store;

