/**
 * Redux Store Configuration
 * Configured with Redux Persist for state persistence
 */

import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage
import authReducer from './authSlice';
import flightsReducer from './slices/flightsSlice';
import staysReducer from './slices/staysSlice';
import carsReducer from './slices/carsSlice';
import bookingReducer from './slices/bookingSlice';

// Persist configuration
const persistConfig = {
  key: 'kayak-auth',
  storage,
  whitelist: ['user', 'token', 'isAuthenticated'], // Only persist these fields
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    flights: flightsReducer,
    stays: staysReducer,
    cars: carsReducer,
    booking: bookingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  // Enable Redux DevTools - explicitly enable it
  devTools: true,
});

export const persistor = persistStore(store);

// Expose store to window for Redux DevTools (development only)
if (typeof window !== 'undefined') {
  window.__REDUX_STORE__ = store;
  // Also expose for Redux DevTools extension
  if (window.__REDUX_DEVTOOLS_EXTENSION__) {
    window.__REDUX_DEVTOOLS_EXTENSION__.connect();
  }
}
