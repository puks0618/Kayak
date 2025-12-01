import React from 'react';
import Input from '../shared/Input';
import Button from '../shared/Button';
import './CarsFilter.css';

const CarsFilter = ({ filters, onFilterChange, onSearch, onReset }) => {
  const handleChange = (e) => {
    onFilterChange({ ...filters, [e.target.name]: e.target.value });
  };

  const carTypes = ['sedan', 'suv', 'luxury', 'economy', 'compact', 'van'];

  return (
    <div className="cars-filter">
      <div className="filter-row">
        <Input 
          name="search" 
          label="Search" 
          value={filters.search || ''} 
          onChange={handleChange} 
          placeholder="Brand, model, company..." 
        />
        <Input 
          name="location" 
          label="Location" 
          value={filters.location || ''} 
          onChange={handleChange} 
          placeholder="City or Airport Code" 
        />
        <div className="form-group">
          <label>Car Type</label>
          <select 
            name="type" 
            value={filters.type || ''} 
            onChange={handleChange} 
            className="form-select"
          >
            <option value="">All Types</option>
            {carTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
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

export default CarsFilter;
