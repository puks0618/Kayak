// MongoDB initialization script for reviews collection

db = db.getSiblingDB('kayak_listings');

db.createCollection('reviews');

db.reviews.createIndex({ listing_id: 1 });
db.reviews.createIndex({ user_id: 1 });
db.reviews.createIndex({ rating: 1 });
db.reviews.createIndex({ created_at: -1 });

// Sample schema (enforced at application level)
// {
//   _id: ObjectId,
//   listing_id: String,
//   user_id: String,
//   listing_type: String, // 'flight', 'hotel', 'car'
//   rating: Number, // 1-5
//   title: String,
//   comment: String,
//   created_at: Date,
//   updated_at: Date
// }

print('Reviews collection created with indexes');

