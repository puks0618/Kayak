import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ownerAPI } from '../api/authClient';
import { Car, Hotel, Calendar, DollarSign, Plus, List } from 'lucide-react';
import '../styles/OwnerDashboard.css';

const OwnerDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, cars, hotels

  // Format number with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  // Format currency with commas
  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  useEffect(() => {
    fetchOwnerStats();
  }, []);

  const fetchOwnerStats = async () => {
    try {
      // Set timeout for API call to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );
      
      const response = await Promise.race([
        ownerAPI.getStats(),
        timeoutPromise
      ]);
      
      // Response structure: response.data.data (axios wraps the API response)
      setStats(response.data?.data || response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Use fallback data instead of showing error
      setStats({
        cars: { total: 0 },
        hotels: { total: 0 },
        bookings: { total: 0, revenue: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button 
            onClick={fetchOwnerStats} 
            className="px-4 py-2 bg-[#FF690F] text-white rounded-md hover:bg-[#E05A0A]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalListings = (stats?.cars?.total || 0) + (stats?.hotels?.total || 0);
  const totalBookings = stats?.bookings?.total || 0;
  const totalRevenue = stats?.bookings?.revenue || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold dark:text-white">
            Welcome back, {user?.name || user?.email?.split('@')[0] || 'Owner'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your properties and track your performance
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Cars */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 min-h-[140px]">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Cars</p>
                <p className="text-3xl font-bold dark:text-white mt-2 break-words">
                  {formatNumber(stats?.cars?.total || 0)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  {formatNumber(stats?.cars?.approved || 0)} approved
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Car className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Total Hotels */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 min-h-[140px]">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Hotels</p>
                <p className="text-3xl font-bold dark:text-white mt-2 break-words">
                  {formatNumber(stats?.hotels?.total || 0)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  {formatNumber(stats?.hotels?.approved || 0)} approved
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Hotel className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Active Bookings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 min-h-[140px]">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Bookings</p>
                <p className="text-3xl font-bold dark:text-white mt-2 break-words">
                  {formatNumber(totalBookings)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 min-h-[140px]">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold dark:text-white mt-2 break-words">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Listing Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Cars Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2">
              <Car className="w-5 h-5" />
              Car Listings
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total</span>
                <span className="font-semibold dark:text-white">{formatNumber(stats?.cars?.total || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-600 dark:text-green-400">Approved</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatNumber(stats?.cars?.approved || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-600 dark:text-yellow-400">Pending</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {formatNumber(stats?.cars?.pending || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-red-600 dark:text-red-400">Rejected</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {formatNumber(stats?.cars?.rejected || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Hotels Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2">
              <Hotel className="w-5 h-5" />
              Hotel Listings
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total</span>
                <span className="font-semibold dark:text-white">{formatNumber(stats?.hotels?.total || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-600 dark:text-green-400">Approved</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatNumber(stats?.hotels?.approved || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-600 dark:text-yellow-400">Pending</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {formatNumber(stats?.hotels?.pending || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-red-600 dark:text-red-400">Rejected</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {formatNumber(stats?.hotels?.rejected || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold dark:text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Manage Cars */}
            <Link
              to="/cars"
              className="flex items-center justify-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Car className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="font-medium dark:text-white">Manage Cars</span>
            </Link>

            {/* Add New Car */}
            <Link
              to="/cars/new"
              className="flex items-center justify-center gap-3 p-4 bg-[#FF690F] text-white rounded-lg hover:bg-[#E05A0A] transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add New Car</span>
            </Link>

            {/* Manage Hotels */}
            <Link
              to="/hotels"
              className="flex items-center justify-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Hotel className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="font-medium dark:text-white">Manage Hotels</span>
            </Link>

            {/* Add New Hotel */}
            <Link
              to="/hotels/new"
              className="flex items-center justify-center gap-3 p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add New Hotel</span>
            </Link>

            {/* View Bookings - Centered in last row */}
            <Link
              to="/bookings"
              className="flex items-center justify-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors md:col-span-2"
            >
              <List className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="font-medium dark:text-white">View Bookings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
