/**
 * Fare Selection Page
 * Step 1: Choose a fare (Basic vs Economy)
 * Step 2: Choose where to book
 */

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Plane } from 'lucide-react';
import kayakLogo from "../assets/images/kayak logo.png";
import { buildDetailedFareOptions } from '../utils/fareOptions';

export default function FareSelectionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get flight and fare info from navigation state
  const { flight, fareCode: initialFareCode, farePrice, searchForm } = location.state || {};
  
  // State for selected fare
  const [selectedFareCode, setSelectedFareCode] = useState(initialFareCode || 'BASIC');
  
  // If no flight data, redirect back
  if (!flight) {
    navigate('/flights');
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
    try {
      // TODO: Call booking API
      const bookingData = {
        userId: 'current-user-id', // Replace with actual user ID from auth
        type: 'flight',
        outboundSegmentId: flight.id,
        returnSegmentId: flight.id, // TODO: Handle return flight separately
        fare: selectedFare
      };
      
      console.log('Booking:', bookingData);
      
      // Navigate to confirmation page (to be created)
      alert(`Booking ${selectedFare.label} fare for ${formatPrice(selectedFare.price)}!`);
      navigate('/');
    } catch (error) {
      console.error('Booking error:', error);
      alert('Booking failed. Please try again.');
    }
  };
  
  const formatPrice = (price) => {
    return `$${Math.round(price).toLocaleString()}`;
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            className="p-1 hover:bg-gray-100 rounded"
            onClick={() => navigate(-1)}
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
          <div className="text-right mr-4">
            <p className="text-2xl font-bold text-gray-900">{formatPrice(selectedFare?.price || basePrice)}</p>
            <p className="text-xs text-gray-600">Super.com</p>
          </div>
          <button className="px-6 py-2 bg-[#FF690F] hover:bg-[#d6570c] text-white font-bold rounded text-sm transition-colors">
            Book
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        
        {/* Left Column: Fare Selection */}
        <div className="flex-1">
          
          {/* Step 1: Choose a Fare */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 1: Choose a fare</h2>
            <p className="text-sm text-gray-600 mb-1">
              <a href="#" className="text-blue-600 hover:underline">See baggage size and weight limit</a>. Total prices may include estimated baggage fees and flexibility. Some options may require added baggage or flexibility when checking out. Check terms and conditions on the booking site.
            </p>
            <p className="text-xs text-gray-500 mb-6">
              Fare and baggage fees apply to the entire trip.
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
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    {/* Fare Header */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{fare.label}</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{formatPrice(fare.price)}</p>
                    </div>
                    
                    {/* Perks List */}
                    <div className="space-y-3">
                      {fare.perks.map((perk, idx) => {
                        const isNegative = perk.includes('for a fee') || perk.includes('No refunds');
                        const isPartial = perk.includes('$146') || perk.includes('unavailable');
                        
                        return (
                          <div key={idx} className="flex items-start gap-2">
                            {isNegative ? (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-gray-600">$</span>
                              </div>
                            ) : isPartial ? (
                              <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-white">$</span>
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <p className="text-sm text-gray-700">{perk}</p>
                          </div>
                        );
                      })}
                      
                      {/* Refund Badge */}
                      {!fare.refundable && (
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <X className="w-3 h-3 text-gray-600" />
                          </div>
                          <p className="text-sm text-gray-700">No refunds</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Hide fare details link */}
            <button className="text-sm text-blue-600 hover:underline mt-4">
              Hide fare details
            </button>
          </div>
          
          {/* Step 2: Choose Where to Book */}
          {selectedFareCode && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 2: Choose where to book</h2>
              <p className="text-sm text-gray-600 mb-6">
                KAYAK compares hundreds of travel sites at once to show prices available for your trip.
              </p>
              
              {/* Booking Option */}
              <div className="bg-white border border-gray-300 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Provider Logo */}
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">K</span>
                    </div>
                    
                    {/* Provider Info */}
                    <div>
                      <p className="font-semibold text-gray-900">Kiwi.com</p>
                      <p className="text-xs text-gray-500">Ad</p>
                    </div>
                  </div>
                  
                  {/* Price and Book Button */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{formatPrice(selectedFare.price)}</p>
                      <button className="text-xs text-gray-600 hover:underline flex items-center gap-1">
                        <span className="w-4 h-4 border border-gray-400 rounded-full flex items-center justify-center text-[10px]">i</span>
                      </button>
                    </div>
                    <button 
                      onClick={handleBook}
                      className="px-8 py-3 bg-[#FF690F] hover:bg-[#d6570c] text-white font-bold rounded text-sm transition-colors"
                    >
                      Book
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Column: Trip Summary */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-lg p-5 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {originCode} to {destCode}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchForm?.tripType || 'Round-trip'}, {searchForm?.adults || 1} {(searchForm?.adults || 1) === 1 ? 'traveler' : 'travelers'}
            </p>
            
            {/* Outbound Flight */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Plane className="w-4 h-4 text-gray-600 rotate-45" />
                <p className="text-sm font-semibold text-gray-900">
                  {originCode} → {destCode}
                </p>
                <span className="text-xs text-gray-600">
                  {formatDate(departureTime)}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-1">
                {stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`} • {formatDuration(duration)}
              </p>
              <p className="text-sm text-gray-900">
                {formatTime(departureTime)} – {formatTime(arrivalTime)}
              </p>
              <p className="text-xs text-gray-600">
                {originCode} – {destCode}
              </p>
            </div>
            
            {/* Return Flight */}
            {searchForm?.returnDate && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Plane className="w-4 h-4 text-gray-600 rotate-[225deg]" />
                  <p className="text-sm font-semibold text-gray-900">
                    {destCode} → {originCode}
                  </p>
                  <span className="text-xs text-gray-600">
                    {formatDate(searchForm.returnDate)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-1">
                  Nonstop • 6h 47m
                </p>
                <p className="text-sm text-gray-900">
                  9:30 am – 1:17 pm
                </p>
                <p className="text-xs text-gray-600">
                  {destCode} – {originCode}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

