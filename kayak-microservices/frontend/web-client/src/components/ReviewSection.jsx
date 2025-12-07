import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Star, Send, Loader2, MessageSquare, User, Calendar } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export default function ReviewSection({ type, listingId, listingName }) {
  const { user } = useSelector(state => state.auth);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  
  const [formData, setFormData] = useState({
    rating: 5,
    comment: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [type, listingId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/reviews/${type}/${listingId}`);
      setReviews(response.data.reviews || []);
      setAverageRating(response.data.average_rating || 0);
      setTotalReviews(response.data.total_reviews || 0);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please log in to write a review');
      return;
    }

    if (formData.comment.trim().length < 10) {
      setError('Review must be at least 10 characters long');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      await axios.post(`${API_BASE_URL}/reviews/${type}`, {
        listing_id: listingId,
        listing_name: listingName,
        reviewer_id: user.id,
        reviewer_name: `${user.firstName || user.email.split('@')[0]} ${user.lastName || ''}`.trim(),
        rating: formData.rating,
        comment: formData.comment
      });

      // Reset form
      setFormData({ rating: 5, comment: '' });
      setShowWriteReview(false);
      
      // Refresh reviews
      await fetchReviews();
      
      alert('Review submitted successfully!');
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && onRatingChange && onRatingChange(star)}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold dark:text-white mb-2">Reviews</h2>
          {totalReviews > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-xl font-semibold dark:text-white">
                  {averageRating.toFixed(1)}
                </span>
              </div>
              <span className="text-gray-600 dark:text-gray-400">
                ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>
        
        {user && !showWriteReview && (
          <button
            onClick={() => setShowWriteReview(true)}
            className="px-4 py-2 bg-[#FF690F] hover:bg-[#d6570c] text-white rounded-md font-semibold flex items-center gap-2 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Write a Review
          </button>
        )}
      </div>

      {/* Write Review Form */}
      {showWriteReview && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-white">Write Your Review</h3>
            <button
              onClick={() => {
                setShowWriteReview(false);
                setError('');
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmitReview}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 dark:text-white">
                Your Rating
              </label>
              {renderStars(formData.rating, true, (rating) => setFormData({ ...formData, rating }))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 dark:text-white">
                Your Review
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[#FF690F] focus:border-transparent"
                rows="4"
                placeholder="Share your experience..."
                required
                minLength="10"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Minimum 10 characters ({formData.comment.length}/10)
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || formData.comment.trim().length < 10}
              className="px-6 py-2 bg-[#FF690F] hover:bg-[#d6570c] text-white rounded-md font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Review
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF690F]" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold dark:text-white">{review.reviewer_name}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {formatDate(review.review_date)}
                      {review.verified_booking && (
                        <span className="text-green-600 dark:text-green-400 text-xs">✓ Verified</span>
                      )}
                    </div>
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {review.comment}
              </p>
              
              {review.helpful_count > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {review.helpful_count} {review.helpful_count === 1 ? 'person' : 'people'} found this helpful
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
