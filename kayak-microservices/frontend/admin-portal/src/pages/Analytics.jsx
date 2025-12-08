/**
 * Analytics Page
 * Complete analytics dashboard with charts and reports
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell 
} from 'recharts';
import api from '../services/api';
import '../styles/Analytics.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B', '#4ECDC4', '#45B7D1'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [period, setPeriod] = useState('last_month');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [overview, setOverview] = useState(null);
  const [topProperties, setTopProperties] = useState([]);
  const [cityRevenue, setCityRevenue] = useState([]);
  const [topProviders, setTopProviders] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllAnalytics();
  }, [selectedYear, period]);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, propertiesRes, cityRes, providersRes] = await Promise.all([
        api.get(`/admin/analytics/overview?year=${selectedYear}`),
        api.get(`/admin/analytics/top-properties?year=${selectedYear}`),
        api.get(`/admin/analytics/city-revenue?year=${selectedYear}`),
        api.get(`/admin/analytics/top-providers?period=${period}`)
      ]);

      setOverview(overviewRes.data);
      setTopProperties(propertiesRes.data.data || []);
      setCityRevenue(cityRes.data.data || []);
      setTopProviders(providersRes.data.data || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const renderOverview = () => {
    if (!overview) return null;

    return (
      <div className="overview-section">
        <h2>📊 Dashboard Overview</h2>
        
        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon">📈</div>
            <div className="card-content">
              <h3>Total Revenue</h3>
              <p className="card-value">{formatCurrency(overview.summary.total_revenue)}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">🎫</div>
            <div className="card-content">
              <h3>Total Bookings</h3>
              <p className="card-value">{overview.summary.total_bookings.toLocaleString()}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">👥</div>
            <div className="card-content">
              <h3>Unique Customers</h3>
              <p className="card-value">{overview.summary.unique_customers.toLocaleString()}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <h3>Avg Booking Value</h3>
              <p className="card-value">{formatCurrency(overview.summary.avg_booking_value)}</p>
            </div>
          </div>
        </div>

        {/* Booking Breakdown */}
        <div className="charts-row">
          <div className="chart-container">
            <h3>Booking Breakdown by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={overview.booking_breakdown}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.type}: ${entry.count}`}
                >
                  {overview.booking_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Trend */}
          <div className="chart-container">
            <h3>Monthly Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={overview.monthly_trend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_name" />
                <YAxis 
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                  padding={{ top: 20, bottom: 20 }}
                />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  strokeWidth={3} 
                  name="Revenue"
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderTopProperties = () => {
    if (topProperties.length === 0) {
      return <div className="no-data">No hotel property bookings found for this year. Properties specifically refer to hotels and accommodations.</div>;
    }

    // Prepare data for bar chart
    const chartData = topProperties.slice(0, 10).map(prop => ({
      name: prop.property_name.length > 20 ? prop.property_name.substring(0, 20) + '...' : prop.property_name,
      revenue: parseFloat(prop.total_revenue),
      bookings: prop.total_bookings,
      type: prop.property_type
    }));

    return (
      <div className="report-section">
        <h2>🏨 Top 10 Hotel Properties with Revenue per Year</h2>
        <p className="report-subtitle">Top performing hotel and stay properties (accommodations only)</p>
        
        {/* Bar Chart */}
        <div className="chart-container large">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value, name) => {
                if (name === 'revenue') return formatCurrency(value);
                return value;
              }} />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue ($)" />
              <Bar dataKey="bookings" fill="#82ca9d" name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Table View */}
        <div className="table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Property Name</th>
                <th>Type</th>
                <th>Location</th>
                <th>Bookings</th>
                <th>Total Revenue</th>
                <th>Avg Value</th>
              </tr>
            </thead>
            <tbody>
              {topProperties.map((prop, index) => (
                <tr key={prop.listing_id}>
                  <td className="rank">{index + 1}</td>
                  <td className="property-name">{prop.property_name}</td>
                  <td>
                    <span className={`badge badge-${prop.property_type}`}>
                      {prop.property_type}
                    </span>
                  </td>
                  <td>{prop.location}</td>
                  <td>{prop.total_bookings}</td>
                  <td className="revenue">{formatCurrency(prop.total_revenue)}</td>
                  <td>{formatCurrency(prop.avg_booking_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCityRevenue = () => {
    if (cityRevenue.length === 0) {
      return <div className="no-data">No data available for city revenue</div>;
    }

    // Prepare top 15 cities for chart
    const topCities = cityRevenue.slice(0, 15);
    const chartData = topCities.map(city => ({
      city: city.city,
      revenue: parseFloat(city.total_revenue),
      bookings: city.total_bookings
    }));

    return (
      <div className="report-section">
        <h2>🌆 City-wise Revenue per Year</h2>
        
        {/* Bar Chart */}
        <div className="chart-container large">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="city" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" fill="#0088FE" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Top 10 Cities */}
        <div className="chart-container">
          <h3>Top 10 Cities - Revenue Distribution</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData.slice(0, 10)}
                dataKey="revenue"
                nameKey="city"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={(entry) => `${entry.city}: ${formatCurrency(entry.revenue)}`}
              >
                {chartData.slice(0, 10).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Table View */}
        <div className="table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>City</th>
                <th>State</th>
                <th>Total Bookings</th>
                <th>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {cityRevenue.map((city, index) => (
                <tr key={index}>
                  <td className="rank">{index + 1}</td>
                  <td className="city-name">{city.city}</td>
                  <td>{city.state || 'N/A'}</td>
                  <td>{city.total_bookings}</td>
                  <td className="revenue">{formatCurrency(city.total_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTopProviders = () => {
    if (topProviders.length === 0) {
      return <div className="no-data">No data available for top providers</div>;
    }

    const chartData = topProviders.map(provider => ({
      name: provider.provider_name.length > 25 ? provider.provider_name.substring(0, 25) + '...' : provider.provider_name,
      sold: provider.properties_sold,
      revenue: parseFloat(provider.total_revenue),
      type: provider.provider_type
    }));

    return (
      <div className="report-section">
        <h2>👨‍💼 Top 10 Hosts/Providers - Maximum Properties Sold</h2>
        <p className="report-subtitle">Period: {period === 'last_month' ? 'Last Month' : 'Last 3 Months'}</p>
        
        {/* Bar Chart */}
        <div className="chart-container large">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="sold" fill="#8884d8" name="Properties Sold" />
              <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Table View */}
        <div className="table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Provider Name</th>
                <th>Type</th>
                <th>Properties Sold</th>
                <th>Total Revenue</th>
                <th>Unique Properties</th>
              </tr>
            </thead>
            <tbody>
              {topProviders.map((provider, index) => (
                <tr key={index}>
                  <td className="rank">{index + 1}</td>
                  <td className="provider-name">{provider.provider_name}</td>
                  <td>
                    <span className={`badge badge-${provider.provider_type}`}>
                      {provider.provider_type}
                    </span>
                  </td>
                  <td>{provider.properties_sold}</td>
                  <td className="revenue">{formatCurrency(provider.total_revenue)}</td>
                  <td>{provider.unique_properties}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error-message">
          <h2>⚠️ Error Loading Analytics</h2>
          <p>{error}</p>
          <button onClick={fetchAllAnalytics} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>📊 Analytics & Reports</h1>
        
        {/* Filters */}
        <div className="analytics-filters">
          <div className="filter-group">
            <label>Year:</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="filter-select"
            >
              {[2023, 2024, 2025].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Provider Period:</label>
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="filter-select"
            >
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
            </select>
          </div>

          <button onClick={fetchAllAnalytics} className="refresh-button">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="analytics-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          Top Properties
        </button>
        <button 
          className={`tab ${activeTab === 'cities' ? 'active' : ''}`}
          onClick={() => setActiveTab('cities')}
        >
          City Revenue
        </button>
        <button 
          className={`tab ${activeTab === 'providers' ? 'active' : ''}`}
          onClick={() => setActiveTab('providers')}
        >
          Top Providers
        </button>
      </div>

      {/* Content */}
      <div className="analytics-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'properties' && renderTopProperties()}
        {activeTab === 'cities' && renderCityRevenue()}
        {activeTab === 'providers' && renderTopProviders()}
      </div>
    </div>
  );
};

export default Analytics;
