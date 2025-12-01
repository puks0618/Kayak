/**
 * Flight Results Page
 * Displays search results with filters matching Kayak's UI exactly
 */

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Menu, 
  Heart, 
  ArrowLeft,
  Clock,
  Plane,
  Check,
  ChevronDown,
  ChevronUp,
  Filter,
  Wifi,
  Monitor,
  Plug,
  UtensilsCrossed,
  Briefcase,
  Luggage,
  Armchair,
  Info,
  Star
} from 'lucide-react';
import { FaHeart } from 'react-icons/fa';
import { buildFareOptions, getFareAmenities } from '../utils/fareOptions';
import { updateSearchForm, searchFlights } from '../store/slices/flightsSlice';
import { AIRPORTS } from '../constants/airports';

// Airline color mapping
const getAirlineColor = (airline) => {
  const colors = {
    'American Airlines': 'bg-blue-600',
    'Delta': 'bg-red-600',
    'United': 'bg-blue-800',
    'Southwest': 'bg-orange-500',
    'JetBlue': 'bg-blue-500',
    'Alaska Airlines': 'bg-blue-900',
    'Spirit': 'bg-yellow-400',
    'Frontier': 'bg-green-600'
  };
  return colors[airline] || 'bg-gray-600';
};

// Aircraft type mapping by airline
const getAircraftType = (airline) => {
  const aircraft = {
    'American Airlines': ['Boeing 737', 'Boeing 777', 'Airbus A321', 'Boeing 787'],
    'Delta': ['Boeing 737', 'Airbus A320', 'Airbus A350', 'Boeing 757'],
    'United': ['Boeing 737', 'Boeing 777', 'Airbus A320', 'Boeing 787'],
    'Southwest': ['Boeing 737-700', 'Boeing 737-800', 'Boeing 737 MAX 8'],
    'JetBlue': ['Airbus A320', 'Airbus A321', 'Embraer E190'],
    'Alaska Airlines': ['Boeing 737-800', 'Boeing 737-900', 'Airbus A320'],
    'Spirit': ['Airbus A320', 'Airbus A321', 'Airbus A319'],
    'Frontier': ['Airbus A320', 'Airbus A321', 'Airbus A319']
  };
  const types = aircraft[airline] || ['Boeing 737'];
  return types[Math.floor(Math.random() * types.length)];
};

export default function FlightResults() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { results, returnFlights, isRoundTrip, isSearching, searchError, totalResults, searchForm } = useSelector(
    state => state.flights
  );

  // Edit panel state
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editOrigin, setEditOrigin] = useState(searchForm.origin || '');
  const [editDestination, setEditDestination] = useState(searchForm.destination || '');
  const [editDepartureDate, setEditDepartureDate] = useState(searchForm.departureDate || '');
  const [editReturnDate, setEditReturnDate] = useState(searchForm.returnDate || '');
  const [editAdults, setEditAdults] = useState(searchForm.adults || 1);
  const [editCabinClass, setEditCabinClass] = useState(searchForm.cabinClass || 'economy');

  // Autocomplete state
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');

  // Filter state
  const [stops, setStops] = useState({ nonstop: true, oneStop: true, twoPlus: true });
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [departureTime, setDepartureTime] = useState({ morning: true, afternoon: true, evening: true, night: true });
  const [sortBy, setSortBy] = useState('best');
  const [expandedFlight, setExpandedFlight] = useState(null);
  const [showAmenitiesPopup, setShowAmenitiesPopup] = useState(null);
  
  // Calculate min/max prices from results - using BASE/BASIC fare prices
  const prices = results.map(f => f.price || 0).filter(p => p > 0);
  const minPrice = prices.length > 0 ? Math.floor(Math.min(...prices)) : 0;
  const maxPrice = prices.length > 0 ? Math.ceil(Math.max(...prices)) : 10000;

  // Check if this is a deal click (has maxDealPrice parameter)
  useEffect(() => {
    const maxDealPrice = searchParams.get('maxDealPrice');
    if (maxDealPrice) {
      const dealPrice = parseInt(maxDealPrice);
      // Set price range to show flights around the deal price (±$50)
      const minDealPrice = Math.max(0, dealPrice - 50);
      const maxDealPriceRange = dealPrice + 50;
      setPriceRange([minDealPrice, maxDealPriceRange]);
    }
  }, [searchParams]);

  // Filter airports based on search
  const filteredOrigins = AIRPORTS.filter(airport => {
    const searchLower = originSearch.toLowerCase();
    return (
      airport.city.toLowerCase().includes(searchLower) ||
      airport.code.toLowerCase().includes(searchLower) ||
      airport.name.toLowerCase().includes(searchLower) ||
      (airport.state && airport.state.toLowerCase().includes(searchLower)) ||
      airport.country.toLowerCase().includes(searchLower) ||
      airport.fullLocation.toLowerCase().includes(searchLower)
    );
  });

  const filteredDestinations = AIRPORTS.filter(airport => {
    const searchLower = destSearch.toLowerCase();
    return (
      airport.city.toLowerCase().includes(searchLower) ||
      airport.code.toLowerCase().includes(searchLower) ||
      airport.name.toLowerCase().includes(searchLower) ||
      (airport.state && airport.state.toLowerCase().includes(searchLower)) ||
      airport.country.toLowerCase().includes(searchLower) ||
      airport.fullLocation.toLowerCase().includes(searchLower)
    );
  });

  // Handle search update
  const handleUpdateSearch = () => {
    if (!editOrigin || !editDestination) {
      alert('Please select both origin and destination');
      return;
    }

    const params = {
      origin: editOrigin,
      destination: editDestination,
      departureDate: editDepartureDate,
      returnDate: editReturnDate,
      adults: editAdults,
      cabinClass: editCabinClass
    };

    dispatch(updateSearchForm(params));
    dispatch(searchFlights(params));

    // Update URL with search parameters
    const urlParams = new URLSearchParams({
      origin: editOrigin,
      destination: editDestination,
      departureDate: editDepartureDate,
      adults: editAdults.toString(),
      cabinClass: editCabinClass
    });
    if (editReturnDate) {
      urlParams.set('returnDate', editReturnDate);
    }
    setSearchParams(urlParams);

    setShowEditPanel(false);
  };

  // Load search from URL params on mount
  useEffect(() => {
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const departureDate = searchParams.get('departureDate');
    const returnDate = searchParams.get('returnDate');
    const adults = searchParams.get('adults');
    const cabinClass = searchParams.get('cabinClass');

    if (origin && destination && departureDate) {
      // Update Redux state with URL params
      const params = {
        origin,
        destination,
        departureDate,
        returnDate: returnDate || '',
        adults: parseInt(adults) || 1,
        cabinClass: cabinClass || 'economy'
      };
      
      dispatch(updateSearchForm(params));
      
      // Update edit panel state
      setEditOrigin(origin);
      setEditDestination(destination);
      setEditDepartureDate(departureDate);
      setEditReturnDate(returnDate || '');
      setEditAdults(parseInt(adults) || 1);
      setEditCabinClass(cabinClass || 'economy');
      
      // Always trigger search when URL params are present
      dispatch(searchFlights(params));
    }
  }, []); // Run only on mount

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.origin-dropdown-container')) {
        setShowOriginDropdown(false);
      }
      if (!event.target.closest('.dest-dropdown-container')) {
        setShowDestDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format time from ISO string
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Format date - treat UTC timestamp as local time to avoid timezone shift
  const formatDate = (isoString) => {
    // Parse as UTC but display as-is (don't shift timezone)
    const date = new Date(isoString);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    
    // Create a new date in local timezone with same year/month/day
    const localDate = new Date(year, month, day);
    return localDate.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format duration
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };

  // Format price
  const formatPrice = (price) => {
    return `$${Math.round(price).toLocaleString()}`;
  };

  // Get unique airlines from results
  const airlines = [...new Set(results.map(f => f.airline || 'Unknown'))];

  // Filter flights based on selected filters
  let filteredFlights = results.filter(flight => {
    const flightStops = flight.stops ?? 0;
    const flightPrice = flight.price || 0;
    const flightAirline = flight.airline || 'Unknown';
    const departureDateTime = new Date(flight.departureTime || flight.departure_time);
    const departureHour = departureDateTime.getHours();

    const stopsMatch = 
      (stops.nonstop && flightStops === 0) ||
      (stops.oneStop && flightStops === 1) ||
      (stops.twoPlus && flightStops >= 2);

    const priceMatch = flightPrice >= priceRange[0] && flightPrice <= priceRange[1];
    const airlineMatch = selectedAirlines.length === 0 || selectedAirlines.includes(flightAirline);
    
    const timeMatch = 
      (departureTime.morning && departureHour >= 6 && departureHour < 12) ||
      (departureTime.afternoon && departureHour >= 12 && departureHour < 18) ||
      (departureTime.evening && departureHour >= 18 && departureHour < 24) ||
      (departureTime.night && departureHour >= 0 && departureHour < 6);

    return stopsMatch && priceMatch && airlineMatch && timeMatch;
  });

  // For round-trip searches, only show flights that have BOTH outbound and return flights
  if (searchForm.returnDate && isRoundTrip && returnFlights) {
    // Only show flights where we have a corresponding return flight
    filteredFlights = filteredFlights.filter((_, index) => returnFlights[index]);
  }

  // Sort flights
  const sortedFlights = [...filteredFlights].sort((a, b) => {
    if (sortBy === 'cheapest') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'quickest') return (a.duration || 0) - (b.duration || 0);
    const scoreA = (a.price || 0) + (a.duration || 0) * 2;
    const scoreB = (b.price || 0) + (b.duration || 0) * 2;
    return scoreA - scoreB;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Search Summary with Inline Edit Panel */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {searchForm.origin || 'Any'} → {searchForm.destination || 'Any'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {searchForm.departureDate || 'Flexible dates'} • {searchForm.adults} {searchForm.adults === 1 ? 'adult' : 'adults'} • {searchForm.cabinClass}
              </p>
            </div>
            <button 
              onClick={() => setShowEditPanel(!showEditPanel)}
              className="px-4 py-2 text-sm font-medium text-[#FF690F] hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
            >
              {showEditPanel ? 'Close' : 'Edit Search'}
            </button>
          </div>

          {/* Inline Edit Panel */}
          {showEditPanel && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Origin */}
                <div className="relative origin-dropdown-container">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
                  <input
                    type="text"
                    value={showOriginDropdown ? originSearch : editOrigin}
                    onChange={(e) => {
                      setOriginSearch(e.target.value);
                      if (!showOriginDropdown) setShowOriginDropdown(true);
                    }}
                    onClick={() => {
                      setShowOriginDropdown(true);
                      setOriginSearch('');
                    }}
                    placeholder="Origin (e.g., LAX)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF690F] focus:border-transparent dark:bg-gray-800 dark:text-white"
                  />
                  {showOriginDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto z-50">
                      {filteredOrigins.length > 0 ? (
                        filteredOrigins.map((airport) => (
                          <div
                            key={airport.code}
                            className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center"
                            onClick={() => {
                              setEditOrigin(airport.code);
                              setShowOriginDropdown(false);
                            }}
                          >
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{airport.city}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{airport.name}</div>
                            </div>
                            <span className="font-bold text-gray-400 dark:text-gray-500">{airport.code}</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No airports found</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Destination */}
                <div className="relative dest-dropdown-container">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
                  <input
                    type="text"
                    value={showDestDropdown ? destSearch : editDestination}
                    onChange={(e) => {
                      setDestSearch(e.target.value);
                      if (!showDestDropdown) setShowDestDropdown(true);
                    }}
                    onClick={() => {
                      setShowDestDropdown(true);
                      setDestSearch('');
                    }}
                    placeholder="Destination (e.g., SFO)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF690F] focus:border-transparent dark:bg-gray-800 dark:text-white"
                  />
                  {showDestDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto z-50">
                      {filteredDestinations.length > 0 ? (
                        filteredDestinations.map((airport) => (
                          <div
                            key={airport.code}
                            className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center"
                            onClick={() => {
                              setEditDestination(airport.code);
                              setShowDestDropdown(false);
                            }}
                          >
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{airport.city}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{airport.name}</div>
                            </div>
                            <span className="font-bold text-gray-400 dark:text-gray-500">{airport.code}</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No airports found</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Departure Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Departure</label>
                  <input
                    type="date"
                    value={editDepartureDate}
                    onChange={(e) => setEditDepartureDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF690F] focus:border-transparent dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Return Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Return (optional)</label>
                  <input
                    type="date"
                    value={editReturnDate}
                    onChange={(e) => setEditReturnDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF690F] focus:border-transparent dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Travelers */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Travelers</label>
                  <select
                    value={editAdults}
                    onChange={(e) => setEditAdults(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF690F] focus:border-transparent dark:bg-gray-800 dark:text-white"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'traveler' : 'travelers'}</option>
                    ))}
                  </select>
                </div>

                {/* Cabin Class */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cabin Class</label>
                  <select
                    value={editCabinClass}
                    onChange={(e) => setEditCabinClass(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF690F] focus:border-transparent dark:bg-gray-800 dark:text-white"
                  >
                    <option value="economy">Economy</option>
                    <option value="premium economy">Premium Economy</option>
                    <option value="business">Business</option>
                    <option value="first">First Class</option>
                  </select>
                </div>
              </div>

              {/* Update Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleUpdateSearch}
                  className="px-6 py-2 bg-[#FF690F] hover:bg-[#d6570c] text-white font-bold rounded-lg transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        
        {/* Filters Sidebar */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sticky top-24 space-y-6">
            
            {/* Price Range Filter */}
            <div>
              <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Price</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1] === 10000 ? 'Any' : priceRange[1]}</span>
                </div>
                <input
                  type="range"
                  min={minPrice}
                  max={maxPrice}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([minPrice, parseInt(e.target.value)])}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#FF690F]"
                />
              </div>
            </div>
            
            {/* Departure Time Filter */}
            <div>
              <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Departure Time</h3>
              <div className="space-y-2">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Morning</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">6am - 12pm</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={departureTime.morning}
                    onChange={(e) => setDepartureTime({...departureTime, morning: e.target.checked})}
                    className="w-4 h-4 accent-[#FF690F]"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Afternoon</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">12pm - 6pm</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={departureTime.afternoon}
                    onChange={(e) => setDepartureTime({...departureTime, afternoon: e.target.checked})}
                    className="w-4 h-4 accent-[#FF690F]"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Evening</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">6pm - 12am</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={departureTime.evening}
                    onChange={(e) => setDepartureTime({...departureTime, evening: e.target.checked})}
                    className="w-4 h-4 accent-[#FF690F]"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Night</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">12am - 6am</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={departureTime.night}
                    onChange={(e) => setDepartureTime({...departureTime, night: e.target.checked})}
                    className="w-4 h-4 accent-[#FF690F]"
                  />
                </label>
              </div>
            </div>
            
            {/* Stops Filter */}
            <div>
              <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Stops</h3>
              <div className="space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Nonstop</span>
                <input 
                  type="checkbox" 
                  checked={stops.nonstop}
                  onChange={(e) => setStops({...stops, nonstop: e.target.checked})}
                  className="w-4 h-4 accent-[#FF690F]"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-gray-900 dark:text-white">1 stop</span>
                <input 
                  type="checkbox" 
                  checked={stops.oneStop}
                  onChange={(e) => setStops({...stops, oneStop: e.target.checked})}
                  className="w-4 h-4 accent-[#FF690F]"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-gray-900 dark:text-white">2+ stops</span>
                <input 
                  type="checkbox" 
                  checked={stops.twoPlus}
                  onChange={(e) => setStops({...stops, twoPlus: e.target.checked})}
                  className="w-4 h-4 accent-[#FF690F]"
                />
              </label>
            </div>
          </div>

            {/* Airlines Filter */}
            {airlines.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Airlines</h3>
                <div className="space-y-2">
                  {airlines.slice(0, 6).map(airline => (
                    <label key={airline} className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate pr-2">{airline}</span>
                      <input 
                        type="checkbox" 
                        checked={selectedAirlines.includes(airline)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAirlines([...selectedAirlines, airline]);
                          } else {
                            setSelectedAirlines(selectedAirlines.filter(a => a !== airline));
                          }
                        }}
                        className="w-4 h-4 accent-[#FF690F] flex-shrink-0"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Column */}
        <div className="flex-1">
          
          {/* Sort Tabs */}
          <div className="bg-white rounded-t-lg border border-gray-200 flex mb-0">
            <button 
              onClick={() => setSortBy('cheapest')}
              className={`flex-1 py-3 px-4 text-sm font-semibold ${sortBy === 'cheapest' ? 'bg-green-100 text-gray-900' : 'text-gray-600 bg-white'}`}
            >
              Cheapest
            </button>
            <button 
              onClick={() => setSortBy('best')}
              className={`flex-1 py-3 px-4 text-sm font-semibold border-x border-gray-200 ${sortBy === 'best' ? 'bg-blue-100 text-gray-900' : 'text-gray-600 bg-white'}`}
            >
              Best
            </button>
            <button 
              onClick={() => setSortBy('quickest')}
              className={`flex-1 py-3 px-4 text-sm font-semibold ${sortBy === 'quickest' ? 'bg-blue-100 text-gray-900' : 'text-gray-600 bg-white'}`}
            >
              Quickest
            </button>
          </div>

          {/* Loading State */}
          {isSearching && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF690F]"></div>
                <p className="mt-4 text-gray-600">Searching for flights...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {searchError && !isSearching && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-800">Error: {searchError}</p>
            </div>
          )}

          {/* No Results */}
          {!isSearching && sortedFlights.length === 0 && !searchError && (
            <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
              <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No flights found</h2>
              <p className="text-gray-600">Try adjusting your filters</p>
            </div>
          )}

          {/* Flight Results */}
          {!isSearching && sortedFlights.length > 0 && (
            <div className="space-y-0">
              {sortedFlights.map((flight, index) => {
                const originCode = flight.origin?.code || flight.departure_airport || flight.origin || 'N/A';
                const destCode = flight.destination?.code || flight.arrival_airport || flight.destination || 'N/A';
                const departureTime = flight.departureTime || flight.departure_time;
                const arrivalTime = flight.arrivalTime || flight.arrival_time;
                const duration = flight.durationMinutes || flight.duration || 0;
                const stops = flight.stops ?? 0;
                const airline = flight.airline || 'Unknown';
                const flightNumber = flight.flightNumber || flight.flight_code || flight.id;
                const cabinClass = flight.cabinClass || flight.cabin_class || 'economy';
                const price = flight.price || 0;
                const isExpanded = expandedFlight === flight.id;
                const isCheapest = index === 0 && sortBy === 'cheapest';
                const isBest = index === 0 && sortBy === 'best';

                return (
                  <div 
                    key={flight.id}
                    className={`bg-white border-x border-gray-200 ${index === sortedFlights.length - 1 ? 'border-b rounded-b-lg' : 'border-b'}`}
                  >
                    {/* Save Button */}
                    <div className="px-5 pt-3 flex gap-2">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                        <FaHeart className="w-3 h-3" />
                        Save
                      </button>
                    </div>

                    {/* Main Flight Card - 3 Column Layout */}
                    <div className="px-5 py-4">
                      <div className="flex items-start gap-6">
                        
                        {/* LEFT COLUMN: Flight Summary (clickable to expand) */}
                        <div 
                          className={`flex-1 cursor-pointer rounded-lg p-4 transition-colors ${isExpanded ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                          onClick={() => setExpandedFlight(isExpanded ? null : flight.id)}
                        >
                          <div className="flex items-start gap-4">
                            {/* Airline Logo */}
                            <div className={`w-12 h-12 ${getAirlineColor(airline)} rounded flex items-center justify-center flex-shrink-0`}>
                              <span className="text-xs font-bold text-white">
                                {airline.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                              </span>
                            </div>

                            {/* Flight Times & Details */}
                            <div className="flex-1">
                              {/* Outbound Flight */}
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xl font-bold text-gray-900">
                                    {formatTime(departureTime)} – {formatTime(arrivalTime)}
                                  </p>
                                  <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <span>nonstop</span>
                                    <span>{formatDuration(duration)}</span>
                                  </div>
                                </div>
                                
                                {/* Airline name with rating */}
                                <div className="flex items-center gap-2 mb-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/flights/airlines/${encodeURIComponent(airline)}/reviews`);
                                    }}
                                    className="text-sm text-gray-600 hover:text-blue-600 hover:underline"
                                  >
                                    {airline}
                                  </button>
                                  
                                  {flight.airline_rating && flight.airline_rating > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                      <span className="text-sm font-medium text-gray-700">
                                        {parseFloat(flight.airline_rating).toFixed(1)}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        ({flight.airline_review_count} reviews)
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-800 text-xs rounded">
                                  {originCode}–{destCode}
                                </span>
                              </div>

                              {/* Return Flight (if round trip) */}
                              {searchForm.returnDate && returnFlights && returnFlights[index] && (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-xl font-bold text-gray-900">
                                      {formatTime(returnFlights[index].departure_time)} – {formatTime(returnFlights[index].arrival_time)}
                                    </p>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                      <span>nonstop</span>
                                      <span>{formatDuration(returnFlights[index].duration)}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Return airline name with rating */}
                                  <div className="flex items-center gap-2 mb-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/flights/airlines/${encodeURIComponent(returnFlights[index].airline)}/reviews`);
                                      }}
                                      className="text-sm text-gray-600 hover:text-blue-600 hover:underline"
                                    >
                                      {returnFlights[index].airline}
                                    </button>
                                    
                                    {returnFlights[index].airline_rating && returnFlights[index].airline_rating > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        <span className="text-sm font-medium text-gray-700">
                                          {parseFloat(returnFlights[index].airline_rating).toFixed(1)}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          ({returnFlights[index].airline_review_count} reviews)
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-800 text-xs rounded">
                                    {returnFlights[index].departure_airport}–{returnFlights[index].arrival_airport}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* MIDDLE: Badges */}
                        <div className="flex flex-col gap-2 items-center justify-start pt-4">
                          {isBest && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                              Best
                            </span>
                          )}
                          {isCheapest && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                              Cheapest
                            </span>
                          )}
                        </div>

                        {/* RIGHT COLUMN: Multiple Fare Options */}
                        <div className="flex gap-3 flex-shrink-0">
                          {buildFareOptions(price).map((fare) => {
                            const amenities = getFareAmenities(fare.code);
                            
                            return (
                              <div 
                                key={fare.code}
                                className="w-36 border border-gray-300 rounded-lg p-3 bg-white hover:border-gray-400 transition-colors"
                              >
                                {/* Price */}
                                <p className="text-2xl font-bold text-gray-900 text-center">
                                  {formatPrice(fare.price)}
                                </p>
                                
                                {/* Fare Label */}
                                <p className="text-xs text-gray-700 text-center mb-3">
                                  {fare.label}
                                </p>
                                
                                {/* Select Button */}
                                <button 
                                  className="w-full px-4 py-2 bg-[#FF690F] hover:bg-[#d6570c] text-white font-bold rounded text-sm transition-colors mb-3"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/flights/fare-selection', {
                                      state: {
                                        flight,
                                        fareCode: fare.code,
                                        farePrice: fare.price,
                                        searchForm
                                      }
                                    });
                                  }}
                                >
                                  Select
                                </button>
                                
                                {/* Divider */}
                                <div className="border-t border-gray-200 mb-3"></div>
                                
                                {/* Amenity Icons */}
                                <div className="flex items-center justify-center gap-2">
                                  {amenities.map((amenity, idx) => (
                                    <div key={idx} className="relative">
                                      {amenity.icon === '💼' && <Briefcase className={`w-4 h-4 ${amenity.included ? 'text-green-600' : 'text-gray-500'}`} />}
                                      {amenity.icon === '🧳' && <Luggage className={`w-4 h-4 ${amenity.included ? 'text-green-600' : 'text-gray-500'}`} />}
                                      {amenity.icon === '🪑' && <Armchair className={`w-4 h-4 ${amenity.included ? 'text-green-600' : 'text-gray-500'}`} />}
                                      
                                      {amenity.included ? (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                                          <Check className="w-2 h-2 text-white" strokeWidth={3} />
                                        </div>
                                      ) : (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white border-2 border-gray-400 rounded-full flex items-center justify-center">
                                          <span className="text-[7px] font-bold text-gray-600">$</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Flight Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50 px-5 py-5">
                        {/* Departure Flight */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-gray-900">
                              Depart • {formatDate(flight.departure_time)}
                            </h3>
                            <span className="text-sm text-gray-600">{formatDuration(duration)}</span>
                          </div>
                          
                          <div className="flex items-start gap-4">
                            {/* Airline Logo */}
                            <div className="w-12 h-12 bg-blue-900 rounded flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-white">{airline.substring(0, 2).toUpperCase()}</span>
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-4">
                                <p className="text-sm font-semibold text-gray-900">{airline} {flight.flight_number}</p>
                                <span className="text-xs text-gray-500">• Operated by {airline}</span>
                                <span className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs">{getAircraftType(airline)}</span>
                              </div>

                              {/* Flight Timeline */}
                              <div className="relative">
                                <div className="flex items-start gap-4 mb-6">
                                  <div className="flex flex-col items-center pt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                    <div className="w-px h-16 bg-gray-300"></div>
                                  </div>
                                  <div>
                                    <p className="text-base font-bold text-gray-900">{formatTime(departureTime)}</p>
                                    <p className="text-sm text-gray-600">{originCode}</p>
                                  </div>
                                </div>

                                <div className="flex items-start gap-4 mb-6">
                                  <div className="flex flex-col items-center">
                                    <Plane className="w-5 h-5 text-gray-600 rotate-90" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-700">{formatDuration(duration)}</p>
                                  </div>
                                </div>

                                <div className="flex items-start gap-4">
                                  <div className="flex flex-col items-center pt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                  </div>
                                  <div>
                                    <p className="text-base font-bold text-gray-900">{formatTime(arrivalTime)}</p>
                                    <p className="text-sm text-gray-600">{destCode}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Amenities Icons */}
                            <div className="flex flex-col gap-2 items-center">
                              <Wifi className="w-4 h-4 text-gray-600" />
                              <Monitor className="w-4 h-4 text-gray-600" />
                              <Plug className="w-4 h-4 text-gray-600" />
                              <UtensilsCrossed className="w-4 h-4 text-gray-600" />
                              <ChevronDown className="w-4 h-4 text-gray-600 cursor-pointer" />
                            </div>
                          </div>
                        </div>

                        {/* Return Flight */}
                        {searchForm.returnDate && returnFlights && returnFlights[index] && (
                          <div className="border-t border-gray-300 pt-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-base font-bold text-gray-900">
                                Return • {formatDate(returnFlights[index].departure_time)}
                              </h3>
                              <span className="text-sm text-gray-600">{formatDuration(returnFlights[index].duration)}</span>
                            </div>
                            
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 ${getAirlineColor(returnFlights[index].airline)} rounded flex items-center justify-center flex-shrink-0`}>
                                <span className="text-xs font-bold text-white">
                                  {returnFlights[index].airline.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-4">
                                  <p className="text-sm font-semibold text-gray-900">{returnFlights[index].airline} {returnFlights[index].flight_number}</p>
                                  <span className="text-xs text-gray-500">• Operated by {returnFlights[index].airline}</span>
                                  <span className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs">{getAircraftType(returnFlights[index].airline)}</span>
                                </div>

                                <div className="relative">
                                  <div className="flex items-start gap-4 mb-6">
                                    <div className="flex flex-col items-center pt-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                      <div className="w-px h-16 bg-gray-300"></div>
                                    </div>
                                    <div>
                                      <p className="text-base font-bold text-gray-900">{formatTime(returnFlights[index].departure_time)}</p>
                                      <p className="text-sm text-gray-600">{returnFlights[index].departure_airport}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-4 mb-6">
                                    <div className="flex flex-col items-center">
                                      <Plane className="w-5 h-5 text-gray-600 rotate-90" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-700">{formatDuration(returnFlights[index].duration)}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center pt-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                    </div>
                                    <div>
                                      <p className="text-base font-bold text-gray-900">{formatTime(returnFlights[index].arrival_time)}</p>
                                      <p className="text-sm text-gray-600">{returnFlights[index].arrival_airport}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 items-center">
                                <Wifi className="w-4 h-4 text-gray-600" />
                                <Monitor className="w-4 h-4 text-gray-600" />
                                <Plug className="w-4 h-4 text-gray-600" />
                                <UtensilsCrossed className="w-4 h-4 text-gray-600" />
                                <ChevronDown className="w-4 h-4 text-gray-600 cursor-pointer" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Price Summary */}
                        <div className="border-t border-gray-300 pt-4 flex items-center justify-end">
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-gray-900">{formatPrice(price)}</p>
                              <p className="text-xs text-gray-600">/ person</p>
                              <p className="text-xs font-semibold text-gray-900">{formatPrice(price * (searchForm.adults || 1))} total</p>
                            </div>
                            <button 
                              className="px-8 py-2 bg-[#FF690F] hover:bg-[#d6570c] text-white font-bold rounded text-sm transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Select
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
