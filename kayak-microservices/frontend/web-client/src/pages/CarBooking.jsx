import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft, CreditCard, DollarSign, User, Mail, Phone, MapPin, Car, Calendar } from 'lucide-react';
import { bookingService, billingService } from '../services/api';
import { addUserBooking } from '../utils/userStorage';
import {
  setSelectedCar,
  setRentalDetails,
  updateDriverInfo,
  updatePaymentInfo,
  calculatePricing,
  createCarBooking,
  setValidationErrors,
  clearFieldError
} from '../store/slices/carBookingSlice';

export default function CarBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  // Get Redux state
  const {
    selectedCar,
    pickupDate: reduxPickupDate,
    dropoffDate: reduxDropoffDate,
    pickupTime: reduxPickupTime,
    dropoffTime: reduxDropoffTime,
    pickupLocation: reduxPickupLocation,
    days,
    driverInfo,
    paymentInfo,
    pricing,
    isProcessing,
    bookingError,
    validationErrors,
    confirmedBooking,
    bookingId
  } = useSelector(state => state.carBooking);
  // Get current user from auth state
  const user = useSelector(state => state.auth.user);

  // Fallback: Initialize from location state if Redux state is empty
  // This provides backward compatibility if user navigates directly to this page
  useEffect(() => {
    const locationState = location.state;
    if (locationState?.car && !selectedCar) {
      dispatch(setSelectedCar(locationState.car));
      dispatch(setRentalDetails({
        pickupDate: locationState.pickupDate,
        dropoffDate: locationState.dropoffDate,
        pickupTime: locationState.pickupTime || '10:00',
        dropoffTime: locationState.dropoffTime || '10:00',
        pickupLocation: locationState.pickupLocation
      }));
      dispatch(calculatePricing());
    }
  }, [location.state, selectedCar, dispatch]);

  // Use Redux state as primary source
  const car = selectedCar;
  const pickupDate = reduxPickupDate;
  const dropoffDate = reduxDropoffDate;
  const pickupTime = reduxPickupTime;
  const dropoffTime = reduxDropoffTime;
  const pickupLocation = reduxPickupLocation;
  const totalPrice = pricing.totalPrice;

  // Validation functions
  const validStates = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
    'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
    'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
    'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
    'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
    'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
  };

  const validateZipCode = (zip) => {
    const zipPattern = /^(\d{2}|\d{5})(-\d{4})?$/;
    return zipPattern.test(zip);
  };

  const validateState = (state) => {
    if (!state) return false;
    const upperState = state.toUpperCase();
    const lowerState = state.toLowerCase();
    return upperState in validStates || Object.values(validStates).map(s => s.toLowerCase()).includes(lowerState);
  };

  const validatePhone = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length === 10;
  };

  const validateLicenseNumber = (license) => {
    // US Driver License: 8-15 alphanumeric characters
    const licensePattern = /^[A-Za-z0-9]{8,15}$/;
    return licensePattern.test(license);
  };

  if (!car) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No booking information found</p>
          <button
            onClick={() => navigate('/cars/search')}
            className="px-6 py-2 bg-[#FF690F] text-white rounded-md hover:bg-[#d6570c]"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const handleDriverInfoChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Auto-format phone: remove non-digits and limit to 10
    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }

    // Auto-format license: uppercase alphanumeric only, max 15 chars
    if (name === 'licenseNumber') {
      processedValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 15);
    }

    // Auto-format state: uppercase and limit to 2 characters if abbreviation
    if (name === 'state') {
      if (value.length <= 2) {
        processedValue = value.toUpperCase().slice(0, 2);
      }
    }

    dispatch(updateDriverInfo({ [name]: processedValue }));
    if (validationErrors[name]) {
      dispatch(clearFieldError(name));
    }
  };

  const handlePaymentChange = (field, value) => {
    dispatch(updatePaymentInfo({ [field]: value }));
    if (validationErrors[`payment_${field}`]) {
      dispatch(clearFieldError(`payment_${field}`));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Driver Info Validation with enhanced checks
    if (!driverInfo.firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!driverInfo.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!driverInfo.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(driverInfo.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Phone validation
    if (!driverInfo.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(driverInfo.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    }
    
    if (!driverInfo.address?.trim()) newErrors.address = 'Address is required';
    if (!driverInfo.city?.trim()) newErrors.city = 'City is required';
    
    // Zip code validation
    if (!driverInfo.zipCode?.trim()) {
      newErrors.zipCode = 'Zip code is required';
    } else if (!validateZipCode(driverInfo.zipCode)) {
      newErrors.zipCode = 'Enter valid zip code (e.g., 12, 95123, 90086-1929)';
    }
    
    // License number validation
    if (!driverInfo.licenseNumber?.trim()) {
      newErrors.licenseNumber = 'Driver license number is required';
    } else if (!validateLicenseNumber(driverInfo.licenseNumber)) {
      newErrors.licenseNumber = 'License must be 8-15 alphanumeric characters';
    }
    
    if (paymentInfo.method !== 'paypal') {
      if (!paymentInfo.cardNumber.trim()) newErrors.payment_cardNumber = 'Card number is required';
      if (!paymentInfo.cardName.trim()) newErrors.payment_cardName = 'Cardholder name is required';
      if (!paymentInfo.expiryDate.trim()) newErrors.payment_expiryDate = 'Expiry date is required';
      if (!paymentInfo.cvv.trim()) newErrors.payment_cvv = 'CVV is required';
    }

    dispatch(setValidationErrors(newErrors));
    return Object.keys(newErrors).length === 0;
  };

  // Validation helper functions
  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10;
  };

  const validateZipCode = (zip) => {
    return /^\d{5}(-\d{4})?$/.test(zip);
  };

  const validateLicenseNumber = (license) => {
    return /^[a-zA-Z0-9]{8,15}$/.test(license);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const generatedBookingId = 'CR' + Date.now();
      
      // Create booking object
      const booking = {
        id: generatedBookingId,
        type: 'car',
        car: car,
        pickupDate: pickupDate,
        dropoffDate: dropoffDate,
        pickupTime: pickupTime,
        dropoffTime: dropoffTime,
        pickupLocation: pickupLocation,
        days: days,
        totalPrice: totalPrice,
        paymentType: paymentInfo.method,
        driverInfo: driverInfo,
        bookingDate: new Date().toISOString(),
        status: 'confirmed'
      };

      // Send to backend API
      const backendBooking = {
        user_id: user?.id,
        listing_id: car.id || `car-${Date.now()}`,
        listing_type: 'car',
        travel_date: pickupDate,
        total_amount: totalPrice,
        payment_details: {
          method: paymentInfo.method,
          cardNumber: paymentInfo.cardNumber ? paymentInfo.cardNumber.slice(-4) : null
        },
        booking_details: {
          car: {
            id: car.id,
            brand: car.brand,
            model: car.model,
            year: car.year,
            type: car.type,
            company_name: car.company_name,
            daily_rental_price: car.daily_rental_price
          },
          pickupDate: pickupDate,
          dropoffDate: dropoffDate,
          pickupTime: pickupTime,
          dropoffTime: dropoffTime,
          pickupLocation: pickupLocation,
          days: days,
          driverInfo: driverInfo
        }
      };

      console.log('📤 Sending car booking to backend:', backendBooking);
      const response = await bookingService.create(backendBooking, { headers: { 'x-user-id': user?.id } });
      console.log('✅ Backend booking response:', response);

      const finalBookingId = response.booking_id || generatedBookingId;
      booking.id = finalBookingId;

      // Save to localStorage for compatibility
      const existingBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      existingBookings.push(booking);
      localStorage.setItem('bookings', JSON.stringify(existingBookings));

      // Save to user-specific localStorage
      if (user && user.id) {
        addUserBooking(user.id, booking);
      }

      // Create billing record
      const billingData = {
        booking_id: finalBookingId,
        booking_type: 'car',
        amount: parseFloat(totalPrice),
        currency: 'USD',
        payment_status: 'paid',
        payment_method: paymentInfo.method,
        customer_name: `${driverInfo.firstName} ${driverInfo.lastName}`,
        customer_email: driverInfo.email,
        item_description: `${days} day${days !== 1 ? 's' : ''} rental: ${car.brand} ${car.model}`,
        metadata: {
          car: {
            brand: car.brand,
            model: car.model,
            year: car.year,
            type: car.type
          },
          pickupDate,
          dropoffDate,
          pickupLocation,
          days
        }
      };

      console.log('📤 Creating billing record:', billingData);
      const billingResponse = await billingService.create(billingData);
      console.log('✅ Billing record created:', billingResponse);

      // Update Redux state with confirmed booking
      const confirmedBookingData = {
        booking_id: finalBookingId,
        id: finalBookingId,
        ...booking,
        billing_id: billingResponse.data.billing_id,
        status: 'confirmed',
        paymentStatus: 'paid'
      };

      // Dispatch action to save confirmed booking in Redux
      dispatch(createCarBooking.fulfilled(confirmedBookingData));

      // Navigate to success page (data will be retrieved from Redux)
      navigate('/booking/car/success');
      
    } catch (error) {
      console.error('❌ Car booking creation failed:', error);
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
        return <CreditCard className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#FF690F]"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to search results
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 dark:text-white">Confirm and Pay</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit}>
              {/* Driver Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                  <User className="w-5 h-5" />
                  Driver Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={driverInfo.firstName}
                      onChange={(e) => handleDriverInfoChange('firstName', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        validationErrors.firstName ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="John"
                    />
                    {validationErrors.firstName && <p className="text-red-500 text-sm mt-1">{validationErrors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={driverInfo.lastName}
                      onChange={(e) => handleDriverInfoChange('lastName', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        validationErrors.lastName ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="Doe"
                    />
                    {validationErrors.lastName && <p className="text-red-500 text-sm mt-1">{validationErrors.lastName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={driverInfo.email}
                      onChange={(e) => handleDriverInfoChange('email', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        validationErrors.email ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="john.doe@example.com"
                    />
                    {validationErrors.email && <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={driverInfo.phone}
                      onChange={(e) => handleDriverInfoChange('phone', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        validationErrors.phone ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="+1 (555) 123-4567"
                    />
                    {validationErrors.phone && <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      Driver License Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={driverInfo.licenseNumber}
                      onChange={(e) => handleDriverInfoChange('licenseNumber', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        validationErrors.licenseNumber ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="D1234567890"
                    />
                    {validationErrors.licenseNumber && <p className="text-red-500 text-sm mt-1">{validationErrors.licenseNumber}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={driverInfo.address}
                      onChange={(e) => handleDriverInfoChange('address', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        validationErrors.address ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="123 Main St"
                    />
                    {validationErrors.address && <p className="text-red-500 text-sm mt-1">{validationErrors.address}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={driverInfo.city}
                      onChange={(e) => handleDriverInfoChange('city', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        validationErrors.city ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="New York"
                    />
                    {validationErrors.city && <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-white">
                      Zip Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={driverInfo.zipCode}
                      onChange={(e) => handleDriverInfoChange('zipCode', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        validationErrors.zipCode ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="10001"
                    />
                    {validationErrors.zipCode && <p className="text-red-500 text-sm mt-1">{validationErrors.zipCode}</p>}
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
                    value={paymentInfo.method}
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
                        value={paymentInfo.cardNumber}
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
                        value={paymentInfo.cardName}
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
                        value={paymentInfo.expiryDate}
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
                        value={paymentInfo.cvv}
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
                {isProcessing ? 'Processing...' : `Confirm and Pay $${totalPrice}`}
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
              
              <div className="mb-4">
                <img
                  src={car.image_url || 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400'}
                  alt={`${car.brand} ${car.model}`}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400';
                  }}
                />
                <h3 className="font-bold text-lg dark:text-white">{car.brand} {car.model} {car.year}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{car.company}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs dark:text-white">
                    {car.type}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {car.transmission}
                  </span>
                </div>
              </div>

              <div className="border-t dark:border-gray-700 pt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Pick-up Location</p>
                    <p className="font-medium dark:text-white">{pickupLocation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Pick-up</p>
                    <p className="font-medium dark:text-white">{pickupDate} at {pickupTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Drop-off</p>
                    <p className="font-medium dark:text-white">{dropoffDate} at {dropoffTime}</p>
                  </div>
                </div>
              </div>

              <div className="border-t dark:border-gray-700 pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    ${car.price_per_day} × {days} day{days !== 1 ? 's' : ''}
                  </span>
                  <span className="dark:text-white">${pricing.basePrice.toFixed(2)}</span>
                </div>
                {pricing.additionalServices > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Additional Services</span>
                    <span className="dark:text-white">${pricing.additionalServices.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Taxes & Fees (15%)</span>
                  <span className="dark:text-white">${pricing.taxesAndFees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t dark:border-gray-700 pt-2 mt-2">
                  <span className="dark:text-white">Total</span>
                  <span className="text-[#FF690F]">${pricing.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Free cancellation up to 48 hours before pick-up. Your booking is protected by Kayak's secure payment system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
