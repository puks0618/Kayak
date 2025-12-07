import React, { useEffect } from 'react';
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
  clearFieldError
} from '../store/slices/flightBookingSlice';
import {
  validateContactInfo,
  validatePaymentInfo,
  formatCardNumber,
  formatExpiryDate
} from '../utils/bookingValidation';

export default function FlightBookingConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  // Get Redux state
  const {
    selectedOutboundFlight,
    selectedReturnFlight,
    selectedFare,
    passengers,
    passengerDetails,
    contactInfo,
    paymentInfo,
    pricing,
    isProcessing,
    bookingError,
    validationErrors,
    confirmedBooking,
    bookingId
  } = useSelector(state => state.flightBooking);

  // Initialize from location state if coming from flight selection
  useEffect(() => {
    const locationState = location.state;
    if (locationState) {
      if (locationState.outboundFlight && !selectedOutboundFlight) {
        dispatch(setSelectedOutboundFlight(locationState.outboundFlight));
      }
      if (locationState.returnFlight && !selectedReturnFlight) {
        dispatch(setSelectedReturnFlight(locationState.returnFlight));
      }
      if (locationState.fare && !selectedFare) {
        dispatch(setSelectedFare(locationState.fare.type || 'basic'));
      }
      if (locationState.passengers && passengers.adults === 1) {
        dispatch(setPassengerCount({
          adults: locationState.passengers || 1,
          children: 0,
          infants: 0
        }));
      }
      // Calculate pricing after setting flights
      dispatch(calculatePricing());
    }
  }, [location.state]);

  // Redirect if confirmed
  useEffect(() => {
    if (confirmedBooking && bookingId) {
      navigate(`/invoice/${bookingId}`);
    }
  }, [confirmedBooking, bookingId, navigate]);

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

  // Handle passenger field changes
  const handlePassengerChange = (field, value) => {
    dispatch(updatePassengerDetails({
      passengerId: currentPassenger.id,
      details: { [field]: value }
    }));
    if (validationErrors[`passenger_${field}`]) {
      dispatch(clearFieldError(`passenger_${field}`));
    }
  };

  // Handle contact field changes
  const handleContactChange = (field, value) => {
    dispatch(updateContactInfo({ [field]: value }));
    if (validationErrors[`contact_${field}`]) {
      dispatch(clearFieldError(`contact_${field}`));
    }
  };

  // Handle payment field changes
  const handlePaymentChange = (field, value) => {
    let formattedValue = value;
    
    // Format card number with spaces
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    }
    
    // Format expiry date as MM/YY
    if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    }
    
    dispatch(updatePaymentInfo({ [field]: formattedValue }));
    if (validationErrors[`payment_${field}`]) {
      dispatch(clearFieldError(`payment_${field}`));
    }
  };

  const validateForm = () => {
    const contactErrors = validateContactInfo(contactInfo);
    const paymentErrors = validatePaymentInfo(paymentInfo);
    
    const allErrors = {
      ...Object.keys(contactErrors).reduce((acc, key) => ({ ...acc, [`contact_${key}`]: contactErrors[key] }), {}),
      ...Object.keys(paymentErrors).reduce((acc, key) => ({ ...acc, [`payment_${key}`]: paymentErrors[key] }), {})
    };
    
    dispatch(setValidationErrors(allErrors));
    return Object.keys(allErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Prepare booking data
      const bookingData = {
        listing_id: selectedOutboundFlight.id || selectedOutboundFlight.flight_id || 'flight-' + Date.now(),
        listing_type: 'flight',
        travel_date: selectedOutboundFlight.departure_time || selectedOutboundFlight.departureTime,
        total_amount: pricing.totalPrice,
        payment_details: {
          method: paymentInfo.method,
          cardNumber: paymentInfo.cardNumber ? paymentInfo.cardNumber.replace(/\s/g, '').slice(-4) : null
        },
        booking_details: {
          outboundFlight: {
            id: selectedOutboundFlight.id,
            airline: selectedOutboundFlight.airline,
            origin: selectedOutboundFlight.departure_airport || selectedOutboundFlight.origin,
            destination: selectedOutboundFlight.arrival_airport || selectedOutboundFlight.destination,
            departureTime: selectedOutboundFlight.departure_time || selectedOutboundFlight.departureTime
          },
          returnFlight: selectedReturnFlight ? {
            id: selectedReturnFlight.id,
            airline: selectedReturnFlight.airline,
            origin: selectedReturnFlight.departure_airport || selectedReturnFlight.origin,
            destination: selectedReturnFlight.arrival_airport || selectedReturnFlight.destination,
            departureTime: selectedReturnFlight.departure_time || selectedReturnFlight.departureTime
          } : null,
          passengers: passengers.adults + passengers.children + passengers.infants,
          passengerInfo: {
            firstName: currentPassenger.firstName,
            lastName: currentPassenger.lastName,
            email: currentPassenger.email || contactInfo.email,
            phone: currentPassenger.phone || contactInfo.phone,
            address: contactInfo.address,
            city: contactInfo.city,
            zipCode: contactInfo.zipCode
          },
          fareType: selectedFare,
          pricing: pricing
        }
      };

      console.log('📤 Sending flight booking to backend:', bookingData);
      const response = await bookingService.create(bookingData);
      console.log('✅ Backend booking response:', response);

      const finalBookingId = response.booking_id || response.id;

      // Prepare local booking for localStorage
      const localBooking = {
        id: finalBookingId,
        type: 'flight',
        outboundFlight: selectedOutboundFlight,
        returnFlight: selectedReturnFlight,
        fare: selectedFare,
        passengers,
        totalPrice: pricing.totalPrice,
        paymentType: paymentInfo.method,
        passengerInfo: bookingData.booking_details.passengerInfo,
        bookingDate: new Date().toISOString(),
        status: 'confirmed'
      };

      // Store in user-specific localStorage for compatibility
      if (user && user.id) {
        addUserBooking(user.id, localBooking);
      }

      // Create billing record
      const originCode = selectedOutboundFlight.origin?.code || selectedOutboundFlight.departure_airport || selectedOutboundFlight.origin || 'N/A';
      const destCode = selectedOutboundFlight.destination?.code || selectedOutboundFlight.arrival_airport || selectedOutboundFlight.destination || 'N/A';
      
      const billingData = {
        booking_id: finalBookingId,
        booking_type: 'flight',
        amount: parseFloat(pricing.totalPrice),
        currency: 'USD',
        payment_status: 'paid',
        payment_method: paymentInfo.method,
        customer_name: `${currentPassenger.firstName} ${currentPassenger.lastName}`,
        customer_email: contactInfo.email,
        item_description: `Flight from ${originCode} to ${destCode}`,
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
      };

      console.log('📤 Creating billing record:', billingData);
      const billingResponse = await billingService.create(billingData);
      console.log('✅ Billing record created:', billingResponse);

      // Update Redux state with confirmed booking
      const confirmedBookingData = {
        booking_id: finalBookingId,
        id: finalBookingId,
        ...localBooking,
        billing_id: billingResponse.data.billing_id,
        status: 'confirmed',
        paymentStatus: 'paid'
      };

      // Dispatch action to save confirmed booking in Redux
      dispatch(createFlightBooking.fulfilled(confirmedBookingData));

      // Navigate to success page (Redux is source of truth)
      navigate('/booking/success');
      
    } catch (error) {
      console.error('❌ Booking creation failed:', error);
      alert('Failed to complete booking. Please try again.');
    }
  };

  const getPaymentIcon = () => {
    switch (paymentInfo.method) {
      case 'credit':
      case 'debit':
        return <CreditCard className="w-5 h-5" />;
      case 'paypal':
        return <DollarSign className="w-5 h-5" />;
      default:
        return <Building className="w-5 h-5" />;
    }
  };

  const originCode = selectedOutboundFlight.origin?.code || selectedOutboundFlight.departure_airport || selectedOutboundFlight.origin || 'N/A';
  const destCode = selectedOutboundFlight.destination?.code || selectedOutboundFlight.arrival_airport || selectedOutboundFlight.destination || 'N/A';
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
                      value={currentPassenger.firstName || ''}
                      onChange={(e) => handlePassengerChange('firstName', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        validationErrors.passenger_firstName ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="John"
                    />
                    {validationErrors.passenger_firstName && <p className="text-red-500 text-sm mt-1">{validationErrors.passenger_firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={currentPassenger.lastName || ''}
                      onChange={(e) => handlePassengerChange('lastName', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        validationErrors.passenger_lastName ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="Doe"
                    />
                    {validationErrors.passenger_lastName && <p className="text-red-500 text-sm mt-1">{validationErrors.passenger_lastName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={contactInfo.email || ''}
                      onChange={(e) => handleContactChange('email', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        validationErrors.contact_email ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="john.doe@example.com"
                    />
                    {validationErrors.contact_email && <p className="text-red-500 text-sm mt-1">{validationErrors.contact_email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={contactInfo.phone || ''}
                      onChange={(e) => handleContactChange('phone', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        validationErrors.contact_phone ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="+1 (555) 123-4567"
                    />
                    {validationErrors.contact_phone && <p className="text-red-500 text-sm mt-1">{validationErrors.contact_phone}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={contactInfo.address || ''}
                      onChange={(e) => handleContactChange('address', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        validationErrors.contact_address ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="123 Main St"
                    />
                    {validationErrors.contact_address && <p className="text-red-500 text-sm mt-1">{validationErrors.contact_address}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={contactInfo.city || ''}
                      onChange={(e) => handleContactChange('city', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        validationErrors.contact_city ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="New York"
                    />
                    {validationErrors.contact_city && <p className="text-red-500 text-sm mt-1">{validationErrors.contact_city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      Zip Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={contactInfo.zipCode || ''}
                      onChange={(e) => handleContactChange('zipCode', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        validationErrors.contact_zipCode ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="10001"
                    />
                    {validationErrors.contact_zipCode && <p className="text-red-500 text-sm mt-1">{validationErrors.contact_zipCode}</p>}
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
                    value={paymentInfo.method || 'credit'}
                    onChange={(e) => handlePaymentChange('method', e.target.value)}
                    className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="credit">Credit Card</option>
                    <option value="debit">Debit Card</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>

                {paymentInfo.method !== 'paypal' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 dark:text-white">
                        Card Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={paymentInfo.cardNumber || ''}
                        onChange={(e) => handlePaymentChange('cardNumber', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                          validationErrors.payment_cardNumber ? 'border-red-500' : 'dark:border-gray-600'
                        }`}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                      />
                      {validationErrors.payment_cardNumber && <p className="text-red-500 text-sm mt-1">{validationErrors.payment_cardNumber}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 dark:text-white">
                        Cardholder Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="cardName"
                        value={paymentInfo.cardName || ''}
                        onChange={(e) => handlePaymentChange('cardName', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                          validationErrors.payment_cardName ? 'border-red-500' : 'dark:border-gray-600'
                        }`}
                        placeholder="John Doe"
                      />
                      {validationErrors.payment_cardName && <p className="text-red-500 text-sm mt-1">{validationErrors.payment_cardName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-white">
                        Expiry Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={paymentInfo.expiryDate || ''}
                        onChange={(e) => handlePaymentChange('expiryDate', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                          validationErrors.payment_expiryDate ? 'border-red-500' : 'dark:border-gray-600'
                        }`}
                        placeholder="MM/YY"
                        maxLength="5"
                      />
                      {validationErrors.payment_expiryDate && <p className="text-red-500 text-sm mt-1">{validationErrors.payment_expiryDate}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-white">
                        CVV <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        value={paymentInfo.cvv || ''}
                        onChange={(e) => handlePaymentChange('cvv', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                          validationErrors.payment_cvv ? 'border-red-500' : 'dark:border-gray-600'
                        }`}
                        placeholder="123"
                        maxLength="4"
                      />
                      {validationErrors.payment_cvv && <p className="text-red-500 text-sm mt-1">{validationErrors.payment_cvv}</p>}
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
