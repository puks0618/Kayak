import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft, CreditCard, Building, DollarSign, User, Mail, Phone, MapPin, Plane } from 'lucide-react';
import { bookingService, billingService } from '../services/api';
import { addUserBooking } from '../utils/userStorage';
import {
  setSelectedOutboundFlight,
  setSelectedReturnFlight,
  setSelectedFare,
  setPassengerCount,
  updatePassengerDetails,
  updateContactInfo,
  updatePaymentInfo,
  calculatePricing,
  createFlightBooking,
  setValidationErrors,
  clearValidationErrors,
  setFieldError,
  clearFieldError,
  setConfirmedBooking
} from '../store/slices/flightBookingSlice';
import {
  validateContactInfo,
  validatePaymentInfo,
  validatePassenger,
  formatCardNumber,
  formatExpiryDate,
  validatePhone,
  validateZipCode,
  validateState,
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
  validateCardholderName,
  detectCardType
} from '../utils/bookingValidation';

export default function FlightBookingConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  // Get user from auth state
  const { user } = useSelector(state => state.auth);
  
  // Get Redux state
  const {
    selectedOutboundFlight,
    selectedReturnFlight,
    selectedFare,
    passengers,
    passengerDetails,
    contactInfo: reduxContactInfo,
    paymentInfo: reduxPaymentInfo,
    pricing,
    isProcessing,
    bookingError,
    validationErrors: reduxValidationErrors,
    confirmedBooking,
    bookingId
  } = useSelector(state => state.flightBooking);
  
  // Local form state (like hotels) - initialize empty, will autofill from user profile
  const [formData, setFormData] = useState({
    firstName: reduxContactInfo.firstName || '',
    lastName: reduxContactInfo.lastName || '',
    email: reduxContactInfo.email || '',
    phone: reduxContactInfo.phone || '',
    address: reduxContactInfo.address || '',
    city: reduxContactInfo.city || '',
    state: reduxContactInfo.state || '',
    zipCode: reduxContactInfo.zipCode || '',
    paymentType: reduxPaymentInfo.method || 'credit',
    cardNumber: reduxPaymentInfo.cardNumber || '',
    cardName: reduxPaymentInfo.cardName || '',
    expiryDate: reduxPaymentInfo.expiryDate || '',
    cvv: reduxPaymentInfo.cvv || ''
  });

  const [errors, setErrors] = useState({});

  // Initialize from location state if coming from flight selection
  useEffect(() => {
    const locationState = location.state;
    if (locationState) {
      // ALWAYS set flights from location.state to override any stale Redux state
      if (locationState.outboundFlight) {
        console.log('✅ Setting outbound flight from location.state:', locationState.outboundFlight);
        dispatch(setSelectedOutboundFlight(locationState.outboundFlight));
      }
      if (locationState.returnFlight) {
        dispatch(setSelectedReturnFlight(locationState.returnFlight));
      } else if (!locationState.returnFlight && selectedReturnFlight) {
        // Clear return flight if not in location state
        dispatch(setSelectedReturnFlight(null));
      }
      if (locationState.fare) {
        dispatch(setSelectedFare(locationState.fare.type || locationState.fare.code || 'basic'));
      }
      if (locationState.passengers) {
        dispatch(setPassengerCount({
          adults: locationState.passengers || 1,
          children: 0,
          infants: 0
        }));
      }
      
      // DON'T call calculatePricing() - use the pre-calculated price from fare selection
      // The totalPrice from location.state is already correct (includes passengers + fare type)
      if (locationState.totalPrice) {
        console.log('💰 Using pre-calculated price from fare selection:', locationState.totalPrice);
        // Manually set the pricing object with the correct values
        const basePrice = locationState.totalPrice;
        const taxesAndFees = basePrice * 0.15;
        const serviceFee = basePrice * 0.10;
        const total = basePrice + taxesAndFees + serviceFee;
        
        dispatch(updatePaymentInfo({ 
          precalculatedBasePrice: basePrice,
          precalculatedTotal: total
        }));
      }
    }
  }, [location.state, dispatch]);

  // Auto-fill from user profile if available (EXACT same logic as hotels)
  useEffect(() => {
    if (user && !reduxContactInfo.email) {
      const cleanPhone = (user.phone || '').replace(/\D/g, '').slice(0, 10);
      const cleanZip = (user.zipCode || '').trim();
      const cleanState = (user.state || '').toUpperCase().slice(0, 2);
      
      dispatch(updateContactInfo({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: validatePhone(cleanPhone) ? cleanPhone : '',
        address: user.address || '',
        city: user.city || '',
        state: validateState(cleanState) ? cleanState : '',
        zipCode: validateZipCode(cleanZip) ? cleanZip : ''
      }));
    }
  }, [user, reduxContactInfo.email, dispatch]);

  // Sync formData when Redux updates
  useEffect(() => {
    if (reduxContactInfo.email) {
      setFormData(prev => ({
        ...prev,
        firstName: reduxContactInfo.firstName || '',
        lastName: reduxContactInfo.lastName || '',
        email: reduxContactInfo.email || '',
        phone: reduxContactInfo.phone || '',
        address: reduxContactInfo.address || '',
        city: reduxContactInfo.city || '',
        state: reduxContactInfo.state || '',
        zipCode: reduxContactInfo.zipCode || ''
      }));
    }
  }, [reduxContactInfo]);

  // Check if booking data exists
  if (!selectedOutboundFlight) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No booking information found</p>
          <button
            onClick={() => navigate('/flights/results')}
            className="px-6 py-2 bg-[#FF690F] text-white rounded-md hover:bg-[#d6570c]"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  // Get current passenger (assuming single passenger for now - can be extended)
  const currentPassenger = passengerDetails[0] || {};

  // Helper functions
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Handle input changes (same logic as hotels)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Auto-format phone: remove non-digits and limit to 10
    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }

    // Auto-format state: uppercase and limit to 2 characters if abbreviation
    if (name === 'state') {
      if (value.length <= 2) {
        processedValue = value.toUpperCase().slice(0, 2);
      }
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate passenger info
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    // Validate contact info
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    }
    
    // Address validation
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    } else if (!validateState(formData.state)) {
      newErrors.state = 'Invalid state code';
    }
    
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'Zip code is required';
    } else if (!validateZipCode(formData.zipCode)) {
      newErrors.zipCode = 'Invalid zip code';
    }

    // Validate payment info
    if (formData.paymentType === 'credit' || formData.paymentType === 'debit') {
      // Card number validation
      if (!formData.cardNumber.trim()) {
        newErrors.cardNumber = 'Card number is required';
      } else if (!validateCardNumber(formData.cardNumber)) {
        newErrors.cardNumber = 'Invalid card number';
      }
      
      // Cardholder name validation
      if (!formData.cardName.trim()) {
        newErrors.cardName = 'Cardholder name is required';
      } else if (!validateCardholderName(formData.cardName)) {
        newErrors.cardName = 'Invalid name (letters, spaces, hyphens only)';
      }
      
      // Expiry date validation
      if (!formData.expiryDate.trim()) {
        newErrors.expiryDate = 'Expiry date is required';
      } else if (!validateExpiryDate(formData.expiryDate)) {
        newErrors.expiryDate = 'Invalid or expired date (MM/YY)';
      }
      
      // CVV validation
      const cardType = detectCardType(formData.cardNumber);
      if (!formData.cvv.trim()) {
        newErrors.cvv = 'CVV is required';
      } else if (!validateCVV(formData.cvv, cardType)) {
        newErrors.cvv = cardType === 'amex' ? 'CVV must be 4 digits for Amex' : 'CVV must be 3 digits';
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    
    if (!isValid) {
      console.log('❌ Form validation failed:', newErrors);
    } else {
      console.log('✅ Form validation passed');
    }
    
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 Flight booking form submitted');
    
    if (!validateForm()) {
      console.error('❌ Form validation failed');
      return;
    }

    console.log('✅ Form validation passed');

    try {
      // Prepare booking data using formData
      const bookingData = {
        listing_id: selectedOutboundFlight.id || selectedOutboundFlight.flight_id || 'flight-' + Date.now(),
        listing_type: 'flight',
        travel_date: selectedOutboundFlight.departure_time || selectedOutboundFlight.departureTime,
        total_amount: pricing.totalPrice,
        payment_details: {
          method: formData.paymentType,
          cardNumber: formData.cardNumber ? formData.cardNumber.replace(/\s/g, '').slice(-4) : null
        },
        booking_details: {
          outboundFlight: {
            airline: selectedOutboundFlight.airline,
            origin: selectedOutboundFlight.departure_airport || selectedOutboundFlight.origin,
            destination: selectedOutboundFlight.arrival_airport || selectedOutboundFlight.destination,
            departureTime: selectedOutboundFlight.departure_time || selectedOutboundFlight.departureTime
          },
          returnFlight: selectedReturnFlight ? {
            airline: selectedReturnFlight.airline,
            origin: selectedReturnFlight.departure_airport || selectedReturnFlight.origin,
            destination: selectedReturnFlight.arrival_airport || selectedReturnFlight.destination,
            departureTime: selectedReturnFlight.departure_time || selectedReturnFlight.departureTime
          } : null,
          passengers: passengers.adults + passengers.children + passengers.infants,
          passengerInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode
          },
          fareType: selectedFare,
          pricing: pricing
        }
      };

      console.log('📤 Sending flight booking to backend:', bookingData);
      const response = await bookingService.create(bookingData);
      console.log('✅ Backend booking response:', response);

      const finalBookingId = response.booking_id || response.id || 'FL' + Date.now();
      console.log('✅ Flight booking ID:', finalBookingId);

      // Also store in localStorage for compatibility
      const localBooking = {
        id: finalBookingId,
        type: 'flight',
        outboundFlight: selectedOutboundFlight,
        returnFlight: selectedReturnFlight,
        fare: selectedFare,
        passengers,
        totalPrice: pricing.totalPrice,
        paymentType: formData.paymentType,
        passengerInfo: bookingData.booking_details.passengerInfo,
        bookingDate: new Date().toISOString(),
        status: 'confirmed'
      };
      
      const existingBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      existingBookings.push(localBooking);
      localStorage.setItem('bookings', JSON.stringify(existingBookings));

      // Create billing record
      const originCode = selectedOutboundFlight.departure_airport || selectedOutboundFlight.origin?.code || selectedOutboundFlight.origin || 'N/A';
      const destCode = selectedOutboundFlight.arrival_airport || selectedOutboundFlight.destination?.code || selectedOutboundFlight.destination || 'N/A';
      
      // Map payment method to billing service format
      const paymentMethodMap = {
        'credit': 'CREDIT_CARD',
        'debit': 'DEBIT_CARD',
        'paypal': 'PAYPAL',
        'other': 'OTHER'
      };
      
      const billingData = {
        userId: user?.id || user?.user_id || 'guest',
        bookingType: 'FLIGHT',
        bookingId: finalBookingId,
        totalAmount: parseFloat(pricing.totalPrice),
        paymentMethod: paymentMethodMap[formData.paymentType] || 'CREDIT_CARD',
        transactionStatus: 'PAID',
        invoiceDetails: {
          customer_name: `${formData.firstName} ${formData.lastName}`,
          customer_email: formData.email,
          item_description: `Flight from ${originCode} to ${destCode}`,
          currency: 'USD',
          metadata: {
            outboundFlight: {
              airline: selectedOutboundFlight.airline,
              route: `${originCode} → ${destCode}`,
              departureTime: selectedOutboundFlight.departure_time || selectedOutboundFlight.departureTime
            },
            returnFlight: selectedReturnFlight ? {
              airline: selectedReturnFlight.airline,
              departureTime: selectedReturnFlight.departure_time || selectedReturnFlight.departureTime
            } : null,
            passengers: passengers.adults + passengers.children + passengers.infants
          }
        }
      };

      console.log('📤 Creating billing record:', billingData);
      const billingResponse = await billingService.create(billingData);
      console.log('✅ Billing record created:', billingResponse);

      // Create confirmed booking data
      const confirmedBookingData = {
        booking_id: finalBookingId,
        id: finalBookingId,
        type: 'flight',
        ...localBooking,
        billing_id: billingResponse.data.billing_id,
        status: 'confirmed',
        paymentStatus: 'paid'
      };

      // Save to Redux state
      dispatch(setConfirmedBooking(confirmedBookingData));

      // Save to user-specific localStorage for My Trips
      const userId = user?.id || user?.user_id;
      if (userId) {
        console.log('💾 Saving flight booking to localStorage:', { userId, bookingId: finalBookingId });
        addUserBooking(userId, confirmedBookingData);
      } else {
        console.warn('⚠️ No user ID found, cannot save to localStorage');
      }

      // Navigate to success page
      console.log('🎯 Navigating to success page');
      navigate('/booking/success', { state: { booking: confirmedBookingData, type: 'flight' } });
      console.log('✅ Navigation initiated to /booking/success');
      
    } catch (error) {
      console.error('❌ Booking creation failed:', error);
      console.error('Error details:', error.response?.data || error.message);
      console.error('Full error object:', error);
      
      // Create fallback booking data
      const fallbackBookingData = {
        id: 'FL' + Date.now(),
        booking_id: 'FL' + Date.now(),
        type: 'flight',
        status: 'pending',
        totalAmount: pricing.totalPrice,
        outboundFlight: selectedOutboundFlight,
        returnFlight: selectedReturnFlight,
        passengers,
        fare: selectedFare,
        passengerInfo: {
          firstName: currentPassenger.firstName,
          lastName: currentPassenger.lastName,
          email: currentPassenger.email || contactInfo.email,
          phone: currentPassenger.phone || contactInfo.phone
        }
      };
      
      // Try to save to localStorage
      const userId = user?.id || user?.user_id;
      if (userId) {
        console.log('💾 Saving fallback booking to localStorage despite error');
        addUserBooking(userId, fallbackBookingData);
      }
      
      // Always navigate to success page with fallback data
      console.warn('⚠️ Proceeding to success page with fallback booking data');
      navigate('/booking/success', { state: { booking: fallbackBookingData, type: 'flight' } });
    }
  };

  const getPaymentIcon = () => {
    switch (formData.paymentType) {
      case 'credit':
      case 'debit':
        return <CreditCard className="w-5 h-5" />;
      case 'paypal':
        return <DollarSign className="w-5 h-5" />;
      default:
        return <Building className="w-5 h-5" />;
    }
  };

  // Debug: Log flight data to verify airport codes
  console.log('🛫 FlightBookingConfirmation - Outbound Flight Data:', {
    departure_airport: selectedOutboundFlight.departure_airport,
    arrival_airport: selectedOutboundFlight.arrival_airport,
    origin: selectedOutboundFlight.origin,
    destination: selectedOutboundFlight.destination,
    fullFlight: selectedOutboundFlight
  });

  // Extract airport codes properly from flight data
  const originCode = selectedOutboundFlight.departure_airport || selectedOutboundFlight.origin?.code || selectedOutboundFlight.origin || 'N/A';
  const destCode = selectedOutboundFlight.arrival_airport || selectedOutboundFlight.destination?.code || selectedOutboundFlight.destination || 'N/A';
  
  console.log('🛫 Extracted Codes:', { originCode, destCode });
  
  const totalPassengers = passengers.adults + passengers.children + passengers.infants;
  
  // Get fare label
  const fareLabel = selectedFare ? 
    (selectedFare === 'flexible' ? 'Flexible' : selectedFare === 'standard' ? 'Standard' : 'Basic') : 
    'Basic';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold dark:text-white">Complete Your Booking</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Fill in your details to confirm your flight booking
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {/* Passenger Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                  <User className="w-5 h-5" />
                  Passenger Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        errors.firstName ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="John"
                    />
                    {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        errors.lastName ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="Doe"
                    />
                    {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        errors.email ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="john.doe@example.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        errors.phone ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder=""
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        errors.address ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="123 Main St"
                    />
                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        errors.city ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="New York"
                    />
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      maxLength={2}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        errors.state ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="NY"
                    />
                    {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      Zip Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        errors.zipCode ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="10001"
                    />
                    {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                  {getPaymentIcon()}
                  Payment Information
                </h2>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 dark:text-white">
                    Payment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="paymentType"
                    value={formData.paymentType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="credit">Credit Card</option>
                    <option value="debit">Debit Card</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>

                {formData.paymentType !== 'paypal' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 dark:text-white">
                        Card Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                          errors.cardNumber ? 'border-red-500' : 'dark:border-gray-600'
                        }`}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                      />
                      {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 dark:text-white">
                        Cardholder Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="cardName"
                        value={formData.cardName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                          errors.cardName ? 'border-red-500' : 'dark:border-gray-600'
                        }`}
                        placeholder="John Doe"
                      />
                      {errors.cardName && <p className="text-red-500 text-sm mt-1">{errors.cardName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-white">
                        Expiry Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                          errors.expiryDate ? 'border-red-500' : 'dark:border-gray-600'
                        }`}
                        placeholder="MM/YY"
                        maxLength="5"
                      />
                      {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-white">
                        CVV <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                          errors.cvv ? 'border-red-500' : 'dark:border-gray-600'
                        }`}
                        placeholder="123"
                        maxLength="4"
                      />
                      {errors.cvv && <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      You will be redirected to PayPal to complete your payment securely.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-[#FF690F] hover:bg-[#d6570c] text-white py-4 rounded-md font-bold text-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : `Confirm and Pay $${pricing.totalPrice.toFixed(2)}`}
              </button>
              {bookingError && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">{bookingError}</p>
                </div>
              )}
            </form>
          </div>

          {/* Right Column - Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold mb-4 dark:text-white">Booking Summary</h2>
              
              {/* Flight Route Header */}
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 text-2xl font-bold dark:text-white">
                    <span>{originCode}</span>
                    <Plane className="w-6 h-6 text-[#FF690F]" />
                    <span>{destCode}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedReturnFlight ? 'roundtrip' : 'one-way'}, {totalPassengers} traveler{totalPassengers !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Outbound Flight */}
              <div className="mb-4 border-l-4 border-[#FF690F] pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Plane className="w-4 h-4 text-[#FF690F]" />
                  <span className="font-bold dark:text-white">{originCode} → {destCode}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(selectedOutboundFlight.departureTime || selectedOutboundFlight.departure_time)}</p>
                <div className="mt-2">
                  <p className="text-sm dark:text-white">
                    <span className="font-medium">{formatTime(selectedOutboundFlight.departureTime || selectedOutboundFlight.departure_time)}</span>
                    {' – '}
                    <span className="font-medium">{formatTime(selectedOutboundFlight.arrivalTime || selectedOutboundFlight.arrival_time)}</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedOutboundFlight.stops === 0 ? 'Nonstop' : `${selectedOutboundFlight.stops} stop${selectedOutboundFlight.stops !== 1 ? 's' : ''}`}
                    {' • '}
                    {formatDuration(selectedOutboundFlight.durationMinutes || selectedOutboundFlight.duration)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{selectedOutboundFlight.airline}</p>
                </div>
              </div>

              {/* Return Flight */}
              {selectedReturnFlight && (
                <div className="mb-4 border-l-4 border-[#FF690F] pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane className="w-4 h-4 text-[#FF690F] transform rotate-180" />
                    <span className="font-bold dark:text-white">{destCode} → {originCode}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(selectedReturnFlight.departureTime || selectedReturnFlight.departure_time)}</p>
                  <div className="mt-2">
                    <p className="text-sm dark:text-white">
                      <span className="font-medium">{formatTime(selectedReturnFlight.departureTime || selectedReturnFlight.departure_time)}</span>
                      {' – '}
                      <span className="font-medium">{formatTime(selectedReturnFlight.arrivalTime || selectedReturnFlight.arrival_time)}</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedReturnFlight.stops === 0 ? 'Nonstop' : `${selectedReturnFlight.stops} stop${selectedReturnFlight.stops !== 1 ? 's' : ''}`}
                      {' • '}
                      {formatDuration(selectedReturnFlight.durationMinutes || selectedReturnFlight.duration)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{selectedReturnFlight.airline}</p>
                  </div>
                </div>
              )}

              {/* Fare Type */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="font-bold text-blue-900 dark:text-blue-200">{fareLabel}</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Selected fare type for your booking
                </p>
              </div>

              {/* Price Breakdown */}
              <div className="border-t dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Base fare × {totalPassengers}</span>
                  <span className="dark:text-white">${pricing.basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Taxes & fees</span>
                  <span className="dark:text-white">${pricing.taxesAndFees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Service fee</span>
                  <span className="dark:text-white">${pricing.serviceFee.toFixed(2)}</span>
                </div>
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Discount</span>
                    <span className="text-green-600 dark:text-green-400">-${pricing.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t dark:border-gray-700 pt-2 mt-2">
                  <span className="dark:text-white">Total</span>
                  <span className="text-[#FF690F]">${pricing.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Your booking is protected by Kayak's secure payment system. You will receive a confirmation email after payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
