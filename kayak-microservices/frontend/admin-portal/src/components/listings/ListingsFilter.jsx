import React from 'react';
import './ListingsFilter.css';

const ListingsFilter = ({ filters, onFilterChange }) => {
  const handleTypeChange = (e) => {
    onFilterChange({ ...filters, type: e.target.value, page: 1 });
  };

  const handleStatusChange = (e) => {
    onFilterChange({ ...filters, status: e.target.value, page: 1 });
  };

  const handleSearchChange = (e) => {
    onFilterChange({ ...filters, search: e.target.value, page: 1 });
  };

  const handleClearFilters = () => {
    onFilterChange({ type: 'all', status: 'all', search: '', page: 1, limit: 20 });
  };

  return (
    <div className="listings-filter">
      <div className="filter-group">
        <label htmlFor="type-filter">Type:</label>
        <select
          id="type-filter"
          value={filters.type || 'all'}
          onChange={handleTypeChange}
          className="filter-select"
        >
          <option value="all">All Types</option>
          <option value="flight">Flights</option>
          <option value="hotel">Hotels</option>
          <option value="car">Cars</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="status-filter">Status:</label>
        <select
          id="status-filter"
          value={filters.status || 'all'}
          onChange={handleStatusChange}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      <div className="filter-group search-group">
        <label htmlFor="search-filter">Search:</label>
        <input
          id="search-filter"
          type="text"
          value={filters.search || ''}
          onChange={handleSearchChange}
          placeholder="Search listings..."
          className="filter-input"
        />
      </div>

      <button onClick={handleClearFilters} className="btn-clear-filters">
        Clear Filters
      </button>
    </div>
  );
};

export default ListingsFilter;
