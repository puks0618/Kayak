import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Calendar, MapPin, Users, ChevronRight, Search } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function MyTrips() {
  const navigate = useNavigate();
  const authState = useSelector((state) => state.auth || {});
  const user = authState.user;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, past
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // Get bookings from localStorage for now (MVP)
      const storedBookings = localStorage.getItem('userBookings');
      if (storedBookings) {
        setBookings(JSON.parse(storedBookings));
      }
      
      // TODO: Fetch from backend when API is ready
      // if (user) {
      //   const response = await axios.get(`${API_BASE_URL}/bookings/user/${user.id}`);
      //   setBookings(response.data);
      // }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
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
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkOutDate < today) {
      return { status: 'completed', label: 'Completed', color: 'bg-gray-500' };
    } else if (checkInDate <= today && checkOutDate >= today) {
      return { status: 'active', label: 'Active', color: 'bg-green-500' };
    } else {
      return { status: 'upcoming', label: 'Upcoming', color: 'bg-blue-500' };
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (!booking || !booking.hotel) return false;
    
    const { status } = getBookingStatus(booking);
    const matchesFilter = filter === 'all' || 
                         (filter === 'upcoming' && status === 'upcoming') ||
                         (filter === 'past' && status === 'completed');
    
    const hotelName = booking.hotel.hotel_name || '';
    const city = booking.hotel.city || '';
    const matchesSearch = hotelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         city.toLowerCase().includes(searchQuery.toLowerCase());
    
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
              
              return (
                <div
                  key={booking.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/booking/${booking.id}`, { state: { booking } })}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Hotel Image */}
                    <div className="md:w-64 h-48 md:h-auto">
                      <img
                        src={booking.hotel.picture_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                        alt={booking.hotel.hotel_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';
                        }}
                      />
                    </div>

                    {/* Booking Details */}
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-xl font-bold mb-1 dark:text-white">
                            {booking.hotel.hotel_name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {booking.hotel.neighbourhood_cleansed}, {booking.hotel.city}
                          </p>
                        </div>
                        <span className={`${bookingStatus.color} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                          {bookingStatus.label}
                        </span>
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
                            {booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Booking ID</p>
                          <p className="font-mono text-sm font-semibold dark:text-white">{booking.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
                          <p className="text-xl font-bold text-[#FF690F]">${booking.totalPrice}</p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-gray-400" />
                      </div>
                    </div>
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
