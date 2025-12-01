import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Input from '../shared/Input';
import Button from '../shared/Button';

const CarFormModal = ({ isOpen, onClose, onSubmit, car, loading }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'sedan',
    transmission: 'automatic',
    seats: 5,
    daily_rental_price: '',
    location: '',
    availability_status: true
  });

  useEffect(() => {
    if (car) {
      setFormData(car);
    } else {
      setFormData({
        company_name: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        type: 'sedan',
        transmission: 'automatic',
        seats: 5,
        daily_rental_price: '',
        location: '',
        availability_status: true
      });
    }
  }, [car, isOpen]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      year: parseInt(formData.year),
      seats: parseInt(formData.seats),
      daily_rental_price: parseFloat(formData.daily_rental_price)
    };
    onSubmit(submitData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={car ? 'Edit Car' : 'Add New Car'}>
      <form onSubmit={handleSubmit} className="car-form">
        <Input 
          name="company_name" 
          label="Company Name *" 
          value={formData.company_name} 
          onChange={handleChange} 
          required 
        />
        
        <div className="form-row">
          <Input 
            name="brand" 
            label="Brand *" 
            value={formData.brand} 
            onChange={handleChange} 
            required 
          />
          <Input 
            name="model" 
            label="Model *" 
            value={formData.model} 
            onChange={handleChange} 
            required 
          />
          <Input 
            name="year" 
            label="Year *" 
            type="number" 
            value={formData.year} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Type *</label>
            <select 
              name="type" 
              value={formData.type} 
              onChange={handleChange} 
              className="form-select" 
              required
            >
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="luxury">Luxury</option>
              <option value="economy">Economy</option>
              <option value="compact">Compact</option>
              <option value="van">Van</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Transmission *</label>
            <select 
              name="transmission" 
              value={formData.transmission} 
              onChange={handleChange} 
              className="form-select" 
              required
            >
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          
          <Input 
            name="seats" 
            label="Seats *" 
            type="number" 
            min="2" 
            max="15" 
            value={formData.seats} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="form-row">
          <Input 
            name="daily_rental_price" 
            label="Daily Price ($) *" 
            type="number" 
            step="0.01" 
            value={formData.daily_rental_price} 
            onChange={handleChange} 
            required 
          />
          <Input 
            name="location" 
            label="Location *" 
            value={formData.location} 
            onChange={handleChange} 
            placeholder="City or Airport Code" 
            required 
          />
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              name="availability_status" 
              checked={formData.availability_status} 
              onChange={handleChange} 
            />
            Available for Rent
          </label>
        </div>

        <div className="modal-actions">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving...' : car ? 'Update Car' : 'Create Car'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CarFormModal;
