import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  MapPin,
  Star,
  Users,
  Settings,
  Calendar,
  ChevronLeft,
  Share2,
  Heart,
  Loader2,
  Car,
  Gauge,
  Fuel,
  Shield
} from 'lucide-react';
import LoginPromptModal from '../components/LoginPromptModal';
import ReviewSection from '../components/ReviewSection';
import { getUserFavorites, addToUserFavorites, removeFromUserFavorites, isUserFavorite } from '../utils/userStorage';
import {
  setSelectedCar,
  setRentalDetails,
  calculatePricing
} from '../store/slices/carBookingSlice';

export default function CarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  // Get search params for booking
  const pickupDate = searchParams.get('pickupDate');
  const dropoffDate = searchParams.get('dropoffDate');
  const pickupTime = searchParams.get('pickupTime') || 'Noon';
  const dropoffTime = searchParams.get('dropoffTime') || 'Noon';
  const pickupLocation = searchParams.get('location');

  // Calculate rental days
  const calculateDays = () => {
    if (!pickupDate || !dropoffDate) return 1;
    const pickup = new Date(pickupDate);
    const dropoff = new Date(dropoffDate);
    const days = Math.max(1, Math.ceil((dropoff - pickup) / (1000 * 60 * 60 * 24)));
    return days;
  };

  const days = calculateDays();

  useEffect(() => {
    fetchCarDetails();
    checkIfLiked();
  }, [id]);

  const fetchCarDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/listings/cars/${id}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setCar(data);
      }
    } catch (err) {
      console.error('Failed to fetch car details:', err);
      setError('Failed to load car details');
    } finally {
      setLoading(false);
    }
  };

  const checkIfLiked = () => {
    if (user && user.id) {
      setIsLiked(isUserFavorite(user.id, 'cars', id));
    } else {
      setIsLiked(false);
    }
  };

  const toggleLike = () => {
    if (!user || !user.id) {
      setShowLoginPrompt(true);
      return;
    }

    if (isLiked) {
      // Remove from favorites
      removeFromUserFavorites(user.id, 'cars', id);
      setIsLiked(false);
    } else {
      // Add to favorites
      addToUserFavorites(user.id, 'cars', car);
      setIsLiked(true);
    }
  };

  const handleBooking = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (!pickupDate || !dropoffDate) {
      alert('Please select pickup and drop-off dates');
      return;
    }

    // Ensure car images are passed correctly
    const carImages = Array.isArray(car.images) ? car.images : (typeof car.images === 'string' ? JSON.parse(car.images) : []);
    
    // Prepare car object with correct field names
    const carForBooking = {
      ...car,
      price_per_day: car.daily_rental_price,
      image_url: carImages[0] || 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400'
    };
    
    // Dispatch Redux actions to set up booking state
    dispatch(setSelectedCar(carForBooking));
    dispatch(setRentalDetails({
      pickupDate,
      dropoffDate,
      pickupTime: pickupTime || '10:00',
      dropoffTime: dropoffTime || '10:00',
      pickupLocation: pickupLocation || car.location
    }));
    dispatch(calculatePricing());
    
    // Navigate to booking page (Redux state is already set)
    navigate('/cars/booking');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-12 h-12 animate-spin text-[#FF690F]" />
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Car className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'Car not found'}</p>
        <button
          onClick={() => navigate('/cars')}
          className="px-6 py-2 bg-[#FF690F] text-white rounded-md hover:bg-[#d6570c]"
        >
          Back to Search
        </button>
      </div>
    );
  }

  const carImages = Array.isArray(car.images) 
    ? car.images 
    : (typeof car.images === 'string' ? JSON.parse(car.images) : []);
  
  const mainImage = carImages[0] || 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800';
  const subtotal = (car.daily_rental_price * days).toFixed(2);
  const tax = (subtotal * 0.15).toFixed(2);
  const total = (parseFloat(subtotal) + parseFloat(tax)).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#FF690F] transition-colors mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Results
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Car Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="relative rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
              <img
                src={mainImage}
                alt={`${car.brand} ${car.model}`}
                className="w-full h-96 object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800';
                }}
              />
              
              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={toggleLike}
                  className="p-3 bg-white dark:bg-gray-800 rounded-full hover:scale-110 transition-transform shadow-lg"
                >
                  <Heart 
                    className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-400'}`}
                  />
                </button>
                <button className="p-3 bg-white dark:bg-gray-800 rounded-full hover:scale-110 transition-transform shadow-lg">
                  <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Car Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {car.brand} {car.model} {car.year}
                  </h1>
                  <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{car.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{car.rating || '4.5'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF690F]/10 rounded-full mb-6">
                <Car className="w-4 h-4 text-[#FF690F]" />
                <span className="text-sm font-semibold text-[#FF690F]">{car.company_name}</span>
              </div>

              {/* Specifications */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="w-5 h-5 text-[#FF690F]" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">{car.type}</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-5 h-5 text-[#FF690F]" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Transmission</span>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">{car.transmission}</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-[#FF690F]" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Seats</span>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">{car.seats} seats</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Fuel className="w-5 h-5 text-[#FF690F]" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Fuel Policy</span>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">Full-to-Full</p>
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Included Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { icon: Shield, text: 'Basic Insurance Included' },
                    { icon: Gauge, text: 'Unlimited Mileage' },
                    { icon: MapPin, text: 'GPS Navigation' },
                    { icon: Car, text: 'Roadside Assistance' },
                    { icon: Users, text: 'Additional Driver Option' },
                    { icon: Calendar, text: 'Flexible Cancellation' }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <feature.icon className="w-5 h-5 text-[#FF690F]" />
                      <span className="text-gray-700 dark:text-gray-300">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg sticky top-24">
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-[#FF690F]">
                    ${car.daily_rental_price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">/day</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {days} {days === 1 ? 'day' : 'days'} rental
                </p>
              </div>

              {/* Rental Details */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Calendar className="w-5 h-5 text-[#FF690F]" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Pick-up</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {pickupDate ? new Date(pickupDate).toLocaleDateString() : 'Select date'} • {pickupTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Calendar className="w-5 h-5 text-[#FF690F]" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Drop-off</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {dropoffDate ? new Date(dropoffDate).toLocaleDateString() : 'Select date'} • {dropoffTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <MapPin className="w-5 h-5 text-[#FF690F]" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Location</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {pickupLocation || car.location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t dark:border-gray-700 pt-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    ${car.daily_rental_price} × {days} {days === 1 ? 'day' : 'days'}
                  </span>
                  <span className="text-gray-900 dark:text-white font-semibold">${subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Taxes & Fees (15%)</span>
                  <span className="text-gray-900 dark:text-white font-semibold">${tax}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t dark:border-gray-700 pt-2 mt-2">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-[#FF690F]">${total}</span>
                </div>
              </div>

              {/* Book Button */}
              <button
                onClick={handleBooking}
                className="w-full py-4 bg-[#FF690F] text-white font-semibold rounded-lg hover:bg-[#d6570c] transition-colors mb-4"
              >
                Book Now
              </button>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                You won't be charged yet
              </p>
            </div>
          </div>

          {/* Reviews Section */}
          <ReviewSection 
            type="cars" 
            listingId={car.id} 
            listingName={`${car.make} ${car.model}`}
          />
        </div>
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <LoginPromptModal
          onClose={() => setShowLoginPrompt(false)}
          message="Please log in to book this car or save it to your favorites"
        />
      )}
    </div>
  );
}
