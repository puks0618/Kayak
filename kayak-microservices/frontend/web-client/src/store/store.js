/**
 * Redux Store Configuration
 */

import { configureStore } from '@reduxjs/toolkit';

// TODO: Import reducers
// import authReducer from './slices/authSlice';
// import searchReducer from './slices/searchSlice';
// import bookingReducer from './slices/bookingSlice';

export const store = configureStore({
  reducer: {
    // auth: authReducer,
    // search: searchReducer,
    // booking: bookingReducer,
  },
});

export default store;

