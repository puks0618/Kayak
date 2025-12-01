import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronUp,
  Star,
  Users,
  Briefcase,
  Settings,
  Fuel,
  MapPin,
  X
} from 'lucide-react';

export default function CarResults() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState({});
  
  // Filter states
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedTransmission, setSelectedTransmission] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState('price_asc');
  
  // Collapsible sections
  const [showFilters, setShowFilters] = useState({
    type: true,
    price: true,
    company: true,
    transmission: true,
    features: false
  });

  useEffect(() => {
    // Get search results from navigation state or fetch from API
    if (location.state?.searchResults) {
      setCars(location.state.searchResults.cars || []);
      setSearchParams(location.state.searchParams || {});
      setLoading(false);
    } else {
      // Fetch from API if no state
      fetchCars();
    }
  }, [location]);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(location.search);
      const response = await fetch(`http://localhost:3003/api/listings/cars/search?${queryParams.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setCars(data.cars || []);
        setSearchParams(Object.fromEntries(queryParams));
      } else {
        setError('Failed to load cars');
      }
    } catch (err) {
      setError('Error loading cars: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort cars
  const filteredCars = cars
    .filter(car => {
      if (selectedTypes.length > 0 && !selectedTypes.includes(car.type?.toLowerCase())) return false;
      if (selectedCompanies.length > 0 && !selectedCompanies.includes(car.rental_company?.toLowerCase())) return false;
      if (selectedTransmission.length > 0 && !selectedTransmission.includes(car.transmission?.toLowerCase())) return false;
      if (car.price_per_day < priceRange[0] || car.price_per_day > priceRange[1]) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price_per_day - b.price_per_day;
        case 'price_desc':
          return b.price_per_day - a.price_per_day;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

  const toggleFilter = (section) => {
    setShowFilters(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleTypeFilter = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleCompanyFilter = (company) => {
    setSelectedCompanies(prev => 
      prev.includes(company) ? prev.filter(c => c !== company) : [...prev, company]
    );
  };

  const toggleTransmissionFilter = (transmission) => {
    setSelectedTransmission(prev => 
      prev.includes(transmission) ? prev.filter(t => t !== transmission) : [...prev, transmission]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedCompanies([]);
    setSelectedTransmission([]);
    setPriceRange([0, 500]);
  };

  // Get unique values for filters
  const carTypes = [...new Set(cars.map(car => car.type?.toLowerCase()).filter(Boolean))];
  const companies = [...new Set(cars.map(car => car.rental_company?.toLowerCase()).filter(Boolean))];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF690F] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Searching for cars...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/cars')}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF690F] mb-2"
        >
          ← Back to search
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {searchParams.location || 'Car'} Rentals
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {searchParams.pickupDate} - {searchParams.dropoffDate} • {filteredCars.length} cars available
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky top-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Filters</h2>
              {(selectedTypes.length > 0 || selectedCompanies.length > 0 || selectedTransmission.length > 0) && (
                <button 
                  onClick={clearFilters}
                  className="text-xs text-[#FF690F] hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort by
              </label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Rating</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <div 
                className="flex justify-between items-center cursor-pointer mb-2"
                onClick={() => toggleFilter('price')}
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Price per day</span>
                {showFilters.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
              {showFilters.price && (
                <div className="space-y-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="500" 
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>$0</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Car Type */}
            {carTypes.length > 0 && (
              <div className="mb-6">
                <div 
                  className="flex justify-between items-center cursor-pointer mb-2"
                  onClick={() => toggleFilter('type')}
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Car type</span>
                  {showFilters.type ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
                {showFilters.type && (
                  <div className="space-y-2">
                    {carTypes.map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input 
                          type="checkbox"
                          checked={selectedTypes.includes(type)}
                          onChange={() => toggleTypeFilter(type)}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="text-gray-700 dark:text-gray-300 capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Transmission */}
            <div className="mb-6">
              <div 
                className="flex justify-between items-center cursor-pointer mb-2"
                onClick={() => toggleFilter('transmission')}
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Transmission</span>
                {showFilters.transmission ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
              {showFilters.transmission && (
                <div className="space-y-2">
                  {['automatic', 'manual'].map(trans => (
                    <label key={trans} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input 
                        type="checkbox"
                        checked={selectedTransmission.includes(trans)}
                        onChange={() => toggleTransmissionFilter(trans)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-gray-700 dark:text-gray-300 capitalize">{trans}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Rental Company */}
            {companies.length > 0 && (
              <div className="mb-6">
                <div 
                  className="flex justify-between items-center cursor-pointer mb-2"
                  onClick={() => toggleFilter('company')}
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rental company</span>
                  {showFilters.company ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
                {showFilters.company && (
                  <div className="space-y-2">
                    {companies.map(company => (
                      <label key={company} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input 
                          type="checkbox"
                          checked={selectedCompanies.includes(company)}
                          onChange={() => toggleCompanyFilter(company)}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="text-gray-700 dark:text-gray-300 capitalize">{company}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Car List */}
        <div className="lg:col-span-3 space-y-4">
          {filteredCars.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">No cars match your filters. Try adjusting your search criteria.</p>
            </div>
          ) : (
            filteredCars.map(car => (
              <CarCard key={car.id} car={car} searchParams={searchParams} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CarCard({ car, searchParams }) {
  const navigate = useNavigate();
  
  const images = typeof car.images === 'string' ? JSON.parse(car.images) : car.images || [];
  const features = typeof car.features === 'string' ? JSON.parse(car.features) : car.features || [];
  const mainImage = images[0] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {/* Car Image */}
        <div className="md:col-span-1">
          <img 
            src={mainImage}
            alt={`${car.make} ${car.model}`}
            className="w-full h-48 object-cover rounded-lg cursor-pointer"
            onClick={() => navigate(`/cars/${car.id}`, { state: { searchParams } })}
          />
        </div>

        {/* Car Details */}
        <div className="md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {car.make} {car.model} <span className="text-sm font-normal text-gray-500">or similar</span>
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{car.type}</p>
              </div>
              {car.rating && (
                <div className="flex items-center gap-1 bg-[#FF690F] text-white px-2 py-1 rounded text-sm font-semibold">
                  <Star className="w-3 h-3 fill-current" />
                  {car.rating}
                </div>
              )}
            </div>

            {/* Car Specs */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{car.seating_capacity} seats</span>
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                <span>{car.baggage_capacity || 2} bags</span>
              </div>
              <div className="flex items-center gap-1">
                <Settings className="w-4 h-4" />
                <span className="capitalize">{car.transmission}</span>
              </div>
              {car.fuel_type && (
                <div className="flex items-center gap-1">
                  <Fuel className="w-4 h-4" />
                  <span className="capitalize">{car.fuel_type}</span>
                </div>
              )}
            </div>

            {/* Features */}
            {features.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {features.slice(0, 4).map((feature, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                    {feature}
                  </span>
                ))}
                {features.length > 4 && (
                  <span className="text-xs text-gray-500">+{features.length - 4} more</span>
                )}
              </div>
            )}

            {/* Company & Location */}
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium capitalize">{car.rental_company}</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{car.location}</span>
              </div>
            </div>
          </div>

          {/* Price & Action */}
          <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ${car.price_per_day}
                <span className="text-sm font-normal text-gray-500">/day</span>
              </div>
              {car.insurance_included && (
                <p className="text-xs text-green-600 dark:text-green-400">✓ Insurance included</p>
              )}
            </div>
            <button 
              onClick={() => navigate(`/cars/${car.id}`, { state: { searchParams } })}
              className="bg-[#FF690F] hover:bg-[#d6570c] text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              View details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
