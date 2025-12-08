import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Heart,
  Plane,
  Building2,
  Car,
  MapPin,
  Calendar,
  Users,
  Star,
  Trash2,
  ExternalLink
} from 'lucide-react';
import LoginPromptModal from '../components/LoginPromptModal';

export default function Favorites() {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [favorites, setFavorites] = useState({
    flights: [],
    hotels: [],
    cars: []
  });

  useEffect(() => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    loadFavorites();
  }, [user]);

  const loadFavorites = () => {
    const stored = localStorage.getItem('favorites');
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  };

  const removeFavorite = (type, itemId) => {
    const updated = { ...favorites };
    updated[type] = updated[type].filter(item => item.id !== itemId);
    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
  };

  const handleFlightClick = (flight) => {
    navigate('/flights/results', { state: { selectedFlight: flight } });
  };

  const handleHotelClick = (hotel) => {
    navigate(`/stays/hotel/${hotel.id}`);
  };

  const handleCarClick = (car) => {
    navigate(`/cars/${car.id}`);
  };

  const totalFavorites = favorites.flights.length + favorites.hotels.length + favorites.cars.length;

  const filteredFavorites = () => {
    switch (activeTab) {
      case 'flights':
        return { flights: favorites.flights, hotels: [], cars: [] };
      case 'hotels':
        return { flights: [], hotels: favorites.hotels, cars: [] };
      case 'cars':
        return { flights: [], hotels: [], cars: favorites.cars };
      default:
        return favorites;
    }
  };

  const filtered = filteredFavorites();

  if (showLoginPrompt && !user) {
    return (
      <LoginPromptModal
        onClose={() => navigate('/')}
        message="Please log in to view your favorites"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-8 h-8 text-[#FF690F] fill-[#FF690F]" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              My Favorites
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {totalFavorites} {totalFavorites === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'all', label: 'All', icon: Heart },
            { id: 'flights', label: 'Flights', icon: Plane },
            { id: 'hotels', label: 'Hotels', icon: Building2 },
            { id: 'cars', label: 'Cars', icon: Car }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#FF690F] text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.id !== 'all' && (
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-0.5 rounded-full text-sm">
                  {favorites[tab.id]?.length || 0}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {totalFavorites === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-lg">
            <Heart className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No favorites yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start exploring and save your favorite flights, hotels, and cars!
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/flights/results')}
                className="px-6 py-3 bg-[#FF690F] text-white font-semibold rounded-lg hover:bg-[#d6570c] transition-colors"
              >
                Browse Flights
              </button>
              <button
                onClick={() => navigate('/stays')}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Browse Hotels
              </button>
              <button
                onClick={() => navigate('/cars')}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Browse Cars
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Flights Section */}
            {filtered.flights.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Plane className="w-6 h-6 text-[#FF690F]" />
                  Flights ({filtered.flights.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.flights.map((flight) => (
                    <div
                      key={flight.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gray-200 dark:border-gray-700"
                      onClick={() => handleFlightClick(flight)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {flight.airline || 'Airline'}
                          </p>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {flight.from} → {flight.to}
                          </h3>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFavorite('flights', flight.id);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{flight.date || 'Date not set'}</span>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-2xl font-bold text-[#FF690F]">
                            ${flight.price || '0'}
                          </span>
                          <ExternalLink className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hotels Section */}
            {filtered.hotels.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-[#FF690F]" />
                  Hotels ({filtered.hotels.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.hotels.map((hotel) => (
                    <div
                      key={hotel.id}
                      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gray-200 dark:border-gray-700"
                      onClick={() => handleHotelClick(hotel)}
                    >
                      {hotel.images && hotel.images[0] && (
                        <img
                          src={hotel.images[0]}
                          alt={hotel.name}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';
                          }}
                        />
                      )}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {hotel.name}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFavorite('hotels', hotel.id);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                          >
                            <Trash2 className="w-5 h-5 text-red-500" />
                          </button>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{hotel.location || hotel.city}</span>
                          </div>
                          {hotel.rating && (
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold">{hotel.rating}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-4">
                            <span className="text-2xl font-bold text-[#FF690F]">
                              ${hotel.price_per_night || hotel.price}
                            </span>
                            <span className="text-xs text-gray-500">/night</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cars Section */}
            {filtered.cars.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Car className="w-6 h-6 text-[#FF690F]" />
                  Cars ({filtered.cars.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.cars.map((car) => (
                    <div
                      key={car.id}
                      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gray-200 dark:border-gray-700"
                      onClick={() => handleCarClick(car)}
                    >
                      {car.images && car.images[0] && (
                        <img
                          src={Array.isArray(car.images) ? car.images[0] : JSON.parse(car.images)[0]}
                          alt={`${car.brand} ${car.model}`}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400';
                          }}
                        />
                      )}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              {car.brand} {car.model}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {car.year} • {car.company_name}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFavorite('cars', car.id);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                          >
                            <Trash2 className="w-5 h-5 text-red-500" />
                          </button>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{car.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{car.seats} seats</span>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <span className="text-2xl font-bold text-[#FF690F]">
                              ${car.daily_rental_price || car.price_per_day}
                            </span>
                            <span className="text-xs text-gray-500">/day</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
