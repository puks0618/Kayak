import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
  CheckCircle
} from 'lucide-react';
import { getStayDetailsAsync } from '../store/slices/staysSlice';

export default function HotelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedStay, loading, error } = useSelector(state => state.stays);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    dispatch(getStayDetailsAsync(id));
  }, [id, dispatch]);

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
        {/* Image Gallery */}
        <div className="mb-6">
          <div className="grid grid-cols-4 gap-2 h-96">
            {/* Main Image */}
            <div
              className="col-span-2 row-span-2 relative cursor-pointer overflow-hidden rounded-lg"
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

            {/* Thumbnail Grid */}
            {allImages.slice(1, 5).map((img, idx) => (
              <div
                key={idx}
                className="relative cursor-pointer overflow-hidden rounded-lg"
                onClick={() => {
                  setSelectedImage(idx + 1);
                  setShowGallery(true);
                }}
              >
                <img
                  src={img}
                  alt={`${hotel.hotel_name} ${idx + 2}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';
                  }}
                />
              </div>
            ))}

            {allImages.length > 5 && (
              <div
                className="relative cursor-pointer overflow-hidden rounded-lg bg-gray-900 flex items-center justify-center"
                onClick={() => setShowGallery(true)}
              >
                <span className="text-white text-lg font-bold">+{allImages.length - 5} more</span>
              </div>
            )}
          </div>
        </div>

        {/* Hotel Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2 dark:text-white">{hotel.hotel_name}</h1>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-5 h-5" />
                    <span>{hotel.neighbourhood_cleansed}, {hotel.city}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 border rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700">
                    <Share2 className="w-5 h-5 dark:text-white" />
                  </button>
                  <button className="p-2 border rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700">
                    <Heart className="w-5 h-5 dark:text-white" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                {hotel.star_rating && parseFloat(hotel.star_rating) > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <span className="font-bold text-lg dark:text-white">{parseFloat(hotel.star_rating).toFixed(1)}</span>
                    <span className="text-gray-600 dark:text-gray-400">({hotel.number_of_reviews} reviews)</span>
                  </div>
                )}
                {hotel.instant_bookable === 1 && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Instant Book
                  </span>
                )}
              </div>

              <div className="flex items-center gap-6 text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{hotel.accommodates} guests</span>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  <span>{hotel.bedrooms} bedrooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5" />
                  <span>{hotel.bathrooms} bathrooms</span>
                </div>
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
                <h2 className="text-xl font-bold mb-4 dark:text-white">Amenities</h2>
                <div className="grid grid-cols-2 gap-4">
                  {hotel.amenities.slice(0, 10).map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700 dark:text-gray-300">{amenity.amenity_name}</span>
                    </div>
                  ))}
                </div>
                {hotel.amenities.length > 10 && (
                  <button className="mt-4 text-[#FF690F] hover:underline font-medium">
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
                            {review.review_date ? new Date(review.review_date).toLocaleDateString() : 'No date'}
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
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">Check-in</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">Check-out</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">Guests</label>
                  <select className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    {[...Array(hotel.accommodates || 4)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} guest{i > 0 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button className="w-full bg-[#FF690F] hover:bg-[#d6570c] text-white py-3 rounded-md font-bold text-lg mb-4">
                Reserve
              </button>

              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                You won't be charged yet
              </p>

              <div className="border-t dark:border-gray-700 pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">${hotel.price_per_night} × 1 night</span>
                  <span className="dark:text-white">${hotel.price_per_night}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Service fee</span>
                  <span className="dark:text-white">${(hotel.price_per_night * 0.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t dark:border-gray-700 pt-2 mt-2">
                  <span className="dark:text-white">Total</span>
                  <span className="dark:text-white">${(hotel.price_per_night * 1.1).toFixed(2)}</span>
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
