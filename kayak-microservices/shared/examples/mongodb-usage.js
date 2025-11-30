/**
 * Example: Using MongoDB Connection in Listings Service
 */

const { connections } = require('../../shared/database/mongodb');

async function getReviewsByListingId(listingId) {
  const listingsDb = connections.listings;
  await listingsDb.connect();
  
  const reviewsCollection = listingsDb.getCollection('reviews');
  const reviews = await reviewsCollection
    .find({ listing_id: listingId })
    .sort({ created_at: -1 })
    .toArray();
  
  return reviews;
}

async function createReview(reviewData) {
  const listingsDb = connections.listings;
  await listingsDb.connect();
  
  const reviewsCollection = listingsDb.getCollection('reviews');
  const result = await reviewsCollection.insertOne({
    listing_id: reviewData.listingId,
    user_id: reviewData.userId,
    rating: reviewData.rating,
    comment: reviewData.comment,
    created_at: new Date()
  });
  
  return result.insertedId;
}

async function logAnalytics(eventData) {
  const analyticsDb = connections.analytics;
  await analyticsDb.connect();
  
  const analyticsCollection = analyticsDb.getCollection('analytics');
  await analyticsCollection.insertOne({
    date: new Date(),
    type: eventData.type,
    metrics: eventData.metrics,
    timestamp: new Date()
  });
}

async function writeLog(logData) {
  const logsDb = connections.logs;
  await logsDb.connect();
  
  const logsCollection = logsDb.getCollection('application_logs');
  await logsCollection.insertOne({
    service: logData.service,
    level: logData.level,
    message: logData.message,
    timestamp: new Date(),
    metadata: logData.metadata || {}
  });
}

module.exports = {
  getReviewsByListingId,
  createReview,
  logAnalytics,
  writeLog
};
