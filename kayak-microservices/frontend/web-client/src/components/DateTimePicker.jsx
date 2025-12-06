import React, { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, Clock, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

const TIME_OPTIONS = [
  '12:00 AM', '12:30 AM', '1:00 AM', '1:30 AM', '2:00 AM', '2:30 AM',
  '3:00 AM', '3:30 AM', '4:00 AM', '4:30 AM', '5:00 AM', '5:30 AM',
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'
];

export default function DateTimePicker({ 
  label,
  selectedDate, 
  selectedTime, 
  onDateChange, 
  onTimeChange,
  minDate = new Date(),
  placeholder = "Select date",
  showBorder = true
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const containerRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowCalendar(false);
        setShowTimeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date for display
  const formatDateDisplay = (date) => {
    if (!date) return placeholder;
    return format(new Date(date), 'EEE M/d');
  };

  return (
    <div ref={containerRef} className="flex-1 bg-white dark:bg-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 relative group overflow-visible">
      <div className="flex flex-col gap-3">
        {/* Date Selection */}
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setShowCalendar(!showCalendar);
            setShowTimeDropdown(false);
          }}
        >
          <div className="flex items-center gap-3 flex-1">
            <Calendar className="w-5 h-5 text-[#FF690F]" />
            <div className="flex flex-col">
              {label && <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>}
              <span className="font-semibold text-gray-900 dark:text-white text-base">
                {formatDateDisplay(selectedDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Time Selection */}
        <div 
          className="flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setShowTimeDropdown(!showTimeDropdown);
            setShowCalendar(false);
          }}
        >
          <div className="flex items-center gap-2.5 flex-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
              {selectedTime || 'Noon'}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showTimeDropdown ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Calendar Dropdown */}
      {showCalendar && (
        <div 
          className="absolute top-full left-0 mt-2 z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-600 overflow-hidden animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          <style>
            {`
              .react-datepicker {
                font-family: inherit;
                border: none;
                background-color: transparent;
              }
              .react-datepicker__header {
                background-color: transparent;
                border-bottom: 1px solid #e5e7eb;
              }
              .dark .react-datepicker__header {
                border-bottom-color: #4b5563;
              }
              .react-datepicker__current-month {
                color: #111827;
                font-weight: 600;
                padding: 8px 0;
              }
              .dark .react-datepicker__current-month {
                color: #f3f4f6;
              }
              .react-datepicker__day-name {
                color: #6b7280;
                font-weight: 500;
              }
              .dark .react-datepicker__day-name {
                color: #9ca3af;
              }
              .react-datepicker__day {
                color: #374151;
                border-radius: 0.375rem;
                transition: all 0.2s;
              }
              .dark .react-datepicker__day {
                color: #d1d5db;
              }
              .react-datepicker__day:hover {
                background-color: #f3f4f6;
                border-radius: 0.375rem;
              }
              .dark .react-datepicker__day:hover {
                background-color: #374151;
              }
              .react-datepicker__day--selected {
                background-color: #FF690F !important;
                color: white !important;
                font-weight: 600;
              }
              .react-datepicker__day--keyboard-selected {
                background-color: #FF690F;
                color: white;
              }
              .react-datepicker__day--disabled {
                color: #d1d5db !important;
                cursor: not-allowed;
              }
              .dark .react-datepicker__day--disabled {
                color: #4b5563 !important;
              }
              .react-datepicker__navigation {
                top: 12px;
              }
              .react-datepicker__navigation-icon::before {
                border-color: #6b7280;
              }
              .dark .react-datepicker__navigation-icon::before {
                border-color: #9ca3af;
              }
            `}
          </style>
          <DatePicker
            selected={selectedDate ? new Date(selectedDate) : null}
            onChange={(date) => {
              onDateChange(date);
              setShowCalendar(false);
            }}
            minDate={minDate}
            inline
            calendarClassName="custom-calendar"
          />
        </div>
      )}

      {/* Time Dropdown */}
      {showTimeDropdown && (
        <div 
          className="absolute top-full left-0 mt-3 z-[9999] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 max-h-72 overflow-y-auto overflow-x-hidden w-48 scrollbar-thin scrollbar-thumb-orange-400 hover:scrollbar-thumb-orange-500 dark:scrollbar-thumb-gray-600 dark:hover:scrollbar-thumb-gray-500 scrollbar-track-gray-100 dark:scrollbar-track-gray-800 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2">
            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 px-3 py-2 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Select Time
            </div>
            {TIME_OPTIONS.map((time) => (
              <div
                key={time}
                className={`px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 font-medium ${
                  selectedTime === time
                    ? 'bg-gradient-to-r from-[#FF690F] to-[#FF8534] text-white shadow-md scale-[1.02]'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:pl-5'
                }`}
                onClick={() => {
                  onTimeChange(time);
                  setShowTimeDropdown(false);
                }}
              >
                {time}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
