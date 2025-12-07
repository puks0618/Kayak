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
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);
