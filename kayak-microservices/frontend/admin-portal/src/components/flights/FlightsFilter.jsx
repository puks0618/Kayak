/**
 * Flights Filter Component
 */

import React from 'react';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Button from '../shared/Button';
import './FlightsFilter.css';

const FlightsFilter = ({ filters, onFilterChange, onSearch, onReset, airlines = [] }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const airlineOptions = airlines.map(airline => ({
    value: airline,
    label: airline
  }));

  return (
    <div className="flights-filter">
      <div className="filter-fields">
        <Select
          name="airline"
          label="Airline"
          value={filters.airline || ''}
          onChange={handleChange}
          options={airlineOptions}
          placeholder="All Airlines"
        />

        <Input
          name="origin"
          label="Origin"
          value={filters.origin || ''}
          onChange={handleChange}
          placeholder="e.g., JFK"
          maxLength={3}
        />

        <Input
          name="destination"
          label="Destination"
          value={filters.destination || ''}
          onChange={handleChange}
          placeholder="e.g., LAX"
          maxLength={3}
        />
      </div>

      <div className="filter-actions">
        <Button variant="ghost" size="small" onClick={onReset}>
          Reset
        </Button>
        <Button variant="primary" size="small" onClick={onSearch}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

export default FlightsFilter;
