import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import LoginPromptModal from '../components/LoginPromptModal';
import DateRangeCalendar from '../components/DateRangeCalendar';
import {
  MapPin,
  Star,
  Users,
  Home,
  Wifi,
  Coffee,
  Wind,
  Droplets,
  Tv,
  Car,
  ChevronLeft,
  ChevronRight,
  X,
  Share2,
  Heart,
  Loader2,
  Calendar,
  CheckCircle,
  Snowflake,
  Utensils,
  ParkingCircle,
  Dumbbell,
  Waves,
  Baby,
  DoorOpen,
  Shield,
  Sparkles,
  Shirt
} from 'lucide-react';
import { getStayDetailsAsync } from '../store/slices/staysSlice';

// Helper function to get appropriate icon for amenity
function getAmenityIcon(amenityName) {
  const name = amenityName.toLowerCase();
  
  if (name.includes('wifi') || name.includes('internet')) return Wifi;
  if (name.includes('kitchen')) return Utensils;
  if (name.includes('air conditioning') || name.includes('ac')) return Snowflake;
  if (name.includes('heating') || name.includes('heat')) return Wind;
  if (name.includes('tv') || name.includes('television')) return Tv;
  if (name.includes('parking')) return ParkingCircle;
  if (name.includes('pool')) return Waves;
  if (name.includes('gym') || name.includes('fitness')) return Dumbbell;
  if (name.includes('washer') || name.includes('dryer') || name.includes('laundry')) return Shirt;
  if (name.includes('coffee') || name.includes('breakfast')) return Coffee;
  if (name.includes('shower') || name.includes('bath')) return Droplets;
  if (name.includes('workspace') || name.includes('desk')) return Home;
  if (name.includes('smoke') || name.includes('carbon monoxide')) return Shield;
  if (name.includes('first aid') || name.includes('fire extinguisher')) return Shield;
  if (name.includes('self check-in') || name.includes('keypad')) return DoorOpen;
  if (name.includes('crib') || name.includes('baby') || name.includes('child')) return Baby;
  if (name.includes('cleaning')) return Sparkles;
  
  return CheckCircle;
}

export default function HotelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { selectedStay, loading, error } = useSelector(state => state.stays);
  const { user } = useSelector(state => state.auth);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Calculate number of nights
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    return nights;
  };

  const nights = calculateNights();

  useEffect(() => {
    dispatch(getStayDetailsAsync(id));
    checkIfLiked();
  }, [id, dispatch]);

  const checkIfLiked = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '{"hotels": []}');
    setIsLiked(favorites.hotels?.some(h => h.hotel_id === id || h.id === id) || false);
  };

  const toggleLike = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    const favorites = JSON.parse(localStorage.getItem('favorites') || '{"flights": [], "hotels": [], "cars": []}');
    
    if (isLiked) {
      // Remove from favorites
      favorites.hotels = favorites.hotels.filter(h => h.hotel_id !== id && h.id !== id);
      setIsLiked(false);
    } else {
      // Add to favorites
      if (!favorites.hotels) favorites.hotels = [];
      favorites.hotels.push({
        ...selectedStay,
        savedAt: new Date().toISOString()
      });
      setIsLiked(true);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
  };

  // Handle loading and error states
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-[#FF690F]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error loading hotel details</h2>
          <p>{error}</p>
          <button
            onClick={() => navigate('/stays/search')}
            className="mt-4 px-4 py-2 bg-[#FF690F] text-white rounded-md hover:bg-[#d6570c]"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  if (!selectedStay) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Hotel not found</p>
          <button
            onClick={() => navigate('/stays/search')}
            className="mt-4 px-4 py-2 bg-[#FF690F] text-white rounded-md hover:bg-[#d6570c]"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const hotel = selectedStay;
  const allImages = [hotel.picture_url, ...(hotel.images || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#FF690F]"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to results
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Single Hero Image */}
        <div className="mb-6">
          <div
            className="relative cursor-pointer overflow-hidden rounded-lg h-[450px] w-full"
            onClick={() => setShowGallery(true)}
          >
            <img
              src={allImages[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
              alt={hotel.hotel_name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
              }}
            />
          </div>
        </div>

        {/* Hotel Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2">

            {/* Main Info */}
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2 dark:text-white">{hotel.hotel_name || hotel.name}</h1>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-5 h-5" />
                    <span>{hotel.city}{hotel.state ? `, ${hotel.state}` : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 border rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700">
                    <Share2 className="w-5 h-5 dark:text-white" />
                  </button>
                  <button 
                    onClick={toggleLike}
                    className="p-2 border rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    <Heart 
                      className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'dark:text-white'}`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                {hotel.star_rating && parseFloat(hotel.star_rating) > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <span className="font-bold text-lg dark:text-white">{parseFloat(hotel.star_rating).toFixed(1)}</span>
                    {hotel.reviews && hotel.reviews.length > 0 && (
                      <span className="text-gray-600 dark:text-gray-400">({hotel.reviews.length} reviews)</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{hotel.accommodates || hotel.num_rooms} {(hotel.accommodates || hotel.num_rooms) === 1 ? 'guest' : 'guests'}</span>
                </div>
                {hotel.room_type && (
                  <div className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    <span>{hotel.room_type}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Property Type */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 dark:text-white">Property Type</h2>
              <p className="text-gray-700 dark:text-gray-300">{hotel.property_type || 'Entire home/apt'}</p>
            </div>

            {/* Description */}
            {hotel.description && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4 dark:text-white">About this place</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {hotel.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {hotel.amenities && hotel.amenities.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6 dark:text-white">What this place offers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hotel.amenities.slice(0, 10).map((amenity, idx) => {
                    const amenityName = typeof amenity === 'string' ? amenity : (amenity.amenity || amenity.amenity_name || 'Unknown');
                    const IconComponent = getAmenityIcon(amenityName);
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <IconComponent className="w-6 h-6 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{amenityName}</span>
                      </div>
                    );
                  })}
                </div>
                {hotel.amenities.length > 10 && (
                  <button className="mt-6 w-full py-3 border border-gray-900 dark:border-gray-300 rounded-lg text-gray-900 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Show all {hotel.amenities.length} amenities
                  </button>
                )}
              </div>
            )}

            {/* Reviews */}
            {hotel.reviews && hotel.reviews.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4 dark:text-white">Reviews</h2>
                <div className="space-y-4">
                  {hotel.reviews.slice(0, 5).map((review, idx) => (
                    <div key={idx} className="border-b dark:border-gray-700 pb-4 last:border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="font-bold dark:text-white">{review.reviewer_name?.charAt(0) || 'U'}</span>
                        </div>
                        <div>
                          <p className="font-medium dark:text-white">{review.reviewer_name || 'Anonymous'}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {review.date ? new Date(review.date).toLocaleDateString() : 'No date'}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 line-clamp-3">{review.comments}</p>
                    </div>
                  ))}
                </div>
                {hotel.reviews.length > 5 && (
                  <button className="mt-4 text-[#FF690F] hover:underline font-medium">
                    Show all {hotel.reviews.length} reviews
                  </button>
                )}
              </div>
            )}
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-6">
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#FF690F]">${hotel.price_per_night}</span>
                  <span className="text-gray-600 dark:text-gray-400">/night</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="relative">
                  <label className="block text-sm font-medium mb-2 dark:text-white">Dates</label>
                  <button
                    onClick={() => setShowCalendar(true)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#FF690F] dark:hover:border-[#FF690F] transition-colors text-left bg-white dark:bg-gray-700 dark:text-white flex items-center gap-2"
                  >
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="flex-1">
                      {checkIn && checkOut
                        ? (() => {
                            // Parse dates as local dates to avoid timezone issues
                            const [startYear, startMonth, startDay] = checkIn.split('-').map(Number);
                            const [endYear, endMonth, endDay] = checkOut.split('-').map(Number);
                            const startDate = new Date(startYear, startMonth - 1, startDay);
                            const endDate = new Date(endYear, endMonth - 1, endDay);
                            return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                          })()
                        : 'Select check-in and check-out'}
                    </span>
                  </button>
                  {showCalendar && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="relative">
                        <DateRangeCalendar
                          checkIn={checkIn}
                          checkOut={checkOut}
                          onSelect={(start, end) => {
                            // Format dates as YYYY-MM-DD for consistency
                            const formatDate = (date) => {
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              return `${year}-${month}-${day}`;
                            };
                            setCheckIn(formatDate(start));
                            setCheckOut(formatDate(end));
                            setShowCalendar(false);
                          }}
                          onClose={() => setShowCalendar(false)}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">Guests</label>
                  <select 
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {[...Array(hotel.accommodates || 4)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} guest{i > 0 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                onClick={() => {
                  console.log('Reserve button clicked!');
                  console.log('User state:', user);
                  console.log('Check-in:', checkIn);
                  console.log('Check-out:', checkOut);
                  
                  if (!checkIn || !checkOut) {
                    alert('Please select check-in and check-out dates');
                    return;
                  }
                  
                  // Check if user is logged in
                  if (!user) {
                    // Show alert to login
                    const shouldLogin = window.confirm(
                      'Please sign in to book this stay.\n\n' +
                      'Click OK to go to login page, or Cancel to continue browsing.'
                    );
                    
                    if (shouldLogin) {
                      navigate('/login', { 
                        state: { from: { pathname: location.pathname } } 
                      });
                    }
                    return;
                  }
                  
                  console.log('User is logged in, navigating to booking');
                  navigate('/stays/booking/confirm', {
                    state: {
                      hotel,
                      checkIn,
                      checkOut,
                      guests,
                      nights,
                      totalPrice: (hotel.price_per_night * nights * 1.1).toFixed(2)
                    }
                  });
                }}
                className="w-full bg-[#FF690F] hover:bg-[#d6570c] text-white py-3 rounded-md font-bold text-lg mb-4"
              >
                Reserve
              </button>

              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                You won't be charged yet
              </p>

              <div className="border-t dark:border-gray-700 pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    ${hotel.price_per_night} × {nights} night{nights !== 1 ? 's' : ''}
                  </span>
                  <span className="dark:text-white">${(hotel.price_per_night * nights).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Service fee</span>
                  <span className="dark:text-white">${(hotel.price_per_night * nights * 0.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t dark:border-gray-700 pt-2 mt-2">
                  <span className="dark:text-white">Total</span>
                  <span className="dark:text-white">${(hotel.price_per_night * nights * 1.1).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {showGallery && (
        <ImageGallery
          images={allImages}
          selectedIndex={selectedImage}
          onClose={() => setShowGallery(false)}
          onSelect={setSelectedImage}
        />
      )}
    </div>
  );
}

// Image Gallery Modal Component
function ImageGallery({ images, selectedIndex, onClose, onSelect }) {
  const [current, setCurrent] = useState(selectedIndex);

  useEffect(() => {
    setCurrent(selectedIndex);
  }, [selectedIndex]);

  const handlePrev = () => {
    setCurrent((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrent((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Image Counter */}
      <div className="absolute top-4 left-4 text-white text-lg z-10">
        {current + 1} / {images.length}
      </div>

      {/* Main Image */}
      <div className="relative w-full h-full flex items-center justify-center p-12">
        <img
          src={images[current]}
          alt={`Gallery image ${current + 1}`}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200';
          }}
        />

        {/* Navigation Arrows */}
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-40 text-white p-3 rounded-full transition-all"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-40 text-white p-3 rounded-full transition-all"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Thumbnail Strip */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-4xl overflow-x-auto">
        <div className="flex gap-2 px-4">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                current === idx ? 'border-[#FF690F] scale-110' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100';
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
