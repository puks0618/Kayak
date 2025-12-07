import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ===========================
// Async Thunks
// ===========================

export const createStayBooking = createAsyncThunk(
  'stayBooking/create',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/bookings`, bookingData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchStayBookingById = createAsyncThunk(
  'stayBooking/fetchById',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchUserStayBookings = createAsyncThunk(
  'stayBooking/fetchUserBookings',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/bookings/user/${userId}`);
      return response.data.filter(booking => booking.listing_type === 'hotel');
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const cancelStayBooking = createAsyncThunk(
  'stayBooking/cancel',
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
  selectedHotel: null,
  checkInDate: null,
  checkOutDate: null,
  guests: 1,
  rooms: 1,
  contactInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  },
  paymentInfo: {
    method: 'credit',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  },
  pricing: {
    basePrice: 0,
    taxesAndFees: 0,
    additionalServices: 0,
    totalPrice: 0
  },
  additionalServices: {
    breakfast: false,
    airportPickup: false
  },
  confirmedBooking: null,
  bookingId: null,
  bookingHistory: [],
  isProcessing: false,
  bookingError: null,
  validationErrors: {},
  isLoadingHistory: false
};

// ===========================
// Slice
// ===========================

const stayBookingSlice = createSlice({
  name: 'stayBooking',
  initialState,
  reducers: {
    setSelectedHotel: (state, action) => {
      state.selectedHotel = action.payload;
      if (action.payload?.price_per_night && state.nights > 0) {
        state.pricing.basePrice = action.payload.price_per_night * state.nights * state.rooms;
      }
    },
    setStayDetails: (state, action) => {
      const { checkInDate, checkOutDate, guests, rooms } = action.payload;
      if (checkInDate) state.checkInDate = checkInDate;
      if (checkOutDate) state.checkOutDate = checkOutDate;
      if (guests) state.guests = guests;
      if (rooms) state.rooms = rooms;
      // Calculate nights
      if (checkInDate && checkOutDate) {
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const diffTime = Math.abs(checkOut - checkIn);
        state.nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        if (state.selectedHotel?.price_per_night) {
          state.pricing.basePrice = state.selectedHotel.price_per_night * state.nights * state.rooms;
        }
        stayBookingSlice.caseReducers.calculatePricing(state);
      }
    },
    updateContactInfo: (state, action) => {
      state.contactInfo = { ...state.contactInfo, ...action.payload };
    },
    updatePaymentInfo: (state, action) => {
      state.paymentInfo = { ...state.paymentInfo, ...action.payload };
    },
    toggleBreakfast: (state) => {
      state.additionalServices.breakfast = !state.additionalServices.breakfast;
      stayBookingSlice.caseReducers.calculatePricing(state);
    },
    toggleAirportPickup: (state) => {
      state.additionalServices.airportPickup = !state.additionalServices.airportPickup;
      stayBookingSlice.caseReducers.calculatePricing(state);
    },
    calculatePricing: (state) => {
      const basePrice = state.pricing.basePrice;
      let additionalServices = 0;
      if (state.additionalServices.breakfast) additionalServices += 20 * state.nights * state.rooms;
      if (state.additionalServices.airportPickup) additionalServices += 50;
      state.pricing.additionalServices = additionalServices;
      const subtotal = basePrice + additionalServices;
      state.pricing.taxesAndFees = subtotal * 0.12;
      state.pricing.totalPrice = subtotal + state.pricing.taxesAndFees;
    },
    setValidationErrors: (state, action) => {
      state.validationErrors = action.payload;
    },
    clearValidationErrors: (state) => {
      state.validationErrors = {};
    },
    clearBookingData: (state) => {
      Object.assign(state, initialState);
    },
    resetBooking: (state) => {
      return { ...initialState, bookingHistory: state.bookingHistory };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createStayBooking.pending, (state) => {
        state.isProcessing = true;
        state.bookingError = null;
      })
      .addCase(createStayBooking.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.confirmedBooking = action.payload;
        state.bookingId = action.payload.booking_id || action.payload.id;
        state.bookingHistory.unshift(action.payload);
      })
      .addCase(createStayBooking.rejected, (state, action) => {
        state.isProcessing = false;
        state.bookingError = action.payload?.message || 'Failed to create booking';
      })
      .addCase(fetchStayBookingById.pending, (state) => {
        state.isProcessing = true;
      })
      .addCase(fetchStayBookingById.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.confirmedBooking = action.payload;
      })
      .addCase(fetchStayBookingById.rejected, (state, action) => {
        state.isProcessing = false;
        state.bookingError = action.payload?.message || 'Failed to fetch booking';
      })
      .addCase(fetchUserStayBookings.pending, (state) => {
        state.isLoadingHistory = true;
      })
      .addCase(fetchUserStayBookings.fulfilled, (state, action) => {
        state.isLoadingHistory = false;
        state.bookingHistory = action.payload;
      })
      .addCase(fetchUserStayBookings.rejected, (state, action) => {
        state.isLoadingHistory = false;
        state.bookingError = action.payload?.message || 'Failed to fetch bookings';
      })
      .addCase(cancelStayBooking.fulfilled, (state, action) => {
        state.bookingHistory = state.bookingHistory.filter(b => b.id !== action.payload.bookingId);
      });
  }
});

export const {
  setSelectedHotel,
  setStayDetails,
  updateContactInfo,
  updatePaymentInfo,
  toggleBreakfast,
  toggleAirportPickup,
  calculatePricing,
  setValidationErrors,
  clearValidationErrors,
  clearBookingData,
  resetBooking
} = stayBookingSlice.actions;

export default stayBookingSlice.reducer;
