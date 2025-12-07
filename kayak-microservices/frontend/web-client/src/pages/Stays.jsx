import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ChevronDown, 
  Search, 
  Calendar,
  MapPin,
  Users
} from 'lucide-react';
import { PiAirplaneTiltFill } from "react-icons/pi";
import { IoIosBed } from "react-icons/io";
import { IoCarSharp } from "react-icons/io5";
import { FaUmbrellaBeach } from "react-icons/fa6";
import { HiSparkles } from "react-icons/hi2";
import { 
  addRecentSearch
} from '../store/slices/staysSlice';
import { getPopularNeighborhoods } from '../services/staysApi';
import DateRangeCalendar from '../components/DateRangeCalendar';

export default function Stays() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const dispatch = useDispatch();
  
  // Redux state
  const { recentSearches } = useSelector(state => state.stays);
  
  // Local UI state
  const [location, setLocation] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(2);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  
  // Popular neighborhoods for autocomplete
  const popularNeighborhoods = getPopularNeighborhoods();
  
  // Filter neighborhoods based on input
  const filteredNeighborhoods = popularNeighborhoods.filter(city => 
    city.toLowerCase().includes(location.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLocationDropdown && !event.target.closest('.location-input-container')) {
        setShowLocationDropdown(false);
      }
      if (showGuestsDropdown && !event.target.closest('.guests-dropdown-container')) {
        setShowGuestsDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLocationDropdown, showGuestsDropdown]);

  // Format date for display
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    // Parse as local date to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]} ${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Handle date selection from calendar
  const handleDateSelection = (checkInDate, checkOutDate) => {
    // Format dates in local timezone to avoid timezone shift
    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    setCheckIn(formatLocalDate(checkInDate));
    setCheckOut(formatLocalDate(checkOutDate));
  };

  // Handle search submission
  const handleSearch = async () => {
    if (!location.trim()) {
      alert('Please enter a location');
      return;
    }

    // Extract just the neighborhood name (first part before comma)
    const neighborhood = location.split(',')[0].trim();

    // Save to recent searches
    dispatch(addRecentSearch({ cities: [location], checkIn, checkOut, rooms, guests }));

    // Navigate to search results page with query parameters
    const searchParams = new URLSearchParams({
      cities: neighborhood,
      checkIn: checkIn || '',
      checkOut: checkOut || '',
      rooms: rooms.toString(),
      guests: guests.toString()
    });

    navigate(`/stays/search?${searchParams.toString()}`);
  };

  // Load a recent search
  const loadRecentSearch = (search) => {
    setLocation(search.cities?.[0] || '');
    setCheckIn(search.checkIn || '');
    setCheckOut(search.checkOut || '');
    setRooms(search.rooms || 1);
    setGuests(search.guests || 2);
  };

  return (
    <main className="mt-4 md:mt-8">
      {/* Full-width gray background card */}
      <div className="w-full bg-[#edf0f3] dark:bg-gray-800 py-6 md:py-8">
        {/* Constrained content inside */}
        <div className="max-w-[1200px] mx-auto px-2 md:px-3 lg:px-4">
          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Search Interface */}
            <div className="lg:col-span-8">
              <h1 className="text-3xl md:text-5xl font-extrabold mb-8 leading-tight tracking-tight dark:text-white">
                Compare hotel deals from 100s of sites<span className="text-[#FF690F]">.</span>
              </h1>

              {/* Navigation Tabs */}
              <div className="flex flex-wrap gap-6 mb-6">
                <NavTab icon={<PiAirplaneTiltFill />} label="Flights" active={routerLocation.pathname === '/'} link="/" />
                <NavTab icon={<IoIosBed />} label="Stays" active={routerLocation.pathname === '/stays'} link="/stays" />
                <NavTab icon={<IoCarSharp />} label="Cars" active={routerLocation.pathname === '/cars'} link="/cars" />
                <NavTab icon={<FaUmbrellaBeach />} label="Packages" active={routerLocation.pathname === '/packages'} link="/packages" />
                <NavTab icon={<HiSparkles />} label="AI Mode" active={routerLocation.pathname === '/ai-mode'} link="/ai-mode" />
              </div>

              {/* Main Search Bar */}
              <div className="flex flex-col md:flex-row bg-gray-200 dark:bg-gray-700 p-[2px] md:p-[2px] rounded-xl shadow-sm md:shadow-none gap-[2px]">
                
                {/* Location Input */}
                <div className="location-input-container flex-[2] relative w-full md:w-auto">
                  <div className="bg-white dark:bg-gray-800 rounded-t-lg md:rounded-l-lg md:rounded-tr-none p-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => setShowLocationDropdown(true)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <label className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wide">
                        Location
                      </label>
                    </div>
                    <input
                      type="text"
                      placeholder="Select a city or neighborhood"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        setShowLocationDropdown(true);
                      }}
                      onFocus={() => setShowLocationDropdown(true)}
                      className="w-full border-0 outline-none bg-transparent text-gray-900 dark:text-white text-[15px] placeholder-gray-400 font-medium"
                    />
                  </div>
                  
                  {/* Location Dropdown */}
                  {showLocationDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-2xl z-30 border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          {location ? 'Matching locations' : 'Popular neighborhoods'}
                        </p>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto py-1">
                        {(location ? filteredNeighborhoods : popularNeighborhoods).map((city, idx) => {
                          const parts = city.split(',').map(p => p.trim());
                          const mainLocation = parts[0];
                          const subLocation = parts.slice(1).join(', ');
                          const isCity = parts.length === 3; // City format
                          const isAirport = city.includes('Airport') || city.match(/\b[A-Z]{3}\b/);
                          
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                setLocation(city);
                                setShowLocationDropdown(false);
                              }}
                              className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-start gap-3 transition-colors"
                            >
                              <div className="mt-0.5">
                                {isAirport ? (
                                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                  </svg>
                                ) : isCity ? (
                                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 dark:text-white text-[15px]">
                                  {mainLocation}
                                  {isAirport && city.match(/\b([A-Z]{3})\b/) && (
                                    <span className="ml-2 text-gray-500 dark:text-gray-400 text-sm font-normal">
                                      {city.match(/\b([A-Z]{3})\b/)[1]}
                                    </span>
                                  )}
                                </div>
                                {subLocation && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {subLocation}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Date Range */}
                <div className="flex-[1.5] w-full md:w-auto">
                  <div 
                    onClick={() => setShowCalendar(true)}
                    className="bg-white dark:bg-gray-800 p-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2 md:pl-2 w-full">
                      <Calendar className="w-5 h-5 text-gray-400 md:hidden" />
                      <span className="font-medium text-gray-900 dark:text-white text-[15px]">
                        {checkIn ? formatDateDisplay(checkIn) : 'Tue 12/30'}
                      </span>
                      <span className="text-gray-400">—</span>
                      <span className="font-medium text-gray-900 dark:text-white text-[15px]">
                        {checkOut ? formatDateDisplay(checkOut) : 'Tue 1/27'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rooms & Guests Dropdown */}
                <div className="guests-dropdown-container flex-1 w-full md:w-auto relative">
                  <div
                    onClick={() => setShowGuestsDropdown(!showGuestsDropdown)}
                    className="bg-white dark:bg-gray-800 rounded-b-lg md:rounded-none p-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center group transition-colors"
                  >
                    <div className="md:pl-2 flex-1 flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white text-[15px]">{rooms} room{rooms > 1 ? 's' : ''}, {guests} guest{guests > 1 ? 's' : ''}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showGuestsDropdown ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                    
                    {/* Guests & Rooms Dropdown Menu */}
                    {showGuestsDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-30 border border-gray-200 dark:border-gray-700 p-4 min-w-[280px]">
                        {/* Rooms */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Rooms
                          </label>
                          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRooms(Math.max(1, rooms - 1));
                              }}
                              className="w-8 h-8 rounded-full bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 flex items-center justify-center text-gray-700 dark:text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={rooms <= 1}
                            >
                              −
                            </button>
                            <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[40px] text-center">
                              {rooms}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRooms(Math.min(10, rooms + 1));
                              }}
                              className="w-8 h-8 rounded-full bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 flex items-center justify-center text-gray-700 dark:text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={rooms >= 10}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Guests */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Guests
                          </label>
                          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setGuests(Math.max(1, guests - 1));
                              }}
                              className="w-8 h-8 rounded-full bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 flex items-center justify-center text-gray-700 dark:text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={guests <= 1}
                            >
                              −
                            </button>
                            <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[40px] text-center">
                              {guests}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setGuests(Math.min(20, guests + 1));
                              }}
                              className="w-8 h-8 rounded-full bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 flex items-center justify-center text-gray-700 dark:text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={guests >= 20}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Done Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowGuestsDropdown(false);
                          }}
                          className="w-full bg-[#FF690F] hover:bg-[#e85d0a] text-white py-2 rounded-lg font-medium transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </div>

                {/* Search Button */}
                <div className="bg-[#FF690F] hover:bg-[#d6570c] md:rounded-r-lg md:rounded-l-none rounded-lg md:w-[70px] flex items-center justify-center transition-colors cursor-pointer p-3 md:p-0 mt-[2px] md:mt-0" onClick={handleSearch}>
                  <Search className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Recent Searches</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentSearches.map((search, idx) => (
                      <div
                        key={idx}
                        onClick={() => loadRecentSearch(search)}
                        className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-shadow border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white mb-2">
                          <MapPin className="w-4 h-4 text-[#FF690F]" />
                          {search.cities?.join(', ')}
                        </div>
                        {search.checkIn && search.checkOut && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {search.checkIn} → {search.checkOut}
                          </div>
                        )}
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {search.rooms} room(s), {search.guests} guest(s)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Image Grid */}
            <div className="lg:col-span-4 hidden lg:block">
              <div className="grid grid-cols-2 gap-3 h-full max-h-[380px]">
                <div className="col-span-1 row-span-1 overflow-hidden rounded-xl relative group cursor-pointer">
                  <img 
                    src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop" 
                    alt="Hotel Exterior" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="col-span-1 overflow-hidden rounded-xl relative group cursor-pointer">
                  <img 
                    src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop" 
                    alt="Hotel Room" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="col-span-1 overflow-hidden rounded-xl relative group cursor-pointer">
                  <img 
                    src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop" 
                    alt="Hotel Lobby" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="col-span-1 row-span-2 overflow-hidden rounded-xl relative group -mt-12 cursor-pointer">
                  <img 
                    src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800&auto=format&fit=crop" 
                    alt="Luxury Hotel" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="col-span-1 overflow-hidden rounded-xl relative group h-24 cursor-pointer">
                  <img 
                    src="https://images.unsplash.com/photo-1563911892437-1feda0179e1b?q=80&w=800&auto=format&fit=crop" 
                    alt="Hotel Pool" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Calendar Modal */}
      {showCalendar && (
        <DateRangeCalendar
          checkIn={checkIn}
          checkOut={checkOut}
          onSelect={handleDateSelection}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </main>
  );
}

// Navigation Tab Component
function NavTab({ icon, label, active, link }) {
  const navigate = useNavigate();
  
  return (
    <div 
      className="flex flex-col items-center gap-1.5 cursor-pointer select-none"
      onClick={() => link && navigate(link)}
    >
      <div className={`
        w-14 h-14 rounded-lg flex items-center justify-center shadow-sm transition-all
        ${active ? 'bg-[#FF690F] text-white' : 'bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-200 dark:border-gray-600'}
      `}>
        <div className="text-2xl">
          {icon}
        </div>
      </div>
      <span className={`font-medium text-xs ${active ? 'text-[#FF690F]' : 'text-gray-900 dark:text-white'}`}>
        {label}
      </span>
    </div>
  );
}
