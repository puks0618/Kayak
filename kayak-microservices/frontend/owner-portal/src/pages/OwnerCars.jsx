import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ownerAPI } from '../api/authClient';
import '../styles/OwnerListings.css';

const OwnerCars = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMyCars();
  }, []);

  const fetchMyCars = async () => {
    try {
      const response = await ownerAPI.getCars();
      console.log('Cars API response:', response.data);
      setCars(response.data?.cars || []);
    } catch (err) {
      console.error('Error fetching cars:', err);
      setError('Failed to load your car listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (carId) => {
    if (!window.confirm('Are you sure you want to delete this car listing?')) {
      return;
    }

    try {
      await ownerAPI.deleteCar(carId);
      setCars(cars.filter(car => car.id !== carId));
      alert('Car listing deleted successfully');
    } catch (err) {
      console.error('Error deleting car:', err);
      alert('Failed to delete car listing');
    }
  };

  const filteredCars = filter === 'all' 
    ? cars 
    : cars.filter(car => car.approval_status === filter);

  if (loading) {
    return (
      <div className="owner-listings">
        <div className="loading">Loading your car listings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-listings">
        <div className="error-message">{error}</div>
        <button onClick={fetchMyCars} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="owner-listings">
      <div className="listings-header">
        <div>
          <h1>My Car Listings</h1>
          <p className="subtitle">Manage your car rental inventory</p>
        </div>
        <Link to="/cars/new" className="add-button">
          <span>+ Add New Car</span>
        </Link>
      </div>

      <div className="filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All Cars ({cars.length})
        </button>
        <button
          className={filter === 'approved' ? 'active' : ''}
          onClick={() => setFilter('approved')}
        >
          Approved
        </button>
        <button
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button
          className={filter === 'rejected' ? 'active' : ''}
          onClick={() => setFilter('rejected')}
        >
          Rejected
        </button>
      </div>

      {filteredCars.length === 0 ? (
        <div className="empty-state">
          <p>No cars found</p>
          <Link to="/cars/new" className="add-button">
            Add your first car
          </Link>
        </div>
      ) : (
        <div className="listings-grid">
          {filteredCars.map((car) => (
            <div key={car.id} className="listing-card">
              <div className="car-image">
                {car.images && car.images.length > 0 ? (
                  <img src={car.images[0]} alt={`${car.brand} ${car.model}`} />
                ) : (
                  <div className="placeholder-image">🚗</div>
                )}
                <span className={`status-badge ${car.approval_status}`}>
                  {car.approval_status}
                </span>
              </div>
              
              <div className="car-details">
                <h3>{car.brand} {car.model}</h3>
                <p className="car-type">{car.type} • {car.year}</p>
                
                <div className="car-specs">
                  <span>👥 {car.seats} seats</span>
                  <span>⚙️ {car.transmission}</span>
                  <span>⛽ {car.fuel_type}</span>
                </div>
                
                <div className="car-location">
                  <span>📍 {car.location}</span>
                </div>
                
                <div className="car-price">
                  <span className="price">${parseFloat(car.daily_rental_price).toFixed(2)}/day</span>
                  {car.rating && parseFloat(car.rating) > 0 && (
                    <span className="rating">⭐ {parseFloat(car.rating).toFixed(1)}</span>
                  )}
                </div>

                <div className="car-booking-stats">
                  <div className="stat">
                    <span className="stat-label">Bookings:</span>
                    <span className="stat-value">{car.booking_count || 0}</span>
                  </div>
                  {car.booking_revenue && (
                    <div className="stat">
                      <span className="stat-label">Revenue:</span>
                      <span className="stat-value">${parseFloat(car.booking_revenue).toFixed(0)}</span>
                    </div>
                  )}
                </div>
                
                <div className="car-actions">
                  {/* Edit functionality not yet implemented */}
                  {/* <Link
                    to={`/cars/edit/${car.id}`}
                    className="edit-button"
                  >
                    Edit
                  </Link> */}
                  <button
                    onClick={() => handleDelete(car.id)}
                    className="delete-button"
                    style={{ width: '100%' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerCars;
