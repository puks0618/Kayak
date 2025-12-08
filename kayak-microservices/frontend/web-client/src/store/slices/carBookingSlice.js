/**
 * Car Booking Redux Slice
 * Manages car rental booking state and workflow
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ===========================
// Async Thunks
// ===========================

/**
 * Create a new car booking
 */
export const createCarBooking = createAsyncThunk(
  'carBooking/create',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/bookings`, bookingData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

/**
 * Fetch car booking by ID
 */
export const fetchCarBookingById = createAsyncThunk(
  'carBooking/fetchById',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

/**
 * Fetch user car bookings
 */
export const fetchUserCarBookings = createAsyncThunk(
  'carBooking/fetchUserBookings',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/bookings/user/${userId}`);
      return response.data.filter(booking => booking.listing_type === 'car');
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

/**
 * Cancel car booking
 */
export const cancelCarBooking = createAsyncThunk(
  'carBooking/cancel',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/bookings/${bookingId}`);
      return { bookingId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// ===========================
// Initial State
// ===========================

const initialState = {
  // Selected car for booking
  selectedCar: null,
  
  // Rental details
  pickupDate: null,
  dropoffDate: null,
  pickupTime: '10:00',
  dropoffTime: '10:00',
  pickupLocation: '',
  days: 1,
  
  // Driver information
  driverInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    licenseNumber: ''
  },
  
  // Payment information
  paymentInfo: {
    method: 'credit', // credit, debit, paypal
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  },
  
  // Pricing
  pricing: {
    basePrice: 0,
    taxesAndFees: 0,
    insurance: 0,
    additionalServices: 0,
    totalPrice: 0
  },
  
  // Additional services
  additionalServices: {
    insurance: false,
    gps: false,
    childSeat: false,
    additionalDriver: false
  },
  
  // Booking state
  confirmedBooking: null,
  bookingId: null,
  bookingHistory: [],
  
  // UI state
  isProcessing: false,
  bookingError: null,
  validationErrors: {},
  isLoadingHistory: false
};

// ===========================
// Slice
// ===========================

const carBookingSlice = createSlice({
  name: 'carBooking',
  initialState,
  reducers: {
    // Car selection
    setSelectedCar: (state, action) => {
      state.selectedCar = action.payload;
      // Initialize base price when car is selected
      if (action.payload?.price_per_day && state.days > 0) {
        state.pricing.basePrice = action.payload.price_per_day * state.days;
      }
    },
    
    // Rental details
    setRentalDetails: (state, action) => {
      const { pickupDate, dropoffDate, pickupTime, dropoffTime, pickupLocation } = action.payload;
      if (pickupDate) state.pickupDate = pickupDate;
      if (dropoffDate) state.dropoffDate = dropoffDate;
      if (pickupTime) state.pickupTime = pickupTime;
      if (dropoffTime) state.dropoffTime = dropoffTime;
      if (pickupLocation) state.pickupLocation = pickupLocation;
      
      // Calculate days
      if (pickupDate && dropoffDate) {
        const pickup = new Date(pickupDate);
        const dropoff = new Date(dropoffDate);
        const diffTime = Math.abs(dropoff - pickup);
        state.days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        
        // Recalculate pricing
        if (state.selectedCar?.price_per_day) {
          state.pricing.basePrice = state.selectedCar.price_per_day * state.days;
          carBookingSlice.caseReducers.calculatePricing(state);
        }
      }
    },
    
    setPickupDate: (state, action) => {
      state.pickupDate = action.payload;
      if (state.dropoffDate) {
        const pickup = new Date(action.payload);
        const dropoff = new Date(state.dropoffDate);
        const diffTime = Math.abs(dropoff - pickup);
        state.days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        
        if (state.selectedCar?.price_per_day) {
          state.pricing.basePrice = state.selectedCar.price_per_day * state.days;
          carBookingSlice.caseReducers.calculatePricing(state);
        }
      }
    },
    
    setDropoffDate: (state, action) => {
      state.dropoffDate = action.payload;
      if (state.pickupDate) {
        const pickup = new Date(state.pickupDate);
        const dropoff = new Date(action.payload);
        const diffTime = Math.abs(dropoff - pickup);
        state.days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        
        if (state.selectedCar?.price_per_day) {
          state.pricing.basePrice = state.selectedCar.price_per_day * state.days;
          carBookingSlice.caseReducers.calculatePricing(state);
        }
      }
    },
    
    setPickupTime: (state, action) => {
      state.pickupTime = action.payload;
    },
    
    setDropoffTime: (state, action) => {
      state.dropoffTime = action.payload;
    },
    
    setPickupLocation: (state, action) => {
      state.pickupLocation = action.payload;
    },
    
    // Driver information
    updateDriverInfo: (state, action) => {
      state.driverInfo = { ...state.driverInfo, ...action.payload };
    },
    
    // Payment information
    updatePaymentInfo: (state, action) => {
      state.paymentInfo = { ...state.paymentInfo, ...action.payload };
    },
    
    // Additional services
    toggleInsurance: (state) => {
      state.additionalServices.insurance = !state.additionalServices.insurance;
      carBookingSlice.caseReducers.calculatePricing(state);
    },
    
    toggleGPS: (state) => {
      state.additionalServices.gps = !state.additionalServices.gps;
      carBookingSlice.caseReducers.calculatePricing(state);
    },
    
    toggleChildSeat: (state) => {
      state.additionalServices.childSeat = !state.additionalServices.childSeat;
      carBookingSlice.caseReducers.calculatePricing(state);
    },
    
    toggleAdditionalDriver: (state) => {
      state.additionalServices.additionalDriver = !state.additionalServices.additionalDriver;
      carBookingSlice.caseReducers.calculatePricing(state);
    },
    
    // Pricing calculation
    calculatePricing: (state) => {
      // Ensure basePrice is a valid number
      const basePrice = parseFloat(state.pricing.basePrice) || 0;
      let additionalServices = 0;
      
      // Add service costs
      if (state.additionalServices.insurance) additionalServices += 15 * state.days;
      if (state.additionalServices.gps) additionalServices += 10 * state.days;
      if (state.additionalServices.childSeat) additionalServices += 8 * state.days;
      if (state.additionalServices.additionalDriver) additionalServices += 12 * state.days;
      
      state.pricing.additionalServices = additionalServices;
      
      // Calculate taxes (15% of base + services)
      const subtotal = basePrice + additionalServices;
      state.pricing.taxesAndFees = subtotal * 0.15;
      
      // Total price
      state.pricing.totalPrice = subtotal + state.pricing.taxesAndFees;
    },
    
    // Validation
    setValidationErrors: (state, action) => {
      state.validationErrors = action.payload;
    },
    
    clearValidationErrors: (state) => {
      state.validationErrors = {};
    },
    
    setFieldError: (state, action) => {
      const { field, error } = action.payload;
      state.validationErrors[field] = error;
    },
    
    clearFieldError: (state, action) => {
      delete state.validationErrors[action.payload];
    },
    
    // Reset booking
    clearBookingData: (state) => {
      state.selectedCar = null;
      state.pickupDate = null;
      state.dropoffDate = null;
      state.pickupTime = '10:00';
      state.dropoffTime = '10:00';
      state.pickupLocation = '';
      state.days = 1;
      state.driverInfo = initialState.driverInfo;
      state.paymentInfo = { ...initialState.paymentInfo };
      state.pricing = initialState.pricing;
      state.additionalServices = initialState.additionalServices;
      state.validationErrors = {};
      state.bookingError = null;
    },
    
    resetBooking: (state) => {
      return { ...initialState, bookingHistory: state.bookingHistory };
    }
  },
  
  // ===========================
  // Extra Reducers (Async Thunks)
  // ===========================
  extraReducers: (builder) => {
    builder
      // Create Booking
      .addCase(createCarBooking.pending, (state) => {
        state.isProcessing = true;
        state.bookingError = null;
      })
      .addCase(createCarBooking.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.confirmedBooking = action.payload;
        state.bookingId = action.payload.booking_id || action.payload.id;
        // Add to history
        state.bookingHistory.unshift(action.payload);
      })
      .addCase(createCarBooking.rejected, (state, action) => {
        state.isProcessing = false;
        state.bookingError = action.payload?.message || 'Failed to create booking';
      })
      
      // Fetch Booking
      .addCase(fetchCarBookingById.pending, (state) => {
        state.isProcessing = true;
      })
      .addCase(fetchCarBookingById.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.confirmedBooking = action.payload;
      })
      .addCase(fetchCarBookingById.rejected, (state, action) => {
        state.isProcessing = false;
        state.bookingError = action.payload?.message || 'Failed to fetch booking';
      })
      
      // Fetch User Bookings
      .addCase(fetchUserCarBookings.pending, (state) => {
        state.isLoadingHistory = true;
      })
      .addCase(fetchUserCarBookings.fulfilled, (state, action) => {
        state.isLoadingHistory = false;
        state.bookingHistory = action.payload;
      })
      .addCase(fetchUserCarBookings.rejected, (state, action) => {
        state.isLoadingHistory = false;
        state.bookingError = action.payload?.message || 'Failed to fetch bookings';
      })
      
      // Cancel Booking
      .addCase(cancelCarBooking.pending, (state) => {
        state.isProcessing = true;
      })
      .addCase(cancelCarBooking.fulfilled, (state, action) => {
        state.isProcessing = false;
        // Remove from history
        state.bookingHistory = state.bookingHistory.filter(
          b => b.id !== action.payload.bookingId
        );
      })
      .addCase(cancelCarBooking.rejected, (state, action) => {
        state.isProcessing = false;
        state.bookingError = action.payload?.message || 'Failed to cancel booking';
      });
  }
});

// ===========================
// Exports
// ===========================

export const {
  setSelectedCar,
  setRentalDetails,
  setPickupDate,
  setDropoffDate,
  setPickupTime,
  setDropoffTime,
  setPickupLocation,
  updateDriverInfo,
  updatePaymentInfo,
  toggleInsurance,
  toggleGPS,
  toggleChildSeat,
  toggleAdditionalDriver,
  calculatePricing,
  setValidationErrors,
  clearValidationErrors,
  setFieldError,
  clearFieldError,
  clearBookingData,
  resetBooking
} = carBookingSlice.actions;

export default carBookingSlice.reducer;

// ===========================
// Selectors
// ===========================

export const selectSelectedCar = (state) => state.carBooking.selectedCar;
export const selectRentalDetails = (state) => ({
  pickupDate: state.carBooking.pickupDate,
  dropoffDate: state.carBooking.dropoffDate,
  pickupTime: state.carBooking.pickupTime,
  dropoffTime: state.carBooking.dropoffTime,
  pickupLocation: state.carBooking.pickupLocation,
  days: state.carBooking.days
});
export const selectDriverInfo = (state) => state.carBooking.driverInfo;
export const selectPaymentInfo = (state) => state.carBooking.paymentInfo;
export const selectPricing = (state) => state.carBooking.pricing;
export const selectAdditionalServices = (state) => state.carBooking.additionalServices;
export const selectConfirmedBooking = (state) => state.carBooking.confirmedBooking;
export const selectBookingHistory = (state) => state.carBooking.bookingHistory;
export const selectIsProcessing = (state) => state.carBooking.isProcessing;
export const selectBookingError = (state) => state.carBooking.bookingError;
export const selectValidationErrors = (state) => state.carBooking.validationErrors;
