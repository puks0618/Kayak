import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronDown, 
  Search
} from 'lucide-react';
import { PiAirplaneTiltFill } from "react-icons/pi";
import { IoIosBed } from "react-icons/io";
import { IoCarSharp } from "react-icons/io5";
import { FaUmbrellaBeach } from "react-icons/fa6";
import { HiSparkles } from "react-icons/hi2";
import LocationInput from '../components/LocationInput';
import DateTimePicker from '../components/DateTimePicker';

const DEFAULT_CAR_CITIES = [
  'Los Angeles, CA',
  'New York, NY',
  'Miami, FL',
  'Las Vegas, NV',
  'San Francisco, CA',
  'Chicago, IL',
  'Orlando, FL',
  'Seattle, WA',
  'Boston, MA',
  'Denver, CO'
];

export default function Cars() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Search state
  const [sameDropOff, setSameDropOff] = useState(true);
  const [suvsOnly, setSuvsOnly] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [pickupDate, setPickupDate] = useState(null);
  const [pickupTime, setPickupTime] = useState('Noon');
  const [dropoffDate, setDropoffDate] = useState(null);
  const [dropoffTime, setDropoffTime] = useState('Noon');
  const [carCities, setCarCities] = useState([]);

  // Fetch car cities on component mount
  useEffect(() => {
    const fetchCarCities = async () => {
      try {
        console.log('Fetching car cities...');
        const response = await fetch('http://localhost:3000/api/listings/cars/cities');
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Fetched car cities:', data);
        
        if (data.cities && Array.isArray(data.cities)) {
          setCarCities(data.cities);
          console.log('Set car cities:', data.cities.length, 'cities');
        } else {
          console.warn('No cities in response or invalid format:', data);
        }
      } catch (error) {
        console.error('Failed to fetch car cities:', error);
        // Keep empty array as fallback
      }
    };
    
    fetchCarCities();
  }, []);

  // Swap locations
  const handleSwapLocations = () => {
    const temp = pickupLocation;
    setPickupLocation(dropoffLocation);
    setDropoffLocation(temp);
  };

  // Handle search
  const handleSearch = () => {
    if (!pickupLocation) {
      alert('Please enter a pickup location');
      return;
    }
    if (!sameDropOff && !dropoffLocation) {
      alert('Please enter a drop-off location');
      return;
    }
    if (!pickupDate || !dropoffDate) {
      alert('Please select pickup and drop-off dates');
      return;
    }
    
    // Build search query params
    const searchParams = new URLSearchParams({
      location: pickupLocation,
      pickupDate: pickupDate.toISOString().split('T')[0],
      dropoffDate: dropoffDate.toISOString().split('T')[0],
      pickupTime,
      dropoffTime,
    });
    
    if (suvsOnly) {
      searchParams.append('type', 'suv');
    }
    
    if (!sameDropOff) {
      searchParams.append('dropoffLocation', dropoffLocation);
    }
    
    // Navigate to search results
    navigate(`/cars/search?${searchParams.toString()}`);
  };

  return (
    <main className="mt-4 md:mt-8">
      {/* Hero Section */}
      <div className="w-full bg-[#edf0f3] dark:bg-gray-800 py-6 md:py-8">
        <div className="max-w-[1200px] mx-auto px-2 md:px-3 lg:px-4">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-8 leading-tight tracking-tight dark:text-white">
            Compare rental cars from 100s of sites<span className="text-[#FF690F]">.</span>
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Search Interface */}
            <div className="lg:col-span-8">
              {/* Navigation Tabs */}
              <div className="flex flex-wrap gap-6 mb-6">
                <NavTab icon={<PiAirplaneTiltFill />} label="Flights" active={location.pathname === '/'} link="/" />
                <NavTab icon={<IoIosBed />} label="Stays" active={location.pathname === '/stays'} link="/stays" />
                <NavTab icon={<IoCarSharp />} label="Cars" active={location.pathname === '/cars'} link="/cars" />
                <NavTab icon={<FaUmbrellaBeach />} label="Packages" active={location.pathname === '/packages'} link="/packages" />
                <NavTab icon={<HiSparkles />} label="AI Mode" active={location.pathname === '/ai-mode'} link="/ai-mode" />
              </div>

              {/* Search options */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={sameDropOff}
                      onChange={(e) => setSameDropOff(e.target.checked)}
                      className="w-[16px] h-[16px] text-[#FF690F] bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-[#FF690F] focus:ring-2 cursor-pointer transition-all"
                    />
                  </div>
                  <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    Same drop-off
                  </span>
                </label>
                
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={suvsOnly}
                    onChange={(e) => setSuvsOnly(e.target.checked)}
                    className="w-[16px] h-[16px] text-[#FF690F] bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-[#FF690F] focus:ring-2 cursor-pointer transition-all"
                  />
                  <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    SUVs only
                  </span>
                </label>
              </div>

              {/* Main Search Bar */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-visible">
                <div className="bg-gray-50 dark:bg-gray-900 p-[3px] rounded-2xl overflow-visible">
                  {/* Pickup Location and Drop-off Location Row */}
                  <div className="flex flex-col md:flex-row gap-[3px] mb-[3px] overflow-visible">
                    <div className="flex flex-col md:flex-row flex-1 gap-[3px] rounded-t-xl md:rounded-l-xl md:rounded-tr-none overflow-visible">
                      <LocationInput
                        label="Pick-up"
                        value={pickupLocation}
                        onChange={setPickupLocation}
                        placeholder="Pick-up location?"
                        showSwapButton={!sameDropOff}
                        onSwap={handleSwapLocations}
                        cities={carCities.length > 0 ? carCities : DEFAULT_CAR_CITIES}
                      />
                      
                      {!sameDropOff && (
                        <LocationInput
                          label="Drop-off"
                          value={dropoffLocation}
                          onChange={setDropoffLocation}
                          placeholder="Drop-off location?"
                          cities={carCities.length > 0 ? carCities : DEFAULT_CAR_CITIES}
                        />
                      )}
                    </div>
                  </div>

                  {/* Date and Time Row */}
                  <div className="flex flex-col md:flex-row gap-[3px]">
                    <DateTimePicker
                      label="Pick-up"
                      selectedDate={pickupDate}
                      selectedTime={pickupTime}
                      onDateChange={setPickupDate}
                      onTimeChange={setPickupTime}
                      placeholder="Select pick-up date"
                      showBorder={true}
                    />
                    
                    <DateTimePicker
                      label="Drop-off"
                      selectedDate={dropoffDate}
                      selectedTime={dropoffTime}
                      onDateChange={setDropoffDate}
                      onTimeChange={setDropoffTime}
                      placeholder="Select drop-off date"
                      minDate={pickupDate || new Date()}
                      showBorder={false}
                    />

                    {/* Search Button */}
                    <button
                      onClick={handleSearch}
                      className="bg-gradient-to-r from-[#FF690F] to-[#FF8534] hover:from-[#d6570c] hover:to-[#d6570c] md:rounded-r-xl rounded-b-xl md:rounded-bl-none md:w-[80px] flex items-center justify-center transition-all duration-300 cursor-pointer p-4 md:p-0 font-bold text-white shadow-lg hover:shadow-2xl transform hover:scale-[1.03] active:scale-[0.97]"
                    >
                      <Search className="w-7 h-7 md:w-8 md:h-8" strokeWidth={2.8} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Help Text */}
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center md:text-left">
                💡 <span className="font-medium">Pro tip:</span> Prices tend to be lower on weekdays and for longer rental periods
              </p>
            </div>

            {/* Right Column: Image Grid */}
            <div className="lg:col-span-4 hidden lg:block">
              <div className="grid grid-cols-2 gap-3 h-full max-h-[380px]">
                <div className="col-span-1 row-span-1 overflow-hidden rounded-xl relative group cursor-pointer">
                  <img 
                    src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop" 
                    alt="Plane Wing" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="col-span-1 overflow-hidden rounded-xl relative group cursor-pointer">
                  <img 
                    src="https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?q=80&w=800&auto=format&fit=crop" 
                    alt="City" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="col-span-1 overflow-hidden rounded-xl relative group cursor-pointer">
                  <img 
                    src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop" 
                    alt="Traveler" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="col-span-1 row-span-2 overflow-hidden rounded-xl relative group -mt-12 cursor-pointer">
                  <img 
                    src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop" 
                    alt="Nature" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="col-span-1 overflow-hidden rounded-xl relative group h-24 cursor-pointer">
                  <img 
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop" 
                    alt="Beach" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Navigation Tab Component
function NavTab({ icon, label, active, link }) {
  const navigate = useNavigate();
  
  return (
    <div 
      className="flex flex-col items-center gap-2 cursor-pointer select-none group"
      onClick={() => link && navigate(link)}
    >
      <div className={`
        w-16 h-16 rounded-xl flex items-center justify-center shadow-md transition-all duration-300 transform
        ${active 
          ? 'bg-gradient-to-br from-[#FF690F] to-[#FF8534] text-white scale-105 shadow-lg' 
          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 group-hover:border-[#FF690F] dark:group-hover:border-[#FF690F] group-hover:scale-105'
        }
      `}>
        <div className="text-3xl">
          {icon}
        </div>
      </div>
      <span className={`font-semibold text-[13px] transition-colors ${active ? 'text-[#FF690F]' : 'text-gray-700 dark:text-gray-300 group-hover:text-[#FF690F]'}`}>
        {label}
      </span>
    </div>
  );
}
