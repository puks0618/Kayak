/**
 * Flight Results Page
 * Displays search results with filters matching Kayak's UI exactly
 */

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  ShoppingBag,
  Info,
  Share2
} from 'lucide-react';
import { FaHeart, FaShareAlt } from 'react-icons/fa';
import kayakLogo from "../assets/images/kayak logo.png";

export default function FlightResults() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { results, isSearching, searchError, totalResults, searchForm } = useSelector(
    state => state.flights
  );

  // Filter state
  const [stops, setStops] = useState({ nonstop: true, oneStop: true, twoPlus: true });
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [sortBy, setSortBy] = useState('best');
  const [expandedFlight, setExpandedFlight] = useState(null);
  const [showAmenitiesPopup, setShowAmenitiesPopup] = useState(null);

  // Format time from ISO string
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Format date
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
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
  const filteredFlights = results.filter(flight => {
    const flightStops = flight.stops ?? 0;
    const flightPrice = flight.price || 0;
    const flightAirline = flight.airline || 'Unknown';

    const stopsMatch = 
      (stops.nonstop && flightStops === 0) ||
      (stops.oneStop && flightStops === 1) ||
      (stops.twoPlus && flightStops >= 2);

    const priceMatch = flightPrice >= priceRange[0] && flightPrice <= priceRange[1];
    const airlineMatch = selectedAirlines.length === 0 || selectedAirlines.includes(flightAirline);

    return stopsMatch && priceMatch && airlineMatch;
  });

  // Sort flights
  const sortedFlights = [...filteredFlights].sort((a, b) => {
    if (sortBy === 'cheapest') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'quickest') return (a.duration || 0) - (b.duration || 0);
    const scoreA = (a.price || 0) + (a.duration || 0) * 2;
    const scoreB = (b.price || 0) + (b.duration || 0) * 2;
    return scoreA - scoreB;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            className="p-1 hover:bg-gray-100 rounded"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="h-8 w-32 overflow-hidden relative flex items-center">
            <img 
              src={kayakLogo} 
              alt="KAYAK" 
              className="w-full h-full object-contain object-left"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Heart className="w-5 h-5 text-gray-700" />
          </button>
          <button className="p-1">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-semibold text-sm">
              K
            </div>
          </button>
        </div>
      </header>

      {/* Search Summary */}
      <div className="bg-white border-b border-gray-200 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {searchForm.origin || 'Any'} → {searchForm.destination || 'Any'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {searchForm.departureDate || 'Flexible dates'} • {searchForm.adults} {searchForm.adults === 1 ? 'adult' : 'adults'} • {searchForm.cabinClass}
              </p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-medium text-[#FF690F] hover:bg-orange-50 rounded-lg transition-colors"
            >
              Edit Search
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        
        {/* Filters Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-24">
            <h3 className="font-bold text-lg mb-4">Stops</h3>

            {/* Stops Filter */}
            <div className="mb-6">
              <label className="flex items-center justify-between mb-2 cursor-pointer">
                <span className="text-sm">Nonstop</span>
                <input 
                  type="checkbox" 
                  checked={stops.nonstop}
                  onChange={(e) => setStops({...stops, nonstop: e.target.checked})}
                  className="w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between mb-2 cursor-pointer">
                <span className="text-sm">1 stop</span>
                <input 
                  type="checkbox" 
                  checked={stops.oneStop}
                  onChange={(e) => setStops({...stops, oneStop: e.target.checked})}
                  className="w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">2+ stops</span>
                <input 
                  type="checkbox" 
                  checked={stops.twoPlus}
                  onChange={(e) => setStops({...stops, twoPlus: e.target.checked})}
                  className="w-4 h-4"
                />
              </label>
            </div>

            {/* Airlines Filter */}
            {airlines.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-4">Airlines</h3>
                {airlines.slice(0, 5).map(airline => (
                  <label key={airline} className="flex items-center justify-between mb-2 cursor-pointer">
                    <span className="text-sm">{airline}</span>
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
                      className="w-4 h-4"
                    />
                  </label>
                ))}
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
                    {/* Save and Share Buttons */}
                    <div className="px-5 pt-3 flex gap-2">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-xs font-medium hover:bg-gray-50">
                        <FaHeart className="w-3 h-3" />
                        Save
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-xs font-medium hover:bg-gray-50">
                        <FaShareAlt className="w-3 h-3" />
                        Share
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
                            <div className="w-12 h-12 bg-red-600 rounded flex items-center justify-center flex-shrink-0">
                              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                              </svg>
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
                                    <span>{stops === 0 ? 'nonstop' : `${stops} stop`}</span>
                                    <span>{formatDuration(duration)}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">{airline}</p>
                                <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-800 text-xs rounded">
                                  {originCode}–{destCode}
                                </span>
                              </div>

                              {/* Return Flight (if round trip) */}
                              {searchForm.returnDate && (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-xl font-bold text-gray-900">
                                      9:30 am – 1:17 pm
                                    </p>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                      <span>nonstop</span>
                                      <span>6h 47m</span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-1">{airline}</p>
                                  <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-800 text-xs rounded">
                                    JFK–{originCode}
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

                        {/* RIGHT COLUMN: Price & Select */}
                        <div className="w-72 flex-shrink-0 text-right">
                          <p className="text-3xl font-bold text-gray-900">
                            {formatPrice(price)}
                          </p>
                          <p className="text-sm text-gray-600">/ person</p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            {formatPrice(price * (searchForm.adults || 1))} total
                          </p>
                          <p className="text-sm text-gray-700 mt-1">Delta Comfort Classic</p>
                          
                          {/* Amenities Icons */}
                          <div className="flex items-center justify-end gap-3 mt-3 mb-3 relative">
                            <div 
                              className="flex items-center gap-3 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowAmenitiesPopup(showAmenitiesPopup === flight.id ? null : flight.id);
                              }}
                            >
                              <div className="relative">
                                <Briefcase className="w-5 h-5 text-gray-600" />
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                              </div>
                              <div className="relative">
                                <ShoppingBag className="w-5 h-5 text-gray-600" />
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white border-2 border-gray-600 rounded-full flex items-center justify-center">
                                  <span className="text-[9px] font-bold text-gray-600">$</span>
                                </div>
                              </div>
                              <div className="relative">
                                <UtensilsCrossed className="w-5 h-5 text-gray-600" />
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                              </div>
                            </div>

                            {/* Amenities Popup */}
                            {showAmenitiesPopup === flight.id && (
                              <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 w-72">
                                <div className="space-y-2.5">
                                  <div className="flex items-start gap-2.5">
                                    <Wifi className="w-4 h-4 text-gray-700 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-medium text-gray-900">Streaming capable Wi-Fi</p>
                                      <p className="text-xs text-gray-600">(fee)</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2.5">
                                    <Monitor className="w-4 h-4 text-gray-700 flex-shrink-0" />
                                    <p className="text-xs font-medium text-gray-900">Streaming entertainment</p>
                                  </div>
                                  <div className="flex items-center gap-2.5">
                                    <Plug className="w-4 h-4 text-gray-700 flex-shrink-0" />
                                    <p className="text-xs font-medium text-gray-900">Power & USB outlets</p>
                                  </div>
                                  <div className="flex items-center gap-2.5">
                                    <UtensilsCrossed className="w-4 h-4 text-gray-700 flex-shrink-0" />
                                    <p className="text-xs font-medium text-gray-900">Lunch provided</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <button 
                            className="w-full px-6 py-2.5 bg-[#FF690F] hover:bg-[#d6570c] text-white font-bold rounded text-sm transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Flight Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50 px-5 py-5">
                        {/* Departure Flight */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-gray-900">Depart • Thu, Dec 4</h3>
                            <span className="text-sm text-gray-600">{formatDuration(duration)}</span>
                          </div>
                          
                          <div className="flex items-start gap-4">
                            {/* Airline Logo */}
                            <div className="w-12 h-12 bg-blue-900 rounded flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-white">AS</span>
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-4">
                                <p className="text-sm font-semibold text-gray-900">Alaska Airlines 292</p>
                                <span className="text-xs text-gray-500">• Operated by Alaska</span>
                                <span className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs">Boeing 737 MAX 9</span>
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
                                    <p className="text-sm text-gray-600">San Francisco (SFO)</p>
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
                                    <p className="text-sm text-gray-600">Newark (EWR)</p>
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
                        {searchForm.returnDate && (
                          <div className="border-t border-gray-300 pt-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-base font-bold text-gray-900">Return • Thu, Dec 11</h3>
                              <span className="text-sm text-gray-600">6h 47m</span>
                            </div>
                            
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-blue-900 rounded flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-white">AS</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-4">
                                  <p className="text-sm font-semibold text-gray-900">Alaska Airlines 114</p>
                                  <span className="text-xs text-gray-500">• Operated by Alaska</span>
                                  <span className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs">Boeing 737 MAX 9</span>
                                </div>

                                <div className="relative">
                                  <div className="flex items-start gap-4 mb-6">
                                    <div className="flex flex-col items-center pt-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                      <div className="w-px h-16 bg-gray-300"></div>
                                    </div>
                                    <div>
                                      <p className="text-base font-bold text-gray-900">9:30 am</p>
                                      <p className="text-sm text-gray-600">New York John F Kennedy Intl (JFK)</p>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-4 mb-6">
                                    <div className="flex flex-col items-center">
                                      <Plane className="w-5 h-5 text-gray-600 rotate-90" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-700">6h 47m</p>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center pt-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                    </div>
                                    <div>
                                      <p className="text-base font-bold text-gray-900">1:17 pm</p>
                                      <p className="text-sm text-gray-600">San Francisco (SFO)</p>
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
                        <div className="border-t border-gray-300 pt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-700">4 deals from</span>
                          </div>
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
