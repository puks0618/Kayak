import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  ChevronDown, 
  ArrowRightLeft, 
  Search, 
  X, 
  Calendar,
  MapPin,
  Clock
} from 'lucide-react';
import { PiAirplaneTiltFill } from "react-icons/pi";
import { IoIosBed } from "react-icons/io";
import { IoCarSharp } from "react-icons/io5";
import { FaUmbrellaBeach } from "react-icons/fa6";
import { HiSparkles } from "react-icons/hi2";

export default function Cars() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Refs for click outside detection
  const pickupLocationRef = useRef(null);
  const dropoffLocationRef = useRef(null);
  const ageRef = useRef(null);
  const dateRef = useRef(null);
  
  // Search State
  const [pickupLocation, setPickupLocation] = useState('Los Angeles (LAX)');
  const [dropoffLocation, setDropoffLocation] = useState('Los Angeles (LAX)');
  const [sameLocation, setSameLocation] = useState(true);
  const [pickupDate, setPickupDate] = useState(new Date(2025, 11, 14)); // Dec 14, 2025
  const [pickupTime, setPickupTime] = useState('10:00');
  const [dropoffDate, setDropoffDate] = useState(new Date(2025, 11, 18)); // Dec 18, 2025
  const [dropoffTime, setDropoffTime] = useState('10:00');
  const [driverAge, setDriverAge] = useState('30');
  
  // Dropdown State
  const [showPickupDropdown, setShowPickupDropdown] = useState(false);
  const [showDropoffDropdown, setShowDropoffDropdown] = useState(false);
  const [showAgeDropdown, setShowAgeDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(null); // 'pickup' or 'dropoff'
  
  // Popular locations
  const popularLocations = [
    'Los Angeles (LAX)',
    'New York (JFK)',
    'San Francisco (SFO)',
    'Las Vegas (LAS)',
    'Miami (MIA)',
    'Chicago (ORD)',
    'Boston (BOS)',
    'Seattle (SEA)'
  ];

  // Time options
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of ['00', '30']) {
      const time = `${hour.toString().padStart(2, '0')}:${minute}`;
      const label = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${minute} ${hour < 12 ? 'AM' : 'PM'}`;
      timeOptions.push({ value: time, label });
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickupLocationRef.current && !pickupLocationRef.current.contains(e.target)) {
        setShowPickupDropdown(false);
      }
      if (dropoffLocationRef.current && !dropoffLocationRef.current.contains(e.target)) {
        setShowDropoffDropdown(false);
      }
      if (ageRef.current && !ageRef.current.contains(e.target)) {
        setShowAgeDropdown(false);
      }
      if (dateRef.current && !dateRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
      if (!e.target.closest('.time-picker')) {
        setShowTimePicker(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateDisplay = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  const formatTimeDisplay = (time) => {
    if (!time) return '';
    const [hour, minute] = time.split(':');
    const h = parseInt(hour);
    return `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${minute} ${h < 12 ? 'AM' : 'PM'}`;
  };

  const handleSearch = () => {
    const searchParams = new URLSearchParams({
      location: pickupLocation.split('(')[0].trim(),
      pickupDate: pickupDate.toISOString().split('T')[0],
      dropoffDate: dropoffDate.toISOString().split('T')[0],
      pickupTime,
      dropoffTime,
      driverAge
    });
    
    console.log('Searching cars:', {
      pickupLocation,
      dropoffLocation: sameLocation ? pickupLocation : dropoffLocation,
      pickupDate: pickupDate.toISOString().split('T')[0],
      pickupTime,
      dropoffDate: dropoffDate.toISOString().split('T')[0],
      dropoffTime,
      driverAge
    });
    
    // Navigate to results page (to be created)
    navigate(`/cars/results?${searchParams.toString()}`);
  };

  return (
    <main className="mt-4 md:mt-8">
      {/* Full-width gray background card */}
      <div className="w-full bg-[#edf0f3] dark:bg-gray-800 py-6 md:py-8">
        {/* Constrained content inside */}
        <div className="max-w-[1200px] mx-auto px-2 md:px-3 lg:px-4">
          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Search Interface */}
            <div className="lg:col-span-8">
              <h1 className="text-3xl md:text-5xl font-extrabold mb-8 leading-tight tracking-tight dark:text-white">
                Compare car rental deals from 100s of sites<span className="text-[#FF690F]">.</span>
              </h1>

              {/* Navigation Tabs */}
              <div className="flex flex-wrap gap-6 mb-6">
                <NavTab icon={<PiAirplaneTiltFill />} label="Flights" active={location.pathname === '/'} link="/" />
                <NavTab icon={<IoIosBed />} label="Stays" active={location.pathname === '/stays'} link="/stays" />
                <NavTab icon={<IoCarSharp />} label="Cars" active={location.pathname === '/cars'} link="/cars" />
                <NavTab icon={<FaUmbrellaBeach />} label="Packages" active={location.pathname === '/packages'} link="/packages" />
                <NavTab icon={<HiSparkles />} label="AI Mode" active={location.pathname === '/ai-mode'} link="/ai-mode" />
              </div>

              {/* Search Filters Row */}
              <div className="flex flex-wrap gap-4 mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded select-none">
                  <input 
                    type="checkbox" 
                    checked={sameLocation}
                    onChange={(e) => setSameLocation(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span>Return to same location</span>
                </label>
                <div className="relative age-dropdown">
                  <div 
                    className="cursor-pointer flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded select-none"
                    onClick={() => setShowAgeDropdown(!showAgeDropdown)}
                  >
                    <span>Driver age: {driverAge}</span> <ChevronDown className="w-4 h-4" />
                  </div>
                  {showAgeDropdown && (
                    <div className="absolute top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 z-50 min-w-[200px]">
                      <label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">Driver's age</label>
                      <select 
                        value={driverAge}
                        onChange={(e) => {
                          setDriverAge(e.target.value);
                          setShowAgeDropdown(false);
                        }}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {Array.from({length: 64}, (_, i) => i + 18).map(age => (
                          <option key={age} value={age}>{age}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Search Bar */}
              <div className="flex flex-col md:flex-row bg-gray-200 dark:bg-gray-700 p-[2px] md:p-[2px] rounded-xl shadow-sm md:shadow-none gap-[2px]">
                
                {/* Pickup Location */}
                <div className="flex-1 relative location-dropdown bg-white dark:bg-gray-800 rounded-t-lg md:rounded-l-lg md:rounded-tr-none hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="p-3.5">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pick-up location</div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <input 
                        type="text"
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        onFocus={() => setShowPickupDropdown(true)}
                        placeholder="City, airport, station, etc."
                        className="flex-1 bg-transparent outline-none font-medium text-gray-900 dark:text-white text-[15px]"
                      />
                      {pickupLocation && (
                        <X 
                          className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" 
                          onClick={() => setPickupLocation('')} 
                        />
                      )}
                    </div>
                  </div>
                  {showPickupDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 z-50 max-h-[300px] overflow-y-auto">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Popular locations</div>
                      {popularLocations
                        .filter(loc => !pickupLocation || loc.toLowerCase().includes(pickupLocation.toLowerCase()))
                        .map(loc => (
                          <div 
                            key={loc}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer text-sm"
                            onClick={() => {
                              setPickupLocation(loc);
                              setShowPickupDropdown(false);
                              if (sameLocation) setDropoffLocation(loc);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900 dark:text-white">{loc}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                  {/* Swap Button */}
                  {!sameLocation && (
                    <div 
                      className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full p-1.5 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-gray-600 dark:text-gray-300"
                      onClick={() => {
                        const temp = pickupLocation;
                        setPickupLocation(dropoffLocation);
                        setDropoffLocation(temp);
                      }}
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Drop-off Location (only if different location) */}
                {!sameLocation && (
                  <div className="flex-1 relative location-dropdown bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="p-3.5 md:pl-5">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Drop-off location</div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <input 
                          type="text"
                          value={dropoffLocation}
                          onChange={(e) => setDropoffLocation(e.target.value)}
                          onFocus={() => setShowDropoffDropdown(true)}
                          placeholder="City, airport, station, etc."
                          className="flex-1 bg-transparent outline-none font-medium text-gray-900 dark:text-white text-[15px]"
                        />
                        {dropoffLocation && (
                          <X 
                            className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" 
                            onClick={() => setDropoffLocation('')} 
                          />
                        )}
                      </div>
                    </div>
                    {showDropoffDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 z-50 max-h-[300px] overflow-y-auto">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Popular locations</div>
                        {popularLocations
                          .filter(loc => !dropoffLocation || loc.toLowerCase().includes(dropoffLocation.toLowerCase()))
                          .map(loc => (
                            <div 
                              key={loc}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer text-sm"
                              onClick={() => {
                                setDropoffLocation(loc);
                                setShowDropoffDropdown(false);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-900 dark:text-white">{loc}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Pickup Date & Time */}
                <div className="flex-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="p-3.5 md:pl-5">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pick-up</div>
                    <div className="flex gap-2">
                      <input 
                        type="date"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        className="flex-1 bg-transparent outline-none font-medium text-gray-900 dark:text-white text-[15px] cursor-pointer"
                      />
                      <input 
                        type="time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="bg-transparent outline-none font-medium text-gray-900 dark:text-white text-[15px] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Drop-off Date & Time */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-b-lg md:rounded-none hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="p-3.5 md:pl-5">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Drop-off</div>
                    <div className="flex gap-2">
                      <input 
                        type="date"
                        value={dropoffDate}
                        onChange={(e) => setDropoffDate(e.target.value)}
                        className="flex-1 bg-transparent outline-none font-medium text-gray-900 dark:text-white text-[15px] cursor-pointer"
                      />
                      <input 
                        type="time"
                        value={dropoffTime}
                        onChange={(e) => setDropoffTime(e.target.value)}
                        className="bg-transparent outline-none font-medium text-gray-900 dark:text-white text-[15px] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Search Button */}
                <div 
                  onClick={handleSearch}
                  className="bg-[#FF690F] hover:bg-[#d6570c] md:rounded-r-lg md:rounded-l-none rounded-lg md:w-[70px] flex items-center justify-center transition-colors cursor-pointer p-3 md:p-0 mt-[2px] md:mt-0"
                >
                  <Search className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>
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
      className="flex flex-col items-center gap-1.5 cursor-pointer select-none"
      onClick={() => link && navigate(link)}
    >
      <div className={`
        w-14 h-14 rounded-lg flex items-center justify-center shadow-sm transition-all
        ${active ? 'bg-[#FF690F] text-white' : 'bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-200 dark:border-gray-600'}
      `}>
        <div className="text-2xl">
          {icon}
        </div>
      </div>
      <span className={`font-medium text-xs ${active ? 'text-[#FF690F]' : 'text-gray-900 dark:text-white'}`}>
        {label}
      </span>
    </div>
  );
}
