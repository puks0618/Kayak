import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function DateRangeCalendar({ checkIn, checkOut, onSelect, onClose }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectingCheckIn, setSelectingCheckIn] = useState(true);
  const [tempCheckIn, setTempCheckIn] = useState(checkIn ? new Date(checkIn) : null);
  const [tempCheckOut, setTempCheckOut] = useState(checkOut ? new Date(checkOut) : null);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Removed price category coloring - keeping calendar simple and consistent

  // Check if date is in selected range
  const isInRange = (date) => {
    if (!tempCheckIn || !tempCheckOut) return false;
    return date >= tempCheckIn && date <= tempCheckOut;
  };

  // Check if date is selected
  const isSelected = (date) => {
    if (!tempCheckIn) return false;
    if (date.toDateString() === tempCheckIn.toDateString()) return true;
    if (tempCheckOut && date.toDateString() === tempCheckOut.toDateString()) return true;
    return false;
  };

  // Handle date selection
  const handleDateClick = (date) => {
    if (selectingCheckIn) {
      setTempCheckIn(date);
      setTempCheckOut(null);
      setSelectingCheckIn(false);
    } else {
      if (date < tempCheckIn) {
        setTempCheckIn(date);
        setTempCheckOut(null);
      } else {
        setTempCheckOut(date);
      }
    }
  };

  // Apply selection
  const handleApply = () => {
    if (tempCheckIn && tempCheckOut) {
      onSelect(tempCheckIn, tempCheckOut);
      onClose();
    }
  };

  // Render calendar for a specific month
  const renderMonth = (monthOffset) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const isPast = cellDate < today;
      const inRange = isInRange(cellDate);
      const selected = isSelected(cellDate);
      
      let bgColor = 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600';
      if (isPast) {
        bgColor = 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600';
      } else if (selected) {
        bgColor = 'bg-[#FF690F] text-white hover:bg-[#d6570c]';
      } else if (inRange) {
        bgColor = 'bg-orange-100 dark:bg-orange-900/30 text-gray-900 dark:text-white';
      }

      days.push(
        <button
          key={day}
          onClick={() => !isPast && handleDateClick(cellDate)}
          disabled={isPast}
          className={`h-12 rounded-lg font-semibold transition-all hover:scale-105 disabled:cursor-not-allowed ${bgColor}`}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="flex-1">
        <div className="text-center font-bold text-lg mb-4 text-gray-900 dark:text-white">
          {monthNames[month]} {year}
        </div>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((day, i) => (
            <div key={i} className="text-center font-semibold text-gray-600 dark:text-gray-400 text-sm">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          <div className="flex gap-8 mb-6">
            {renderMonth(0)}
            {renderMonth(1)}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!tempCheckIn || !tempCheckOut}
              className="px-6 py-2 bg-[#FF690F] text-white rounded-lg hover:bg-[#e85d0a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
