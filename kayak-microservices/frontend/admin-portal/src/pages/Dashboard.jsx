/**
 * Dashboard Page
 * Main dashboard with metrics and recent bookings
 */

import React, { useState, useEffect } from 'react';
import MetricCard from '../components/dashboard/MetricCard';
import RecentBookingsTable from '../components/dashboard/RecentBookingsTable';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { getDashboardMetrics, getRecentBookings } from '../services/dashboardApi';
import './Dashboard.css';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    revenue: 0,
    bookings: 0,
    flights: 0,
    users: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch metrics and bookings in parallel
      const [metricsData, bookingsData] = await Promise.all([
        getDashboardMetrics(),
        getRecentBookings()
      ]);

      setMetrics(metricsData);
      setRecentBookings(bookingsData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">Overview of your flight booking system</p>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="dashboard-subtitle">Overview of your flight booking system</p>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Revenue"
          value={metrics.revenue}
          icon="💵"
          iconBg="#10b981"
          loading={loading}
        />
        <MetricCard
          title="Total Bookings"
          value={metrics.bookings}
          icon="📅"
          iconBg="#3b82f6"
          loading={loading}
        />
        <MetricCard
          title="Total Flights"
          value={metrics.flights}
          icon="✈️"
          iconBg="#8b5cf6"
          loading={loading}
        />
        <MetricCard
          title="Total Users"
          value={metrics.users}
          icon="👥"
          iconBg="#f59e0b"
          loading={loading}
        />
      </div>

      {/* Recent Bookings */}
      <RecentBookingsTable bookings={recentBookings} loading={loading} />
    </div>
  );
};

export default Dashboard;
