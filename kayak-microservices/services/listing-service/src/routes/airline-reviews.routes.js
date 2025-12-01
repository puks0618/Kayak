/**
 * Airline Reviews Routes
 * API endpoints for fetching airline reviews from MongoDB Atlas
 */

const express = require('express');
const router = express.Router();
const mongoAtlas = require('../database/mongodb-atlas');

/**
 * GET /api/reviews/airline/:airlineName
 * Get all reviews for a specific airline with pagination
 * Query params: page (default 1), limit (default 10), sort (date/-date/rating/-rating)
 */
router.get('/airline/:airlineName', async (req, res) => {
  try {
    const { airlineName } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sort || '-date'; // Default: newest first
    
    // Parse sort parameter
    let sortField, sortOrder;
    if (sortBy.startsWith('-')) {
      sortField = sortBy.substring(1);
      sortOrder = -1;
    } else {
      sortField = sortBy;
      sortOrder = 1;
    }
    
    const skip = (page - 1) * limit;
    
    const reviewsCollection = mongoAtlas.getCollection('flights_reviews');
    
    // Get total count
    const totalReviews = await reviewsCollection.countDocuments({ airline: airlineName });
    
    // Get reviews
    const reviews = await reviewsCollection
      .find({ airline: airlineName })
      .sort({ [sortField === 'date' ? 'review_date' : sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Calculate rating distribution
    const ratingDist = await reviewsCollection.aggregate([
      { $match: { airline: airlineName } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    const ratingDistribution = {};
    ratingDist.forEach(r => {
      ratingDistribution[r._id] = r.count;
    });
    
    // Get average rating
    const avgRating = await reviewsCollection.aggregate([
      { $match: { airline: airlineName } },
      {
        $group: {
          _id: null,
          avg: { $avg: '$rating' }
        }
      }
    ]).toArray();
    
    const averageRating = avgRating.length > 0 ? parseFloat(avgRating[0].avg.toFixed(2)) : 0;
    
    res.json({
      airline: airlineName,
      average_rating: averageRating,
      total_reviews: totalReviews,
      rating_distribution: ratingDistribution,
      reviews: reviews.map(r => ({
        id: r._id,
        reviewer_name: r.reviewer_name,
        rating: r.rating,
        comment: r.comment,
        review_date: r.review_date,
        verified_booking: r.verified_booking,
        helpful_count: r.helpful_count
      })),
      pagination: {
        page,
        limit,
        total_pages: Math.ceil(totalReviews / limit),
        has_next: page < Math.ceil(totalReviews / limit),
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching airline reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/**
 * GET /api/reviews/airline/:airlineName/stats
 * Get review statistics for a specific airline
 */
router.get('/airline/:airlineName/stats', async (req, res) => {
  try {
    const { airlineName } = req.params;
    const reviewsCollection = mongoAtlas.getCollection('flights_reviews');
    
    const stats = await reviewsCollection.aggregate([
      { $match: { airline: airlineName } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          average_rating: { $avg: '$rating' },
          verified_count: {
            $sum: { $cond: ['$verified_booking', 1, 0] }
          }
        }
      }
    ]).toArray();
    
    // Rating distribution
    const ratingDist = await reviewsCollection.aggregate([
      { $match: { airline: airlineName } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    const distribution = {};
    ratingDist.forEach(r => {
      distribution[r._id] = r.count;
    });
    
    if (stats.length === 0) {
      return res.json({
        airline: airlineName,
        total_reviews: 0,
        average_rating: 0,
        verified_percentage: 0,
        rating_distribution: {}
      });
    }
    
    const stat = stats[0];
    
    res.json({
      airline: airlineName,
      total_reviews: stat.total,
      average_rating: parseFloat(stat.average_rating.toFixed(2)),
      verified_count: stat.verified_count,
      verified_percentage: parseFloat(((stat.verified_count / stat.total) * 100).toFixed(1)),
      rating_distribution: distribution
    });
  } catch (error) {
    console.error('Error fetching airline stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/reviews/airline/:airlineName/recent
 * Get recent reviews for a specific airline (default 3)
 */
router.get('/airline/:airlineName/recent', async (req, res) => {
  try {
    const { airlineName } = req.params;
    const limit = parseInt(req.query.limit) || 3;
    
    const reviewsCollection = mongoAtlas.getCollection('flights_reviews');
    
    const reviews = await reviewsCollection
      .find({ airline: airlineName })
      .sort({ review_date: -1 })
      .limit(limit)
      .toArray();
    
    res.json({
      airline: airlineName,
      reviews: reviews.map(r => ({
        reviewer_name: r.reviewer_name,
        rating: r.rating,
        comment: r.comment,
        review_date: r.review_date,
        verified_booking: r.verified_booking
      }))
    });
  } catch (error) {
    console.error('Error fetching recent reviews:', error);
    res.status(500).json({ error: 'Failed to fetch recent reviews' });
  }
});

module.exports = router;
