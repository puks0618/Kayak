/**
 * Redux Store Configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import flightsReducer from './slices/flightsSlice';
import staysReducer from './slices/staysSlice';

// TODO: Import other reducers
// import authReducer from './slices/authSlice';
// import bookingReducer from './slices/bookingSlice';

export const store = configureStore({
  reducer: {
    flights: flightsReducer,
    stays: staysReducer,
    // auth: authReducer,
    // booking: bookingReducer,
  },
});

export default store;

