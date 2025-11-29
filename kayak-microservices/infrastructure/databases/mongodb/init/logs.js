// MongoDB initialization script for logs collection

db = db.getSiblingDB('kayak_logs');

db.createCollection('application_logs', {
  capped: true,
  size: 104857600, // 100MB
  max: 100000
});

db.application_logs.createIndex({ service: 1 });
db.application_logs.createIndex({ level: 1 });
db.application_logs.createIndex({ timestamp: -1 });

// Sample schema
// {
//   _id: ObjectId,
//   service: String,
//   level: String, // 'info', 'warning', 'error'
//   message: String,
//   trace_id: String,
//   metadata: Object,
//   timestamp: Date
// }

print('Logs collection created with indexes');

