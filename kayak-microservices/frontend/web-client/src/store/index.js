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
import bookingReducer from './slices/bookingSlice';
import flightBookingReducer from './slices/flightBookingSlice';

// Persist configuration for auth
const authPersistConfig = {
  key: 'kayak-auth',
  storage,
  whitelist: ['user', 'token', 'isAuthenticated'], // Only persist these fields
};

// Persist configuration for flight booking (draft persistence)
const flightBookingPersistConfig = {
  key: 'kayak-flight-booking',
  storage,
  whitelist: ['selectedOutboundFlight', 'selectedReturnFlight', 'selectedFare', 'passengers', 'passengerDetails', 'contactInfo', 'additionalServices', 'pricing'],
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedFlightBookingReducer = persistReducer(flightBookingPersistConfig, flightBookingReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    flights: flightsReducer,
    stays: staysReducer,
    booking: bookingReducer,
    flightBooking: persistedFlightBookingReducer,
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
