import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft, CreditCard, DollarSign, User, Mail, Phone, MapPin, Car } from 'lucide-react';
import { bookingService, billingService } from '../services/api';
import { addUserBooking } from '../utils/userStorage';
import { 
  validateState, 
  validatePhone, 
  validateZipCode as validateZip,
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
  validateCardholderName,
  detectCardType
} from '../utils/bookingValidation';

export default function CarBookingConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(state => state.auth);
  const { car, pickupDate, dropoffDate, pickupTime, dropoffTime, pickupLocation, days, totalPrice } = location.state || {};

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
    licenseNumber: '',
    paymentType: 'credit',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  const [errors, setErrors] = useState({});

  // Auto-fill user details from profile - runs once on mount, fills ALL fields at once
  useEffect(() => {
    if (user) {
      // Clean phone to only digits (max 10)
      const cleanPhone = (user.phone || '').replace(/\D/g, '').slice(0, 10);
      // Clean zipCode to valid format
      const cleanZip = (user.zipCode || '').trim();
      // Clean state to uppercase 2 letters
      const cleanState = (user.state || '').toUpperCase().slice(0, 2);
      
      console.log('🔄 Auto-filling ALL fields from user profile:', user);
      
      // Set ALL form fields at once with validated user data
      setFormData(prev => ({
        ...prev, // Keep payment info if already entered
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: validatePhone(cleanPhone) ? cleanPhone : '',
        address: user.address || '',
        city: user.city || '',
        state: validateState(cleanState) ? cleanState : '',
        zipCode: validateZip(cleanZip) ? cleanZip : ''
      }));
      
      console.log('✅ All fields auto-filled at once');
    }
  }, [user]); // Only depend on user, runs when component mounts and user is available

  const validateLicenseNumber = (license) => {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }

    if (name === 'licenseNumber') {
      processedValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 15);
    }
    
    if (name === 'state') {
      processedValue = value.toUpperCase().slice(0, 2);
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
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
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    }
    
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    } else if (!validateState(formData.state)) {
      newErrors.state = 'Invalid state code. Please use 2-letter US state code (e.g., CA, NY)';
    }
    
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'Zip code is required';
    } else if (!validateZip(formData.zipCode)) {
      newErrors.zipCode = 'Enter valid zip code';
    }
    
    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'Driver license number is required';
    } else if (!validateLicenseNumber(formData.licenseNumber)) {
      newErrors.licenseNumber = 'License must be 8-15 alphanumeric characters';
    }
    
    if (formData.paymentType !== 'paypal') {
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
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const bookingId = 'CR' + Date.now();
      
      const booking = {
        id: bookingId,
        type: 'car',
        car: car,
        pickupDate: pickupDate,
        dropoffDate: dropoffDate,
        pickupTime: pickupTime,
        dropoffTime: dropoffTime,
        pickupLocation: pickupLocation,
        days: days,
        totalPrice: totalPrice,
        paymentType: formData.paymentType,
        driverInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          zipCode: formData.zipCode,
          licenseNumber: formData.licenseNumber
        },
        bookingDate: new Date().toISOString(),
        status: 'confirmed'
      };

      try {
        const backendBooking = {
          listing_id: car.id || `car-${Date.now()}`,
          listing_type: 'car',
          travel_date: pickupDate,
          total_amount: totalPrice,
          payment_details: {
            method: formData.paymentType,
            cardNumber: formData.cardNumber ? formData.cardNumber.slice(-4) : null
          },
          booking_details: {
            car: {
              id: car.id,
              make: car.make,
              model: car.model,
              year: car.year,
              category: car.category,
              company_name: car.company_name,
              daily_rental_price: car.daily_rental_price
            },
            pickupDate: pickupDate,
            dropoffDate: dropoffDate,
            pickupTime: pickupTime,
            dropoffTime: dropoffTime,
            pickupLocation: pickupLocation,
            days: days,
            driverInfo: booking.driverInfo
          }
        };

        const response = await bookingService.create(backendBooking);
        const finalBookingId = response.booking_id || bookingId;
        booking.id = finalBookingId;

        // Create billing record
        const paymentMethodMap = {
          'credit': 'CREDIT_CARD',
          'debit': 'DEBIT_CARD',
          'paypal': 'PAYPAL',
          'other': 'OTHER'
        };

        const billingData = {
          userId: user?.id || user?.user_id || 'guest',
          bookingType: 'CAR',
          bookingId: finalBookingId,
          totalAmount: parseFloat(totalPrice),
          paymentMethod: paymentMethodMap[formData.paymentType] || 'CREDIT_CARD',
          transactionStatus: 'PAID',
          invoiceDetails: {
            customer_name: `${formData.firstName} ${formData.lastName}`,
            customer_email: formData.email,
            item_description: `${days} day${days !== 1 ? 's' : ''} rental: ${car.make} ${car.model}`,
            currency: 'USD',
            metadata: {
              car: {
                id: car.id,
                make: car.make,
                model: car.model,
                year: car.year,
                category: car.category,
                company_name: car.company_name
              },
              pickupDate,
              dropoffDate,
              pickupLocation,
              days
            }
          }
        };

        console.log('📤 Creating billing record:', billingData);
        const billingResponse = await billingService.create(billingData);
        console.log('✅ Billing record created:', billingResponse);

        if (user && user.id) {
          addUserBooking(user.id, booking);
        }

        navigate('/booking/car/success', { state: { booking } });
      } catch (error) {
        console.error('❌ Car booking creation failed:', error);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#FF690F] dark:hover:text-[#FF690F] mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
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
                      Phone <span className="text-red-500">*</span>
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
                      Driver License Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                        errors.licenseNumber ? 'border-red-500' : 'dark:border-gray-600'
                      }`}
                      placeholder="D1234567890"
                    />
                    {errors.licenseNumber && <p className="text-red-500 text-sm mt-1">{errors.licenseNumber}</p>}
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
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

                {formData.paymentType !== 'paypal' && (
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
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-[#FF690F] hover:bg-[#d6570c] text-white py-3 rounded-md font-semibold"
              >
                Confirm Booking
              </button>
            </form>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4 dark:text-white">Booking Summary</h2>
              
              <div className="mb-4">
                <img
                  src={car.image_url || 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400'}
                  alt={`${car.make} ${car.model}`}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
                <h3 className="font-bold text-lg dark:text-white">
                  {car.make} {car.model} ({car.year})
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{car.company_name}</p>
              </div>

              <div className="space-y-3 mb-4 pb-4 border-b dark:border-gray-700">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pick-up</p>
                    <p className="font-semibold text-sm dark:text-white">{pickupLocation}</p>
                    <p className="text-sm dark:text-gray-400">{pickupDate} at {pickupTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Drop-off</p>
                    <p className="font-semibold text-sm dark:text-white">{pickupLocation}</p>
                    <p className="text-sm dark:text-gray-400">{dropoffDate} at {dropoffTime}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    ${parseFloat(car.daily_rental_price).toFixed(2)} × {days} day{days !== 1 ? 's' : ''}
                  </span>
                  <span className="dark:text-white">${(car.daily_rental_price * days).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Service fee (10%)</span>
                  <span className="dark:text-white">${(car.daily_rental_price * days * 0.1).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-lg border-t dark:border-gray-700 pt-3">
                <span className="dark:text-white">Total</span>
                <span className="text-[#FF690F]">${parseFloat(totalPrice).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
