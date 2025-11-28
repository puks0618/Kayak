import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { searchFlights, updateSearchForm, addRecentSearch } from '../store/slices/flightsSlice';
import { getFlightDeals } from '../services/flightsApi';
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
import { HiSparkles } from "react-icons/hi2";
import { HiOutlineLogout } from "react-icons/hi";
import { ImUserPlus } from "react-icons/im";
import kayakLogo from "../assets/images/kayak logo.png";
import DarkModeToggle from "../components/DarkModeToggle";

// Mock airports data with images
const AIRPORTS = [
  { 
    code: 'SFO', 
    city: 'San Francisco', 
    name: 'San Francisco International', 
    state: 'California', 
    country: 'United States',
    fullLocation: 'San Francisco, California, United States',
    image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=100&h=100&fit=crop'
  },
  { 
    code: 'LAX', 
    city: 'Los Angeles', 
    name: 'Los Angeles International', 
    state: 'California', 
    country: 'United States',
    fullLocation: 'Los Angeles, California, United States',
    image: 'https://images.unsplash.com/photo-1534190239940-9ba8944ea261?w=100&h=100&fit=crop'
  },
  { 
    code: 'SJC', 
    city: 'San Jose', 
    name: 'Norman Y. Mineta San Jose International', 
    state: 'California', 
    country: 'United States',
    fullLocation: 'San Jose, California, United States',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=100&h=100&fit=crop'
  },
  { 
    code: 'SAN', 
    city: 'San Diego', 
    name: 'San Diego International', 
    state: 'California', 
    country: 'United States',
    fullLocation: 'San Diego, California, United States',
    image: 'https://images.unsplash.com/photo-1583511666407-5f06533f2113?w=100&h=100&fit=crop'
  },
  { 
    code: 'JFK', 
    city: 'New York', 
    name: 'John F. Kennedy International', 
    state: 'New York', 
    country: 'United States',
    fullLocation: 'New York, United States',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=100&h=100&fit=crop'
  },
  { 
    code: 'LGA', 
    city: 'New York', 
    name: 'LaGuardia Airport', 
    state: 'New York', 
    country: 'United States',
    fullLocation: 'New York, United States',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=100&h=100&fit=crop'
  },
  { 
    code: 'EWR', 
    city: 'Newark', 
    name: 'Newark Liberty International', 
    state: 'New Jersey', 
    country: 'United States',
    fullLocation: 'Newark, New Jersey, United States',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=100&h=100&fit=crop'
  },
  { 
    code: 'BOS', 
    city: 'Boston', 
    name: 'Logan International Airport', 
    state: 'Massachusetts', 
    country: 'United States',
    fullLocation: 'Boston, Massachusetts, United States',
    image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=100&h=100&fit=crop'
  },
  { 
    code: 'LAS', 
    city: 'Las Vegas', 
    name: 'Harry Reid Intl', 
    state: 'Nevada', 
    country: 'United States',
    fullLocation: 'Las Vegas, Nevada, United States',
    image: 'https://images.unsplash.com/photo-1605833556294-ea5d3b5b6b5e?w=100&h=100&fit=crop'
  },
  { 
    code: 'TYO', 
    city: 'Tokyo', 
    name: 'All airports', 
    country: 'Japan',
    fullLocation: 'Tokyo, Japan',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=100&h=100&fit=crop'
  },
  { 
    code: 'NYC', 
    city: 'New York', 
    name: 'All airports', 
    country: 'United States',
    fullLocation: 'New York, United States',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=100&h=100&fit=crop'
  },
  { 
    code: 'HNL', 
    city: 'Honolulu', 
    name: 'Honolulu', 
    state: 'Hawaii', 
    country: 'United States',
    fullLocation: 'Honolulu, Hawaii, United States',
    image: 'https://images.unsplash.com/photo-1542259009477-d625272157b7?w=100&h=100&fit=crop'
  },
  { 
    code: 'MIA', 
    city: 'Miami', 
    name: 'Miami International Airport', 
    state: 'Florida', 
    country: 'United States',
    fullLocation: 'Miami, Florida, United States',
    image: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=100&h=100&fit=crop'
  },
  { 
    code: 'ORD', 
    city: 'Chicago', 
    name: "O'Hare International Airport", 
    state: 'Illinois', 
    country: 'United States',
    fullLocation: 'Chicago, Illinois, United States',
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=100&h=100&fit=crop'
  },
  { 
    code: 'ATL', 
    city: 'Atlanta', 
    name: 'Hartsfield-Jackson Atlanta International', 
    state: 'Georgia', 
    country: 'United States',
    fullLocation: 'Atlanta, Georgia, United States',
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=100&h=100&fit=crop'
  },
  { 
    code: 'DEN', 
    city: 'Denver', 
    name: 'Denver International Airport', 
    state: 'Colorado', 
    country: 'United States',
    fullLocation: 'Denver, Colorado, United States',
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=100&h=100&fit=crop'
  },
  { 
    code: 'SEA', 
    city: 'Seattle', 
    name: 'Seattle-Tacoma International', 
    state: 'Washington', 
    country: 'United States',
    fullLocation: 'Seattle, Washington, United States',
    image: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=100&h=100&fit=crop'
  },
  { 
    code: 'PHX', 
    city: 'Phoenix', 
    name: 'Phoenix Sky Harbor International', 
    state: 'Arizona', 
    country: 'United States',
    fullLocation: 'Phoenix, Arizona, United States',
    image: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=100&h=100&fit=crop'
  },
  { 
    code: 'DFW', 
    city: 'Dallas', 
    name: 'Dallas/Fort Worth International', 
    state: 'Texas', 
    country: 'United States',
    fullLocation: 'Dallas, Texas, United States',
    image: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=100&h=100&fit=crop'
  },
  { 
    code: 'IAH', 
    city: 'Houston', 
    name: 'George Bush Intercontinental', 
    state: 'Texas', 
    country: 'United States',
    fullLocation: 'Houston, Texas, United States',
    image: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=100&h=100&fit=crop'
  },
  { 
    code: 'MCO', 
    city: 'Orlando', 
    name: 'Orlando International Airport', 
    state: 'Florida', 
    country: 'United States',
    fullLocation: 'Orlando, Florida, United States',
    image: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=100&h=100&fit=crop'
  },
];

// Mock recent searches
const MOCK_RECENT_SEARCHES = [
  {
    id: '1',
    origin: 'LAX',
    originCity: 'Los Angeles',
    destination: 'SJC',
    destinationCity: 'San Jose',
    departureDate: '2025-12-04',
    returnDate: '2025-12-11',
    travelers: 1,
    comboType: 'Flight + Hotel',
    price: 777
  },
  {
    id: '2',
    originCity: 'San Jose',
    destinationCity: 'California',
    departureDate: '2025-12-04',
    returnDate: '2025-12-11',
    price: 163
  }
];

// Mock travel deals
const MOCK_DEALS = [
  { city: 'Los Angeles', duration: '1h 21m, non-stop', dates: 'Sun 12/14 → Thu 12/18', price: 107, image: 'https://images.unsplash.com/photo-1534190239940-9ba8944ea261?w=400' },
  { city: 'Las Vegas', duration: '1h 15m, non-stop', dates: 'Sun 12/21 → Thu 12/25', price: 141, image: 'https://images.unsplash.com/photo-1605833556294-ea5d3b5b6b5e?w=400' },
  { city: 'San Diego', duration: '1h 35m, non-stop', dates: 'Wed 12/17 → Wed 12/24', price: 147, image: 'https://images.unsplash.com/photo-1583511666407-5f06533f2113?w=400' },
  { city: 'Burbank', duration: '1h 15m, non-stop', dates: 'Thu 12/25 → Mon 12/29', price: 236, image: 'https://images.unsplash.com/photo-1564221710304-0b37c8b9d729?w=400' },
];

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  // Get search form from Redux
  const { searchForm } = useSelector(state => state.flights);
  
  // Helper to normalize trip type from Redux
  const normalizeTripType = (type) => {
    if (!type) return 'Round-trip';
    if (type === 'roundtrip') return 'Round-trip';
    if (type === 'oneway') return 'One-way';
    if (type === 'multicity') return 'Multi-city';
    return type;
  };
  
  // State management - initialize from Redux if available
  const [tripType, setTripType] = useState(normalizeTripType(searchForm.tripType));
  const [bags, setBags] = useState(searchForm.bags || '0 bags');
  const [origin, setOrigin] = useState(searchForm.origin || 'LAX');
  const [destination, setDestination] = useState(searchForm.destination || '');
  const [departureDate, setDepartureDate] = useState(
    searchForm.departureDate ? new Date(searchForm.departureDate) : new Date('2025-12-04')
  );
  const [returnDate, setReturnDate] = useState(
    searchForm.returnDate ? new Date(searchForm.returnDate) : new Date('2025-12-11')
  );
  const [adults, setAdults] = useState(searchForm.adults || 1);
  const [students, setStudents] = useState(searchForm.students || 0);
  const [seniors, setSeniors] = useState(searchForm.seniors || 0);
  const [youths, setYouths] = useState(searchForm.youths || 0);
  const [children, setChildren] = useState(searchForm.children || 0);
  const [toddlers, setToddlers] = useState(searchForm.toddlers || 0);
  const [infants, setInfants] = useState(searchForm.infants || 0);
  const [cabinClass, setCabinClass] = useState(searchForm.cabinClass || 'Economy');
  
  // UI state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTravelersPicker, setShowTravelersPicker] = useState(false);
  
  // Debug logging
  console.log('Dropdown states:', { showOriginDropdown, showDestDropdown, showDatePicker, showTravelersPicker });
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [showStickySearch, setShowStickySearch] = useState(false);
  
  // API data state
  const [deals, setDeals] = useState(MOCK_DEALS); // Start with mock data
  const [dealsLoading, setDealsLoading] = useState(true);
  
  // Calculate total travelers
  const totalTravelers = adults + students + seniors + youths + children + toddlers + infants;
  
  // Refs
  const originRef = useRef(null);
  const destRef = useRef(null);
  const dateRef = useRef(null);
  const travelersRef = useRef(null);
  const searchSectionRef = useRef(null);
  
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
  
  // Scroll handler for sticky search
  useEffect(() => {
    const handleScroll = () => {
      if (searchSectionRef.current) {
        const rect = searchSectionRef.current.getBoundingClientRect();
        setShowStickySearch(rect.bottom < 0);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Load flight deals from API
  useEffect(() => {
    const loadDeals = async () => {
      try {
        setDealsLoading(true);
        const response = await getFlightDeals({ maxPrice: 310, limit: 12 });
        
        if (response.success && response.deals) {
          // Transform API data to match the format expected by the UI
          const transformedDeals = response.deals.map(deal => ({
            city: deal.arrival_city || deal.arrival_airport,
            duration: `${Math.floor(deal.duration / 60)}h ${deal.duration % 60}m, ${deal.stops === 0 ? 'non-stop' : `${deal.stops} stop${deal.stops > 1 ? 's' : ''}`}`,
            dates: `${new Date(deal.departure_time).toLocaleDateString('en-US', { weekday: 'short', month: '2-digit', day: '2-digit' })}`,
            price: Math.round(parseFloat(deal.price)),
            image: `https://images.unsplash.com/photo-1534190239940-9ba8944ea261?w=400`,
            flightCode: deal.flight_code,
            airline: deal.airline,
            origin: deal.departure_city || deal.departure_airport,
            destination: deal.arrival_city || deal.arrival_airport
          }));
          
          setDeals(transformedDeals);
        }
      } catch (error) {
        console.error('Failed to load deals:', error);
        // Keep mock data on error
      } finally {
        setDealsLoading(false);
      }
    };
    
    loadDeals();
  }, []);
  
  // Filter airports - search by city, code, airport name, state, country, and full location
  const filteredOrigins = AIRPORTS.filter(airport => {
    const searchLower = originSearch.toLowerCase();
    return (
      airport.city.toLowerCase().includes(searchLower) ||
      airport.code.toLowerCase().includes(searchLower) ||
      airport.name.toLowerCase().includes(searchLower) ||
      (airport.state && airport.state.toLowerCase().includes(searchLower)) ||
      airport.country.toLowerCase().includes(searchLower) ||
      airport.fullLocation.toLowerCase().includes(searchLower)
    );
  });
  
  const filteredDestinations = AIRPORTS.filter(airport => {
    const searchLower = destSearch.toLowerCase();
    return (
      airport.city.toLowerCase().includes(searchLower) ||
      airport.code.toLowerCase().includes(searchLower) ||
      airport.name.toLowerCase().includes(searchLower) ||
      (airport.state && airport.state.toLowerCase().includes(searchLower)) ||
      airport.country.toLowerCase().includes(searchLower) ||
      airport.fullLocation.toLowerCase().includes(searchLower)
    );
  });
  
  // Get nearby airports based on current origin (simplified - in real app would use actual distance calculation)
  const getNearbyAirports = (originCode) => {
    const nearbyMap = {
      // California
      'LAX': ['SJC', 'SAN', 'SFO'],
      'SFO': ['SJC', 'LAX', 'SAN'],
      'SAN': ['LAX', 'SFO', 'LAS'],
      'SJC': ['SFO', 'LAX', 'SAN'],
      
      // New York Area
      'JFK': ['LGA', 'EWR', 'BOS'],
      'LGA': ['JFK', 'EWR', 'BOS'],
      'EWR': ['JFK', 'LGA', 'BOS'],
      
      // Florida
      'MIA': ['FLL', 'MCO', 'TPA'],
      'MCO': ['MIA', 'TPA', 'FLL'],
      'TPA': ['MCO', 'MIA', 'FLL'],
      'FLL': ['MIA', 'MCO', 'TPA'],
      
      // Texas
      'DFW': ['DAL', 'HOU', 'IAH'],
      'IAH': ['HOU', 'DFW', 'DAL'],
      'DAL': ['DFW', 'IAH', 'HOU'],
      'HOU': ['IAH', 'DFW', 'DAL'],
      
      // Other major cities
      'ORD': ['MDW', 'MKE', 'IND'],
      'ATL': ['BNA', 'CLT', 'JAX'],
      'DEN': ['COS', 'ABQ', 'SLC'],
      'PHX': ['LAS', 'SAN', 'LAX'],
      'SEA': ['PDX', 'SFO', 'SJC'],
      'BOS': ['JFK', 'LGA', 'EWR'],
      'LAS': ['LAX', 'SAN', 'PHX'],
      'MSP': ['ORD', 'MKE', 'DSM'],
      'DTW': ['ORD', 'CLE', 'IND'],
      'PHL': ['JFK', 'EWR', 'BWI'],
      'CLT': ['ATL', 'RDU', 'GSP'],
      'DCA': ['BWI', 'IAD', 'PHL'],
      'IAD': ['DCA', 'BWI', 'PHL'],
      'BWI': ['DCA', 'IAD', 'PHL'],
      'SLC': ['DEN', 'LAS', 'PHX'],
      'PDX': ['SEA', 'SFO', 'SJC'],
    };
    
    const nearbyCodes = nearbyMap[originCode] || [];
    return AIRPORTS.filter(a => nearbyCodes.includes(a.code));
  };
  
  // Format dates for display
  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: '2-digit', day: '2-digit' });
  };
  
  // Handle search
  const handleSearch = async () => {
    if (!origin || !destination) {
      alert('Please select origin and destination');
      return;
    }
    
    const searchParams = {
      tripType: tripType.toLowerCase().replace('-', ''),
      origin,
      destination,
      departureDate: departureDate.toISOString().split('T')[0],
      returnDate: tripType === 'Round-trip' ? returnDate.toISOString().split('T')[0] : null,
      adults,
      cabinClass: cabinClass.toLowerCase()
    };
    
    dispatch(updateSearchForm(searchParams));
    await dispatch(searchFlights(searchParams));
    dispatch(addRecentSearch(searchParams));
    
    navigate('/flights/results');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20">
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
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
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
        <div className="flex items-center gap-4 flex-1">
          <button 
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <div className="h-8 md:h-10 w-32 md:w-40 overflow-hidden relative flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src={kayakLogo} 
              alt="KAYAK" 
              className="w-full h-full object-contain object-left"
            />
          </div>
          
          {/* Sticky Search Bar */}
          {showStickySearch && (
            <div className="hidden lg:flex items-center gap-2 flex-1 max-w-4xl ml-8">
              <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 flex-1">
                <span className="text-sm font-medium">{tripType}</span>
                <span className="text-gray-300">|</span>
                <span className="text-sm">{origin || 'From?'}</span>
                <ArrowRightLeft className="w-3 h-3 text-gray-400" />
                <span className="text-sm">{destination || 'To?'}</span>
                <span className="text-gray-300">|</span>
                <span className="text-sm">{formatDateDisplay(departureDate)}</span>
                {tripType === 'Round-trip' && (
                  <>
                    <span className="text-sm">—</span>
                    <span className="text-sm">{formatDateDisplay(returnDate)}</span>
                  </>
                )}
                <span className="text-gray-300">|</span>
                <span className="text-sm">{totalTravelers} {totalTravelers === 1 ? 'adult' : 'traveler'}, {cabinClass === 'Premium Economy' ? 'Premium' : cabinClass}</span>
              </div>
              <button 
                onClick={handleSearch}
                className="bg-[#FF690F] hover:bg-[#d6570c] text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 relative">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <Heart className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <button 
            onClick={() => {
              const html = document.documentElement;
              if (html.classList.contains('dark')) {
                html.classList.remove('dark');
                localStorage.setItem('theme', 'light');
              } else {
                html.classList.add('dark');
                localStorage.setItem('theme', 'dark');
              }
            }}
            style={{
              padding: '8px',
              backgroundColor: '#f3f4f6',
              border: '2px solid #d1d5db',
              borderRadius: '9999px',
              cursor: 'pointer',
              fontSize: '20px'
            }}
            title="Toggle dark mode"
          >
            🌙
          </button>
          <button 
            className="p-1 relative"
            onClick={() => user ? setIsUserMenuOpen(!isUserMenuOpen) : navigate('/login')}
          >
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-semibold text-sm">
              K
            </div>
          </button>
          
          {isUserMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-12 w-72 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
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
                    onClick={handleSignOut}
                    className="w-full py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
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
        {/* Hero Section */}
        <div ref={searchSectionRef} className="w-full bg-[#edf0f3] py-6 md:py-8">
          <div className="max-w-[1200px] mx-auto px-2 md:px-3 lg:px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Search Interface */}
              <div className="lg:col-span-8">
                <h1 className="text-3xl md:text-5xl font-extrabold mb-8 leading-tight tracking-tight">
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

                {/* Search Filters Row */}
                <div className="flex flex-wrap gap-4 mb-3 text-sm font-medium text-gray-700">
                  <TripTypeDropdown value={tripType} onChange={setTripType} />
                  <BagsDropdown value={bags} onChange={setBags} />
                </div>

                {/* Main Search Bar */}
                <div className="flex flex-col md:flex-row bg-gray-200 p-[2px] md:p-[2px] rounded-xl shadow-sm md:shadow-none gap-[2px] relative">
                  
                  {/* Origin */}
                  <div 
                    ref={originRef}
                    className="flex-[0.9] relative bg-white rounded-t-lg md:rounded-l-lg md:rounded-tr-none p-3.5 hover:bg-gray-50 cursor-pointer flex items-center group transition-colors"
                  >
                    <div 
                      className="flex-1"
                      onClick={() => {
                        console.log('Origin clicked!');
                        setShowOriginDropdown(true);
                        setShowDestDropdown(false);
                        setShowDatePicker(false);
                        setShowTravelersPicker(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 truncate text-[15px]">{origin || 'From?'}</span>
                        <X className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); setOrigin(''); }} />
                      </div>
                    </div>
                    {/* Swap Button */}
                    <div 
                      className="hidden md:flex absolute -right-3.5 z-20 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:bg-gray-50 cursor-pointer text-gray-600"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const temp = origin; 
                        setOrigin(destination); 
                        setDestination(temp); 
                      }}
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </div>
                    
                    {showOriginDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[500px] overflow-y-auto z-50 min-w-[450px]">
                        <div className="p-4 border-b border-gray-200">
                          <input
                            type="text"
                            placeholder="Search airports..."
                            value={originSearch}
                            onChange={(e) => setOriginSearch(e.target.value)}
                            className="w-full p-3 border-2 border-[#FF690F] rounded-lg outline-none text-base"
                            autoFocus
                          />
                        </div>
                        
                        {/* Add nearby airports section - show when not searching and origin is set */}
                        {!originSearch && origin && (
                          <div className="border-b border-gray-200">
                            <div className="px-4 py-3 flex items-center justify-between">
                              <div>
                                <div className="font-bold text-sm">Add nearby airports</div>
                                <div className="text-xs text-gray-600">Within 70mi of {origin}</div>
                              </div>
                              <div className="text-sm text-gray-600 cursor-pointer hover:text-[#FF690F]">All</div>
                            </div>
                            
                            {/* Nearby airports list */}
                            <div className="px-4 pb-3 space-y-2">
                              {getNearbyAirports(origin).map((airport) => (
                                <div 
                                  key={airport.code} 
                                  className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('Selected nearby origin:', airport.code);
                                    setOrigin(airport.code);
                                    setOriginSearch('');
                                    setShowOriginDropdown(false);
                                  }}
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="text-gray-600">✈</div>
                                    <div className="flex-1">
                                      <div className="text-sm font-bold text-gray-900">
                                        {airport.city}, {airport.state || airport.country} <span className="font-normal text-gray-600">{airport.code}</span>
                                      </div>
                                      <div className="text-xs text-gray-600 line-clamp-1">{airport.name}</div>
                                    </div>
                                  </div>
                                  <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Search results - show when searching */}
                        {originSearch && (
                          <div className="py-2">
                            {filteredOrigins.map(airport => {
                              const isSelected = origin === airport.code;
                              return (
                                <div
                                  key={airport.code}
                                  className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('Toggling origin:', airport.code);
                                    if (isSelected) {
                                      // Unselect if already selected
                                      setOrigin('');
                                    } else {
                                      // Select if not selected
                                      setOrigin(airport.code);
                                      setOriginSearch('');
                                      setShowOriginDropdown(false);
                                    }
                                  }}
                                >
                                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">✈️</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm text-gray-900 leading-tight">
                                      {airport.fullLocation} <span className="text-gray-500 font-normal">{airport.code}</span>
                                    </div>
                                    <div className="text-xs text-gray-600 line-clamp-1">{airport.name}</div>
                                  </div>
                                  <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded border-gray-300 pointer-events-none"
                                    checked={isSelected}
                                    readOnly
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Destination */}
                  <div 
                    ref={destRef}
                    className="flex-[0.9] relative bg-white p-3.5 hover:bg-gray-50 cursor-pointer flex items-center group transition-colors"
                  >
                    <div 
                      className="md:pl-2 flex-1"
                      onClick={() => {
                        console.log('Destination clicked!');
                        setShowDestDropdown(true);
                        setShowOriginDropdown(false);
                        setShowDatePicker(false);
                        setShowTravelersPicker(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 truncate text-[15px]">{destination || 'To?'}</span>
                        <X className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); setDestination(''); }} />
                      </div>
                    </div>
                    
                    {showDestDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[500px] overflow-y-auto z-50 min-w-[450px]">
                        <div className="p-4 border-b border-gray-200">
                          <input
                            type="text"
                            placeholder="Search airports..."
                            value={destSearch}
                            onChange={(e) => setDestSearch(e.target.value)}
                            className="w-full p-3 border-2 border-[#FF690F] rounded-lg outline-none text-base"
                            autoFocus
                          />
                        </div>
                        
                        {/* Show image list when NOT searching */}
                        {!destSearch && (
                          <div className="py-2">
                            {AIRPORTS.map(airport => {
                              const isSelected = destination === airport.code;
                              return (
                                <div
                                  key={airport.code}
                                  className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('Toggling destination:', airport.code);
                                    if (isSelected) {
                                      // Unselect if already selected
                                      setDestination('');
                                    } else {
                                      // Select if not selected
                                      setDestination(airport.code);
                                      setDestSearch('');
                                      setShowDestDropdown(false);
                                    }
                                  }}
                                >
                                  {airport.image && (
                                    <img 
                                      src={airport.image} 
                                      alt={airport.city} 
                                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm text-gray-900 leading-tight">
                                      {airport.fullLocation} <span className="text-gray-500 font-normal">{airport.code}</span>
                                    </div>
                                    <div className="text-xs text-gray-600 line-clamp-1">{airport.name}</div>
                                  </div>
                                  <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded border-gray-300 pointer-events-none"
                                    checked={isSelected}
                                    readOnly
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Show simple list when searching */}
                        {destSearch && (
                          <div className="py-2">
                            {filteredDestinations.map(airport => {
                              const isSelected = destination === airport.code;
                              return (
                                <div
                                  key={airport.code}
                                  className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('Toggling destination:', airport.code);
                                    if (isSelected) {
                                      // Unselect if already selected
                                      setDestination('');
                                    } else {
                                      // Select if not selected
                                      setDestination(airport.code);
                                      setDestSearch('');
                                      setShowDestDropdown(false);
                                    }
                                  }}
                                >
                                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">✈️</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm text-gray-900 leading-tight">
                                      {airport.fullLocation} <span className="text-gray-500 font-normal">{airport.code}</span>
                                    </div>
                                    <div className="text-xs text-gray-600 line-clamp-1">{airport.name}</div>
                                  </div>
                                  <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded border-gray-300 pointer-events-none"
                                    checked={isSelected}
                                    readOnly
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div 
                    ref={dateRef}
                    className="flex-[1.5] bg-white p-3.5 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors relative"
                    onClick={() => {
                      setShowDatePicker(!showDatePicker);
                      setShowOriginDropdown(false);
                      setShowDestDropdown(false);
                      setShowTravelersPicker(false);
                    }}
                  >
                    <div className="flex items-center gap-2 md:pl-2 w-full">
                      <Calendar className="w-5 h-5 text-gray-400 md:hidden" />
                      <span className="font-medium text-gray-900 text-[15px]">
                        {formatDateDisplay(departureDate)} {tripType === 'Round-trip' && `— ${formatDateDisplay(returnDate)}`}
                      </span>
                    </div>
                    
                    {/* Calendar Picker - Positioned absolutely */}
                    {showDatePicker && (
                      <>
                        <div 
                          className="fixed inset-0 z-40"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDatePicker(false);
                          }}
                        />
                        <div 
                          className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 p-6 z-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex gap-8">
                            <div>
                              <div className="text-base font-bold mb-3">Departure</div>
                              <DatePicker
                                selected={departureDate}
                                onChange={(date) => setDepartureDate(date)}
                                inline
                                minDate={new Date()}
                              />
                            </div>
                            {tripType === 'Round-trip' && (
                              <div>
                                <div className="text-base font-bold mb-3">Return</div>
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
                      </>
                    )}
                  </div>

                  {/* Travelers/Class */}
                  <div 
                    ref={travelersRef}
                    className="flex-1 bg-white rounded-b-lg md:rounded-none p-3.5 hover:bg-gray-50 cursor-pointer flex items-center group relative transition-colors"
                  >
                    <div 
                      className="md:pl-2 flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTravelersPicker(!showTravelersPicker);
                        setShowOriginDropdown(false);
                        setShowDestDropdown(false);
                        setShowDatePicker(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 truncate text-[15px]">
                          {totalTravelers} {totalTravelers === 1 ? 'adult' : 'traveler'}, {cabinClass === 'Premium Economy' ? 'Premium' : cabinClass}
                        </span>
                      </div>
                    </div>
                    
                    {showTravelersPicker && (
                      <div 
                        className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 w-[360px] max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-3">
                          <h3 className="text-base font-bold mb-2">Travelers</h3>
                          
                          {/* Adults */}
                          <div className="flex items-center justify-between py-1.5">
                            <div>
                              <div className="font-bold text-xs">Adults</div>
                              <div className="text-[10px] text-gray-600">18-64</div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAdults(Math.max(1, adults - 1));
                                }}
                                className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 text-sm"
                              >
                                −
                              </button>
                              <span className="w-5 text-center font-bold text-xs">{adults}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAdults(adults + 1);
                                }}
                                className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 text-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          
                          {/* Students */}
                          <div className="flex items-center justify-between py-1.5 border-t border-gray-200">
                            <div>
                              <div className="font-bold text-xs">Students</div>
                              <div className="text-[10px] text-gray-600">over 18</div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setStudents(Math.max(0, students - 1))}
                                className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 text-sm"
                              >
                                −
                              </button>
                              <span className="w-5 text-center font-bold text-xs">{students}</span>
                              <button
                                onClick={() => setStudents(students + 1)}
                                className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 text-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          
                          {/* Seniors */}
                          <div className="flex items-center justify-between py-1.5 border-t border-gray-200">
                            <div>
                              <div className="font-bold text-xs">Seniors</div>
                              <div className="text-[10px] text-gray-600">over 65</div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setSeniors(Math.max(0, seniors - 1))}
                                className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 text-sm"
                              >
                                −
                              </button>
                              <span className="w-5 text-center font-bold text-xs">{seniors}</span>
                              <button
                                onClick={() => setSeniors(seniors + 1)}
                                className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 text-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          
                          {/* Youths */}
                          <div className="flex items-center justify-between py-1.5 border-t border-gray-200">
                            <div>
                              <div className="font-bold text-xs">Youths</div>
                              <div className="text-[10px] text-gray-600">12-17</div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setYouths(Math.max(0, youths - 1))}
                                className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 text-sm"
                              >
                                −
                              </button>
                              <span className="w-5 text-center font-bold text-xs">{youths}</span>
                              <button
                                onClick={() => setYouths(youths + 1)}
                                className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 text-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          
                          {/* Children */}
                          <div className="flex items-center justify-between py-1.5 border-t border-gray-200">
                            <div>
                              <div className="font-bold text-xs">Children</div>
                              <div className="text-[10px] text-gray-600">2-11</div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setChildren(Math.max(0, children - 1))}
                                className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 text-sm"
                              >
                                −
                              </button>
                              <span className="w-5 text-center font-bold text-xs">{children}</span>
                              <button
                                onClick={() => setChildren(children + 1)}
                                className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 text-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          
                          {/* Toddlers */}
                          <div className="flex items-center justify-between py-1.5 border-t border-gray-200">
                            <div>
                              <div className="font-bold text-xs">Toddlers in own seat</div>
                              <div className="text-[10px] text-gray-600">under 2</div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setToddlers(Math.max(0, toddlers - 1))}
                                className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 text-sm"
                              >
                                −
                              </button>
                              <span className="w-5 text-center font-bold text-xs">{toddlers}</span>
                              <button
                                onClick={() => setToddlers(toddlers + 1)}
                                className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 text-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          
                          {/* Infants */}
                          <div className="flex items-center justify-between py-1.5 border-t border-gray-200">
                            <div>
                              <div className="font-bold text-xs">Infants on lap</div>
                              <div className="text-[10px] text-gray-600">under 2</div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setInfants(Math.max(0, infants - 1))}
                                className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 text-sm"
                              >
                                −
                              </button>
                              <span className="w-5 text-center font-bold text-xs">{infants}</span>
                              <button
                                onClick={() => setInfants(infants + 1)}
                                className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 text-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          
                          {/* Cabin Class */}
                          <div className="pt-2 border-t border-gray-200 mt-1">
                            <h3 className="text-base font-bold mb-2">Cabin Class</h3>
                            <div className="grid grid-cols-2 gap-1.5">
                              {['Economy', 'Premium Economy', 'Business', 'First'].map(cls => (
                                <button
                                  key={cls}
                                  onClick={() => setCabinClass(cls)}
                                  className={`px-2 py-1.5 rounded-lg border-2 font-medium text-[10px] transition-colors ${
                                    cabinClass === cls 
                                      ? 'border-gray-900 bg-gray-100' 
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                >
                                  {cls}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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

        {/* Your Recent Searches */}
        <div className="bg-[#f7f9fa] py-12">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Your recent searches</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MOCK_RECENT_SEARCHES.map(search => (
                <div key={search.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="font-bold text-base mb-2">{search.originCity} ({search.origin}) → {search.destinationCity}</div>
                      <div className="text-sm text-gray-600">{search.departureDate} → {search.returnDate}</div>
                      <div className="text-sm text-gray-600">{search.travelers} traveler</div>
                      {search.comboType && <div className="text-xs text-gray-500 mt-1">{search.comboType}</div>}
                    </div>
                    <button className="w-12 h-12 bg-[#FF690F] rounded-lg flex items-center justify-center text-white hover:bg-[#d6570c] flex-shrink-0 ml-3">
                      <Search className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">${search.price}</div>
                </div>
              ))}
              <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center text-center hover:border-gray-400 transition-colors cursor-pointer min-h-[180px]">
                <div className="text-5xl text-gray-400 mb-3">+</div>
                <div className="font-bold text-gray-700">Start a new search</div>
              </div>
            </div>
          </div>
        </div>

        {/* Travel Deals Under $310 */}
        <div className="max-w-[1200px] mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Travel deals under $310</h2>
            <button className="text-[#FF690F] font-bold text-sm hover:underline flex items-center gap-1">
              Explore more <span>→</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {dealsLoading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-lg overflow-hidden border border-gray-200 animate-pulse">
                  <div className="w-full h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3"></div>
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))
            ) : (
              deals.map((deal, idx) => (
                <div key={idx} className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
                  <img src={deal.image} alt={deal.city} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <div className="font-bold text-lg mb-1">{deal.city}</div>
                    <div className="text-sm text-gray-600 mb-1">{deal.duration}</div>
                    <div className="text-sm text-gray-600 mb-3">{deal.dates}</div>
                    <div className="text-xl font-bold text-gray-900">from ${deal.price}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Search Cheap Flights by Destination */}
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-2">Search cheap flights by destination</h2>
          <p className="text-gray-600 mb-6">Find Cheap Flights</p>
          <p className="text-sm text-gray-700 leading-relaxed mb-8">
            Save money on airfare by searching for cheap flight tickets on KAYAK. KAYAK searches for flight deals on hundreds of airline tickets sites to help you find the cheapest flights. Whether you are looking for a last minute flight or a cheap plane ticket for a later date, you can find the best deals faster at KAYAK.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DestinationAccordion title="Las Vegas Flights" destinations={[
              { route: 'Flight Dallas - Las Vegas (DFW - LAS)', price: '$56+' },
              { route: 'Flight Denver - Las Vegas (DEN - LAS)', price: '$57+' },
              { route: 'Flight Los Angeles - Las Vegas (LAX - LAS)', price: '$57+' },
              { route: 'Flight Ontario - Las Vegas (ONT - LAS)', price: '$57+' },
              { route: 'Flight Phoenix - Las Vegas (PHX - LAS)', price: '$57+' },
              { route: 'Flight San Francisco - Las Vegas (SFO - LAS)', price: '$57+' },
              { route: 'Flight Santa Ana - Las Vegas (SNA - LAS)', price: '$57+' },
              { route: 'Flight Atlanta - Las Vegas (ATL - LAS)', price: '$58+' },
              { route: 'Flight Burbank - Las Vegas (BUR - LAS)', price: '$58+' },
              { route: 'Flight San Jose - Las Vegas (SJC - LAS)', price: '$70+' },
            ]} />
            
            <DestinationAccordion title="New York Flights" destinations={[]} />
            <DestinationAccordion title="London Flights" destinations={[]} />
            <DestinationAccordion title="Miami Flights" destinations={[]} />
            <DestinationAccordion title="Paris Flights" destinations={[]} />
            <DestinationAccordion title="Rome Flights" destinations={[]} />
            <DestinationAccordion title="Manila Flights" destinations={[]} />
            <DestinationAccordion title="Seattle Flights" destinations={[]} />
            <DestinationAccordion title="Denver Flights" destinations={[]} />
            <DestinationAccordion title="Fort Lauderdale Flights" destinations={[]} />
            <DestinationAccordion title="San Francisco Flights" destinations={[]} />
            <DestinationAccordion title="Atlanta Flights" destinations={[]} />
            <DestinationAccordion title="San Diego Flights" destinations={[]} />
            <DestinationAccordion title="Boston Flights" destinations={[]} />
            <DestinationAccordion title="Punta Cana Flights" destinations={[]} />
            <DestinationAccordion title="Los Angeles Flights" destinations={[]} />
            <DestinationAccordion title="Chicago Flights" destinations={[]} />
            <DestinationAccordion title="Phoenix Flights" destinations={[]} />
            <DestinationAccordion title="United States Flights" destinations={[]} />
            <DestinationAccordion title="India Flights" destinations={[]} />
            <DestinationAccordion title="Japan Flights" destinations={[]} />
            <DestinationAccordion title="Orlando Flights" destinations={[]} />
            <DestinationAccordion title="Hawaii Flights" destinations={[]} />
            <DestinationAccordion title="San Juan Flights" destinations={[]} />
            <DestinationAccordion title="Cancun Flights" destinations={[]} />
            <DestinationAccordion title="New Delhi Flights" destinations={[]} />
            <DestinationAccordion title="Dallas Flights" destinations={[]} />
            <DestinationAccordion title="Europe Flights" destinations={[]} />
            <DestinationAccordion title="Florida Flights" destinations={[]} />
            <DestinationAccordion title="Honolulu Flights" destinations={[]} />
            <DestinationAccordion title="Tokyo Flights" destinations={[]} />
            <DestinationAccordion title="Washington, D.C. Flights" destinations={[]} />
            <DestinationAccordion title="Tampa Flights" destinations={[]} />
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-[1200px] mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-8">Frequently asked questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              <FAQItem 
                question="What do I need to know before booking a flight?" 
                answer="There are various factors to consider when booking a flight including cost, fare classes, baggage policies, the complications of flying long haul, and complying with airport regulations. To make your booking journey smoother KAYAK has developed a comprehensive flight guide including insights on finding affordable flights, packing efficiently, and utilizing the best travel tools."
              />
              <FAQItem 
                question="Which month of the year are flight prices lowest?" 
                answer="It's well established that flights in the low season are generally cheaper than ticket prices during the high season. That means that knowing which month to find the lowest priced plane tickets will depend heavily on seasonality and your destination. While avoiding peak travel times can help you keep costs down, our data shows that the month with the lowest priced plane tickets for domestic flights based on all searches made on KAYAK in the last 12 months was September, while the most expensive was December. If you're booking an international flight, then October is the cheapest month to fly and December the most expensive."
              />
              <FAQItem 
                question="Can flying international flights with a layover save money on airfare?" 
                answer="For many long-haul international flights, flying non-stop is not possible and you will have to fly with a layover. Some routes will offer both and you could consider flying with a layover for a number of reasons. Firstly, breaking up what would otherwise be a long-haul flight, taking a rest and then completing the journey might make the flight more manageable. Secondly, prices can also be lower than non-stop flights, so while it might take longer for you to reach your destination, you could save money. We've looked at prices over the last 12 months for the 100 most popular international destinations for KAYAK users and on average, prices for non-stop flights were cheaper than flights with a layover."
              />
              <FAQItem 
                question="How do I find the best flight deals on KAYAK?" 
                answer="A simple flight search at https://www.kayak.com/flights scans for prices on hundreds of travel sites in seconds. We gather flight deals from across the web and put them in one place. Then on the search results page you can use various filters to compare options for the same flight and easily choose the best flight deal from all of the deals coming straight from the travel sites to your screen, with no extra fee from KAYAK."
              />
              <FAQItem 
                question="Does KAYAK query more flight providers than competitors?" 
                answer="Yes, KAYAK has access to more data and information than online travel agencies and consistently outperforms the competition in accuracy, globally."
              />
              <FAQItem 
                question="What is KAYAK's 'flexible dates' feature and why should I care?" 
                answer="Sometimes travel dates aren't set in stone. If your preferred travel dates have some wiggle room, flexible dates will show you flights up to 3 days before/after your preferred dates. That way, you can see if leaving a day or two earlier will find you a better deal. You can also select the flexible 'weekend' or 'month' search options to widen your search range and find the cheapest price that works for you."
              />
            </div>
            <div>
              <FAQItem 
                question="What is the cheapest day of the week to book a flight?" 
                answer="The best day to book your flight depends on a number of factors, but there are general trends that you can follow to increase your chances of cheaper plane tickets. Based on an analysis of KAYAK data for all flights departing from inside United States over the last 12 months, the cheapest day to fly for domestic flights is Wednesday. For international flights, Tuesday had the cheapest tickets on average."
              />
              <FAQItem 
                question="When is the best time to buy plane tickets - Last minute or in advance?" 
                answer="Last minute flight deals are definitely up for grabs but when exactly to purchase your plane tickets will depend on where you're traveling to and from. Based on all data for flight searches made on KAYAK over the last 12 months, prices for domestic flights remained below the average price up to 1 weeks before departure. For international flights, deals could still be had up to 1 weeks prior to the departure date, with prices remaining below average. If you're flexible, KAYAK brings you both advance and last minute one-way and round-trip flight deals."
              />
              <FAQItem 
                question="How does KAYAK find such low flight prices?" 
                answer="KAYAK processes over 2 billion flight queries annually and displays results from hundreds of airlines and third party sites, allowing it to find a variety of flight prices and options. It also displays results from 2M+ properties along with rental cars, vacation packages, activities and millions of verified reviews so users can see as many available travel options as possible."
              />
              <FAQItem 
                question="How can Hacker Fares save me money?" 
                answer="Hacker Fares allow you to combine one-way tickets on different airlines when it can save you money over a traditional round-trip ticket."
              />
              <FAQItem 
                question="How does KAYAK's flight Price Forecast tool help me choose the right time to buy?" 
                answer="KAYAK's flight Price Forecast tool uses historical data to determine whether the price for a given destination and date is likely to change within 7 days, so travelers know whether to wait or book now."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-[#f7f9fa] border-t border-gray-200 mt-16">
          <div className="max-w-[1200px] mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
              <div>
                <h3 className="font-bold text-base mb-4">Company</h3>
                <ul className="space-y-3 text-sm">
                  <li><a href="#" className="text-gray-700 hover:text-[#FF690F] underline">About</a></li>
                  <li><a href="#" className="text-gray-700 hover:text-[#FF690F] underline">Careers</a></li>
                  <li><a href="#" className="text-gray-700 hover:text-[#FF690F] underline">Mobile</a></li>
                  <li><a href="#" className="text-gray-700 hover:text-[#FF690F] underline">Blog</a></li>
                  <li><a href="#" className="text-gray-700 hover:text-[#FF690F] underline">How we work</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-base mb-4">Contact</h3>
                <ul className="space-y-3 text-sm">
                  <li><a href="#" className="text-gray-700 hover:text-[#FF690F] underline">Help/FAQ</a></li>
                  <li><a href="#" className="text-gray-700 hover:text-[#FF690F] underline">Press</a></li>
                  <li><a href="#" className="text-gray-700 hover:text-[#FF690F] underline">Affiliates</a></li>
                  <li><a href="#" className="text-gray-700 hover:text-[#FF690F] underline">Hotel owners</a></li>
                  <li><a href="#" className="text-gray-700 hover:text-[#FF690F] underline">Partners</a></li>
                  <li><a href="#" className="text-gray-700 hover:text-[#FF690F] underline">Advertise with us</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-base mb-4">More</h3>
                <ul className="space-y-3 text-sm">
                  <li><a href="#" className="text-gray-700 hover:text-[#FF690F] underline">Airline fees</a></li>
                  <li><a href="#" className="text-gray-700 hover:text-[#FF690F] underline">Airlines</a></li>
                  <li><a href="#" className="text-gray-700 hover:text-[#FF690F] underline">Low fare tips</a></li>
                  <li><a href="#" className="text-gray-700 hover:text-[#FF690F] underline">Badges & Certificates</a></li>
                  <li><a href="#" className="text-gray-700 hover:text-[#FF690F] underline">Security</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-base mb-4">Get the KAYAK app</h3>
                <div className="space-y-3">
                  <a href="#" className="block">
                    <div className="border border-gray-300 rounded-lg px-4 py-2 hover:bg-white transition-colors">
                      <div className="text-xs text-gray-600">GET IT ON</div>
                      <div className="font-bold text-sm">Google Play</div>
                    </div>
                  </a>
                  <a href="#" className="block">
                    <div className="border border-gray-300 rounded-lg px-4 py-2 hover:bg-white transition-colors">
                      <div className="text-xs text-gray-600">Download on the</div>
                      <div className="font-bold text-sm">App Store</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-300 pt-8 pb-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-700">©2025 KAYAK</span>
                  <a href="#" className="text-gray-700 hover:text-[#FF690F] underline">Do Not Sell or Share My Info</a>
                  <a href="#" className="text-gray-700 hover:text-[#FF690F] underline">Privacy</a>
                  <a href="#" className="text-gray-700 hover:text-[#FF690F] underline">Terms & Conditions</a>
                  <a href="#" className="text-gray-700 hover:text-[#FF690F] underline">Ad Choices</a>
                </div>
                <div className="flex items-center gap-4">
                  <a href="#" className="text-gray-600 hover:text-[#FF690F]">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href="#" className="text-gray-600 hover:text-[#FF690F]">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                  </a>
                  <a href="#" className="text-gray-600 hover:text-[#FF690F]">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                  <a href="#" className="text-gray-600 hover:text-[#FF690F]">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>
                  </a>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 mb-6">
                <span className="text-gray-700 font-bold text-lg">Booking.com</span>
                <span className="text-gray-700 font-bold text-lg">KAYAK</span>
                <span className="text-gray-700 font-bold text-lg">OpenTable</span>
                <span className="text-gray-700 font-bold text-lg">priceline</span>
                <span className="text-gray-700 font-bold text-lg">agoda</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🇺🇸</span>
                  <span className="text-sm text-gray-700">English</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">$</span>
                  <span className="text-sm text-gray-700">USD</span>
                </div>
              </div>
            </div>
          </div>
        </footer>

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
        ${active ? 'bg-[#FF690F] text-white' : 'bg-white dark:bg-gray-700 text-black dark:text-gray-200 border border-gray-200 dark:border-gray-600'}
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
        ${active ? 'bg-[#FF690F] text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'}
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
        className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded select-none"
      >
        <span>{value}</span> <ChevronDown className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[150px]">
          <button
            onClick={() => { onChange('Round-trip'); setIsOpen(false); }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-medium"
          >
            Round-trip
          </button>
          <button
            onClick={() => { onChange('One-way'); setIsOpen(false); }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-medium"
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
        className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded select-none"
      >
        <span>{value}</span> <ChevronDown className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[120px]">
          {['0 bags', '1 bag', '2 bags', '3 bags'].map(bag => (
            <button
              key={bag}
              onClick={() => { onChange(bag); setIsOpen(false); }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-medium"
            >
              {bag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DestinationAccordion({ title, destinations }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <span className="font-bold text-sm">{title}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && destinations.length > 0 && (
        <div className="pb-4 bg-gray-50">
          <div className="space-y-2">
            {destinations.map((dest, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <a href="#" className="text-gray-600 hover:text-[#FF690F] hover:underline">{dest.route}</a>
                <span className="text-gray-900 font-semibold">{dest.price}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <span className="text-sm text-gray-900">{question}</span>
        <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="pb-4 pt-2">
          <p className="text-sm text-gray-700 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
