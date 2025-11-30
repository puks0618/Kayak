import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  MapPin, 
  Star, 
  DollarSign, 
  Users, 
  Wifi, 
  Coffee,
  Loader2,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { searchStaysAsync, updateSearchForm, setPage } from '../store/slices/staysSlice';

export default function StaysSearch() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  
  const { results, loading, error, pagination, searchForm, cached } = useSelector(state => state.stays);
  const [showFilters, setShowFilters] = useState(false);
  
  // Local filter state
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [sortBy, setSortBy] = useState('price_asc');
  
  // Get searched cities from URL params
  const searchedCities = searchParams.get('cities')?.split(',').filter(Boolean) || [];
  
  // Client-side filtering to ensure only searched location properties are shown
  const filteredResults = results.filter(hotel => {
    // Filter by location - check if the hotel's neighborhood matches any of the searched cities
    if (searchedCities.length > 0) {
      const hotelLocation = (hotel.neighbourhood_cleansed || hotel.neighborhood || '').toLowerCase();
      const matchesLocation = searchedCities.some(city => 
        hotelLocation.includes(city.toLowerCase()) || city.toLowerCase().includes(hotelLocation)
      );
      if (!matchesLocation) return false;
    }
    
    // Filter by price range
    const price = hotel.price_per_night || 0;
    if (price < priceRange[0] || price > priceRange[1]) return false;
    
    // Filter by rating
    if (selectedRating && hotel.star_rating < selectedRating) return false;
    
    return true;
  });

  // Parse search params on mount
  useEffect(() => {
    const cities = searchParams.get('cities')?.split(',') || [];
    const checkIn = searchParams.get('checkIn') || '';
    const checkOut = searchParams.get('checkOut') || '';
    const rooms = parseInt(searchParams.get('rooms')) || 1;
    const guests = parseInt(searchParams.get('guests')) || 2;

    if (cities.length > 0) {
      // Update Redux state with search params
      dispatch(updateSearchForm({
        cities,
        checkIn,
        checkOut,
        rooms,
        guests
      }));
      
      const params = {
        cities,
        checkIn,
        checkOut,
        rooms,
        guests,
        sortBy,
        page: 1,
        limit: 20
      };
      
      dispatch(searchStaysAsync(params));
    }
  }, [searchParams, dispatch, sortBy]);

  // Apply filters
  const handleApplyFilters = () => {
    const params = {
      cities: searchForm.cities,
      checkIn: searchForm.checkIn,
      checkOut: searchForm.checkOut,
      rooms: searchForm.rooms,
      guests: searchForm.guests,
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      starRating: selectedRating,
      amenities: selectedAmenities,
      sortBy,
      page: 1,
      limit: 20
    };
    
    dispatch(searchStaysAsync(params));
  };

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    const params = {
      ...searchForm,
      sortBy: newSort,
      page: 1
    };
    dispatch(searchStaysAsync(params));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    dispatch(setPage(newPage));
    const params = {
      ...searchForm,
      page: newPage
    };
    dispatch(searchStaysAsync(params));
    window.scrollTo(0, 0);
  };

  // Navigate to hotel detail
  const handleHotelClick = (hotelId) => {
    navigate(`/stays/hotel/${hotelId}`);
  };

  if (loading && results.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-[#FF690F]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold dark:text-white">
                {filteredResults.length} hotel{filteredResults.length !== 1 ? 's' : ''} found
                {cached && <span className="text-sm text-gray-500 ml-2">(cached)</span>}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {searchForm.cities?.join(', ')} • {searchForm.checkIn} - {searchForm.checkOut}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white cursor-pointer"
                >
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating_desc">Rating: High to Low</option>
                  <option value="reviews_desc">Most Reviews</option>
                </select>
              </div>
              
              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="col-span-12 lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-bold mb-4 dark:text-white">Filters</h2>
                
                {/* Price Range */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3 dark:text-white">Price per night</h3>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                      className="w-20 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Min"
                    />
                    <span className="dark:text-white">-</span>
                    <input
                      type="number"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-20 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Max"
                    />
                  </div>
                </div>

                {/* Star Rating */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3 dark:text-white">Star Rating</h3>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(rating => (
                      <label key={rating} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="rating"
                          checked={selectedRating === rating}
                          onChange={() => setSelectedRating(rating)}
                          className="text-[#FF690F]"
                        />
                        <div className="flex items-center">
                          {[...Array(rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                          ))}
                          <span className="ml-2 text-sm dark:text-gray-300">{rating}+ stars</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3 dark:text-white">Amenities</h3>
                  <div className="space-y-2">
                    {['WiFi', 'Kitchen', 'Air conditioning', 'Heating', 'Washer', 'Dryer'].map(amenity => (
                      <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAmenities.includes(amenity)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAmenities([...selectedAmenities, amenity]);
                            } else {
                              setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
                            }
                          }}
                          className="text-[#FF690F]"
                        />
                        <span className="text-sm dark:text-gray-300">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleApplyFilters}
                  className="w-full bg-[#FF690F] hover:bg-[#d6570c] text-white py-2 rounded-md font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          {/* Results Grid */}
          <div className={showFilters ? "col-span-12 lg:col-span-9" : "col-span-12"}>
            {error && (
              <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            {filteredResults.length === 0 && !loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 text-lg">No hotels found matching your criteria</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                  Try adjusting your filters or search for a different location
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredResults.map((hotel) => (
                    <HotelCard key={hotel.hotel_id} hotel={hotel} onClick={() => handleHotelClick(hotel.hotel_id)} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="p-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      <ChevronLeft className="w-5 h-5 dark:text-white" />
                    </button>
                    
                    <span className="px-4 py-2 dark:text-white">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="p-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      <ChevronRight className="w-5 h-5 dark:text-white" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hotel Card Component
function HotelCard({ hotel, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={hotel.picture_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
          alt={hotel.hotel_name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';
          }}
        />
        {hotel.instant_bookable === 1 && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
            Instant Book
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 dark:text-white line-clamp-2">
          {hotel.hotel_name}
        </h3>
        
        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{hotel.neighbourhood_cleansed}</span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          {hotel.star_rating && parseFloat(hotel.star_rating) > 0 ? (
            <>
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="ml-1 font-medium dark:text-white">{parseFloat(hotel.star_rating).toFixed(1)}</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {hotel.review_count || hotel.number_of_reviews || 0} reviews
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">No rating yet</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <Users className="w-4 h-4" />
          <span>{hotel.accommodates} guests • {hotel.bedrooms} beds • {hotel.bathrooms} baths</span>
        </div>

        {/* Recent Reviews Preview */}
        {hotel.recent_reviews && hotel.recent_reviews.length > 0 && (
          <div className="mb-3 pb-3 border-b dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">
              "{hotel.recent_reviews[0].comments}"
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              — {hotel.recent_reviews[0].reviewer_name}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t dark:border-gray-700">
          <div className="flex items-center gap-1">
            <DollarSign className="w-5 h-5 text-[#FF690F]" />
            <span className="text-2xl font-bold text-[#FF690F]">{hotel.price_per_night}</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">/night</span>
          </div>
        </div>
      </div>
    </div>
  );
}
