import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { searchFlights, updateSearchForm, addRecentSearch } from '../store/slices/flightsSlice';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  Menu, 
  Heart, 
  ChevronDown, 
  ArrowRightLeft, 
  Search, 
  X, 
  Calendar,
  Plane
} from 'lucide-react';
import { PiAirplaneTiltFill } from "react-icons/pi";
import { IoIosBed } from "react-icons/io";
import { IoCarSharp } from "react-icons/io5";
import { FaUmbrellaBeach, FaFlag, FaDollarSign } from "react-icons/fa6";
import { HiSparkles, HiOutlineLogout } from "react-icons/hi2";
import { ImUserPlus } from "react-icons/im";
import kayakLogo from "../assets/images/kayak logo.png";

// Mock airports data
const AIRPORTS = [
  { code: 'SFO', city: 'San Francisco', name: 'San Francisco International', state: 'California', country: 'United States' },
  { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles International', state: 'California', country: 'United States' },
  { code: 'SJC', city: 'San Jose', name: 'Norman Y. Mineta San Jose International', state: 'California', country: 'United States' },
  { code: 'SAN', city: 'San Diego', name: 'San Diego International', state: 'California', country: 'United States' },
  { code: 'SAT', city: 'San Antonio', name: 'San Antonio International', state: 'Texas', country: 'United States' },
  { code: 'JFK', city: 'New York', name: 'John F. Kennedy International', state: 'New York', country: 'United States' },
  { code: 'NYC', city: 'New York', name: 'All airports', state: 'New York', country: 'United States' },
  { code: 'LAV', city: 'Las Vegas', name: 'Harry Reid Intl', state: 'Nevada', country: 'United States' },
  { code: 'HNL', city: 'Honolulu', name: 'Daniel K. Inouye International', state: 'Hawaii', country: 'United States' },
  { code: 'TYO', city: 'Tokyo', name: 'All airports', state: '', country: 'Japan' },
];

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  // State management
  const [tripType, setTripType] = useState('roundtrip');
  const [bags, setBags] = useState(0);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState(new Date('2025-12-04'));
  const [returnDate, setReturnDate] = useState(new Date('2025-12-11'));
  
  // Travelers state
  const [adults, setAdults] = useState(1);
  const [students, setStudents] = useState(0);
  const [seniors, setSeniors] = useState(0);
  const [youths, setYouths] = useState(0);
  const [children, setChildren] = useState(0);
  const [toddlers, setToddlers] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState('economy');
  
  // UI state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTravelersPicker, setShowTravelersPicker] = useState(false);
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  
  // Refs for click outside
  const originRef = useRef(null);
  const destRef = useRef(null);
  const dateRef = useRef(null);
  const travelersRef = useRef(null);
  
  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (originRef.current && !originRef.current.contains(event.target)) {
        setShowOriginDropdown(false);
      }
      if (destRef.current && !destRef.current.contains(event.target)) {
        setShowDestDropdown(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
      if (travelersRef.current && !travelersRef.current.contains(event.target)) {
        setShowTravelersPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Filter airports
  const filteredOrigins = AIRPORTS.filter(airport =>
    airport.city.toLowerCase().includes(originSearch.toLowerCase()) ||
    airport.code.toLowerCase().includes(originSearch.toLowerCase()) ||
    airport.name.toLowerCase().includes(originSearch.toLowerCase())
  );
  
  const filteredDestinations = AIRPORTS.filter(airport =>
    airport.city.toLowerCase().includes(destSearch.toLowerCase()) ||
    airport.code.toLowerCase().includes(destSearch.toLowerCase()) ||
    airport.name.toLowerCase().includes(destSearch.toLowerCase())
  );
  
  // Calculate total travelers
  const totalTravelers = adults + students + seniors + youths + children + toddlers + infants;
  
  // Format travelers display
  const getTravelersDisplay = () => {
    if (totalTravelers === 1 && adults === 1) {
      return `1 adult, ${cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1)}`;
    }
    return `${totalTravelers} ${totalTravelers === 1 ? 'traveler' : 'travelers'}, ${cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1)}`;
  };
  
  // Handle search
  const handleSearch = async () => {
    if (!origin || !destination) {
      alert('Please select origin and destination');
      return;
    }
    
    const searchParams = {
      tripType,
      origin,
      destination,
      departureDate: departureDate.toISOString().split('T')[0],
      returnDate: tripType === 'roundtrip' ? returnDate.toISOString().split('T')[0] : null,
      adults,
      cabinClass
    };
    
    dispatch(updateSearchForm(searchParams));
    await dispatch(searchFlights(searchParams));
    dispatch(addRecentSearch(searchParams));
    
    navigate('/flights/results');
  };
  
  // Swap origin and destination
  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    const tempSearch = originSearch;
    setOriginSearch(destSearch);
    setDestSearch(tempSearch);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Sidebar Menu */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 overflow-y-auto pt-16">
            <div className="p-4">
              <div className="mb-6">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Categories
                </div>
                <SidebarMenuItem icon={<PiAirplaneTiltFill />} label="Flights" active={location.pathname === '/'} onClick={() => navigate('/')} />
                <SidebarMenuItem icon={<IoIosBed />} label="Stays" onClick={() => navigate('/stays')} />
                <SidebarMenuItem icon={<IoCarSharp />} label="Cars" onClick={() => navigate('/cars')} />
                <SidebarMenuItem icon={<FaUmbrellaBeach />} label="Packages" onClick={() => navigate('/packages')} />
                <SidebarMenuItem icon={<HiSparkles />} label="AI Mode" isNew onClick={() => navigate('/ai-mode')} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            className="p-1 hover:bg-gray-100 rounded"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <div className="h-8 md:h-10 w-32 md:w-40 overflow-hidden relative flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src={kayakLogo} 
              alt="KAYAK" 
              className="w-full h-full object-contain object-left"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 relative">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Heart className="w-5 h-5 text-gray-700" />
          </button>
          <button 
            className="p-1 relative"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-semibold text-sm">
              K
            </div>
          </button>
          
          {/* User Menu */}
          {isUserMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-12 w-72 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                      K
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Keith</div>
                      <div className="text-sm text-gray-600">keith@example.com</div>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-200">
                  <button 
                    onClick={() => navigate('/login')}
                    className="w-full py-2.5 px-4 border border-gray-300 rounded-lg font-semibold text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <HiOutlineLogout className="w-5 h-5" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="mt-4 md:mt-8">
        <div className="w-full bg-[#edf0f3] py-6 md:py-8">
          <div className="max-w-[1400px] mx-auto px-4">
            
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-extrabold mb-8 leading-tight">
              Compare flight deals from 100s of sites<span className="text-[#FF690F]">.</span>
            </h1>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-6 mb-6">
              <NavTab icon={<PiAirplaneTiltFill />} label="Flights" active />
              <NavTab icon={<IoIosBed />} label="Stays" onClick={() => navigate('/stays')} />
              <NavTab icon={<IoCarSharp />} label="Cars" onClick={() => navigate('/cars')} />
              <NavTab icon={<FaUmbrellaBeach />} label="Packages" onClick={() => navigate('/packages')} />
              <NavTab icon={<HiSparkles />} label="AI Mode" onClick={() => navigate('/ai-mode')} />
            </div>

            {/* Search Filters */}
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              <TripTypeDropdown value={tripType} onChange={setTripType} />
              <BagsDropdown value={bags} onChange={setBags} />
            </div>

            {/* Main Search Bar */}
            <div className="bg-white rounded-xl shadow-lg p-1 flex flex-wrap md:flex-nowrap gap-1">
              
              {/* Origin Input */}
              <div ref={originRef} className="flex-1 min-w-[200px] relative">
                <div 
                  className="p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => {
                    setShowOriginDropdown(true);
                    setShowDestDropdown(false);
                    setShowDatePicker(false);
                    setShowTravelersPicker(false);
                  }}
                >
                  <input
                    type="text"
                    placeholder="From?"
                    value={origin ? `${origin}` : originSearch}
                    onChange={(e) => {
                      setOriginSearch(e.target.value);
                      setOrigin('');
                      setShowOriginDropdown(true);
                    }}
                    className="w-full text-lg font-medium outline-none bg-transparent"
                  />
                  {origin && (
                    <div className="text-sm text-gray-600">
                      {AIRPORTS.find(a => a.code === origin)?.city}
                    </div>
                  )}
                </div>
                
                {/* Swap Button */}
                <button
                  onClick={handleSwap}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 shadow-md z-20"
                >
                  <ArrowRightLeft className="w-4 h-4 text-gray-600" />
                </button>
                
                {/* Origin Dropdown */}
                {showOriginDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[400px] overflow-y-auto z-50">
                    {filteredOrigins.map(airport => (
                      <div
                        key={airport.code}
                        className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          setOrigin(airport.code);
                          setOriginSearch('');
                          setShowOriginDropdown(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Plane className="w-6 h-6 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{airport.city}, {airport.state || airport.country}</div>
                            <div className="text-sm text-gray-600">{airport.name}</div>
                          </div>
                          <div className="text-lg font-bold text-gray-700">{airport.code}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination Input */}
              <div ref={destRef} className="flex-1 min-w-[200px] relative">
                <div 
                  className="p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => {
                    setShowDestDropdown(true);
                    setShowOriginDropdown(false);
                    setShowDatePicker(false);
                    setShowTravelersPicker(false);
                  }}
                >
                  <input
                    type="text"
                    placeholder="To?"
                    value={destination ? `${destination}` : destSearch}
                    onChange={(e) => {
                      setDestSearch(e.target.value);
                      setDestination('');
                      setShowDestDropdown(true);
                    }}
                    className="w-full text-lg font-medium outline-none bg-transparent"
                  />
                  {destination && (
                    <div className="text-sm text-gray-600">
                      {AIRPORTS.find(a => a.code === destination)?.city}
                    </div>
                  )}
                </div>
                
                {/* Destination Dropdown */}
                {showDestDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[400px] overflow-y-auto z-50">
                    {filteredDestinations.map(airport => (
                      <div
                        key={airport.code}
                        className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          setDestination(airport.code);
                          setDestSearch('');
                          setShowDestDropdown(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Plane className="w-6 h-6 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{airport.city}, {airport.state || airport.country}</div>
                            <div className="text-sm text-gray-600">{airport.name}</div>
                          </div>
                          <div className="text-lg font-bold text-gray-700">{airport.code}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Picker */}
              <div ref={dateRef} className="flex-1 min-w-[250px] relative">
                <div 
                  className="p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => {
                    setShowDatePicker(true);
                    setShowOriginDropdown(false);
                    setShowDestDropdown(false);
                    setShowTravelersPicker(false);
                  }}
                >
                  <div className="text-lg font-medium">
                    {departureDate.toLocaleDateString('en-US', { weekday: 'short', month: '2-digit', day: '2-digit' })}
                    {tripType === 'roundtrip' && (
                      <> — {returnDate.toLocaleDateString('en-US', { weekday: 'short', month: '2-digit', day: '2-digit' })}</>
                    )}
                  </div>
                </div>
                
                {/* Date Picker Dropdown */}
                {showDatePicker && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50">
                    <div className="flex gap-4">
                      <div>
                        <div className="text-sm font-semibold mb-2">Departure</div>
                        <DatePicker
                          selected={departureDate}
                          onChange={(date) => setDepartureDate(date)}
                          inline
                          minDate={new Date()}
                        />
                      </div>
                      {tripType === 'roundtrip' && (
                        <div>
                          <div className="text-sm font-semibold mb-2">Return</div>
                          <DatePicker
                            selected={returnDate}
                            onChange={(date) => setReturnDate(date)}
                            inline
                            minDate={departureDate}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Travelers Picker */}
              <div ref={travelersRef} className="flex-1 min-w-[200px] relative">
                <div 
                  className="p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => {
                    setShowTravelersPicker(true);
                    setShowOriginDropdown(false);
                    setShowDestDropdown(false);
                    setShowDatePicker(false);
                  }}
                >
                  <div className="text-lg font-medium">{getTravelersDisplay()}</div>
                </div>
                
                {/* Travelers Dropdown */}
                {showTravelersPicker && (
                  <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 p-6 z-50 w-[400px]">
                    <div className="space-y-4">
                      <div className="text-xl font-bold mb-4">Travelers</div>
                      
                      <TravelerCounter label="Adults" sublabel="18-64" value={adults} onChange={setAdults} min={1} />
                      <TravelerCounter label="Students" sublabel="over 18" value={students} onChange={setStudents} />
                      <TravelerCounter label="Seniors" sublabel="over 65" value={seniors} onChange={setSeniors} />
                      <TravelerCounter label="Youths" sublabel="12-17" value={youths} onChange={setYouths} />
                      <TravelerCounter label="Children" sublabel="2-11" value={children} onChange={setChildren} />
                      <TravelerCounter label="Toddlers in own seat" sublabel="under 2" value={toddlers} onChange={setToddlers} />
                      <TravelerCounter label="Infants on lap" sublabel="under 2" value={infants} onChange={setInfants} />
                      
                      <div className="pt-4 border-t border-gray-200">
                        <div className="text-xl font-bold mb-4">Cabin Class</div>
                        <div className="grid grid-cols-2 gap-2">
                          <CabinButton label="Economy" active={cabinClass === 'economy'} onClick={() => setCabinClass('economy')} />
                          <CabinButton label="Premium Economy" active={cabinClass === 'premium_economy'} onClick={() => setCabinClass('premium_economy')} />
                          <CabinButton label="Business" active={cabinClass === 'business'} onClick={() => setCabinClass('business')} />
                          <CabinButton label="First" active={cabinClass === 'first'} onClick={() => setCabinClass('first')} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Button */}
              <button 
                onClick={handleSearch}
                className="bg-[#FF690F] hover:bg-[#d6570c] rounded-lg px-8 py-4 flex items-center justify-center transition-colors"
              >
                <Search className="w-6 h-6 text-white" strokeWidth={2.5} />
              </button>
            </div>

            {/* Direct flights only checkbox */}
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="direct" className="w-4 h-4" />
              <label htmlFor="direct" className="text-sm text-gray-700 cursor-pointer">Direct flights only</label>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper Components
function NavTab({ icon, label, active, onClick }) {
  return (
    <div 
      className={`flex flex-col items-center gap-1.5 cursor-pointer select-none ${onClick ? '' : 'pointer-events-none'}`}
      onClick={onClick}
    >
      <div className={`
        w-14 h-14 rounded-lg flex items-center justify-center shadow-sm transition-all
        ${active ? 'bg-[#FF690F] text-white' : 'bg-white text-black border border-gray-200'}
      `}>
        <div className="text-2xl">{icon}</div>
      </div>
      <span className={`font-medium text-xs ${active ? 'text-[#FF690F]' : 'text-gray-900'}`}>
        {label}
      </span>
    </div>
  );
}

function SidebarMenuItem({ icon, label, active, isNew, onClick }) {
  return (
    <div 
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors select-none
        ${active ? 'bg-[#FF690F] text-white' : 'hover:bg-gray-100 text-gray-900'}
      `}
      onClick={onClick}
    >
      {icon && <div className="text-lg">{icon}</div>}
      <span className="font-medium text-sm flex-1">{label}</span>
      {isNew && (
        <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-[9px] text-white px-1.5 py-0.5 rounded-full font-bold">
          NEW
        </span>
      )}
    </div>
  );
}

function TripTypeDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span className="font-medium text-gray-700 capitalize">
          {value === 'roundtrip' ? 'Round-trip' : 'One-way'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-600" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[150px]">
          <button
            onClick={() => { onChange('roundtrip'); setIsOpen(false); }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700"
          >
            Round-trip
          </button>
          <button
            onClick={() => { onChange('oneway'); setIsOpen(false); }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700"
          >
            One-way
          </button>
        </div>
      )}
    </div>
  );
}

function BagsDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span className="font-medium text-gray-700">{value} bags</span>
        <ChevronDown className="w-4 h-4 text-gray-600" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[120px]">
          {[0, 1, 2, 3].map(num => (
            <button
              key={num}
              onClick={() => { onChange(num); setIsOpen(false); }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700"
            >
              {num} {num === 1 ? 'bag' : 'bags'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TravelerCounter({ label, sublabel, value, onChange, min = 0 }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-gray-900">{label}</div>
        <div className="text-sm text-gray-600">{sublabel}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          −
        </button>
        <span className="w-6 text-center font-semibold">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50"
        >
          +
        </button>
      </div>
    </div>
  );
}

function CabinButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
        active 
          ? 'border-gray-900 bg-gray-50' 
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      {label}
    </button>
  );
}

