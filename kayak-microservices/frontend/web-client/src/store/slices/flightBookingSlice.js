/**
 * Flight Booking Redux Slice
 * Manages comprehensive flight booking state and workflow
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ===========================
// Async Thunks
// ===========================

/**
 * Create a new flight booking
 */
export const createFlightBooking = createAsyncThunk(
  'flightBooking/create',
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
 * Process payment for booking
 */
export const processPayment = createAsyncThunk(
  'flightBooking/processPayment',
  async ({ bookingId, paymentData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/bookings/${bookingId}/payment`,
        paymentData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

/**
 * Fetch booking by ID
 */
export const fetchBookingById = createAsyncThunk(
  'flightBooking/fetchById',
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
 * Fetch user's booking history
 */
export const fetchUserBookings = createAsyncThunk(
  'flightBooking/fetchUserBookings',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/bookings/user/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

/**
 * Cancel booking
 */
export const cancelBooking = createAsyncThunk(
  'flightBooking/cancel',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

/**
 * Fetch seat map for a flight
 */
export const fetchSeatMap = createAsyncThunk(
  'flightBooking/fetchSeatMap',
  async (flightId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/flights/${flightId}/seats`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

/**
 * Apply promo/voucher code
 */
export const applyPromoCode = createAsyncThunk(
  'flightBooking/applyPromo',
  async ({ code, bookingData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/promo/validate`, {
        code,
        bookingData
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// ===========================
// Helper Functions
// ===========================

const loadBookingFromStorage = () => {
  try {
    const saved = localStorage.getItem('kayak_flight_booking_draft');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if booking is not expired (24 hours)
      const savedTime = new Date(parsed.savedAt).getTime();
      const now = new Date().getTime();
      if (now - savedTime < 24 * 60 * 60 * 1000) {
        return parsed.data;
      }
    }
  } catch (error) {
    console.error('Error loading booking from storage:', error);
  }
  return null;
};

const saveBookingToStorage = (state) => {
  try {
    localStorage.setItem('kayak_flight_booking_draft', JSON.stringify({
      data: state,
      savedAt: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error saving booking to storage:', error);
  }
};

const clearBookingFromStorage = () => {
  try {
    localStorage.removeItem('kayak_flight_booking_draft');
  } catch (error) {
    console.error('Error clearing booking from storage:', error);
  }
};

// ===========================
// Initial State
// ===========================

const savedBooking = loadBookingFromStorage();

const initialState = savedBooking || {
  // Flight Selection
  selectedOutboundFlight: null,
  selectedReturnFlight: null,
  selectedFare: null, // 'basic', 'standard', 'flexible'
  
  // Booking Details
  passengers: {
    adults: 1,
    children: 0,
    infants: 0
  },
  
  // Passenger Information (array of passenger objects)
  passengerDetails: [
    {
      id: 1,
      title: 'Mr',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      passportNumber: '',
      nationality: '',
      frequentFlyerNumber: ''
    }
  ],
  
  // Contact & Billing Information
  contactInfo: {
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  },
  
  // Payment Information
  paymentInfo: {
    method: 'credit', // 'credit', 'debit', 'paypal'
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    billingAddressSameAsContact: true,
    billingAddress: null
  },
  
  // Pricing Breakdown
  pricing: {
    basePrice: 0,
    taxesAndFees: 0,
    serviceFee: 0,
    seatSelectionFee: 0,
    baggageFee: 0,
    insuranceFee: 0,
    priorityBoardingFee: 0,
    discount: 0,
    promoCode: null,
    totalPrice: 0
  },
  
  // Additional Services
  additionalServices: {
    selectedSeats: [], // Array of { passengerId, flightId, seatNumber, price }
    extraBaggage: 0, // Number of extra bags
    insurance: false,
    priorityBoarding: false,
    mealPreferences: [] // Array of { passengerId, mealType }
  },
  
  // Seat Map Data
  seatMap: {
    outboundSeats: null,
    returnSeats: null,
    isLoading: false,
    error: null
  },
  
  // Booking Workflow
  bookingStep: 'selection', // 'selection', 'details', 'services', 'payment', 'review', 'confirmation'
  completedSteps: [],
  
  // Status & Errors
  isProcessing: false,
  bookingError: null,
  paymentError: null,
  validationErrors: {},
  
  // Confirmed Booking
  confirmedBooking: null,
  bookingId: null,
  
  // Booking History
  bookingHistory: [],
  isLoadingHistory: false,
  
  // Promo Code
  promoCodeStatus: null, // null, 'checking', 'valid', 'invalid'
  promoCodeError: null
};

// ===========================
// Slice
// ===========================

const flightBookingSlice = createSlice({
  name: 'flightBooking',
  initialState,
  reducers: {
    // ===== Flight Selection =====
    setSelectedOutboundFlight: (state, action) => {
      state.selectedOutboundFlight = action.payload;
      saveBookingToStorage(state);
    },
    
    setSelectedReturnFlight: (state, action) => {
      state.selectedReturnFlight = action.payload;
      saveBookingToStorage(state);
    },
    
    setSelectedFare: (state, action) => {
      state.selectedFare = action.payload;
      // Update pricing based on fare type
      // NOTE: Don't multiply by passengers here - the fare selection page already calculated the total
      if (state.selectedOutboundFlight) {
        const fareMultiplier = action.payload === 'flexible' ? 1.3 : action.payload === 'standard' ? 1.15 : 1;
        state.pricing.basePrice = state.selectedOutboundFlight.price * fareMultiplier;
        if (state.selectedReturnFlight) {
          state.pricing.basePrice += state.selectedReturnFlight.price * fareMultiplier;
        }
      }
      saveBookingToStorage(state);
    },
    
    // ===== Passenger Management =====
    setPassengerCount: (state, action) => {
      const { adults, children, infants } = action.payload;
      state.passengers = { adults, children, infants };
      
      // Adjust passenger details array
      const totalPassengers = adults + children;
      const currentCount = state.passengerDetails.length;
      
      if (totalPassengers > currentCount) {
        // Add new passengers
        for (let i = currentCount; i < totalPassengers; i++) {
          state.passengerDetails.push({
            id: i + 1,
            title: 'Mr',
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            dateOfBirth: '',
            passportNumber: '',
            nationality: '',
            frequentFlyerNumber: ''
          });
        }
      } else if (totalPassengers < currentCount) {
        // Remove excess passengers
        state.passengerDetails = state.passengerDetails.slice(0, totalPassengers);
      }
      saveBookingToStorage(state);
    },
    
    updatePassengerDetails: (state, action) => {
      const { passengerId, details } = action.payload;
      const index = state.passengerDetails.findIndex(p => p.id === passengerId);
      if (index !== -1) {
        state.passengerDetails[index] = { ...state.passengerDetails[index], ...details };
        saveBookingToStorage(state);
      }
    },
    
    addPassenger: (state) => {
      const newId = Math.max(...state.passengerDetails.map(p => p.id), 0) + 1;
      state.passengerDetails.push({
        id: newId,
        title: 'Mr',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        passportNumber: '',
        nationality: '',
        frequentFlyerNumber: ''
      });
      state.passengers.adults += 1;
      saveBookingToStorage(state);
    },
    
    removePassenger: (state, action) => {
      const passengerId = action.payload;
      state.passengerDetails = state.passengerDetails.filter(p => p.id !== passengerId);
      if (state.passengers.adults > 1) {
        state.passengers.adults -= 1;
      }
      saveBookingToStorage(state);
    },
    
    // ===== Contact & Payment =====
    updateContactInfo: (state, action) => {
      state.contactInfo = { ...state.contactInfo, ...action.payload };
      saveBookingToStorage(state);
    },
    
    updatePaymentInfo: (state, action) => {
      state.paymentInfo = { ...state.paymentInfo, ...action.payload };
      
      // If precalculated pricing is provided (from fare selection page), use it
      if (action.payload.precalculatedBasePrice) {
        state.pricing.basePrice = action.payload.precalculatedBasePrice;
        state.pricing.taxesAndFees = action.payload.precalculatedBasePrice * 0.15;
        state.pricing.serviceFee = action.payload.precalculatedBasePrice * 0.10;
        state.pricing.totalPrice = action.payload.precalculatedTotal || (
          state.pricing.basePrice +
          state.pricing.taxesAndFees +
          state.pricing.serviceFee +
          state.pricing.seatSelectionFee +
          state.pricing.baggageFee +
          state.pricing.insuranceFee +
          state.pricing.priorityBoardingFee -
          state.pricing.discount
        );
      }
      
      saveBookingToStorage(state);
    },
    
    updateBillingAddress: (state, action) => {
      state.paymentInfo.billingAddress = action.payload;
      state.paymentInfo.billingAddressSameAsContact = false;
      saveBookingToStorage(state);
    },
    
    toggleBillingAddressSameAsContact: (state) => {
      state.paymentInfo.billingAddressSameAsContact = !state.paymentInfo.billingAddressSameAsContact;
      if (state.paymentInfo.billingAddressSameAsContact) {
        state.paymentInfo.billingAddress = null;
      }
      saveBookingToStorage(state);
    },
    
    // ===== Additional Services =====
    toggleSeatSelection: (state, action) => {
      const seat = action.payload;
      const existingIndex = state.additionalServices.selectedSeats.findIndex(
        s => s.passengerId === seat.passengerId && s.flightId === seat.flightId
      );
      
      if (existingIndex !== -1) {
        // Remove existing seat
        const oldSeat = state.additionalServices.selectedSeats[existingIndex];
        state.additionalServices.selectedSeats.splice(existingIndex, 1);
        state.pricing.seatSelectionFee -= oldSeat.price;
      }
      
      // Add new seat
      state.additionalServices.selectedSeats.push(seat);
      state.pricing.seatSelectionFee += seat.price;
      saveBookingToStorage(state);
    },
    
    removeSeatSelection: (state, action) => {
      const { passengerId, flightId } = action.payload;
      const index = state.additionalServices.selectedSeats.findIndex(
        s => s.passengerId === passengerId && s.flightId === flightId
      );
      
      if (index !== -1) {
        const seat = state.additionalServices.selectedSeats[index];
        state.additionalServices.selectedSeats.splice(index, 1);
        state.pricing.seatSelectionFee -= seat.price;
        saveBookingToStorage(state);
      }
    },
    
    setExtraBaggage: (state, action) => {
      const previousBaggage = state.additionalServices.extraBaggage;
      state.additionalServices.extraBaggage = action.payload;
      
      // Update baggage fee ($30 per bag)
      const baggageFeePerBag = 30;
      state.pricing.baggageFee = action.payload * baggageFeePerBag;
      saveBookingToStorage(state);
    },
    
    toggleInsurance: (state) => {
      state.additionalServices.insurance = !state.additionalServices.insurance;
      // Insurance fee: 5% of base price or minimum $20
      if (state.additionalServices.insurance) {
        state.pricing.insuranceFee = Math.max(state.pricing.basePrice * 0.05, 20);
      } else {
        state.pricing.insuranceFee = 0;
      }
      saveBookingToStorage(state);
    },
    
    togglePriorityBoarding: (state) => {
      state.additionalServices.priorityBoarding = !state.additionalServices.priorityBoarding;
      // Priority boarding: $25 per passenger
      if (state.additionalServices.priorityBoarding) {
        const totalPassengers = state.passengers.adults + state.passengers.children;
        state.pricing.priorityBoardingFee = totalPassengers * 25;
      } else {
        state.pricing.priorityBoardingFee = 0;
      }
      saveBookingToStorage(state);
    },
    
    setMealPreference: (state, action) => {
      const { passengerId, mealType } = action.payload;
      const existingIndex = state.additionalServices.mealPreferences.findIndex(
        m => m.passengerId === passengerId
      );
      
      if (existingIndex !== -1) {
        state.additionalServices.mealPreferences[existingIndex].mealType = mealType;
      } else {
        state.additionalServices.mealPreferences.push({ passengerId, mealType });
      }
      saveBookingToStorage(state);
    },
    
    // ===== Pricing =====
    calculatePricing: (state) => {
      // Base price already set when flights selected
      
      // Taxes and fees: 15% of base price
      state.pricing.taxesAndFees = state.pricing.basePrice * 0.15;
      
      // Service fee: 10% of base price
      state.pricing.serviceFee = state.pricing.basePrice * 0.10;
      
      // Total calculation
      state.pricing.totalPrice = 
        state.pricing.basePrice +
        state.pricing.taxesAndFees +
        state.pricing.serviceFee +
        state.pricing.seatSelectionFee +
        state.pricing.baggageFee +
        state.pricing.insuranceFee +
        state.pricing.priorityBoardingFee -
        state.pricing.discount;
      
      saveBookingToStorage(state);
    },
    
    applyDiscount: (state, action) => {
      state.pricing.discount = action.payload;
      state.pricing.totalPrice -= action.payload;
      saveBookingToStorage(state);
    },
    
    // ===== Workflow Navigation =====
    setBookingStep: (state, action) => {
      state.bookingStep = action.payload;
      saveBookingToStorage(state);
    },
    
    markStepCompleted: (state, action) => {
      const step = action.payload;
      if (!state.completedSteps.includes(step)) {
        state.completedSteps.push(step);
        saveBookingToStorage(state);
      }
    },
    
    goToNextStep: (state) => {
      const steps = ['selection', 'details', 'services', 'payment', 'review', 'confirmation'];
      const currentIndex = steps.indexOf(state.bookingStep);
      if (currentIndex < steps.length - 1) {
        state.bookingStep = steps[currentIndex + 1];
        saveBookingToStorage(state);
      }
    },
    
    goToPreviousStep: (state) => {
      const steps = ['selection', 'details', 'services', 'payment', 'review', 'confirmation'];
      const currentIndex = steps.indexOf(state.bookingStep);
      if (currentIndex > 0) {
        state.bookingStep = steps[currentIndex - 1];
        saveBookingToStorage(state);
      }
    },
    
    // ===== Validation =====
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
      const field = action.payload;
      delete state.validationErrors[field];
    },
    
    // ===== Confirmed Booking =====
    setConfirmedBooking: (state, action) => {
      state.confirmedBooking = action.payload;
      state.bookingId = action.payload.booking_id || action.payload.id;
      state.isProcessing = false;
      // Add to history
      state.bookingHistory.unshift(action.payload);
    },
    
    // ===== Booking Management =====
    clearBookingData: (state) => {
      Object.assign(state, initialState);
      clearBookingFromStorage();
    },
    
    resetBooking: (state) => {
      Object.assign(state, {
        ...initialState,
        bookingHistory: state.bookingHistory // Preserve history
      });
      clearBookingFromStorage();
    },
    
    setBookingError: (state, action) => {
      state.bookingError = action.payload;
    },
    
    clearBookingError: (state) => {
      state.bookingError = null;
    },
    
    // ===== Restore from Draft =====
    restoreBookingFromDraft: (state, action) => {
      const draft = action.payload;
      Object.assign(state, draft);
    }
  },
  
  // ===========================
  // Extra Reducers (Async Thunks)
  // ===========================
  extraReducers: (builder) => {
    builder
      // Create Booking
      .addCase(createFlightBooking.pending, (state) => {
        state.isProcessing = true;
        state.bookingError = null;
      })
      .addCase(createFlightBooking.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.confirmedBooking = action.payload;
        state.bookingId = action.payload.booking_id || action.payload.id;
        state.bookingStep = 'confirmation';
        // Add to history
        state.bookingHistory.unshift(action.payload);
        // Clear draft from storage
        clearBookingFromStorage();
      })
      .addCase(createFlightBooking.rejected, (state, action) => {
        state.isProcessing = false;
        state.bookingError = action.payload?.message || 'Failed to create booking';
      })
      
      // Process Payment
      .addCase(processPayment.pending, (state) => {
        state.isProcessing = true;
        state.paymentError = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.isProcessing = false;
        if (state.confirmedBooking) {
          state.confirmedBooking.paymentStatus = 'paid';
        }
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.isProcessing = false;
        state.paymentError = action.payload?.message || 'Payment failed';
      })
      
      // Fetch Booking
      .addCase(fetchBookingById.pending, (state) => {
        state.isProcessing = true;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.confirmedBooking = action.payload;
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.isProcessing = false;
        state.bookingError = action.payload?.message || 'Failed to fetch booking';
      })
      
      // Fetch User Bookings
      .addCase(fetchUserBookings.pending, (state) => {
        state.isLoadingHistory = true;
      })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.isLoadingHistory = false;
        state.bookingHistory = action.payload;
      })
      .addCase(fetchUserBookings.rejected, (state, action) => {
        state.isLoadingHistory = false;
        state.bookingError = action.payload?.message || 'Failed to fetch bookings';
      })
      
      // Cancel Booking
      .addCase(cancelBooking.pending, (state) => {
        state.isProcessing = true;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.isProcessing = false;
        // Update booking in history
        const index = state.bookingHistory.findIndex(
          b => b.id === action.payload.id || b.booking_id === action.payload.id
        );
        if (index !== -1) {
          state.bookingHistory[index].status = 'cancelled';
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.isProcessing = false;
        state.bookingError = action.payload?.message || 'Failed to cancel booking';
      })
      
      // Fetch Seat Map
      .addCase(fetchSeatMap.pending, (state) => {
        state.seatMap.isLoading = true;
        state.seatMap.error = null;
      })
      .addCase(fetchSeatMap.fulfilled, (state, action) => {
        state.seatMap.isLoading = false;
        // Determine if outbound or return
        if (action.meta.arg === state.selectedOutboundFlight?.id) {
          state.seatMap.outboundSeats = action.payload;
        } else {
          state.seatMap.returnSeats = action.payload;
        }
      })
      .addCase(fetchSeatMap.rejected, (state, action) => {
        state.seatMap.isLoading = false;
        state.seatMap.error = action.payload?.message || 'Failed to fetch seat map';
      })
      
      // Apply Promo Code
      .addCase(applyPromoCode.pending, (state) => {
        state.promoCodeStatus = 'checking';
        state.promoCodeError = null;
      })
      .addCase(applyPromoCode.fulfilled, (state, action) => {
        state.promoCodeStatus = 'valid';
        state.pricing.promoCode = action.payload.code;
        state.pricing.discount = action.payload.discount;
        // Recalculate total
        state.pricing.totalPrice -= action.payload.discount;
        saveBookingToStorage(state);
      })
      .addCase(applyPromoCode.rejected, (state, action) => {
        state.promoCodeStatus = 'invalid';
        state.promoCodeError = action.payload?.message || 'Invalid promo code';
      });
  }
});

// ===========================
// Actions Export
// ===========================

export const {
  setSelectedOutboundFlight,
  setSelectedReturnFlight,
  setSelectedFare,
  setPassengerCount,
  updatePassengerDetails,
  addPassenger,
  removePassenger,
  updateContactInfo,
  updatePaymentInfo,
  updateBillingAddress,
  toggleBillingAddressSameAsContact,
  toggleSeatSelection,
  removeSeatSelection,
  setExtraBaggage,
  toggleInsurance,
  togglePriorityBoarding,
  setMealPreference,
  calculatePricing,
  applyDiscount,
  setBookingStep,
  markStepCompleted,
  goToNextStep,
  goToPreviousStep,
  setValidationErrors,
  clearValidationErrors,
  setFieldError,
  clearFieldError,
  setConfirmedBooking,
  clearBookingData,
  resetBooking,
  setBookingError,
  clearBookingError,
  restoreBookingFromDraft
} = flightBookingSlice.actions;

// ===========================
// Selectors
// ===========================

// Total passengers
export const selectTotalPassengers = (state) => {
  const { adults, children, infants } = state.flightBooking.passengers;
  return adults + children + infants;
};

// Total price
export const selectTotalPrice = (state) => {
  return state.flightBooking.pricing.totalPrice;
};

// Booking progress (percentage)
export const selectBookingProgress = (state) => {
  const totalSteps = 6;
  const completedSteps = state.flightBooking.completedSteps.length;
  return Math.round((completedSteps / totalSteps) * 100);
};

// Is booking valid for current step
export const selectIsStepValid = (state) => {
  const { bookingStep, selectedOutboundFlight, passengerDetails, contactInfo, paymentInfo } = state.flightBooking;
  
  switch (bookingStep) {
    case 'selection':
      return selectedOutboundFlight !== null;
    case 'details':
      return passengerDetails.every(p => p.firstName && p.lastName && p.email);
    case 'services':
      return true; // Optional step
    case 'payment':
      return contactInfo.email && contactInfo.phone && paymentInfo.cardNumber;
    case 'review':
      return true;
    default:
      return false;
  }
};

// Booking summary
export const selectBookingSummary = (state) => {
  const { selectedOutboundFlight, selectedReturnFlight, passengers, pricing } = state.flightBooking;
  return {
    outbound: selectedOutboundFlight,
    return: selectedReturnFlight,
    passengers,
    total: pricing.totalPrice,
    isRoundTrip: selectedReturnFlight !== null
  };
};

// Can proceed to next step
export const selectCanProceedToNextStep = (state) => {
  return Object.keys(state.flightBooking.validationErrors).length === 0;
};

// Passenger by ID
export const selectPassengerById = (state, passengerId) => {
  return state.flightBooking.passengerDetails.find(p => p.id === passengerId);
};

// Required fields for step
export const selectRequiredFields = (state, step) => {
  const requiredFieldsByStep = {
    selection: ['selectedOutboundFlight'],
    details: ['passengerDetails'],
    services: [],
    payment: ['contactInfo.email', 'paymentInfo.cardNumber'],
    review: []
  };
  return requiredFieldsByStep[step] || [];
};

// Export reducer
export default flightBookingSlice.reducer;
