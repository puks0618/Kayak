/**
 * Unified Reviews Routes
 * API endpoints for managing reviews (flights, hotels, cars)
 * Supports reading, creating, and deleting user reviews
 */

const express = require('express');
const router = express.Router();
const mongoAtlas = require('../database/mongodb-atlas');
const { ObjectId } = require('mongodb');

// Collection mapping
const COLLECTIONS = {
  flights: 'flights_reviews',
  hotels: 'reviews', // hotels use 'reviews' collection
  cars: 'cars_reviews'
};

/**
 * GET /api/reviews/user/:userId
 * Get all reviews by a specific user
 * Query params: type (optional filter)
 * IMPORTANT: This route must come before /:type/:listingId to avoid conflicts
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const typeFilter = req.query.type; // optional: flights, hotels, cars
    
    const userReviews = {
      user_id: userId,
      flights: [],
      hotels: [],
      cars: [],
      total: 0
    };
    
    const types = typeFilter ? [typeFilter] : ['flights', 'hotels', 'cars'];
    
    for (const type of types) {
      const collection = mongoAtlas.getCollection(COLLECTIONS[type]);
      const reviews = await collection
        .find({ reviewer_id: userId })
        .sort({ review_date: -1 })
        .toArray();
      
      userReviews[type] = reviews.map(r => ({
        id: r._id.toString(),
        type: type,
        listing_id: r.airline || r.listing_id || r.car_id,
        listing_name: r.airline || r.car_company || r.hotel_name || r.listing_name || 'Hotel',
        rating: r.rating,
        comment: r.comment || r.comments,
        review_date: r.review_date || r.date,
        helpful_count: r.helpful_count || 0
      }));
      
      userReviews.total += reviews.length;
    }
    
    res.json(userReviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ error: 'Failed to fetch user reviews' });
  }
});

/**
 * GET /api/reviews/:type/:listingId
 * Get all reviews for a specific listing
 * Type: flights | hotels | cars
 * Query params: page, limit, sort
 */
router.get('/:type/:listingId', async (req, res) => {
  try {
    const { type, listingId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    if (!COLLECTIONS[type]) {
      return res.status(400).json({ error: 'Invalid review type' });
    }
    
    const collection = mongoAtlas.getCollection(COLLECTIONS[type]);
    
    // Build query based on type
    let query = {};
    if (type === 'flights') {
      query = { airline: listingId };
    } else if (type === 'hotels') {
      query = { listing_id: parseInt(listingId) };
    } else if (type === 'cars') {
      query = { car_id: parseInt(listingId) };
    }
    
    // Get total count
    const totalReviews = await collection.countDocuments(query);
    
    // Get reviews
    const reviews = await collection
      .find(query)
      .sort({ review_date: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Calculate average rating
    const avgResult = await collection.aggregate([
      { $match: query },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]).toArray();
    
    const averageRating = avgResult.length > 0 ? parseFloat(avgResult[0].avg.toFixed(2)) : 0;
    
    res.json({
      type,
      listing_id: listingId,
      average_rating: averageRating,
      total_reviews: totalReviews,
      reviews: reviews.map(r => ({
        id: r._id.toString(),
        reviewer_id: r.reviewer_id,
        reviewer_name: r.reviewer_name,
        rating: r.rating,
        comment: r.comment || r.comments,
        review_date: r.review_date || r.date,
        verified_booking: r.verified_booking,
        helpful_count: r.helpful_count || 0
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
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/**
 * POST /api/reviews/:type
 * Create a new review
 * Body: listing_id, listing_name, reviewer_id, reviewer_name, rating, comment
 */
router.post('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { listing_id, listing_name, reviewer_id, reviewer_name, rating, comment } = req.body;
    
    if (!COLLECTIONS[type]) {
      return res.status(400).json({ error: 'Invalid review type' });
    }
    
    // Validation
    if (!listing_id || !reviewer_id || !reviewer_name || !rating || !comment) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const collection = mongoAtlas.getCollection(COLLECTIONS[type]);
    
    // Check if user already reviewed this listing
    let existingQuery = {};
    if (type === 'flights') {
      existingQuery = { airline: listing_name, reviewer_id: reviewer_id };
    } else if (type === 'hotels') {
      existingQuery = { listing_id: parseInt(listing_id), reviewer_id: reviewer_id };
    } else if (type === 'cars') {
      existingQuery = { car_id: parseInt(listing_id), reviewer_id: reviewer_id };
    }
    
    const existing = await collection.findOne(existingQuery);
    if (existing) {
      return res.status(400).json({ error: 'You have already reviewed this listing' });
    }
    
    // Create review document
    const review = {
      reviewer_id: reviewer_id,
      reviewer_name: reviewer_name,
      rating: parseInt(rating),
      comment: comment,
      review_date: new Date(),
      verified_booking: true,
      helpful_count: 0,
      created_at: new Date()
    };
    
    // Add type-specific fields
    if (type === 'flights') {
      review.airline = listing_name;
    } else if (type === 'hotels') {
      review.listing_id = parseInt(listing_id);
      review.hotel_name = listing_name; // Save hotel name for display in user reviews
    } else if (type === 'cars') {
      review.car_id = parseInt(listing_id);
      review.car_company = listing_name;
    }
    
    const result = await collection.insertOne(review);
    
    res.status(201).json({
      message: 'Review created successfully',
      review_id: result.insertedId.toString(),
      review: {
        ...review,
        id: result.insertedId.toString()
      }
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

/**
 * DELETE /api/reviews/:type/:reviewId
 * Delete a user's review
 * Requires: reviewer_id in query params for validation
 */
router.delete('/:type/:reviewId', async (req, res) => {
  try {
    const { type, reviewId } = req.params;
    const { reviewer_id } = req.query;
    
    if (!COLLECTIONS[type]) {
      return res.status(400).json({ error: 'Invalid review type' });
    }
    
    if (!reviewer_id) {
      return res.status(400).json({ error: 'reviewer_id is required' });
    }
    
    const collection = mongoAtlas.getCollection(COLLECTIONS[type]);
    
    // Verify ownership
    const review = await collection.findOne({ 
      _id: new ObjectId(reviewId),
      reviewer_id: reviewer_id
    });
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }
    
    // Delete review
    await collection.deleteOne({ _id: new ObjectId(reviewId) });
    
    res.json({ 
      message: 'Review deleted successfully',
      review_id: reviewId
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

/**
 * PUT /api/reviews/:type/:reviewId
 * Update a user's review
 * Body: reviewer_id, rating, comment
 */
router.put('/:type/:reviewId', async (req, res) => {
  try {
    const { type, reviewId } = req.params;
    const { reviewer_id, rating, comment } = req.body;
    
    if (!COLLECTIONS[type]) {
      return res.status(400).json({ error: 'Invalid review type' });
    }
    
    if (!reviewer_id || !rating || !comment) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const collection = mongoAtlas.getCollection(COLLECTIONS[type]);
    
    // Verify ownership
    const review = await collection.findOne({ 
      _id: new ObjectId(reviewId),
      reviewer_id: reviewer_id
    });
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }
    
    // Update review
    const result = await collection.updateOne(
      { _id: new ObjectId(reviewId) },
      { 
        $set: { 
          rating: parseInt(rating),
          comment: comment,
          updated_at: new Date()
        }
      }
    );
    
    res.json({ 
      message: 'Review updated successfully',
      review_id: reviewId
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

module.exports = router;
