/**
 * Bookings Filter Component
 */

import React from 'react';
import Button from '../shared/Button';
import './BookingsFilter.css';

const BookingsFilter = ({ filters, onFilterChange, onSearch, onReset }) => {
  const handleInputChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="bookings-filter">
      <div className="filter-row">
        <div className="filter-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={filters.status || ''}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="listing_type">Listing Type</label>
          <select
            id="listing_type"
            value={filters.listing_type || ''}
            onChange={(e) => handleInputChange('listing_type', e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="flight">Flight</option>
            <option value="hotel">Hotel</option>
            <option value="car">Car</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="user_id">User ID</label>
          <input
            type="text"
            id="user_id"
            value={filters.user_id || ''}
            onChange={(e) => handleInputChange('user_id', e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter user ID..."
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="date_from">Date From</label>
          <input
            type="date"
            id="date_from"
            value={filters.date_from || ''}
            onChange={(e) => handleInputChange('date_from', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="date_to">Date To</label>
          <input
            type="date"
            id="date_to"
            value={filters.date_to || ''}
            onChange={(e) => handleInputChange('date_to', e.target.value)}
            className="filter-input"
          />
        </div>
      </div>

      <div className="filter-actions">
        <Button variant="primary" onClick={onSearch}>
          🔍 Search
        </Button>
        <Button variant="secondary" onClick={onReset}>
          🔄 Reset
        </Button>
      </div>
    </div>
  );
};

export default BookingsFilter;
