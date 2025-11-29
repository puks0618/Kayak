/**
 * Add/Edit Flight Modal Component
 */

import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Button from '../shared/Button';
import './FlightFormModal.css';

const FlightFormModal = ({ isOpen, onClose, onSubmit, flight = null, loading = false }) => {
  const isEditMode = !!flight;
  
  const [formData, setFormData] = useState({
    flight_code: '',
    airline: '',
    departure_airport: '',
    arrival_airport: '',
    departure_time: '',
    arrival_time: '',
    duration: '',
    price: '',
    total_seats: '',
    class: 'economy'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (flight) {
      setFormData({
        flight_code: flight.flight_code || '',
        airline: flight.airline || '',
        departure_airport: flight.departure_airport || '',
        arrival_airport: flight.arrival_airport || '',
        departure_time: formatDateTimeForInput(flight.departure_time) || '',
        arrival_time: formatDateTimeForInput(flight.arrival_time) || '',
        duration: flight.duration || '',
        price: flight.price || '',
        total_seats: flight.total_seats || '',
        class: flight.class || 'economy'
      });
    } else {
      // Reset form for new flight
      setFormData({
        flight_code: '',
        airline: '',
        departure_airport: '',
        arrival_airport: '',
        departure_time: '',
        arrival_time: '',
        duration: '',
        price: '',
        total_seats: '',
        class: 'economy'
      });
    }
    setErrors({});
  }, [flight, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.flight_code.trim()) {
      newErrors.flight_code = 'Flight code is required';
    }
    if (!formData.airline.trim()) {
      newErrors.airline = 'Airline is required';
    }
    if (!formData.departure_airport.trim()) {
      newErrors.departure_airport = 'Departure airport is required';
    } else if (formData.departure_airport.length !== 3) {
      newErrors.departure_airport = 'Airport code must be 3 letters';
    }
    if (!formData.arrival_airport.trim()) {
      newErrors.arrival_airport = 'Arrival airport is required';
    } else if (formData.arrival_airport.length !== 3) {
      newErrors.arrival_airport = 'Airport code must be 3 letters';
    }
    if (!formData.departure_time) {
      newErrors.departure_time = 'Departure time is required';
    }
    if (!formData.arrival_time) {
      newErrors.arrival_time = 'Arrival time is required';
    }
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    if (!formData.total_seats || formData.total_seats <= 0) {
      newErrors.total_seats = 'Total seats must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      departure_airport: formData.departure_airport.toUpperCase(),
      arrival_airport: formData.arrival_airport.toUpperCase(),
      price: parseFloat(formData.price),
      total_seats: parseInt(formData.total_seats)
    };

    onSubmit(submitData);
  };

  const classOptions = [
    { value: 'economy', label: 'Economy' },
    { value: 'business', label: 'Business' },
    { value: 'first', label: 'First Class' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Flight' : 'Add New Flight'}
      size="large"
    >
      <form onSubmit={handleSubmit} className="flight-form">
        <div className="form-grid">
          <Input
            label="Flight Code"
            name="flight_code"
            value={formData.flight_code}
            onChange={handleChange}
            placeholder="e.g., AA123"
            required
            error={errors.flight_code}
          />

          <Input
            label="Airline"
            name="airline"
            value={formData.airline}
            onChange={handleChange}
            placeholder="e.g., American Airlines"
            required
            error={errors.airline}
          />

          <Input
            label="Departure Airport"
            name="departure_airport"
            value={formData.departure_airport}
            onChange={handleChange}
            placeholder="e.g., JFK"
            maxLength={3}
            required
            error={errors.departure_airport}
          />

          <Input
            label="Arrival Airport"
            name="arrival_airport"
            value={formData.arrival_airport}
            onChange={handleChange}
            placeholder="e.g., LAX"
            maxLength={3}
            required
            error={errors.arrival_airport}
          />

          <Input
            label="Departure Time"
            name="departure_time"
            type="datetime-local"
            value={formData.departure_time}
            onChange={handleChange}
            required
            error={errors.departure_time}
          />

          <Input
            label="Arrival Time"
            name="arrival_time"
            type="datetime-local"
            value={formData.arrival_time}
            onChange={handleChange}
            required
            error={errors.arrival_time}
          />

          <Input
            label="Duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="e.g., 5h 30m"
          />

          <Input
            label="Price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={handleChange}
            placeholder="e.g., 350.00"
            required
            error={errors.price}
          />

          <Input
            label="Total Seats"
            name="total_seats"
            type="number"
            min="1"
            value={formData.total_seats}
            onChange={handleChange}
            placeholder="e.g., 180"
            required
            error={errors.total_seats}
          />

          <Select
            label="Class"
            name="class"
            value={formData.class}
            onChange={handleChange}
            options={classOptions}
            required
          />
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEditMode ? 'Update Flight' : 'Add Flight'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Helper function to format date for datetime-local input
const formatDateTimeForInput = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Format: YYYY-MM-DDTHH:MM
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    return '';
  }
};

export default FlightFormModal;
