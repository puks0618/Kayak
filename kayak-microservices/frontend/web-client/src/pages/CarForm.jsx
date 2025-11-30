import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ownerAPI } from '../api/authClient';
import '../styles/CarForm.css';

const CarForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    seats: '',
    transmission: 'automatic',
    fuelType: 'petrol',
    pricePerDay: '',
    location: '',
    description: '',
    features: '',
    image: '',
    status: 'available'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      fetchCarDetails();
    }
  }, [id]);

  const fetchCarDetails = async () => {
    try {
      const response = await ownerAPI.getCar(id);
      const car = response.data;
      setFormData({
        name: car.name || '',
        type: car.type || '',
        seats: car.seats || '',
        transmission: car.transmission || 'automatic',
        fuelType: car.fuelType || 'petrol',
        pricePerDay: car.pricePerDay || '',
        location: car.location || '',
        description: car.description || '',
        features: Array.isArray(car.features) ? car.features.join(', ') : car.features || '',
        image: car.image || '',
        status: car.status || 'available'
      });
    } catch (err) {
      console.error('Error fetching car details:', err);
      setError('Failed to load car details');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert features string to array
      const featuresArray = formData.features
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const carData = {
        ...formData,
        seats: parseInt(formData.seats),
        pricePerDay: parseFloat(formData.pricePerDay),
        features: featuresArray
      };

      if (isEditMode) {
        await ownerAPI.updateCar(id, carData);
        alert('Car updated successfully!');
      } else {
        await ownerAPI.createCar(carData);
        alert('Car added successfully!');
      }

      navigate('/owner/cars');
    } catch (err) {
      console.error('Error saving car:', err);
      setError(err.response?.data?.message || 'Failed to save car listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="car-form-container">
      <div className="form-header">
        <h1>{isEditMode ? 'Edit Car Listing' : 'Add New Car'}</h1>
        <button onClick={() => navigate('/owner/cars')} className="back-button">
          ← Back to Listings
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="car-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label htmlFor="name">Car Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Toyota Camry 2023"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Car Type *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="">Select Type</option>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="hatchback">Hatchback</option>
                <option value="luxury">Luxury</option>
                <option value="sports">Sports</option>
                <option value="van">Van</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="seats">Number of Seats *</label>
              <input
                type="number"
                id="seats"
                name="seats"
                value={formData.seats}
                onChange={handleChange}
                min="2"
                max="12"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="transmission">Transmission *</label>
              <select
                id="transmission"
                name="transmission"
                value={formData.transmission}
                onChange={handleChange}
                required
              >
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="fuelType">Fuel Type *</label>
              <select
                id="fuelType"
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
                required
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Pricing & Location</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pricePerDay">Price Per Day ($) *</label>
              <input
                type="number"
                id="pricePerDay"
                name="pricePerDay"
                value={formData.pricePerDay}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="50.00"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location *</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., San Francisco, CA"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="status">Availability Status *</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2>Details</h2>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Describe your car, its condition, and any special notes..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="features">Features (comma-separated)</label>
            <input
              type="text"
              id="features"
              name="features"
              value={formData.features}
              onChange={handleChange}
              placeholder="GPS, Bluetooth, Backup Camera, Sunroof"
            />
            <small>Enter features separated by commas</small>
          </div>

          <div className="form-group">
            <label htmlFor="image">Image URL</label>
            <input
              type="url"
              id="image"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="https://example.com/car-image.jpg"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/owner/cars')}
            className="cancel-button"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditMode ? 'Update Car' : 'Add Car')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CarForm;
