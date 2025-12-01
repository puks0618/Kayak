/**
 * Dashboard Page
 * Main dashboard with metrics, charts, and analytics
 */

import React, { useState, useEffect } from 'react';
import MetricCard from '../components/dashboard/MetricCard';
import RecentBookingsTable from '../components/dashboard/RecentBookingsTable';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { getDashboardMetrics, getRecentBookings } from '../services/dashboardApi';
import { analyticsApi } from '../services/analyticsApi';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c', '#d084d0'];

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    totalListings: 0,
    totalUsers: 0,
    totalFlights: 0,
    totalHotels: 0,
    totalCars: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [topProperties, setTopProperties] = useState([]);
  const [cityRevenue, setCityRevenue] = useState([]);
  const [topHosts, setTopHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const lastMonth = new Date().getMonth() || 12; // Current month or December if January

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel with new endpoints
      const [metricsData, bookingsData, topPropsData, cityRevData, hostsData] = await Promise.allSettled([
        analyticsApi.getDashboardMetrics(),
        getRecentBookings(),
        analyticsApi.getTopProperties(selectedYear, 10),
        analyticsApi.getCityRevenue(selectedYear),
        analyticsApi.getTopHosts(lastMonth, selectedYear, 10)
      ]);

      if (metricsData.status === 'fulfilled') {
        console.log('Dashboard metrics received:', metricsData.value);
        setMetrics(metricsData.value);
      } else {
        console.error('Failed to fetch metrics:', metricsData.reason);
      }
      if (bookingsData.status === 'fulfilled') {
        setRecentBookings(bookingsData.value || []);
      }
      if (topPropsData.status === 'fulfilled') {
        // Transform data for charts
        const props = (topPropsData.value.properties || []).map(p => ({
          name: `${p.listing_type} #${p.listing_id}`,
          revenue: p.total_revenue,
          bookings: p.total_bookings
        }));
        setTopProperties(props);
      }
      if (cityRevData.status === 'fulfilled') {
        // Transform data for pie chart
        const cities = (cityRevData.value.cities || []).slice(0, 10).map(c => ({
          name: c.city || 'Unknown',
          value: c.total_revenue
        }));
        setCityRevenue(cities);
      }
      if (hostsData.status === 'fulfilled') {
        // Transform data for bar chart
        const hosts = (hostsData.value.hosts || []).map(h => ({
          name: `Owner ${h.owner_id}`,
          properties: h.properties_sold,
          revenue: h.total_revenue
        }));
        setTopHosts(hosts);
      }
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
          <h1>Admin Dashboard</h1>
          <p className="dashboard-subtitle">Comprehensive analytics and system overview</p>
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
        <h1>Admin Dashboard</h1>
        <p className="dashboard-subtitle">Comprehensive analytics and system overview</p>
        <div className="year-selector">
          <label>Year: </label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Revenue"
          value={metrics.totalRevenue || 0}
          icon="💵"
          iconBg="#10b981"
          loading={loading}
        />
        <MetricCard
          title="Total Bookings"
          value={metrics.totalBookings || 0}
          icon="📅"
          iconBg="#3b82f6"
          loading={loading}
        />
        <MetricCard
          title="Total Listings"
          value={metrics.totalListings || 0}
          icon="🏨"
          iconBg="#8b5cf6"
          loading={loading}
        />
        <MetricCard
          title="Total Users"
          value={metrics.totalUsers || 0}
          icon="👥"
          iconBg="#f59e0b"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Top 10 Properties with Revenue */}
        <div className="chart-container">
          <h2>Top 10 Properties by Revenue ({selectedYear})</h2>
          {loading ? (
            <LoadingSpinner />
          ) : topProperties.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProperties}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => `$${parseFloat(value || 0).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No data available</p>
          )}
        </div>

        {/* City-wise Revenue */}
        <div className="chart-container">
          <h2>City-wise Revenue ({selectedYear})</h2>
          {loading ? (
            <LoadingSpinner />
          ) : cityRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cityRevenue}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: $${parseFloat(entry.value || 0).toLocaleString()}`}
                >
                  {cityRevenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No data available</p>
          )}
        </div>

        {/* Top 10 Hosts/Providers */}
        <div className="chart-container full-width">
          <h2>Top 10 Hosts/Providers (Last Month)</h2>
          {loading ? (
            <LoadingSpinner />
          ) : topHosts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topHosts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip formatter={(value) => parseFloat(value || 0).toLocaleString()} />
                <Legend />
                <Bar yAxisId="left" dataKey="properties" fill="#8884d8" name="Properties Sold" />
                <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No data available</p>
          )}
        </div>
      </div>

      {/* Recent Bookings */}
      <RecentBookingsTable bookings={recentBookings} loading={loading} />
    </div>
  );
};

export default Dashboard;
