import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import '../styles/analytics.css';

const AnalyticsDashboard = () => {
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [topProperties, setTopProperties] = useState([]);
  const [cityRevenue, setCityRevenue] = useState([]);
  const [topHosts, setTopHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [metricsRes, propsRes, citiesRes, hostsRes] = await Promise.all([
        axios.get('http://localhost:3007/api/admin/analytics/dashboard'),
        axios.get('http://localhost:3007/api/admin/analytics/top-properties'),
        axios.get('http://localhost:3007/api/admin/analytics/city-revenue'),
        axios.get('http://localhost:3007/api/admin/analytics/top-hosts')
      ]);

      setDashboardMetrics(metricsRes.data.data);
      setTopProperties(propsRes.data.data);
      setCityRevenue(citiesRes.data.data);
      setTopHosts(hostsRes.data.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="analytics-dashboard">
      <h1>Analytics Dashboard</h1>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        {dashboardMetrics && (
          <>
            <MetricCard
              title="Total Users"
              value={Object.values(dashboardMetrics.users || {}).reduce((a, b) => a + b, 0)}
              subtext={`Travellers: ${dashboardMetrics.users?.traveller || 0} | Owners: ${dashboardMetrics.users?.owner || 0}`}
            />
            <MetricCard
              title="Total Bookings"
              value={dashboardMetrics.bookings?.total_bookings || 0}
              subtext={`Completed: ${dashboardMetrics.bookings?.completed || 0} | Confirmed: ${dashboardMetrics.bookings?.confirmed || 0}`}
            />
            <MetricCard
              title="Owner Revenue"
              value={`$${dashboardMetrics.bookings?.total_revenue || '0'}`}
              subtext={`Platform Revenue: $${dashboardMetrics.bookings?.platform_revenue || '0'}`}
            />
            <MetricCard
              title="Avg Booking Value"
              value={`$${(parseFloat(dashboardMetrics.bookings?.total_revenue || 0) / (dashboardMetrics.bookings?.total_bookings || 1)).toFixed(2)}`}
              subtext="Per Booking"
            />
          </>
        )}
      </div>

      {/* Monthly Revenue Trend */}
      <div className="chart-section">
        <h2>Monthly Revenue Trend</h2>
        {dashboardMetrics?.monthly && dashboardMetrics.monthly.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardMetrics.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Legend />
              <Line type="monotone" dataKey="owner_revenue" stroke="#3b82f6" name="Owner Revenue" />
              <Line type="monotone" dataKey="platform_revenue" stroke="#10b981" name="Platform Revenue" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="charts-row">
        {/* Top 10 Properties by Revenue */}
        <div className="chart-section half">
          <h2>Top 10 Properties by Revenue</h2>
          {topProperties && topProperties.length > 0 && (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topProperties.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Bar dataKey="total_revenue" fill="#3b82f6" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* City-wise Revenue */}
        <div className="chart-section half">
          <h2>City-wise Revenue Distribution</h2>
          {cityRevenue && cityRevenue.length > 0 && (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={cityRevenue.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Bar dataKey="total_revenue" fill="#10b981" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="charts-row">
        {/* Revenue by City - Pie */}
        <div className="chart-section half">
          <h2>Revenue Distribution by City (Top 8)</h2>
          {cityRevenue && cityRevenue.length > 0 && (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={cityRevenue.slice(0, 8)}
                  dataKey="total_revenue"
                  nameKey="city"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {cityRevenue.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top 10 Hosts Table */}
        <div className="chart-section half">
          <h2>Top 10 Hosts (This Month)</h2>
          {topHosts && topHosts.length > 0 && (
            <div className="table-container">
              <table className="hosts-table">
                <thead>
                  <tr>
                    <th>Host Email</th>
                    <th>Properties</th>
                    <th>Bookings</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topHosts.map((host, idx) => (
                    <tr key={idx}>
                      <td>{host.host_email}</td>
                      <td>{host.property_count}</td>
                      <td>{host.booking_count}</td>
                      <td>${parseFloat(host.total_revenue || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Top Properties Table */}
      <div className="chart-section">
        <h2>Top 10 Properties Details</h2>
        {topProperties && topProperties.length > 0 && (
          <div className="table-container">
            <table className="properties-table">
              <thead>
                <tr>
                  <th>Property Name</th>
                  <th>City</th>
                  <th>Bookings</th>
                  <th>Total Revenue</th>
                  <th>Avg Booking Value</th>
                </tr>
              </thead>
              <tbody>
                {topProperties.slice(0, 10).map((prop, idx) => (
                  <tr key={idx}>
                    <td>{prop.name || 'N/A'}</td>
                    <td>{prop.city || 'N/A'}</td>
                    <td>{prop.booking_count}</td>
                    <td>${parseFloat(prop.total_revenue || 0).toFixed(2)}</td>
                    <td>${parseFloat(prop.avg_booking_value || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <button className="refresh-btn" onClick={fetchAnalytics}>
        Refresh Data
      </button>
    </div>
  );
};

const MetricCard = ({ title, value, subtext }) => (
  <div className="metric-card">
    <h3>{title}</h3>
    <div className="metric-value">{value}</div>
    {subtext && <p className="metric-subtext">{subtext}</p>}
  </div>
);

export default AnalyticsDashboard;
