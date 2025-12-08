# MongoDB Schema Documentation - Kayak Application

**Generated:** December 6, 2025  
**Database System:** MongoDB 7.0  
**Port:** 27017

---

## Overview

The Kayak application uses MongoDB for:
- Session management
- Reviews and analytics
- Image metadata
- Application logs
- Flexible document storage

---

## MongoDB Databases

### 1. `kayak`
**Purpose:** Main application data, sessions, and notifications

**Collections:**

#### `sessions`
**Purpose:** User authentication sessions

```javascript
{
  _id: ObjectId,
  userId: String,           // UUID from MySQL users table
  token: String,           // JWT token
  userAgent: String,       // Browser/client info
  ipAddress: String,       // Client IP
  expiresAt: Date,         // Session expiration
  role: String,            // 'admin', 'traveller', 'owner'
  lastActivity: Date,
  createdAt: Date,
  updatedAt: Date,
  __v: Number
}
```

**Document Count:** ~13  
**Indexes:**
- userId
- token
- expiresAt

---

#### `notifications`
**Purpose:** User notifications

```javascript
{
  _id: ObjectId,
  userId: Number,          // User ID
  type: String,            // 'in-app', 'email', 'sms'
  channel: String,         // 'system', 'booking', 'payment'
  title: String,
  message: String,
  status: String,          // 'sent', 'pending', 'failed'
  createdAt: Date,
  updatedAt: Date,
  sentAt: Date,
  __v: Number
}
```

**Document Count:** ~1  
**Notification Types:**
- in-app
- email
- sms
- push

---

#### `reviews`
**Purpose:** Hotel/listing reviews

```javascript
{
  _id: ObjectId,
  review_id: Number,
  listing_id: Number,
  date: Date,
  reviewer_id: String,
  reviewer_name: String,
  comments: String
}
```

**Document Count:** ~10,000  
**Source:** Imported from Airbnb dataset

---

### 2. `kayak_analytics`
**Purpose:** Analytics and business intelligence

**Collections:**

#### `analytics`
**Purpose:** Store analytics events and metrics

```javascript
{
  _id: ObjectId,
  event_type: String,      // 'search', 'booking', 'view'
  user_id: String,
  listing_id: String,
  listing_type: String,    // 'flight', 'hotel', 'car'
  metadata: Object,        // Flexible event data
  timestamp: Date
}
```

**Document Count:** 0 (empty, ready for analytics)

---

### 3. `kayak_listings`
**Purpose:** Listing-related data and media

**Collections:**

#### `hotels`
**Purpose:** Hotel listings (MongoDB copy for flexible queries)

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  location: String,
  address: String,
  rating: Number,          // 0.0 - 5.0
  price_per_night: Number,
  rooms_available: Number,
  amenities: [String],     // Array of amenity names
  check_in_time: String,   // "15:00"
  check_out_time: String,  // "11:00"
  phone: String,
  email: String,
  images: [String],        // Array of image URLs
  category: String,        // 'Luxury', 'Boutique', 'Budget'
  created_at: Date
}
```

**Document Count:** ~5,000  
**Note:** Duplicates MySQL hotels table for performance

**Categories:**
- Luxury
- Boutique
- Business
- Budget
- Resort

---

#### `hotel_images`
**Purpose:** Hotel image gallery management

```javascript
{
  _id: ObjectId,
  hotel_id: Number,        // References MySQL hotels.hotel_id
  listing_id: String,      // Airbnb listing ID
  hotel_name: String,
  images: [
    {
      image_url: String,
      image_type: String,  // 'primary', 'room', 'amenity', 'exterior'
      caption: String,
      is_primary: Boolean,
      upload_date: Date
    }
  ],
  created_at: Date
}
```

**Document Count:** ~45,000  
**Image Types:**
- primary (main hotel photo)
- room
- amenity
- exterior
- interior
- common_area

---

#### `car_images`
**Purpose:** Car rental images

```javascript
{
  _id: ObjectId,
  car_id: String,          // UUID from MySQL cars table
  brand: String,
  model: String,
  year: Number,
  images: [String],        // Array of image URLs
  primary_image: String,
  image_count: Number,
  created_at: Date,
  updated_at: Date
}
```

**Document Count:** ~95  
**Image Sources:** Unsplash, stock photos

---

#### `images`
**Purpose:** General listing images

```javascript
{
  _id: ObjectId,
  listing_id: Number,
  picture_url: String
}
```

**Document Count:** ~50

---

#### `reviews`
**Purpose:** Comprehensive review data

```javascript
{
  _id: ObjectId,
  listing_id: Number,
  review_id: Number,
  date: String,            // YYYY-MM-DD
  reviewer_id: Number,
  reviewer_name: String,
  comments: String,
  created_at: Date
}
```

**Document Count:** ~542,793 (large dataset!)  
**Source:** Airbnb reviews dataset

---

### 4. `kayak_logs`
**Purpose:** Application logging

**Collections:**

#### `logs`
**Purpose:** API request/response logs

```javascript
{
  _id: ObjectId,
  level: String,           // 'info', 'warn', 'error', 'debug'
  message: String,
  service: String,         // 'billing-api', 'auth-api', etc.
  metadata: {
    method: String,        // 'GET', 'POST', etc.
    path: String,          // '/health', '/api/bookings'
    query: Object,
    ip: String
  },
  timestamp: Date,
  __v: Number
}
```

**Document Count:** ~34  
**Log Levels:**
- info
- warn
- error
- debug

---

#### `application_logs`
**Purpose:** General application logs

```javascript
{
  _id: ObjectId,
  application: String,
  level: String,
  message: String,
  stack_trace: String,     // For errors
  user_id: String,
  timestamp: Date
}
```

**Document Count:** 0 (empty, ready for logs)

---

## Data Relationships

### MongoDB ↔️ MySQL Connections

```
MongoDB                          MySQL
─────────────────────────────────────────────────────────
kayak.sessions.userId        →   kayak_users.users.id
kayak_listings.hotels           ↔   kayak_listings.hotels (duplicate)
kayak_listings.hotel_images.hotel_id → kayak_listings.hotels.hotel_id
kayak_listings.car_images.car_id → kayak_listings.cars.id
kayak_listings.reviews.listing_id → kayak_listings.hotels.listing_id
```

---

## Storage Statistics

**Total MongoDB Storage:** ~299 MB

**Breakdown:**
- `kayak`: ~3 MB (sessions, notifications)
- `kayak_analytics`: ~20 KB (empty)
- `kayak_listings`: ~297 MB (hotels, reviews, images)
- `kayak_logs`: ~315 KB (logs)

**Largest Collections:**
1. `kayak_listings.reviews`: 542,793 documents
2. `kayak_listings.hotel_images`: 45,000 documents
3. `kayak_listings.hotels`: 5,000 documents
4. `kayak.reviews`: 10,000 documents

---

## Indexes

### Important Indexes to Create

```javascript
// Sessions
db.sessions.createIndex({ userId: 1 });
db.sessions.createIndex({ token: 1 }, { unique: true });
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Reviews
db.reviews.createIndex({ listing_id: 1 });
db.reviews.createIndex({ review_id: 1 });
db.reviews.createIndex({ date: -1 });

// Hotels
db.hotels.createIndex({ location: 1 });
db.hotels.createIndex({ price_per_night: 1 });
db.hotels.createIndex({ rating: -1 });

// Hotel Images
db.hotel_images.createIndex({ hotel_id: 1 });
db.hotel_images.createIndex({ listing_id: 1 });

// Car Images
db.car_images.createIndex({ car_id: 1 }, { unique: true });

// Logs
db.logs.createIndex({ timestamp: -1 });
db.logs.createIndex({ service: 1, timestamp: -1 });
db.logs.createIndex({ level: 1, timestamp: -1 });
```

---

## Setup Instructions

### Export MongoDB Schema

```bash
# Export all Kayak databases
mongodump --uri="mongodb://localhost:27017" \
  --db=kayak \
  --db=kayak_analytics \
  --db=kayak_listings \
  --db=kayak_logs \
  --out=/tmp/kayak_mongodb_backup

# Creates BSON files for all collections
```

### Import MongoDB Data

```bash
# Import to your friend's MongoDB
mongorestore --uri="mongodb://localhost:27017" \
  /tmp/kayak_mongodb_backup

# Or import specific database
mongorestore --uri="mongodb://localhost:27017" \
  --db=kayak \
  /tmp/kayak_mongodb_backup/kayak
```

### Create Indexes

```bash
mongosh mongodb://localhost:27017/kayak << 'EOF'
// Sessions indexes
db.sessions.createIndex({ userId: 1 });
db.sessions.createIndex({ token: 1 }, { unique: true });
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Notifications indexes
db.notifications.createIndex({ userId: 1 });
db.notifications.createIndex({ status: 1 });
db.notifications.createIndex({ createdAt: -1 });
EOF

mongosh mongodb://localhost:27017/kayak_listings << 'EOF'
// Hotels indexes
db.hotels.createIndex({ location: 1 });
db.hotels.createIndex({ price_per_night: 1 });
db.hotels.createIndex({ rating: -1 });
db.hotels.createIndex({ name: "text" });

// Reviews indexes
db.reviews.createIndex({ listing_id: 1 });
db.reviews.createIndex({ review_id: 1 });
db.reviews.createIndex({ date: -1 });

// Image indexes
db.hotel_images.createIndex({ hotel_id: 1 });
db.car_images.createIndex({ car_id: 1 }, { unique: true });
EOF

mongosh mongodb://localhost:27017/kayak_logs << 'EOF'
// Logs indexes
db.logs.createIndex({ timestamp: -1 });
db.logs.createIndex({ service: 1, timestamp: -1 });
db.logs.createIndex({ level: 1 });
EOF
```

---

## Using Copilot

### Prompts for MongoDB Setup

1. **Create Indexes:**
```
"Based on MONGODB_SCHEMA_EXPORT.md, generate MongoDB commands 
to create all recommended indexes for the kayak databases."
```

2. **Verify Collections:**
```
"Generate a MongoDB script to verify all collections exist 
as described in MONGODB_SCHEMA_EXPORT.md."
```

3. **Migration Script:**
```
"Create a MongoDB migration script based on MONGODB_SCHEMA_EXPORT.md 
to set up the kayak, kayak_analytics, kayak_listings, and kayak_logs databases."
```

---

## Verification Queries

### Check Databases
```javascript
db.adminCommand('listDatabases')
```

### Check Collections
```javascript
// Kayak
use kayak
db.getCollectionNames()

// Kayak Listings
use kayak_listings
db.getCollectionNames()

// Check document counts
db.reviews.countDocuments()
db.hotel_images.countDocuments()
```

### Verify Indexes
```javascript
use kayak
db.sessions.getIndexes()

use kayak_listings
db.reviews.getIndexes()
```

---

## Docker Setup

```bash
# Start MongoDB with Docker
cd kayak-microservices/infrastructure/docker
docker-compose up -d mongodb

# MongoDB will be available at localhost:27017
# No authentication by default (add in production!)
```

---

## Notes

### Why MongoDB + MySQL?

**MongoDB For:**
- Flexible schemas (reviews, images, logs)
- Large datasets (542K+ reviews)
- Session management (TTL indexes)
- Analytics events (schema evolution)

**MySQL For:**
- Transactional data (bookings, payments)
- Referential integrity (foreign keys)
- Complex joins (multi-table queries)
- ACID compliance

### Data Duplication

The `kayak_listings.hotels` collection **duplicates** the MySQL `kayak_listings.hotels` table for:
- Performance (no joins with MongoDB)
- Flexible querying
- Full-text search capabilities

**Important:** Updates should sync between MySQL and MongoDB!

---

## Common Issues

### Issue: Missing Collections

**Fix:**
```javascript
use kayak
db.createCollection('sessions')
db.createCollection('notifications')
```

### Issue: No Indexes

**Fix:** Run the index creation script above

### Issue: Connection Refused

**Check:**
```bash
# Is MongoDB running?
docker ps | grep mongo

# Restart if needed
docker-compose restart mongodb
```

---

## Connection Strings

**Local:**
```
mongodb://localhost:27017
```

**Docker:**
```
mongodb://kayak-mongodb:27017
```

**With Auth (Production):**
```
mongodb://username:password@localhost:27017/kayak?authSource=admin
```

---

**Last Updated:** December 6, 2025  
**For:** Kayak Application Development Team
