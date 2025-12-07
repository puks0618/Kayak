import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Calendar, MapPin, Car, CreditCard, Download, Share2, User } from 'lucide-react';

export default function CarBookingSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { booking } = location.state || {};

  if (!booking) {
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
              <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 dark:text-white">Booking Confirmed!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your car rental reservation has been successfully confirmed
          </p>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 inline-block">
            <p className="text-sm text-gray-600 dark:text-gray-400">Booking ID</p>
            <p className="text-2xl font-bold text-[#FF690F]">{booking.id}</p>
          </div>
        </div>

        {/* Car Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 dark:text-white">Car Rental Details</h2>
          
          <div className="flex gap-4 mb-6">
            <img
              src={booking.car?.image_url || 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400'}
              alt={`${booking.car?.make} ${booking.car?.model}`}
              className="w-32 h-32 object-cover rounded-lg"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400';
              }}
            />
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2 dark:text-white">
                {booking.car?.make} {booking.car?.model} ({booking.car?.year})
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">{booking.car?.company_name}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#FF690F] text-white px-2 py-1 rounded text-xs font-semibold">
                  {booking.car?.category}
                </span>
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs dark:text-white">
                  {booking.car?.transmission}
                </span>
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs dark:text-white">
                  {booking.car?.seating_capacity} seats
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t dark:border-gray-700 pt-4">
            <div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Pick-up Location</span>
              </div>
              <p className="font-semibold dark:text-white">{booking.pickupLocation}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Pick-up Date & Time</span>
              </div>
              <p className="font-semibold dark:text-white">
                {formatDate(booking.pickupDate)} at {booking.pickupTime}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Drop-off Location</span>
              </div>
              <p className="font-semibold dark:text-white">{booking.pickupLocation}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Drop-off Date & Time</span>
              </div>
              <p className="font-semibold dark:text-white">
                {formatDate(booking.dropoffDate)} at {booking.dropoffTime}
              </p>
            </div>
          </div>
        </div>

        {/* Driver Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
            <User className="w-5 h-5" />
            Driver Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
              <p className="font-semibold dark:text-white">
                {booking.driverInfo?.firstName} {booking.driverInfo?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
              <p className="font-semibold dark:text-white">{booking.driverInfo?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
              <p className="font-semibold dark:text-white">{booking.driverInfo?.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">License Number</p>
              <p className="font-semibold dark:text-white">{booking.driverInfo?.licenseNumber}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
              <p className="font-semibold dark:text-white">
                {booking.driverInfo?.address}, {booking.driverInfo?.city} {booking.driverInfo?.zipCode}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
            <CreditCard className="w-5 h-5" />
            Payment Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                ${booking.car?.daily_rental_price} × {booking.days} day{booking.days !== 1 ? 's' : ''}
              </span>
              <span className="dark:text-white">
                ${(booking.car?.daily_rental_price * booking.days).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Service Fee (10%)</span>
              <span className="dark:text-white">
                ${(booking.car?.daily_rental_price * booking.days * 0.1).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t dark:border-gray-700 pt-3 mt-3">
              <span className="dark:text-white">Total Paid</span>
              <span className="text-[#FF690F]">${booking.totalPrice}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-600 dark:text-gray-400">Payment Method</span>
              <span className="dark:text-white capitalize">{booking.paymentType} Card</span>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <h3 className="font-bold mb-3 text-blue-900 dark:text-blue-200">Important Information</h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
              <span>Please bring your driver's license and a credit card in the driver's name to the rental counter.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
              <span>The car must be returned with the same fuel level as at pick-up.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
              <span>Free cancellation up to 48 hours before the pick-up time.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
              <span>A confirmation email has been sent to {booking.driverInfo?.email}</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/my-trips')}
            className="flex-1 bg-[#FF690F] hover:bg-[#d6570c] text-white py-3 rounded-md font-semibold flex items-center justify-center gap-2"
          >
            <Car className="w-5 h-5" />
            View My Trips
          </button>
          <button
            onClick={() => navigate('/cars')}
            className="flex-1 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 py-3 rounded-md font-semibold"
          >
            Book Another Car
          </button>
        </div>

        {/* Additional Actions */}
        <div className="flex justify-center gap-6 mt-6">
          <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#FF690F] dark:hover:text-[#FF690F]">
            <Download className="w-4 h-4" />
            <span className="text-sm">Download Receipt</span>
          </button>
          <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#FF690F] dark:hover:text-[#FF690F]">
            <Share2 className="w-4 h-4" />
            <span className="text-sm">Share Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}
