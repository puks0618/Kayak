import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hotel, MapPin, DollarSign, Star, Edit, Trash2, Plus } from 'lucide-react';
import { ownerAPI } from '../api/authClient';

const OwnerHotels = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMyHotels();
  }, []);

  const fetchMyHotels = async () => {
    try {
      const response = await ownerAPI.getHotels();
      setHotels(response.data || []);
    } catch (err) {
      console.error('Error fetching hotels:', err);
      setError('Failed to load your hotel listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (hotelId) => {
    if (!window.confirm('Are you sure you want to delete this hotel listing?')) {
      return;
    }

    try {
      await ownerAPI.deleteHotel(hotelId);
      setHotels(hotels.filter(hotel => hotel.id !== hotelId));
      alert('Hotel listing deleted successfully');
    } catch (err) {
      console.error('Error deleting hotel:', err);
      alert('Failed to delete hotel listing');
    }
  };

  const filteredHotels = filter === 'all' 
    ? hotels 
    : hotels.filter(hotel => hotel.approval_status === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading your hotel listings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button 
            onClick={fetchMyHotels} 
            className="px-4 py-2 bg-[#FF690F] text-white rounded-md hover:bg-[#E05A0A]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold dark:text-white">My Hotel Listings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your hotel properties
            </p>
          </div>
          <Link
            to="/owner/hotels/new"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <Plus className="w-5 h-5" />
            Add New Hotel
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            className={`px-4 py-2 rounded-md whitespace-nowrap ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
            onClick={() => setFilter('all')}
          >
            All Hotels ({hotels.length})
          </button>
          <button
            className={`px-4 py-2 rounded-md whitespace-nowrap ${
              filter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
            onClick={() => setFilter('approved')}
          >
            Approved
          </button>
          <button
            className={`px-4 py-2 rounded-md whitespace-nowrap ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`px-4 py-2 rounded-md whitespace-nowrap ${
              filter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
        </div>

        {/* Hotels Grid */}
        {filteredHotels.length === 0 ? (
          <div className="text-center py-12">
            <Hotel className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
              {filter === 'all' ? 'No hotels yet' : `No ${filter} hotels`}
            </p>
            <Link
              to="/owner/hotels/new"
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Add Your First Hotel
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHotels.map((hotel) => (
              <div
                key={hotel.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                  <img
                    src={
                      hotel.images && hotel.images.length > 0
                        ? typeof hotel.images === 'string'
                          ? JSON.parse(hotel.images)[0]
                          : hotel.images[0]
                        : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'
                    }
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';
                    }}
                  />
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        hotel.approval_status === 'approved'
                          ? 'bg-green-500 text-white'
                          : hotel.approval_status === 'pending'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {hotel.approval_status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 dark:text-white line-clamp-2">
                    {hotel.name}
                  </h3>

                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">
                      {hotel.city}, {hotel.state}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-medium dark:text-white">
                        {hotel.rating || '0.0'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Hotel className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="dark:text-gray-300">
                        {hotel.num_rooms} rooms
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="text-xl font-bold text-green-600">
                        ${parseFloat(hotel.price_per_night).toFixed(0)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        /night
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Link
                      to={`/owner/hotels/edit/${hotel.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(hotel.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerHotels;
