import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Calendar, MapPin, Users, ChevronRight, Search, Car, Hotel, X } from 'lucide-react';
import { getUserBookings, cancelUserBooking } from '../utils/userStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function MyTrips() {
  const navigate = useNavigate();
  const authState = useSelector((state) => state.auth || {});
  const user = authState.user;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, past
  const [bookingType, setBookingType] = useState('all'); // all, flight, hotel, car
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to get passenger/guest count (handles both number and object formats)
  const getCount = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null) {
      // Handle {adults: 1, children: 0, infants: 0} structure
      return (value.adults || 0) + (value.children || 0) + (value.infants || 0);
    }
    return 0;
  };

  // Helper function to get airline code from airline name
  const getAirlineCode = (airlineName) => {
    if (!airlineName) return 'XX';
    
    // Normalize airline name for matching
    const normalized = airlineName.trim();
    
    const airlineMap = {
      'Delta': 'DL',
      'Delta Air Lines': 'DL',
      'American Airlines': 'AA',
      'American': 'AA',
      'United': 'UA',
      'United Airlines': 'UA',
      'Southwest': 'WN',
      'Southwest Airlines': 'WN',
      'JetBlue': 'B6',
      'JetBlue Airways': 'B6',
      'Alaska': 'AS',
      'Alaska Airlines': 'AS',
      'Spirit': 'NK',
      'Spirit Airlines': 'NK',
      'Frontier': 'F9',
      'Frontier Airlines': 'F9'
    };
    
    return airlineMap[normalized] || normalized.substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Handle both user.id and user.user_id formats from auth
      const userId = user?.id || user?.user_id;
      
      // Fetch from backend API first
      if (userId) {
        console.log('📂 Fetching bookings for user:', userId);
        try {
          const response = await fetch(`${API_BASE_URL}/bookings/user/${userId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Fetched bookings from API:', data.length);
            // Transform backend data to match frontend format
            const transformedBookings = data.map(booking => ({
              id: booking.id,
              type: booking.listing_type,
              travel_date: booking.travel_date,
              return_date: booking.return_date,
              status: booking.status,
              total_amount: booking.total_amount,
              listing_id: booking.listing_id,
              rental_days: booking.rental_days,
              // Set dates for compatibility
              pickupDate: booking.travel_date,
              dropoffDate: booking.return_date,
              checkIn: booking.travel_date,
              checkOut: booking.return_date,
              // Will need to fetch listing details separately if needed
              outboundFlight: booking.listing_type === 'flight' ? { 
                departure_time: booking.travel_date 
              } : null,
              car: booking.listing_type === 'car' ? { 
                brand: 'Car', 
                model: booking.listing_id 
              } : null,
              hotel: booking.listing_type === 'hotel' ? { 
                hotel_name: 'Hotel', 
                city: 'City' 
              } : null
            }));
            setBookings(transformedBookings);
          } else {
            console.error('Failed to fetch bookings:', response.statusText);
            // Fallback to localStorage if API fails
            const userBookings = getUserBookings(userId);
            console.log('📚 Fallback to localStorage:', userBookings.length);
            setBookings(userBookings);
          }
        } catch (apiError) {
          console.error('API error, falling back to localStorage:', apiError);
          const userBookings = getUserBookings(userId);
          console.log('📚 Fallback to localStorage:', userBookings.length);
          setBookings(userBookings);
        }
      } else {
        console.warn('⚠️ No user ID found, cannot load bookings');
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (booking) => {
    if (!booking || booking.status === 'cancelled' || booking.status === 'completed') {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel this ${booking.type} booking?`
    );

    if (!confirmed) return;

    try {
      const userId = user?.id || user?.user_id;
      if (!userId) {
        alert('User not found. Please log in again.');
        return;
      }

      // Update localStorage
      const bookingIdToCancel = booking.bookingId || booking.booking_id || booking.id;
      console.log('🚫 Cancelling booking:', bookingIdToCancel);
      cancelUserBooking(userId, bookingIdToCancel);

      // TODO: Call backend API to cancel booking when available
      // await axios.post(`${API_BASE_URL}/bookings/cancel`, { bookingId: bookingIdToCancel });

      // Refresh bookings list
      fetchBookings();
      alert('Booking cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getBookingStatus = (booking) => {
    // Check if booking is cancelled first
    if (booking.status === 'cancelled') {
      return { status: 'cancelled', label: 'Cancelled', color: 'bg-red-500' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (booking.type === 'flight') {
      // For round-trip, check return flight departure date; for one-way, check outbound
      const relevantFlight = booking.returnFlight || booking.outboundFlight;
      const departureDate = new Date(relevantFlight?.departure_time || relevantFlight?.departureTime);
      departureDate.setHours(0, 0, 0, 0);
      
      if (departureDate < today) {
        return { status: 'completed', label: 'Completed', color: 'bg-gray-500' };
      } else {
        return { status: 'upcoming', label: 'Upcoming', color: 'bg-blue-500' };
      }
    } else if (booking.type === 'car') {
      // Car booking
      const pickupDate = new Date(booking.pickupDate);
      pickupDate.setHours(0, 0, 0, 0);
      const dropoffDate = new Date(booking.dropoffDate);
      dropoffDate.setHours(0, 0, 0, 0);

      if (dropoffDate < today) {
        return { status: 'completed', label: 'Completed', color: 'bg-gray-500' };
      } else if (pickupDate <= today && dropoffDate >= today) {
        return { status: 'active', label: 'Active', color: 'bg-green-500' };
      } else {
        return { status: 'upcoming', label: 'Upcoming', color: 'bg-blue-500' };
      }
    } else {
      // Hotel booking
      const checkInDate = new Date(booking.checkIn);
      checkInDate.setHours(0, 0, 0, 0);
      const checkOutDate = new Date(booking.checkOut);
      checkOutDate.setHours(0, 0, 0, 0);

      if (checkOutDate < today) {
        return { status: 'completed', label: 'Completed', color: 'bg-gray-500' };
      } else if (checkInDate <= today && checkOutDate >= today) {
        return { status: 'active', label: 'Active', color: 'bg-green-500' };
      } else {
        return { status: 'upcoming', label: 'Upcoming', color: 'bg-blue-500' };
      }
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (!booking) return false;
    
    // Filter by booking type
    if (bookingType !== 'all' && booking.type !== bookingType) return false;
    
    const { status } = getBookingStatus(booking);
    const matchesFilter = filter === 'all' || 
                         (filter === 'upcoming' && status === 'upcoming') ||
                         (filter === 'past' && status === 'completed');
    
    // Search logic for all types (flight, hotel, car)
    let matchesSearch = false;
    if (booking.type === 'flight') {
      const airline = booking.outboundFlight?.airline || '';
      const origin = booking.outboundFlight?.departure_airport || booking.outboundFlight?.origin || '';
      const destination = booking.outboundFlight?.arrival_airport || booking.outboundFlight?.destination || '';
      matchesSearch = airline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     destination.toLowerCase().includes(searchQuery.toLowerCase());
    } else if (booking.type === 'car') {
      const carName = `${booking.car.brand} ${booking.car.model}`;
      const location = booking.pickupLocation || '';
      matchesSearch = carName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     location.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      // Hotel booking
      const hotelName = booking.hotel?.hotel_name || '';
      const city = booking.hotel?.city || '';
      matchesSearch = hotelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     city.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 dark:text-white">My Trips</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage your bookings
          </p>
        </div>

        {/* Booking Type Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setBookingType('all')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              bookingType === 'all'
                ? 'bg-[#FF690F] text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setBookingType('flight')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              bookingType === 'flight'
                ? 'bg-[#FF690F] text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            ✈️ Flights
          </button>
          <button
            onClick={() => setBookingType('hotel')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              bookingType === 'hotel'
                ? 'bg-[#FF690F] text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            🏨 Stays
          </button>
          <button
            onClick={() => setBookingType('car')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              bookingType === 'car'
                ? 'bg-[#FF690F] text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            🚗 Cars
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by hotel or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-[#FF690F] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  filter === 'upcoming'
                    ? 'bg-[#FF690F] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('past')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  filter === 'past'
                    ? 'bg-[#FF690F] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Past
              </button>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#FF690F] border-t-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your trips...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 dark:text-white">No trips found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery ? 'Try adjusting your search' : 'Start planning your next adventure!'}
            </p>
            <button
              onClick={() => navigate('/stays/search')}
              className="px-6 py-3 bg-[#FF690F] text-white rounded-md hover:bg-[#d6570c] font-bold"
            >
              Search Hotels
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const bookingStatus = getBookingStatus(booking);
              const isCarBooking = booking.type === 'car';
              
              return (
                <div
                  key={booking.id}
                  onClick={() => {
                    // Navigate to booking success page with booking data
                    navigate('/booking/success', { state: { booking } });
                  }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row">
                    {booking.type === 'flight' ? (
                      // Flight Booking Card
                      <>
                        {/* Flight Airline Logo */}
                        <div className="md:w-64 h-48 md:h-auto bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-2">
                              <span className="text-3xl font-bold">{getAirlineCode(booking.outboundFlight?.airline)}</span>
                            </div>
                            <p className="text-sm font-semibold">{booking.outboundFlight?.airline}</p>
                          </div>
                        </div>

                        {/* Flight Details */}
                        <div className="flex-1 p-6">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-xl font-bold mb-1 dark:text-white">
                                {booking.outboundFlight?.departure_airport || booking.outboundFlight?.origin} → {booking.outboundFlight?.arrival_airport || booking.outboundFlight?.destination}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400">
                                {booking.returnFlight ? 'Round-trip' : 'One-way'} • {getCount(booking.passengers)} passenger{getCount(booking.passengers) !== 1 ? 's' : ''}
                              </p>
                            </div>
                            {booking.status !== 'cancelled' && (
                              <span className={`${bookingStatus.color} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                                {bookingStatus.label}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-1">
                                <Calendar className="w-4 h-4" />
                                Departure
                              </p>
                              <p className="font-semibold dark:text-white">{formatDate(booking.outboundFlight?.departure_time || booking.outboundFlight?.departureTime)}</p>
                            </div>
                            {booking.returnFlight && (
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-1">
                                  <Calendar className="w-4 h-4" />
                                  Return
                                </p>
                                <p className="font-semibold dark:text-white">{formatDate(booking.returnFlight?.departure_time || booking.returnFlight?.departureTime)}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Booking ID</p>
                              <p className="font-mono text-sm font-semibold dark:text-white">{booking.id}</p>
                            </div>
                            <div className="text-right">
                              {booking.status === 'cancelled' ? (
                                <>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                                  <p className="text-xl font-bold text-red-500">Cancelled</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
                                  <p className="text-xl font-bold text-[#FF690F]">${booking.totalPrice}</p>
                                </>
                              )}
                            </div>
                            {bookingStatus.status === 'upcoming' && booking.status !== 'cancelled' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelBooking(booking);
                                }}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    ) : booking.type === 'car' ? (
                      // Car Booking Card
                      <>
                        {/* Car Image */}
                        <div className="md:w-64 h-48 md:h-auto relative">
                          <img
                            src={booking.car?.image_url || 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400'}
                            alt={`${booking.car?.brand} ${booking.car?.model}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400';
                            }}
                          />
                          <div className="absolute top-2 left-2 bg-white dark:bg-gray-800 p-2 rounded-full">
                            <Car className="w-5 h-5 text-[#FF690F]" />
                          </div>
                        </div>

                        {/* Car Details */}
                        <div className="flex-1 p-6">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-xl font-bold mb-1 dark:text-white">
                                {booking.car?.brand} {booking.car?.model} {booking.car?.year}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {booking.pickupLocation}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                {booking.car?.company_name} • {booking.car?.type} • {booking.car?.transmission}
                              </p>
                            </div>
                            {booking.status !== 'cancelled' && (
                              <span className={`${bookingStatus.color} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                                {bookingStatus.label}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-1">
                                <Calendar className="w-4 h-4" />
                                Pick-up
                              </p>
                              <p className="font-semibold dark:text-white">{formatDate(booking.pickupDate)}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-500">{booking.pickupTime}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-1">
                                <Calendar className="w-4 h-4" />
                                Drop-off
                              </p>
                              <p className="font-semibold dark:text-white">{formatDate(booking.dropoffDate)}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-500">{booking.dropoffTime}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Duration
                              </p>
                              <p className="font-semibold dark:text-white">
                                {booking.days} {booking.days === 1 ? 'Day' : 'Days'}
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Booking ID</p>
                              <p className="font-mono text-sm font-semibold dark:text-white">{booking.id}</p>
                            </div>
                            <div className="text-right">
                              {booking.status === 'cancelled' ? (
                                <>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                                  <p className="text-xl font-bold text-red-500">Cancelled</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
                                  <p className="text-xl font-bold text-[#FF690F]">${parseFloat(booking.totalPrice).toFixed(2)}</p>
                                </>
                              )}
                            </div>
                            {bookingStatus.status === 'upcoming' && booking.status !== 'cancelled' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelBooking(booking);
                                }}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      // Hotel Booking Card
                      <>
                        {/* Hotel Image */}
                        <div className="md:w-64 h-48 md:h-auto">
                          <img
                            src={booking.hotel?.picture_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                            alt={booking.hotel?.hotel_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';
                            }}
                          />
                        </div>

                        {/* Hotel Details */}
                        <div className="flex-1 p-6">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-xl font-bold mb-1 dark:text-white">
                                {booking.hotel?.hotel_name}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {booking.hotel?.neighbourhood_cleansed}, {booking.hotel?.city}
                              </p>
                            </div>
                            {booking.status !== 'cancelled' && (
                              <span className={`${bookingStatus.color} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                                {bookingStatus.label}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-1">
                                <Calendar className="w-4 h-4" />
                                Check-in
                              </p>
                              <p className="font-semibold dark:text-white">{formatDate(booking.checkIn)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-1">
                                <Calendar className="w-4 h-4" />
                                Check-out
                              </p>
                              <p className="font-semibold dark:text-white">{formatDate(booking.checkOut)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-1">
                                <Users className="w-4 h-4" />
                                Guests
                              </p>
                              <p className="font-semibold dark:text-white">
                                {getCount(booking.guests)} {getCount(booking.guests) === 1 ? 'Guest' : 'Guests'}
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Booking ID</p>
                              <p className="font-mono text-sm font-semibold dark:text-white">{booking.id}</p>
                            </div>
                            <div className="text-right">
                              {booking.status === 'cancelled' ? (
                                <>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                                  <p className="text-xl font-bold text-red-500">Cancelled</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
                                  <p className="text-xl font-bold text-[#FF690F]">${parseFloat(booking.totalPrice).toFixed(2)}</p>
                                </>
                              )}
                            </div>
                            {bookingStatus.status === 'upcoming' && booking.status !== 'cancelled' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelBooking(booking);
                                }}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
