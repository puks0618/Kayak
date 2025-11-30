import React from 'react';
import './UsersFilter.css';

const UsersFilter = ({ filters, onFilterChange }) => {
  const handleStatusChange = (e) => {
    onFilterChange({ ...filters, status: e.target.value, page: 1 });
  };

  const handleSearchChange = (e) => {
    onFilterChange({ ...filters, search: e.target.value, page: 1 });
  };

  const handleClearFilters = () => {
    onFilterChange({ status: 'all', search: '', page: 1, limit: 20 });
  };

  return (
    <div className="users-filter">
      <div className="filter-group">
        <label htmlFor="status-filter">Status:</label>
        <select
          id="status-filter"
          value={filters.status || 'all'}
          onChange={handleStatusChange}
          className="filter-select"
        >
          <option value="all">All Users</option>
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
          placeholder="Search by name or email..."
          className="filter-input"
        />
      </div>

      <button onClick={handleClearFilters} className="btn-clear-filters">
        Clear Filters
      </button>
    </div>
  );
};

export default UsersFilter;
