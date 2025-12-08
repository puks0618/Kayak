import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';

export default function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    billingZip: ''
  });

  // Parse deal info from URL params
  const dealType = searchParams.get('type');
  const dealTitle = searchParams.get('title');
  const dealPrice = searchParams.get('price');
  const dealOrigin = searchParams.get('origin');
  const dealDestination = searchParams.get('destination');
  const dealDate = searchParams.get('date');

  useEffect(() => {
    if (!dealType || !dealTitle) {
      navigate('/ai-mode');
    }
  }, [dealType, dealTitle, navigate]);

  const handleInputChange = (e) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!bookingData.firstName || !bookingData.lastName || !bookingData.email || !bookingData.phone) {
        alert('Please fill in all traveler information');
        return;
      }
    }
    if (step === 2) {
      if (!bookingData.cardNumber || !bookingData.expiryDate || !bookingData.cvv || !bookingData.billingZip) {
        alert('Please fill in all payment information');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) {
      navigate('/ai-mode');
    } else {
      setStep(step - 1);
    }
  };

  const handleBooking = () => {
    // In a real app, this would make an API call to complete the booking
    console.log('Booking completed:', { dealType, dealTitle, ...bookingData });
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Complete Your Booking
          </h1>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                {step > 1 ? <Check size={20} /> : '1'}
              </div>
              <div className={`flex-1 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                {step > 2 ? <Check size={20} /> : '2'}
              </div>
              <div className={`flex-1 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                {step > 3 ? <Check size={20} /> : '3'}
              </div>
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className={step >= 1 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>Traveler Info</span>
              <span className={step >= 2 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>Payment</span>
              <span className={step >= 3 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>Confirm</span>
            </div>
          </div>
        </div>

        {/* Deal Summary Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Your Selection</h2>
          <div className="space-y-2">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Type:</span> {dealType === 'flight' ? 'Flight' : 'Hotel'}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Title:</span> {dealTitle}
            </p>
            {dealOrigin && (
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Route:</span> {dealOrigin} → {dealDestination}
              </p>
            )}
            {dealDate && (
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Date:</span> {dealDate}
              </p>
            )}
            <p className="text-2xl font-bold text-blue-600 mt-4">{dealPrice}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Traveler Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={bookingData.firstName}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={bookingData.lastName}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={bookingData.email}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="john.doe@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={bookingData.phone}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              <button
                onClick={handleNext}
                className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Payment Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Card Number
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={bookingData.cardNumber}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={bookingData.expiryDate}
                      onChange={handleInputChange}
                      className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="MM/YY"
                      maxLength="5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      CVV
                    </label>
                    <input
                      type="text"
                      name="cvv"
                      value={bookingData.cvv}
                      onChange={handleInputChange}
                      className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="123"
                      maxLength="4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Billing ZIP
                    </label>
                    <input
                      type="text"
                      name="billingZip"
                      value={bookingData.billingZip}
                      onChange={handleInputChange}
                      className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="12345"
                      maxLength="10"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={handleNext}
                className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Review Booking
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Review & Confirm</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Traveler Information</h3>
                  <p className="text-gray-700 dark:text-gray-300">{bookingData.firstName} {bookingData.lastName}</p>
                  <p className="text-gray-700 dark:text-gray-300">{bookingData.email}</p>
                  <p className="text-gray-700 dark:text-gray-300">{bookingData.phone}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Payment Method</h3>
                  <p className="text-gray-700 dark:text-gray-300">Card ending in {bookingData.cardNumber.slice(-4)}</p>
                </div>
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Total Amount</h3>
                  <p className="text-3xl font-bold text-blue-600">{dealPrice}</p>
                </div>
              </div>
              <button
                onClick={handleBooking}
                className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Complete Booking
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={40} className="text-green-600" />
              </div>
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Booking Confirmed!</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Your booking for {dealTitle} has been confirmed.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                A confirmation email has been sent to {bookingData.email}
              </p>
              <button
                onClick={() => navigate('/ai-mode')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Back to AI Assistant
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
