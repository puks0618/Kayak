import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft, CreditCard, Building, DollarSign, User, Mail, Phone, MapPin } from 'lucide-react';
import { bookingService } from '../services/api';
import { addUserBooking } from '../utils/userStorage';

export default function BookingConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(state => state.auth);
  const { hotel, checkIn, checkOut, guests, nights, totalPrice } = location.state || {};

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    paymentType: 'credit',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  const [errors, setErrors] = useState({});

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

  if (!hotel) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No booking information found</p>
          <button
            onClick={() => navigate('/stays/search')}
            className="px-6 py-2 bg-[#FF690F] text-white rounded-md hover:bg-[#d6570c]"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

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

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    }
    
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    
    // Zip code validation
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'Zip code is required';
    } else if (!validateZipCode(formData.zipCode)) {
      newErrors.zipCode = 'Enter valid zip code (e.g., 12, 95123, 90086-1929)';
    }
    
    if (formData.paymentType !== 'paypal') {
      if (!formData.cardNumber.trim()) newErrors.cardNumber = 'Card number is required';
      if (!formData.cardName.trim()) newErrors.cardName = 'Cardholder name is required';
      if (!formData.expiryDate.trim()) newErrors.expiryDate = 'Expiry date is required';
      if (!formData.cvv.trim()) newErrors.cvv = 'CVV is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const bookingId = 'BK' + Date.now();
      
      // Create booking object for localStorage
      const booking = {
        id: bookingId,
        type: 'hotel',
        hotel: hotel,
        checkIn: checkIn,
        checkOut: checkOut,
        guests: guests,
        nights: nights,
        totalPrice: totalPrice,
        paymentType: formData.paymentType,
        guestInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          zipCode: formData.zipCode
        },
        bookingDate: new Date().toISOString(),
        status: 'confirmed'
      };

      try {
        // Send to backend API
        const backendBooking = {
          listing_id: hotel.listing_id || hotel.hotel_id || hotel.id || `hotel-${Date.now()}`,
          listing_type: 'hotel',
          travel_date: checkIn,
          total_amount: totalPrice,
          payment_details: {
            method: formData.paymentType,
            cardNumber: formData.cardNumber ? formData.cardNumber.slice(-4) : null
          },
          booking_details: {
            hotel: {
              id: hotel.hotel_id || hotel.id,
              name: hotel.hotel_name || hotel.name,
              city: hotel.city,
              neighbourhood: hotel.neighbourhood_cleansed || hotel.neighbourhood
            },
            checkIn: checkIn,
            checkOut: checkOut,
            guests: guests,
            nights: nights,
            guestInfo: booking.guestInfo
          }
        };

        console.log('📤 Sending hotel booking to backend:', backendBooking);
        const response = await bookingService.create(backendBooking);
        console.log('✅ Backend booking response:', response);

        // Update booking ID from backend response
        booking.id = response.booking_id || bookingId;

        // Save to user-specific localStorage for local tracking
        if (user && user.id) {
          addUserBooking(user.id, booking);
        }

        // Redirect to success page with booking details
        navigate('/booking/success', { state: { booking, type: 'hotel' } });
      } catch (error) {
        console.error('❌ Booking creation failed:', error);
        alert('Failed to save booking. Please try again.');
      }
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
            Back to hotel
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 dark:text-white">Confirm and Pay</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit}>
              {/* Traveler Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                  <User className="w-5 h-5" />
                  Traveler Information
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
                      placeholder="+1 (555) 123-4567"
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
                className="w-full bg-[#FF690F] hover:bg-[#d6570c] text-white py-4 rounded-md font-bold text-lg mt-6"
              >
                Confirm and Pay ${totalPrice}
              </button>
            </form>
          </div>

          {/* Right Column - Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold mb-4 dark:text-white">Booking Summary</h2>
              
              <div className="mb-4">
                <img
                  src={hotel.picture_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                  alt={hotel.hotel_name}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';
                  }}
                />
                <h3 className="font-bold text-lg dark:text-white">{hotel.hotel_name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {hotel.neighbourhood_cleansed}, {hotel.city}
                </p>
              </div>

              <div className="border-t dark:border-gray-700 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Check-in</span>
                  <span className="font-medium dark:text-white">{checkIn}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Check-out</span>
                  <span className="font-medium dark:text-white">{checkOut}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Guests</span>
                  <span className="font-medium dark:text-white">{guests} {guests === 1 ? 'guest' : 'guests'}</span>
                </div>
              </div>

              <div className="border-t dark:border-gray-700 pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    ${hotel.price_per_night} × {nights} night{nights !== 1 ? 's' : ''}
                  </span>
                  <span className="dark:text-white">${(hotel.price_per_night * nights).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Service fee</span>
                  <span className="dark:text-white">${(hotel.price_per_night * nights * 0.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t dark:border-gray-700 pt-2 mt-2">
                  <span className="dark:text-white">Total</span>
                  <span className="text-[#FF690F]">${totalPrice}</span>
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
