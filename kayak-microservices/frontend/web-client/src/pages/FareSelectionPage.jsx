/**
 * Fare Selection Page
 * Step 1: Choose a fare (Basic vs Economy)
 * Direct booking without external providers
 */

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Check, X, Plane } from 'lucide-react';
import { buildDetailedFareOptions } from '../utils/fareOptions';

export default function FareSelectionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  // Get flight and fare info from navigation state
  const { flight, returnFlight, fareCode: initialFareCode, farePrice, searchForm } = location.state || {};
  
  // State for selected fare
  const [selectedFareCode, setSelectedFareCode] = useState(initialFareCode || 'BASIC');
  
  // If no flight data, redirect back
  if (!flight) {
    navigate('/flights/results');
    return null;
  }
  
  // Build detailed fare options
  const basePrice = flight.price || 0;
  const fareOptions = buildDetailedFareOptions(basePrice);
  const selectedFare = fareOptions.find(f => f.code === selectedFareCode);
  
  // Format helpers
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };
  
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  const originCode = flight.origin?.code || flight.departure_airport || flight.origin || 'N/A';
  const destCode = flight.destination?.code || flight.arrival_airport || flight.destination || 'N/A';
  const departureTime = flight.departureTime || flight.departure_time;
  const arrivalTime = flight.arrivalTime || flight.arrival_time;
  const duration = flight.durationMinutes || flight.duration || 0;
  const stops = flight.stops ?? 0;
  
  // Handle booking
  const handleBook = async () => {
    // Check if user is logged in
    if (!user) {
      const shouldLogin = window.confirm(
        'Please sign in to book this flight.\n\n' +
        'Click OK to go to login page, or Cancel to continue browsing.'
      );
      
      if (shouldLogin) {
        navigate('/login', { 
          state: { from: { pathname: location.pathname } } 
        });
      }
      return;
    }
    
    try {
      // Navigate to booking confirmation page
      navigate('/flights/booking/confirm', { 
        state: { 
          outboundFlight: flight,
          returnFlight: returnFlight || null,
          fare: selectedFare,
          totalPrice: selectedFare.price,
          passengers: 1,
          searchForm
        } 
      });
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to proceed to booking. Please try again.');
    }
  };
  
  const formatPrice = (price) => {
    return `$${Math.round(price).toLocaleString()}`;
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header with Price and Book Button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Choose a fare</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatPrice(selectedFare?.price || basePrice)}</p>
            </div>
            <button 
              onClick={handleBook}
              className="px-8 py-3 bg-[#FF690F] hover:bg-[#d6570c] text-white font-bold rounded-lg text-base transition-colors"
            >
              Book
            </button>
          </div>
        </div>
        
        <div className="flex gap-6">
        
          {/* Left Column: Fare Selection */}
          <div className="flex-1">
            {/* Fare Info */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Total prices may include estimated baggage fees and flexibility. Some options may require added baggage or flexibility when checking out.
              </p>
            
              {/* Fare Cards */}
              <div className="flex gap-4">
                {fareOptions.map((fare) => {
                  const isSelected = selectedFareCode === fare.code;
                  
                  return (
                    <div 
                      key={fare.code}
                      onClick={() => setSelectedFareCode(fare.code)}
                      className={`flex-1 border-2 rounded-lg p-6 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500' 
                          : 'border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      {/* Fare Header */}
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{fare.label}</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatPrice(fare.price)}</p>
                      </div>
                    
                      {/* Perks List */}
                      <div className="space-y-3">
                        {fare.perks.map((perk, idx) => (
                          <div key={idx} className="flex items-start gap-2.5">
                            {perk.status === 'included' ? (
                              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                              </div>
                            ) : perk.status === 'fee' ? (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-400 dark:border-gray-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">$</span>
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <X className="w-3 h-3 text-gray-600 dark:text-gray-400" strokeWidth={2.5} />
                              </div>
                            )}
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-5">{perk.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Right Column: Trip Summary */}
          <div className="w-96 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm sticky top-24">
              {/* Trip Header */}
              <div className="mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {originCode} to {destCode}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {searchForm?.tripType || 'roundtrip'}, {searchForm?.adults || 1} {(searchForm?.adults || 1) === 1 ? 'traveler' : 'travelers'}
                </p>
              </div>
              
              {/* Outbound Flight */}
              <div className="mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Plane className="w-5 h-5 text-orange-500 dark:text-orange-400 rotate-45" />
                  <p className="text-base font-bold text-gray-900 dark:text-white">
                    {originCode} → {destCode}
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {formatDate(departureTime)}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {formatTime(departureTime)} – {formatTime(arrivalTime)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`} • {formatDuration(duration)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {flight.airline || 'N/A'} {flight.flight_number || flight.flightNumber || ''}
                  </p>
                </div>
              </div>
              
              {/* Return Flight */}
              {returnFlight && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Plane className="w-5 h-5 text-orange-500 dark:text-orange-400 rotate-[225deg]" />
                    <p className="text-base font-bold text-gray-900 dark:text-white">
                      {returnFlight.departure_airport || returnFlight.origin} → {returnFlight.arrival_airport || returnFlight.destination}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {formatDate(returnFlight.departure_time || returnFlight.departureTime)}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {formatTime(returnFlight.departure_time || returnFlight.departureTime)} – {formatTime(returnFlight.arrival_time || returnFlight.arrivalTime)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {returnFlight.stops === 0 ? 'Nonstop' : `${returnFlight.stops} stop${returnFlight.stops > 1 ? 's' : ''}`} • {formatDuration(returnFlight.duration || returnFlight.durationMinutes)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {returnFlight.airline || 'N/A'} {returnFlight.flight_number || returnFlight.flightNumber || ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

