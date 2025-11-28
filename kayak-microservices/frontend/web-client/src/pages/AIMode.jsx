import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Heart, 
  ChevronDown, 
  ArrowRightLeft, 
  Search, 
  X, 
  Calendar
} from 'lucide-react';
import { PiAirplaneTiltFill } from "react-icons/pi";
import { IoIosBed } from "react-icons/io";
import { IoCarSharp } from "react-icons/io5";
import { FaUmbrellaBeach } from "react-icons/fa6";
import { HiSparkles } from "react-icons/hi2";
import { FaFlag, FaDollarSign } from "react-icons/fa";
import { HiOutlineLogout } from "react-icons/hi";
import { ImUserPlus } from "react-icons/im";
import kayakLogo from "../assets/images/kayak logo.png";

// Main App Component
export default function AIMode() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tripType, setTripType] = useState('Round-trip');
  const [travelers, setTravelers] = useState('1 adult, Economy');
  const [bags, setBags] = useState('0 bags');
  const [origin, setOrigin] = useState('From?');
  const [dest, setDest] = useState('To?');
  const [dates, setDates] = useState('Sun 12/14  —  Thu 12/18');
  const [travelersInfo, setTravelersInfo] = useState('1 adult, Economy');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Load Google Fonts dynamically
  useEffect(() => {
    if (!document.querySelector('#google-fonts')) {
      const link = document.createElement('link');
      link.id = 'google-fonts';
      link.rel = 'stylesheet';
      link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20">
      {/* Sidebar Menu */}
      {isMenuOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 overflow-y-auto pt-16">
            <div className="p-4">
              {/* Categories Section */}
              <div className="mb-6">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Categories
                </div>
                <SidebarMenuItem icon={<PiAirplaneTiltFill />} label="Flights" active={location.pathname === '/'} onClick={() => navigate('/')} />
                <SidebarMenuItem icon={<IoIosBed />} label="Stays" active={location.pathname === '/stays'} onClick={() => navigate('/stays')} />
                <SidebarMenuItem icon={<IoCarSharp />} label="Cars" active={location.pathname === '/cars'} onClick={() => navigate('/cars')} />
                <SidebarMenuItem icon={<FaUmbrellaBeach />} label="Packages" active={location.pathname === '/packages'} onClick={() => navigate('/packages')} />
                <SidebarMenuItem icon={<HiSparkles />} label="AI Mode" isNew active={location.pathname === '/ai-mode'} onClick={() => navigate('/ai-mode')} />
              </div>

              {/* Tools Section */}
              <div className="mb-6">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Tools
                </div>
                <SidebarMenuItem label="Plan your trip" />
                <SidebarMenuItem label="Explore" />
                <SidebarMenuItem label="Flight Tracker" />
                <SidebarMenuItem label="Travel tips" />
                <SidebarMenuItem label="KAYAK for Business" isNew />
              </div>

              {/* Settings Section */}
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Settings
                </div>
                <SidebarMenuItem label="Trips" />
                <SidebarMenuItem icon={<FaFlag />} label="English" />
                <SidebarMenuItem icon={<FaDollarSign />} label="United States dollar" />
                <SidebarMenuItem label="Feedback" />
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
          {/* Logo container strictly constrained to prevent giant image */}
          <div className="h-8 md:h-10 w-32 md:w-40 overflow-hidden relative flex items-center">
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
              S
            </div>
          </button>
          
          {/* User Profile Popup */}
          {isUserMenuOpen && (
            <>
              {/* Overlay to close menu */}
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />
              {/* Popup Menu */}
              <div className="absolute right-0 top-12 w-72 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
                {/* User Info Section */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                      S
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Sheerio217</div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        sheerio217@gmail.com
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Add User Button */}
                  <button className="w-full flex items-center gap-3 hover:bg-gray-100 rounded-lg transition-colors">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <ImUserPlus className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">Add user</span>
                  </button>
                </div>
                
                {/* Navigation Links */}
                <div className="py-2">
                  <UserMenuItem label="Trips" />
                  <UserMenuItem label="Join KAYAK for Business" />
                  <UserMenuItem label="Help/FAQ" />
                  <UserMenuItem label="Your account" />
                </div>
                
                {/* Sign Out Button */}
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
        
        {/* Full-width gray background card */}
        <div className="w-full bg-[#edf0f3] py-6 md:py-8">
          {/* Constrained content inside */}
          <div className="max-w-[1200px] mx-auto px-2 md:px-3 lg:px-4">
            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Search Interface */}
              <div className="lg:col-span-8">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-8 leading-tight tracking-tight">
              AI-powered travel planning from 100s of sites<span className="text-[#FF690F]">.</span>
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
            <div className="flex flex-wrap gap-4 mb-3 text-sm font-medium text-gray-700">
              <div className="relative group cursor-pointer flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded select-none">
                <span>{tripType}</span> <ChevronDown className="w-4 h-4" />
              </div>
              <div className="relative group cursor-pointer flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded select-none">
                <span>{bags}</span> <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {/* Main Search Bar */}
            <div className="flex flex-col md:flex-row bg-gray-200 p-[2px] md:p-[2px] rounded-xl shadow-sm md:shadow-none gap-[2px]">
              
              {/* Origin */}
              <div className="flex-1 relative bg-white rounded-t-lg md:rounded-l-lg md:rounded-tr-none p-3.5 hover:bg-gray-50 cursor-pointer flex items-center group transition-colors">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 truncate text-[15px]">{origin}</span>
                    <X className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); setOrigin(''); }} />
                  </div>
                </div>
                {/* Swap Button */}
                <div className="hidden md:flex absolute -right-3.5 z-20 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:bg-gray-50 cursor-pointer text-gray-600">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Destination */}
              <div className="flex-1 bg-white p-3.5 hover:bg-gray-50 cursor-pointer flex items-center group relative transition-colors">
                 <div className="md:pl-2 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 truncate text-[15px]">{dest}</span>
                    <X className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); setDest(''); }} />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="flex-[1.5] bg-white p-3.5 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors">
                <div className="flex items-center gap-2 md:pl-2 w-full">
                  <Calendar className="w-5 h-5 text-gray-400 md:hidden" />
                  <span className="font-medium text-gray-900 text-[15px]">{dates}</span>
                </div>
              </div>

              {/* Travelers/Class */}
              <div className="flex-1 bg-white rounded-b-lg md:rounded-none p-3.5 hover:bg-gray-50 cursor-pointer flex items-center group relative transition-colors">
                <div className="md:pl-2 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 truncate text-[15px]">{travelersInfo}</span>
                    <X className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); setTravelersInfo('1 adult, Economy'); }} />
                  </div>
                </div>
              </div>

              {/* Search Button */}
              <div className="bg-[#FF690F] hover:bg-[#d6570c] md:rounded-r-lg md:rounded-l-none rounded-lg md:w-[70px] flex items-center justify-center transition-colors cursor-pointer p-3 md:p-0 mt-[2px] md:mt-0">
                <Search className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Right Column: Image Grid */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="grid grid-cols-2 gap-3 h-full max-h-[380px]">
              {/* Large top left */}
              <div className="col-span-1 row-span-1 overflow-hidden rounded-xl relative group cursor-pointer">
                <img 
                  src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop" 
                  alt="Plane Wing" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              {/* Top right */}
              <div className="col-span-1 overflow-hidden rounded-xl relative group cursor-pointer">
                <img 
                  src="https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?q=80&w=800&auto=format&fit=crop" 
                  alt="City" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              {/* Bottom Left */}
              <div className="col-span-1 overflow-hidden rounded-xl relative group cursor-pointer">
                 <img 
                  src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop" 
                  alt="Traveler" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              {/* Bottom Right - Tall */}
              <div className="col-span-1 row-span-2 overflow-hidden rounded-xl relative group -mt-12 cursor-pointer">
                 <img 
                  src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop" 
                  alt="Nature" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
               {/* Extra filler */}
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
    </div>
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
      {/* Icon Container - Small Rounded Square */}
      <div className={`
        w-14 h-14 rounded-lg flex items-center justify-center shadow-sm transition-all
        ${active ? 'bg-[#FF690F] text-white' : 'bg-white text-black border border-gray-200'}
      `}>
        <div className="text-2xl">
          {icon}
        </div>
      </div>
      {/* Label */}
      <span className={`font-medium text-xs ${active ? 'text-[#FF690F]' : 'text-gray-900'}`}>
        {label}
      </span>
    </div>
  );
}

// Sidebar Menu Item Component
function SidebarMenuItem({ icon, label, active, isNew, onClick }) {
  return (
    <div 
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors select-none
        ${active ? 'bg-[#FF690F] text-white' : 'hover:bg-gray-100 text-gray-900'}
      `}
      onClick={onClick}
    >
      {icon && (
        <div className="text-lg flex items-center justify-center">
          {icon}
        </div>
      )}
      <span className="font-medium text-sm flex-1">{label}</span>
      {isNew && (
        <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-[9px] text-white px-1.5 py-0.5 rounded-full font-bold tracking-wide">
          NEW
        </span>
      )}
    </div>
  );
}

// User Menu Item Component
function UserMenuItem({ label }) {
  return (
    <div className="px-4 py-2.5 hover:bg-gray-100 cursor-pointer transition-colors">
      <span className="text-sm font-medium text-gray-900">{label}</span>
    </div>
  );
}

