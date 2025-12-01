import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Star,
  Users,
  Briefcase,
  Settings,
  Fuel,
  MapPin,
  Calendar,
  Shield,
  Check,
  X as XIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function CarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  const searchParams = location.state?.searchParams || {};

  useEffect(() => {
    fetchCarDetails();
  }, [id]);

  const fetchCarDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3003/api/listings/cars/${id}`);
      const data = await response.json();
      
      if (data.success && data.car) {
        setCar(data.car);
      } else {
        setError('Car not found');
      }
    } catch (err) {
      setError('Error loading car details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF690F] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading car details...</p>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error || 'Car not found'}</p>
          <button 
            onClick={() => navigate('/cars/results')}
            className="mt-4 text-[#FF690F] hover:underline"
          >
            ← Back to results
          </button>
        </div>
      </div>
    );
  }

  const images = typeof car.images === 'string' ? JSON.parse(car.images) : car.images || [];
  const features = typeof car.features === 'string' ? JSON.parse(car.features) : car.features || [];
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF690F] mb-4 flex items-center gap-1"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to results
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Images & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-900">
              <img 
                src={images[currentImageIndex] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format'}
                alt={`${car.brand} ${car.model}`}
                className="w-full h-full object-cover"
              />
              
              {images.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 p-2 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-800 dark:text-white" />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 p-2 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-800 dark:text-white" />
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Car Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {car.brand} {car.model} {car.year}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 capitalize">{car.type}</p>
              </div>
              {car.rating && (
                <div className="flex items-center gap-1 bg-[#FF690F] text-white px-3 py-1.5 rounded-lg text-lg font-semibold">
                  <Star className="w-5 h-5 fill-current" />
                  {car.rating}
                </div>
              )}
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Seats</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{car.seats}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Bags</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{car.baggage_capacity || 2}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Transmission</div>
                  <div className="font-semibold text-gray-900 dark:text-white capitalize">{car.transmission}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Fuel className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Fuel</div>
                  <div className="font-semibold text-gray-900 dark:text-white capitalize">{car.fuel_type || 'Gasoline'}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            {car.description && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">About this car</h3>
                <p className="text-gray-600 dark:text-gray-400">{car.description}</p>
              </div>
            )}

            {/* Features */}
            {features.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Features & Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rental Policies */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {car.mileage_limit && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Mileage</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {car.mileage_limit === 0 ? 'Unlimited' : `${car.mileage_limit} miles/day`}
                    </div>
                  </div>
                </div>
              )}
              {car.insurance_included !== undefined && (
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Insurance</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {car.insurance_included ? 'Included' : 'Not included'}
                    </div>
                  </div>
                </div>
              )}
              {car.cancellation_policy && (
                <div className="flex items-start gap-2 md:col-span-2">
                  <XIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Cancellation</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{car.cancellation_policy}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rental Company Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Rental Company</h3>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-600 dark:text-gray-400 capitalize">
                  {car.company_name?.[0] || 'R'}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white capitalize mb-1">{car.company_name}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{car.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Booking Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-4">
            <div className="mb-6">
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                ${car.daily_rental_price}
                <span className="text-lg font-normal text-gray-500">/day</span>
              </div>
              {car.insurance_included && (
                <p className="text-sm text-green-600 dark:text-green-400">✓ Insurance included</p>
              )}
            </div>

            {/* Rental Details */}
            {searchParams.pickupDate && (
              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pick-up</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {searchParams.pickupDate} • {searchParams.pickupTime || '10:00'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{car.location}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Drop-off</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {searchParams.dropoffDate} • {searchParams.dropoffTime || '10:00'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{car.location}</div>
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            {searchParams.pickupDate && searchParams.dropoffDate && (
              <div className="space-y-2 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Rental (4 days)</span>
                  <span className="text-gray-900 dark:text-white">${(car.daily_rental_price * 4).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Taxes & Fees</span>
                  <span className="text-gray-900 dark:text-white">${(car.daily_rental_price * 4 * 0.15).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-gray-900 dark:text-white">${(car.daily_rental_price * 4 * 1.15).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Availability Status */}
            {car.availability_status ? (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <Check className="w-4 h-4" />
                  <span className="font-medium">Available for your dates</span>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                  <XIcon className="w-4 h-4" />
                  <span className="font-medium">Not available</span>
                </div>
              </div>
            )}

            {/* Book Button */}
            <button 
              onClick={() => setShowBookingModal(true)}
              disabled={!car.availability_status}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                car.availability_status
                  ? 'bg-[#FF690F] hover:bg-[#d6570c] text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              {car.availability_status ? 'Book Now' : 'Not Available'}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              You won't be charged yet
            </p>
          </div>
        </div>
      </div>

      {/* Booking Modal (placeholder) */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Booking Coming Soon</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Booking functionality will be integrated with the booking service in Phase 3.
            </p>
            <button 
              onClick={() => setShowBookingModal(false)}
              className="w-full bg-[#FF690F] hover:bg-[#d6570c] text-white py-2 rounded-lg font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
