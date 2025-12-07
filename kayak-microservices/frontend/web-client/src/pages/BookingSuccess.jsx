import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CheckCircle, Calendar, MapPin, Users, CreditCard, Download, Share2 } from 'lucide-react';

export default function BookingSuccess() {

  const navigate = useNavigate();
  // Get Redux state for both flight and stay bookings
  const flightState = useSelector(state => state.flightBooking);
  const stayState = useSelector(state => state.stayBooking);

  // Prefer flight booking if present, else stay booking
  let booking = null;
  if (flightState.confirmedBooking) {
    booking = flightState.confirmedBooking;
  } else if (flightState.selectedOutboundFlight) {
    booking = {
      id: flightState.bookingId,
      type: 'flight',
      outboundFlight: flightState.selectedOutboundFlight,
      returnFlight: flightState.selectedReturnFlight,
      fare: {
        label: flightState.selectedFare === 'flexible' ? 'Flexible' : flightState.selectedFare === 'standard' ? 'Standard' : 'Basic',
        price: flightState.pricing.totalPrice
      },
      passengers: flightState.passengers.adults + flightState.passengers.children + flightState.passengers.infants,
      totalPrice: flightState.pricing.totalPrice,
      paymentType: flightState.paymentInfo.method === 'credit' ? 'Credit Card' : flightState.paymentInfo.method === 'debit' ? 'Debit Card' : 'PayPal',
      passengerInfo: {
        firstName: flightState.passengerDetails[0]?.firstName,
        lastName: flightState.passengerDetails[0]?.lastName,
        email: flightState.contactInfo.email,
        phone: flightState.contactInfo.phone,
        address: flightState.contactInfo.address,
        city: flightState.contactInfo.city,
        zipCode: flightState.contactInfo.zipCode
      },
      bookingDate: new Date().toISOString(),
      status: 'confirmed'
    };
  } else if (stayState.confirmedBooking) {
    booking = {
      ...stayState.confirmedBooking,
      type: 'hotel',
    };
  } else if (stayState.selectedHotel) {
    booking = {
      id: stayState.bookingId,
      type: 'hotel',
      hotel: stayState.selectedHotel,
      checkIn: stayState.checkInDate,
      checkOut: stayState.checkOutDate,
      guests: stayState.guests,
      rooms: stayState.rooms,
      nights: stayState.nights,
      totalPrice: stayState.pricing.totalPrice,
      paymentType: stayState.paymentInfo.method === 'credit' ? 'Credit Card' : stayState.paymentInfo.method === 'debit' ? 'Debit Card' : 'PayPal',
      guestInfo: {
        firstName: stayState.contactInfo.firstName,
        lastName: stayState.contactInfo.lastName,
        email: stayState.contactInfo.email,
        phone: stayState.contactInfo.phone,
        address: stayState.contactInfo.address,
        city: stayState.contactInfo.city,
        zipCode: stayState.contactInfo.zipCode
      },
      bookingDate: new Date().toISOString(),
      status: 'confirmed'
    };
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No booking information found</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-[#FF690F] text-white rounded-md hover:bg-[#d6570c]"
          >
            Back to Home
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
            Your reservation has been successfully confirmed
          </p>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 inline-block">
            <p className="text-sm text-gray-600 dark:text-gray-400">Booking ID</p>
            <p className="text-2xl font-bold text-[#FF690F]">{booking.id}</p>
          </div>
        </div>

        {/* Booking Details - Flight, Hotel, or Car */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 dark:text-white">
            {booking.type === 'flight' ? 'Flight Details' : booking.type === 'car' ? 'Car Details' : 'Hotel Details'}
          </h2>
          
          {booking.type === 'flight' ? (
            // Flight Booking Details
            <div className="space-y-4">
              {/* Outbound Flight */}
              <div className="border-l-4 border-[#FF690F] pl-4">
                <h3 className="font-bold text-lg mb-2 dark:text-white">Outbound Flight</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  {booking.outboundFlight.departure_airport || booking.outboundFlight.origin} → {booking.outboundFlight.arrival_airport || booking.outboundFlight.destination}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(booking.outboundFlight.departure_time || booking.outboundFlight.departureTime)}
                </p>
                <p className="text-sm font-medium dark:text-white">{booking.outboundFlight.airline}</p>
              </div>
              
              {/* Return Flight */}
              {booking.returnFlight && (
                <div className="border-l-4 border-[#FF690F] pl-4">
                  <h3 className="font-bold text-lg mb-2 dark:text-white">Return Flight</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">
                    {booking.returnFlight.departure_airport || booking.returnFlight.origin} → {booking.returnFlight.arrival_airport || booking.returnFlight.destination}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(booking.returnFlight.departure_time || booking.returnFlight.departureTime)}
                  </p>
                  <p className="text-sm font-medium dark:text-white">{booking.returnFlight.airline}</p>
                </div>
              )}
              
              {/* Fare Details */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="font-semibold text-blue-900 dark:text-blue-200">{booking.fare.label} Fare</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {booking.passengers} passenger{booking.passengers !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ) : booking.type === 'car' ? (
            // Car Booking Details
            <div className="flex gap-4 mb-6">
              <img
                src={booking.car?.image_url || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400'}
                alt={booking.car?.make || 'Car'}
                className="w-32 h-32 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2 dark:text-white">
                  {booking.car?.make} {booking.car?.model} ({booking.car?.year})
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {booking.car?.category} • {booking.car?.transmission}
                </p>
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Pickup: {booking.pickupLocation}
                </p>
              </div>
            </div>
          ) : (
            // Hotel Booking Details
            <div className="flex gap-4 mb-6">
              <img
                src={booking.hotel?.picture_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                alt={booking.hotel?.hotel_name || 'Hotel'}
                className="w-32 h-32 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';
                }}
              />
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2 dark:text-white">{booking.hotel?.hotel_name}</h3>
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />
                  {booking.hotel?.neighbourhood_cleansed}, {booking.hotel?.city}
                </p>
                {booking.hotel?.review_scores_rating && (
                  <div className="flex items-center gap-2">
                    <span className="bg-[#FF690F] text-white px-2 py-1 rounded font-bold text-sm">
                      {(booking.hotel.review_scores_rating / 10).toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ({booking.hotel.number_of_reviews} reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {booking.type !== 'flight' && booking.type !== 'car' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t dark:border-gray-700 pt-4">
              <div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Check-in</span>
                </div>
                <p className="font-semibold dark:text-white">{formatDate(booking.checkIn)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Check-out</span>
                </div>
                <p className="font-semibold dark:text-white">{formatDate(booking.checkOut)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Guests</span>
                </div>
                <p className="font-semibold dark:text-white">{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Guest/Passenger Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 dark:text-white">
            {booking.type === 'flight' ? 'Passenger Information' : booking.type === 'car' ? 'Driver Information' : 'Guest Information'}
          </h2>
          {(() => {
            const info = booking.passengerInfo || booking.guestInfo || booking.driverInfo;
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                  <p className="font-semibold dark:text-white">
                    {info?.firstName} {info?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="font-semibold dark:text-white">{info?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="font-semibold dark:text-white">{info?.phone}</p>
                </div>
                {booking.type === 'car' && info?.licenseNumber && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Driver License</p>
                    <p className="font-semibold dark:text-white">{info.licenseNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                  <p className="font-semibold dark:text-white">
                    {info?.address}, {info?.city} {info?.zipCode}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Payment Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
            <CreditCard className="w-5 h-5" />
            Payment Details
          </h2>
          <div className="space-y-3">
            {booking.type === 'flight' ? (
              // Flight payment breakdown
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {booking.fare?.label} fare × {booking.passengers} passenger{booking.passengers !== 1 ? 's' : ''}
                  </span>
                  <span className="dark:text-white">${booking.fare?.price || booking.totalPrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Service fee (10%)</span>
                  <span className="dark:text-white">${((booking.fare?.price || booking.totalPrice) * 0.1).toFixed(2)}</span>
                </div>
              </>
            ) : booking.type === 'car' ? (
              // Car payment breakdown
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    ${booking.car?.daily_rental_price} × {booking.days} day{booking.days !== 1 ? 's' : ''}
                  </span>
                  <span className="dark:text-white">${(booking.car?.daily_rental_price * booking.days).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Service fee</span>
                  <span className="dark:text-white">${(booking.car?.daily_rental_price * booking.days * 0.1).toFixed(2)}</span>
                </div>
              </>
            ) : (
              // Hotel payment breakdown
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    ${booking.hotel?.price_per_night} × {booking.nights} night{booking.nights !== 1 ? 's' : ''}
                  </span>
                  <span className="dark:text-white">${(booking.hotel?.price_per_night * booking.nights).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Service fee</span>
                  <span className="dark:text-white">${(booking.hotel?.price_per_night * booking.nights * 0.1).toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-bold text-lg border-t dark:border-gray-700 pt-3">
              <span className="dark:text-white">Total Paid</span>
              <span className="text-[#FF690F]">${booking.totalPrice}</span>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-3">
              <p className="text-sm text-green-800 dark:text-green-200 font-semibold">
                ✓ Payment successful via {booking.paymentType}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/trips')}
            className="flex-1 bg-[#FF690F] hover:bg-[#d6570c] text-white py-3 rounded-md font-bold flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            View My Trips
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 py-3 rounded-md font-bold flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Receipt
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'My Booking Confirmation',
                  text: `Booking confirmed at ${booking.hotel.hotel_name}`,
                });
              }
            }}
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 py-3 px-6 rounded-md font-bold flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmation Email Notice */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            📧 A confirmation email has been sent to <strong>{(booking.passengerInfo || booking.guestInfo)?.email}</strong> with your booking details and receipt.
          </p>
        </div>
      </div>
    </div>
  );
}
