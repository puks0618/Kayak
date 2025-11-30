import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ownerAPI } from '../api/authClient';
import '../styles/OwnerDashboard.css';

const OwnerDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOwnerStats();
  }, []);

  const fetchOwnerStats = async () => {
    try {
      const response = await ownerAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="owner-dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-dashboard">
        <div className="error-message">{error}</div>
        <button onClick={fetchOwnerStats} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="owner-dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.firstName || 'Owner'}!</h1>
        <p className="subtitle">Manage your car listings and track your bookings</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🚗</div>
          <div className="stat-content">
            <h3>Total Cars</h3>
            <p className="stat-value">{stats?.totalCars || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Active Bookings</h3>
            <p className="stat-value">{stats?.activeBookings || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-value">${stats?.totalRevenue || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>Average Rating</h3>
            <p className="stat-value">{stats?.averageRating || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/owner/cars" className="action-button">
            <span className="button-icon">🚗</span>
            <span>Manage Cars</span>
          </Link>
          <Link to="/owner/cars/new" className="action-button primary">
            <span className="button-icon">➕</span>
            <span>Add New Car</span>
          </Link>
          <Link to="/owner/bookings" className="action-button">
            <span className="button-icon">📋</span>
            <span>View Bookings</span>
          </Link>
        </div>
      </div>

      {stats?.recentBookings && stats.recentBookings.length > 0 && (
        <div className="recent-bookings">
          <h2>Recent Bookings</h2>
          <div className="bookings-list">
            {stats.recentBookings.map((booking) => (
              <div key={booking.id} className="booking-item">
                <div className="booking-info">
                  <h4>{booking.carName}</h4>
                  <p>Customer: {booking.customerName}</p>
                  <p>
                    {new Date(booking.startDate).toLocaleDateString()} -{' '}
                    {new Date(booking.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="booking-status">
                  <span className={`status-badge ${booking.status}`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
