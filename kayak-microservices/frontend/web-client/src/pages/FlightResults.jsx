/**
 * Flight Results Page
 * Displays search results with filters
 */

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Heart, 
  ArrowLeft,
  Clock,
  Plane,
  Check
} from 'lucide-react';
import kayakLogo from "../assets/images/kayak logo.png";

export default function FlightResults() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { results, isSearching, searchError, totalResults, searchForm } = useSelector(
    state => state.flights
  );

  // Format time from ISO string
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Format duration
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format price
  const formatPrice = (price) => {
    return `$${Math.round(price)}`;
  };

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
              S
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
      <div className="max-w-7xl mx-auto px-4 py-6">
        
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

        {/* Results Header */}
        {!isSearching && results.length > 0 && (
          <div className="mb-4">
            <p className="text-gray-600">
              Found <span className="font-semibold">{totalResults}</span> {totalResults === 1 ? 'flight' : 'flights'}
            </p>
          </div>
        )}

        {/* No Results */}
        {!isSearching && results.length === 0 && !searchError && (
          <div className="text-center py-20">
            <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No flights found</h2>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        )}

        {/* Flight Results */}
        {!isSearching && results.length > 0 && (
          <div className="space-y-4">
            {results.map((flight) => (
              <div 
                key={flight.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  
                  {/* Flight Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-6">
                      
                      {/* Airline */}
                      <div className="w-20">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-700">
                            {flight.airline.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{flight.airline}</p>
                      </div>

                      {/* Times & Route */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          {/* Departure */}
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatTime(flight.departureTime)}
                            </p>
                            <p className="text-sm text-gray-600">{flight.origin.code}</p>
                          </div>

                          {/* Duration & Route */}
                          <div className="flex-1 px-4">
                            <div className="relative">
                              <div className="h-px bg-gray-300 w-full"></div>
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                                <Plane className="w-4 h-4 text-gray-400 rotate-90" />
                              </div>
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <p className="text-xs text-gray-600">
                                {formatDuration(flight.durationMinutes)}
                              </p>
                            </div>
                            <p className="text-xs text-center text-gray-500 mt-1">
                              {flight.stops === 0 ? 'Nonstop' : `${flight.stops} ${flight.stops === 1 ? 'stop' : 'stops'}`}
                            </p>
                          </div>

                          {/* Arrival */}
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatTime(flight.arrivalTime)}
                            </p>
                            <p className="text-sm text-gray-600">{flight.destination.code}</p>
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-xs text-gray-500">{flight.flightNumber}</span>
                          <span className="text-xs text-gray-500 capitalize">{flight.cabinClass}</span>
                          {flight.refundable && (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <Check className="w-3 h-3" />
                              Refundable
                            </span>
                          )}
                          {flight.seatsLeft <= 5 && (
                            <span className="text-xs text-orange-600 font-medium">
                              Only {flight.seatsLeft} seats left
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price & Select Button */}
                  <div className="ml-6 text-right">
                    <p className="text-3xl font-bold text-gray-900">
                      {formatPrice(flight.price)}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">per person</p>
                    <button className="w-full px-6 py-2.5 bg-[#FF690F] hover:bg-[#d6570c] text-white font-semibold rounded-lg transition-colors">
                      Select
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

