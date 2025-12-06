import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Car, MapPin, Users, Settings, Star, ArrowLeft, Filter } from 'lucide-react';

export default function CarResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    minPrice: '',
    maxPrice: '',
    transmission: '',
    sortBy: 'price'
  });

  const location = searchParams.get('location');
  const pickupDate = searchParams.get('pickupDate');
  const dropoffDate = searchParams.get('dropoffDate');
  const pickupTime = searchParams.get('pickupTime');
  const dropoffTime = searchParams.get('dropoffTime');

  useEffect(() => {
    fetchCars();
  }, [filters.type, filters.minPrice, filters.maxPrice, filters.transmission, filters.sortBy]);

  const fetchCars = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        location: location,
        sortBy: filters.sortBy,
        sortOrder: 'asc',
        limit: 50
      });

      if (filters.type) params.append('type', filters.type);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.transmission) params.append('transmission', filters.transmission);

      const response = await fetch(`http://localhost:3000/api/listings/cars/search?${params.toString()}`);
      const data = await response.json();

      if (data.cars) {
        setCars(data.cars);
      } else {
        setError('No cars found');
      }
    } catch (err) {
      console.error('Failed to fetch cars:', err);
      setError('Failed to load cars. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookCar = (car) => {
    // Calculate rental days
    const pickup = new Date(pickupDate);
    const dropoff = new Date(dropoffDate);
    const days = Math.ceil((dropoff - pickup) / (1000 * 60 * 60 * 24));
    const totalPrice = ((car.price_per_day * days) * 1.15).toFixed(2); // 15% tax included

    navigate('/cars/booking', {
      state: {
        car,
        pickupDate,
        dropoffDate,
        pickupTime,
        dropoffTime,
        pickupLocation: location,
        days,
        totalPrice
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/cars')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#FF690F] transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Search
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Available Cars in {location}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {pickupDate} {pickupTime} → {dropoffDate} {dropoffTime}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 text-[#FF690F]" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Filters</h2>
              </div>

              {/* Car Type Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Car Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FF690F] focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Types</option>
                  <option value="economy">Economy</option>
                  <option value="compact">Compact</option>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="luxury">Luxury</option>
                  <option value="van">Van</option>
                </select>
              </div>

              {/* Transmission Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Transmission
                </label>
                <select
                  value={filters.transmission}
                  onChange={(e) => setFilters({ ...filters, transmission: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FF690F] focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All</option>
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Price Range (per day)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FF690F] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FF690F] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FF690F] focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="price">Price (Low to High)</option>
                  <option value="rating">Rating (High to Low)</option>
                </select>
              </div>

              <button
                onClick={() => setFilters({ type: '', minPrice: '', maxPrice: '', transmission: '', sortBy: 'price' })}
                className="w-full px-4 py-2 text-[#FF690F] border-2 border-[#FF690F] rounded-lg hover:bg-[#FF690F] hover:text-white transition-all font-semibold"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#FF690F] border-t-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading cars...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            ) : cars.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-lg">
                <Car className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No cars found</h3>
                <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or search criteria</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Found {cars.length} car{cars.length !== 1 ? 's' : ''}
                </p>
                
                {cars.map((car) => (
                  <div
                    key={car.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                      {/* Car Image */}
                      <div className="md:col-span-1">
                        <div className="relative h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                          {car.images && car.images.length > 0 ? (
                            <img
                              src={Array.isArray(car.images) ? car.images[0] : JSON.parse(car.images)[0]}
                              alt={`${car.brand} ${car.model}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/400x300?text=Car+Image';
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Car className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Car Details */}
                      <div className="md:col-span-2 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {car.brand} {car.model}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {car.year} • {car.company_name}
                              </p>
                            </div>
                            {parseFloat(car.rating) > 0 && (
                              <div className="flex items-center gap-1 bg-[#FF690F] text-white px-3 py-1 rounded-full">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="font-semibold">{parseFloat(car.rating).toFixed(1)}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-4 mt-4">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm">{car.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Users className="w-4 h-4" />
                              <span className="text-sm">{car.seats} seats</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Settings className="w-4 h-4" />
                              <span className="text-sm capitalize">{car.transmission}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium capitalize">
                                {car.type}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div>
                            <p className="text-2xl font-bold text-[#FF690F]">
                              ${parseFloat(car.daily_rental_price).toFixed(0)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">per day</p>
                          </div>
                          <button
                            onClick={() => handleBookCar({
                              id: car.id,
                              brand: car.brand,
                              model: car.model,
                              year: car.year,
                              company: car.company_name,
                              location: car.location,
                              seats: car.seats,
                              transmission: car.transmission,
                              type: car.type,
                              price_per_day: parseFloat(car.daily_rental_price),
                              rating: car.rating,
                              image_url: Array.isArray(car.images) ? car.images[0] : (car.images ? JSON.parse(car.images)[0] : null)
                            })}
                            className="px-6 py-3 bg-gradient-to-r from-[#FF690F] to-[#FF8534] text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
