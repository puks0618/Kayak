import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Star, Trash2, Edit2, Plane, Hotel, Car, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export default function UserReviews() {
  const { user } = useSelector(state => state.auth);
  const [reviews, setReviews] = useState({ flights: [], hotels: [], cars: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user) {
      fetchUserReviews();
    }
  }, [user]);

  const fetchUserReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/reviews/user/${user.id}`);
      setReviews(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load your reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (type, reviewId) => {
    try {
      await axios.delete(`${API_BASE_URL}/reviews/${type}/${reviewId}?reviewer_id=${user.id}`);
      await fetchUserReviews();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Failed to delete review');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'flights': return <Plane className="w-5 h-5 text-blue-600" />;
      case 'hotels': return <Hotel className="w-5 h-5 text-green-600" />;
      case 'cars': return <Car className="w-5 h-5 text-orange-600" />;
      default: return null;
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'flights': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'hotels': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'cars': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const getFilteredReviews = () => {
    if (activeTab === 'all') {
      return [...reviews.flights, ...reviews.hotels, ...reviews.cars].sort(
        (a, b) => new Date(b.review_date) - new Date(a.review_date)
      );
    }
    return reviews[activeTab] || [];
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Please log in to view your reviews</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF690F] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your reviews...</p>
        </div>
      </div>
    );
  }

  const filteredReviews = getFilteredReviews();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 dark:text-white">My Reviews</h1>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
          <div className="flex border-b dark:border-gray-700">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-6 py-3 font-semibold ${
                activeTab === 'all'
                  ? 'border-b-2 border-[#FF690F] text-[#FF690F]'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              All Reviews ({reviews.total})
            </button>
            <button
              onClick={() => setActiveTab('flights')}
              className={`flex-1 px-6 py-3 font-semibold flex items-center justify-center gap-2 ${
                activeTab === 'flights'
                  ? 'border-b-2 border-[#FF690F] text-[#FF690F]'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Plane className="w-4 h-4" />
              Flights ({reviews.flights.length})
            </button>
            <button
              onClick={() => setActiveTab('hotels')}
              className={`flex-1 px-6 py-3 font-semibold flex items-center justify-center gap-2 ${
                activeTab === 'hotels'
                  ? 'border-b-2 border-[#FF690F] text-[#FF690F]'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Hotel className="w-4 h-4" />
              Hotels ({reviews.hotels.length})
            </button>
            <button
              onClick={() => setActiveTab('cars')}
              className={`flex-1 px-6 py-3 font-semibold flex items-center justify-center gap-2 ${
                activeTab === 'cars'
                  ? 'border-b-2 border-[#FF690F] text-[#FF690F]'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Car className="w-4 h-4" />
              Cars ({reviews.cars.length})
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {filteredReviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 dark:text-white">No reviews yet</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start sharing your travel experiences by writing reviews
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(review.type)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg dark:text-white">
                          {review.listing_name}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getTypeBadgeColor(review.type)}`}>
                          {review.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(review.review_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDeleteConfirm(review.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      title="Delete review"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  {renderStars(review.rating)}
                </div>

                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {review.comment}
                </p>

                {review.helpful_count > 0 && (
                  <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    {review.helpful_count} {review.helpful_count === 1 ? 'person' : 'people'} found this helpful
                  </div>
                )}

                {/* Delete Confirmation */}
                {deleteConfirm === review.id && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-800 dark:text-red-200 mb-3">
                      Are you sure you want to delete this review?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteReview(review.type, review.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
