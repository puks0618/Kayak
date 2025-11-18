// MongoDB initialization script for analytics collection

db = db.getSiblingDB('kayak_analytics');

db.createCollection('analytics');

db.analytics.createIndex({ date: -1 });
db.analytics.createIndex({ type: 1 });
db.analytics.createIndex({ 'metrics.revenue': -1 });

// Sample schema
// {
//   _id: ObjectId,
//   date: Date,
//   type: String, // 'daily', 'monthly', 'yearly'
//   metrics: {
//     revenue: Number,
//     bookings: Number,
//     users: Number,
//     listings: Number
//   },
//   breakdown: {
//     by_type: {
//       flights: Number,
//       hotels: Number,
//       cars: Number
//     },
//     by_city: Object
//   },
//   created_at: Date
// }

print('Analytics collection created with indexes');

