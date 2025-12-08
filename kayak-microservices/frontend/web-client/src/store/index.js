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
import flightBookingReducer from './slices/flightBookingSlice';
import carBookingReducer from './slices/carBookingSlice';
import stayBookingReducer from './slices/stayBookingSlice';

// Persist configuration for auth
const authPersistConfig = {
  key: 'kayak-auth',
  storage,
  whitelist: ['user', 'token', 'isAuthenticated'], // Persist user data including profile changes
};

// Persist configuration for flight booking (draft persistence)
const flightBookingPersistConfig = {
  key: 'kayak-flight-booking',
  storage,
  whitelist: ['selectedOutboundFlight', 'selectedReturnFlight', 'selectedFare', 'passengers', 'passengerDetails', 'contactInfo', 'additionalServices', 'pricing', 'bookedFlights'],
};

// Persist configuration for stay booking
const stayBookingPersistConfig = {
  key: 'kayak-stay-booking',
  storage,
  whitelist: ['selectedHotel', 'stayDetails', 'bookedHotels', 'favorites'],
};

// Persist configuration for car booking
const carBookingPersistConfig = {
  key: 'kayak-car-booking',
  storage,
  whitelist: ['selectedCar', 'carDetails', 'bookedCars'],
};

// Persist configuration for bookings/trips
const bookingPersistConfig = {
  key: 'kayak-bookings',
  storage,
  whitelist: ['trips', 'myTrips'],
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedFlightBookingReducer = persistReducer(flightBookingPersistConfig, flightBookingReducer);
const persistedStayBookingReducer = persistReducer(stayBookingPersistConfig, stayBookingReducer);
const persistedCarBookingReducer = persistReducer(carBookingPersistConfig, carBookingReducer);
const persistedBookingReducer = persistReducer(bookingPersistConfig, bookingReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    flights: flightsReducer,
    stays: staysReducer,
    cars: carsReducer,
    booking: persistedBookingReducer,
    flightBooking: persistedFlightBookingReducer,
    carBooking: persistedCarBookingReducer,
    stayBooking: persistedStayBookingReducer,
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
