import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
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

export default function AIMode() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tripType, setTripType] = useState('Round-trip');
  const [bags, setBags] = useState('0 bags');
  const [origin, setOrigin] = useState('From?');
  const [dest, setDest] = useState('To?');
  const [dates, setDates] = useState('Sun 12/14  —  Thu 12/18');
  const [travelersInfo, setTravelersInfo] = useState('1 adult, Economy');

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
                AI-powered travel search<span className="text-[#FF690F]">.</span>
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
                <div className="relative group cursor-pointer flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded select-none">
                  <span>{tripType}</span> <ChevronDown className="w-4 h-4" />
                </div>
                <div className="relative group cursor-pointer flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded select-none">
                  <span>{bags}</span> <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* Main Search Bar */}
              <div className="flex flex-col md:flex-row bg-gray-200 dark:bg-gray-700 p-[2px] md:p-[2px] rounded-xl shadow-sm md:shadow-none gap-[2px]">
                
                {/* Origin */}
                <div className="flex-1 relative bg-white dark:bg-gray-800 rounded-t-lg md:rounded-l-lg md:rounded-tr-none p-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center group transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white truncate text-[15px]">{origin}</span>
                      <X className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); setOrigin(''); }} />
                    </div>
                  </div>
                  {/* Swap Button */}
                  <div className="hidden md:flex absolute -right-3.5 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full p-1.5 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-gray-600 dark:text-gray-300">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Destination */}
                <div className="flex-1 bg-white dark:bg-gray-800 p-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center group relative transition-colors">
                  <div className="md:pl-2 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white truncate text-[15px]">{dest}</span>
                      <X className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); setDest(''); }} />
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex-[1.5] bg-white dark:bg-gray-800 p-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between transition-colors">
                  <div className="flex items-center gap-2 md:pl-2 w-full">
                    <Calendar className="w-5 h-5 text-gray-400 md:hidden" />
                    <span className="font-medium text-gray-900 dark:text-white text-[15px]">{dates}</span>
                  </div>
                </div>

                {/* Travelers/Class */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-b-lg md:rounded-none p-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center group relative transition-colors">
                  <div className="md:pl-2 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white truncate text-[15px]">{travelersInfo}</span>
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
