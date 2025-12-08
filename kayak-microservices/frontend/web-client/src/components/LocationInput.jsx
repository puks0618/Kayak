import React, { useState, useRef, useEffect } from 'react';
import { MapPin, X, ChevronDown } from 'lucide-react';

const DEFAULT_CITIES = [
  'Los Angeles, California',
  'New York, New York',
  'San Francisco, California',
  'Miami, Florida',
  'Las Vegas, Nevada',
  'Chicago, Illinois',
  'Seattle, Washington',
  'Boston, Massachusetts',
  'Denver, Colorado',
  'Austin, Texas',
  'San Diego, California',
  'Portland, Oregon',
  'Phoenix, Arizona',
  'Orlando, Florida',
  'Atlanta, Georgia'
];

export default function LocationInput({ 
  label,
  value, 
  onChange, 
  onClear,
  placeholder = "From?",
  showSwapButton = false,
  onSwap,
  cities = DEFAULT_CITIES  // Allow custom cities list
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Debug: Log cities prop
  useEffect(() => {
    console.log('LocationInput cities prop:', cities.length, 'cities', cities);
  }, [cities]);

  // Update local state when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter cities based on input - show all if input is empty
  const filteredCities = inputValue.trim() === '' 
    ? cities 
    : cities.filter(city =>
        city.toLowerCase().includes(inputValue.toLowerCase())
      );

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    if (!showDropdown) {
      setShowDropdown(true);
    }
  };

  const handleCitySelect = (city) => {
    setInputValue(city);
    onChange(city);
    setShowDropdown(false);
  };

  const handleClearClick = (e) => {
    e.stopPropagation();
    setInputValue('');
    onChange('');
    if (onClear) onClear();
    inputRef.current?.focus();
  };

  return (
    <div className="flex-1 relative bg-white dark:bg-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group overflow-visible" ref={dropdownRef}>
      <div className="flex items-center gap-3">
        <MapPin className="w-5 h-5 text-[#FF690F] flex-shrink-0" />
        <div className="flex-1 flex flex-col">
          {label && <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">{label}</span>}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setShowDropdown(true)}
            onClick={() => setShowDropdown(true)}
            placeholder={placeholder}
            className="w-full bg-transparent border-none outline-none font-semibold text-gray-900 dark:text-white text-base placeholder-gray-400 dark:placeholder-gray-500 cursor-text"
          />
        </div>
        {inputValue && (
          <X 
            className="w-5 h-5 text-gray-400 hover:text-[#FF690F] dark:hover:text-[#FF690F] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200" 
            onClick={handleClearClick}
          />
        )}
      </div>

      {/* Swap Button (only for pickup location) */}
      {showSwapButton && onSwap && (
        <button
          className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-[#FF690F] to-[#FF8534] border-2 border-white dark:border-gray-900 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            onSwap();
          }}
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>
      )}

      {/* Dropdown */}
      {showDropdown && filteredCities.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-3 z-[9999] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-orange-400 hover:scrollbar-thumb-orange-500 dark:scrollbar-thumb-gray-600 dark:hover:scrollbar-thumb-gray-500 scrollbar-track-gray-100 dark:scrollbar-track-gray-800 animate-fadeIn">
          <div className="p-3">
            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 px-4 py-3 uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" />
              Popular Locations
            </div>
            {filteredCities.map((city) => (
              <div
                key={city}
                className="px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 dark:hover:from-gray-700 dark:hover:to-gray-700 flex items-center gap-4 group"
                onClick={() => handleCitySelect(city)}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF690F] to-[#FF8534] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white text-base">
                    {city.split(',')[0]}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {city.split(',').slice(1).join(',').trim()}
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400 -rotate-90 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
