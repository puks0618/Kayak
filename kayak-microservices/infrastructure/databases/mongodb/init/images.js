// MongoDB initialization script for images collection

db = db.getSiblingDB('kayak_listings');

db.createCollection('images');

db.images.createIndex({ listing_id: 1 });
db.images.createIndex({ listing_type: 1 });

// Sample schema
// {
//   _id: ObjectId,
//   listing_id: String,
//   listing_type: String,
//   url: String,
//   thumbnail_url: String,
//   caption: String,
//   order: Number,
//   created_at: Date
// }

print('Images collection created with indexes');

