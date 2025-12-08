/**
 * Airline Reviews Page
 * Displays all reviews for a specific airline with ratings distribution and filtering
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Star, StarHalf, CheckCircle, ThumbsUp, ArrowLeft, Filter, Send } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Star rating component
const StarRating = ({ rating, size = 'sm' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(
        <Star key={i} className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`} />
      );
    } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
      stars.push(
        <StarHalf key={i} className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`} />
      );
    } else {
      stars.push(
        <Star key={i} className={`${sizeClasses[size]} text-gray-300`} />
      );
    }
  }
  return <div className="flex gap-0.5">{stars}</div>;
};

export default function AirlineReviews() {
  const { airlineName } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [sortBy, setSortBy] = useState('-date');
  const [filterRating, setFilterRating] = useState(null);
  
  // Write review state
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    fetchStats();
    fetchReviews();
  }, [airlineName, page, sortBy, filterRating]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/listings/reviews/airline/${airlineName}/stats`);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/api/listings/reviews/airline/${airlineName}?page=${page}&limit=10&sort=${sortBy}`;
      
      const response = await axios.get(url);
      
      let filteredReviews = response.data.reviews;
      if (filterRating) {
        filteredReviews = filteredReviews.filter(r => r.rating === filterRating);
      }
      
      setReviews(filteredReviews);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Flights
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{airlineName} Reviews</h1>
              <p className="text-gray-600">{stats?.total_reviews || 0} verified reviews</p>
            </div>
            
            {stats && (
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-1">
                  <span className="text-4xl font-bold text-gray-900">{stats.average_rating}</span>
                  <StarRating rating={stats.average_rating} size="lg" />
                </div>
                <p className="text-sm text-gray-600">
                  {stats.verified_percentage}% verified bookings
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Write Review Section */}
      {showWriteReview && (
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="max-w-2xl">
              <h2 className="text-xl font-bold mb-4">Write Your Review</h2>
              
              {!user ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <p className="text-gray-700 mb-4">Please log in to write a review</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Log In
                  </button>
                </div>
              ) : (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  
                  if (reviewForm.comment.trim().length < 10) {
                    alert('Review must be at least 10 characters long');
                    return;
                  }
                  
                  try {
                    setSubmitting(true);
                    await axios.post(`${API_URL}/api/reviews/flights`, {
                      listing_id: airlineName,
                      listing_name: airlineName,
                      reviewer_id: user.id,
                      reviewer_name: `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim() || user.email,
                      rating: reviewForm.rating,
                      comment: reviewForm.comment.trim()
                    });
                    
                    // Reset form
                    setReviewForm({ rating: 5, comment: '' });
                    setShowWriteReview(false);
                    
                    // Refresh data
                    await fetchStats();
                    await fetchReviews();
                    
                    alert('Review submitted successfully!');
                  } catch (err) {
                    console.error('Error submitting review:', err);
                    alert(err.response?.data?.error || 'Failed to submit review');
                  } finally {
                    setSubmitting(false);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Rating
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-8 h-8 cursor-pointer hover:scale-110 transition-transform ${
                            star <= reviewForm.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Review
                    </label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder="Share your experience with this airline..."
                      rows={5}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {reviewForm.comment.length} characters (minimum 10)
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting || reviewForm.comment.trim().length < 10}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Review
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowWriteReview(false);
                        setReviewForm({ rating: 5, comment: '' });
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      {stats && (
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <h2 className="text-lg font-semibold mb-4">Rating Distribution</h2>
            <div className="grid grid-cols-5 gap-3">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = stats.rating_distribution[rating] || 0;
                const percentage = stats.total_reviews > 0 
                  ? ((count / stats.total_reviews) * 100).toFixed(0) 
                  : 0;
                
                return (
                  <button
                    key={rating}
                    onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                    className={`p-3 rounded-lg border transition-colors ${
                      filterRating === rating 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{rating}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full mb-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600">{count} reviews</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filters & Sort */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <button
              onClick={() => setShowWriteReview(!showWriteReview)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
            >
              <Star className="w-4 h-4" />
              {showWriteReview ? 'Cancel' : 'Write a Review'}
            </button>
            
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="-date">Newest First</option>
                <option value="date">Oldest First</option>
                <option value="-rating">Highest Rated</option>
                <option value="rating">Lowest Rated</option>
              </select>
              
              {filterRating && (
                <button
                  onClick={() => setFilterRating(null)}
                  className="px-3 py-1.5 bg-gray-100 text-sm rounded hover:bg-gray-200"
                >
                  Clear filter: {filterRating} stars
                </button>
              )}
            </div>
            
            <p className="text-sm text-gray-600">
              Showing {reviews.length} reviews
            </p>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No reviews found for this filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{review.reviewer_name}</h3>
                      {review.verified_booking && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Verified Booking
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-sm text-gray-500">
                        {formatDate(review.review_date)}
                      </span>
                    </div>
                  </div>
                  
                  {review.helpful_count > 0 && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{review.helpful_count}</span>
                    </div>
                  )}
                </div>
                
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(page - 1)}
              disabled={!pagination.has_prev}
              className={`px-4 py-2 rounded border ${
                pagination.has_prev
                  ? 'border-gray-300 hover:bg-gray-50'
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Previous
            </button>
            
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {page} of {pagination.total_pages}
            </span>
            
            <button
              onClick={() => setPage(page + 1)}
              disabled={!pagination.has_next}
              className={`px-4 py-2 rounded border ${
                pagination.has_next
                  ? 'border-gray-300 hover:bg-gray-50'
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
