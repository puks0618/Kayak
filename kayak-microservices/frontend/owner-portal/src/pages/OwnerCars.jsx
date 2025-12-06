import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
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
      setCars(response.data);
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
    : cars.filter(car => car.status === filter);

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
          className={filter === 'available' ? 'active' : ''}
          onClick={() => setFilter('available')}
        >
          Available
        </button>
        <button
          className={filter === 'booked' ? 'active' : ''}
          onClick={() => setFilter('booked')}
        >
          Booked
        </button>
        <button
          className={filter === 'maintenance' ? 'active' : ''}
          onClick={() => setFilter('maintenance')}
        >
          Maintenance
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
                {car.image ? (
                  <img src={car.image} alt={car.name} />
                ) : (
                  <div className="placeholder-image">🚗</div>
                )}
                <span className={`status-badge ${car.status}`}>
                  {car.status}
                </span>
              </div>
              
              <div className="car-details">
                <h3>{car.name}</h3>
                <p className="car-type">{car.type}</p>
                
                <div className="car-specs">
                  <span>👥 {car.seats} seats</span>
                  <span>⚙️ {car.transmission}</span>
                  <span>⛽ {car.fuelType}</span>
                </div>
                
                <div className="car-location">
                  <span>📍 {car.location}</span>
                </div>
                
                <div className="car-price">
                  <span className="price">${car.pricePerDay}/day</span>
                  {car.rating && (
                    <span className="rating">⭐ {car.rating}</span>
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
