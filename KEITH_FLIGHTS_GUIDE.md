# Keith's Flights Feature Development Guide

## 🎯 Your Mission
You're working on enhancing the **Flights module** in the Listing Service. This guide will help you understand what's done and what needs to be implemented.

---

## 📍 Current Status

### ✅ What's Already Working

1. **Database Schema** (`infrastructure/databases/mysql/init/03-listings.sql`)
   - Flights table created in AWS RDS MySQL
   - Fields: id, flight_code, airline, airports, times, price, seats, class, rating
   - Indexes on: route, departure_time, price

2. **Basic CRUD Operations** (`services/listing-service/src/modules/flights/`)
   - ✅ `model.js` - Database operations (create, findAll, findById, update, delete)
   - ✅ `controller.js` - HTTP request handlers
   - ✅ `route.js` - REST API endpoints
   - ✅ Server integration - Routes mounted at `/api/listings/flights`

3. **API Endpoints Available:**
   - `GET /api/listings/flights` - Get all flights (with filters)
   - `GET /api/listings/flights/:id` - Get single flight
   - `POST /api/listings/flights` - Create flight (admin)
   - `PATCH /api/listings/flights/:id` - Update flight (admin)
   - `DELETE /api/listings/flights/:id` - Delete flight (admin)

---

## 🚧 What Needs to Be Implemented

### Priority 1: Core Enhancements

#### 1. **MongoDB Reviews Integration** 
**File:** `services/listing-service/src/modules/flights/controller.js` (line 37)

**What to do:**
- When fetching a flight by ID, also fetch reviews from MongoDB
- Reviews collection structure:
```javascript
{
  _id: ObjectId,
  listing_id: "flight-uuid",
  user_id: "user-uuid",
  rating: 4.5,
  comment: "Great flight!",
  created_at: Date
}
```

**Implementation steps:**
1. Import MongoDB connection: `const { connections } = require('../../../shared/database/mongodb');`
2. In `getById()` method, after fetching flight from MySQL:
```javascript
// Fetch reviews from MongoDB
const listingsDb = connections.listings;
await listingsDb.connect();
const reviewsCollection = listingsDb.getCollection('reviews');
const reviews = await reviewsCollection.find({ listing_id: id }).toArray();

// Add reviews to response
flight.reviews = reviews;
```

#### 2. **Kafka Event Publishing**
**File:** `services/listing-service/src/modules/flights/controller.js` (line 57)

**What to do:**
- Publish events when flights are created/updated/deleted
- Topics defined in: `shared/constants/topics.js`

**Implementation steps:**
1. Import producer: `const ListingProducer = require('../../events/producers/listing.producer');`
2. In `create()` method, after creating flight:
```javascript
await listingProducer.publishListingCreated(newFlight, 'flight');
```

#### 3. **Redis Caching**
**File:** `services/listing-service/src/cache/redis.js` (already exists)

**What to do:**
- Cache frequently accessed flights
- Invalidate cache on updates/deletes

**Implementation pattern:**
```javascript
// In getById()
const cacheKey = `flight:${id}`;
const cached = await redisCache.get(cacheKey);
if (cached) return JSON.parse(cached);

// Fetch from DB...
await redisCache.set(cacheKey, JSON.stringify(flight), 3600); // 1 hour TTL
```

### Priority 2: Enhanced Filtering

#### 4. **Advanced Search Filters**
**Current:** Basic filters (origin, destination, date, class)
**Add:**
- Price range: `?minPrice=100&maxPrice=500`
- Time preferences: `?departureTimeStart=06:00&departureTimeEnd=12:00`
- Stops: `?stops=0` (direct flights only)
- Airlines: `?airlines=Delta,United`
- Sort: `?sortBy=price&order=asc`

**File to modify:** `services/listing-service/src/modules/flights/model.js`

#### 5. **Enhanced Validation**
**Current:** Only checks if airline and price exist
**Add:**
- IATA airport code validation (3 letters)
- Date validation (departure before arrival)
- Price validation (positive number)
- Seat validation (positive integer)
- Flight code format validation

**Create new file:** `services/listing-service/src/modules/flights/validator.js`

---

## 🗂️ File Structure Reference

```
services/listing-service/src/
├── modules/
│   └── flights/
│       ├── model.js          # Database operations
│       ├── controller.js     # Business logic & HTTP handlers
│       ├── route.js          # API endpoints
│       └── validator.js      # [CREATE THIS] Input validation
├── cache/
│   └── redis.js              # Redis connection (use this)
├── config/
│   ├── database.js           # MySQL config
│   └── mongo.js              # MongoDB config
├── events/
│   └── producers/
│       └── listing.producer.js  # Kafka producer (enhance this)
└── server.js                 # Main server file
```

---

## 🔧 Development Workflow

### Step 1: Set Up Your Environment

```bash
# You're already on the right branch!
git branch  # Should show: * feature/flights-enhancement

# Navigate to listing service
cd kayak-microservices/services/listing-service

# Install dependencies (if not done)
npm install
```

### Step 2: Start Required Services

```bash
# In one terminal - Start infrastructure
cd kayak-microservices/infrastructure/docker
docker-compose up -d mysql mongodb redis kafka

# Wait 30 seconds for services to start
sleep 30

# In another terminal - Start listing service
cd kayak-microservices/services/listing-service
npm start
```

### Step 3: Test Your Changes

```bash
# Create a test flight
curl -X POST http://localhost:3003/api/listings/flights \
  -H "Content-Type: application/json" \
  -d '{
    "flight_code": "AA123",
    "airline": "American Airlines",
    "departure_airport": "SFO",
    "arrival_airport": "JFK",
    "departure_time": "2025-12-15T08:00:00",
    "arrival_time": "2025-12-15T16:30:00",
    "duration": 330,
    "price": 450.00,
    "total_seats": 180,
    "class": "economy"
  }'

# Get all flights
curl http://localhost:3003/api/listings/flights

# Get specific flight
curl http://localhost:3003/api/listings/flights/{id}

# Search with filters
curl "http://localhost:3003/api/listings/flights?origin=SFO&destination=JFK&date=2025-12-15"
```

### Step 4: Commit Your Changes

```bash
# Check what files you've modified
git status

# Add your changes
git add services/listing-service/src/modules/flights/

# Commit with a descriptive message
git commit -m "feat(flights): add MongoDB reviews integration and Redis caching"

# Push to your branch
git push origin feature/flights-enhancement
```

---

## 📚 Key Concepts to Understand

### Git Workflow for Your Team

1. **Branches:**
   - `master` - Production code (don't touch!)
   - `feature/sqlset` - Base branch with database setup
   - `feature/flights-enhancement` - YOUR branch (where you work)

2. **Basic Git Commands:**
```bash
# See which branch you're on
git branch

# Switch to a different branch
git checkout branch-name

# Create and switch to new branch
git checkout -b new-branch-name

# Pull latest changes from remote
git pull origin feature/sqlset

# Push your changes
git push origin feature/flights-enhancement

# See what you've changed
git status
git diff

# Undo changes to a file (CAREFUL!)
git checkout -- filename
```

3. **Making Changes:**
   - Always work on your feature branch
   - Commit often with clear messages
   - Pull from `feature/sqlset` regularly to stay updated
   - When ready, create a Pull Request to merge into `feature/sqlset`

### Microservices Architecture

**Your service (Listing Service) communicates with:**

1. **MySQL (AWS RDS)** - Stores flight data
   - Connection: `kayak-mysql-db.c078kkiggn44.us-east-1.rds.amazonaws.com:3306`
   - Database: `kayak_listings`
   - Table: `flights`

2. **MongoDB** - Stores reviews and images
   - Collection: `reviews`
   - Links to flights via `listing_id`

3. **Redis** - Caches frequently accessed data
   - Reduces database load
   - Improves response time

4. **Kafka** - Event streaming
   - Publishes events when flights are created/updated
   - Other services (analytics, search) consume these events

---

## 🎓 Learning Resources

### Understanding the Codebase

1. **Database Design:** Read `kayak-microservices/DATABASE_DESIGN.md`
2. **API Routes:** Read `kayak-microservices/DATABASE_ROUTES_SUMMARY.md`
3. **Kafka Topics:** See `kayak-microservices/shared/constants/topics.js`

### Node.js/Express Patterns Used

```javascript
// Async/Await pattern (used throughout)
async function getData() {
  const result = await database.query('SELECT * FROM flights');
  return result;
}

// Express route handler
router.get('/', async (req, res) => {
  try {
    const data = await getData();
    res.json(data);  // Send JSON response
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Query parameters
// URL: /flights?origin=SFO&date=2025-12-15
const { origin, date } = req.query;

// URL parameters
// URL: /flights/123
const { id } = req.params;
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot connect to MySQL"
**Solution:**
```bash
# Check if MySQL is running
docker ps | grep mysql

# Restart MySQL
docker-compose restart mysql

# Check environment variables
echo $DB_HOST
echo $DB_PASSWORD
```

### Issue 2: "Port 3003 already in use"
**Solution:**
```bash
# Find what's using the port
lsof -ti:3003

# Kill the process
lsof -ti:3003 | xargs kill -9
```

### Issue 3: "Module not found"
**Solution:**
```bash
# Reinstall dependencies
cd services/listing-service
rm -rf node_modules package-lock.json
npm install
```

### Issue 4: Git conflicts
**Solution:**
```bash
# Save your changes
git stash

# Pull latest changes
git pull origin feature/sqlset

# Reapply your changes
git stash pop

# If conflicts, manually edit files, then:
git add .
git commit -m "Resolve merge conflicts"
```

---

## ✅ Implementation Checklist

Use this to track your progress:

### Phase 1: Core Features
- [ ] Add MongoDB reviews to `getById()` method
- [ ] Implement Kafka event publishing in `create()` method
- [ ] Implement Kafka event publishing in `update()` method
- [ ] Implement Kafka event publishing in `delete()` method
- [ ] Add Redis caching to `getById()` method
- [ ] Add Redis cache invalidation to `update()` method
- [ ] Add Redis cache invalidation to `delete()` method

### Phase 2: Enhanced Features
- [ ] Create `validator.js` with input validation
- [ ] Add price range filtering
- [ ] Add time range filtering
- [ ] Add airline filtering
- [ ] Add sorting functionality
- [ ] Add pagination (limit/offset)

### Phase 3: Testing
- [ ] Test flight creation
- [ ] Test flight retrieval with reviews
- [ ] Test filtering with multiple parameters
- [ ] Test caching (check Redis)
- [ ] Test Kafka events (check topics)
- [ ] Test error handling

### Phase 4: Documentation
- [ ] Add JSDoc comments to functions
- [ ] Update API documentation
- [ ] Create test data script for flights

---

## 🚀 Next Steps

1. **Start with Priority 1, Task 1** (MongoDB Reviews)
2. **Test it thoroughly**
3. **Commit your changes**
4. **Move to next task**
5. **Ask for help when stuck!**

---

## 📞 Need Help?

- **Check existing code:** Look at hotels/cars modules for similar patterns
- **Read error messages carefully:** They usually tell you what's wrong
- **Use console.log():** Debug by printing values
- **Ask your team:** They're working on similar tasks

---

## 🎉 You Got This!

Remember:
- Take it one task at a time
- Test frequently
- Commit often
- Don't be afraid to ask questions
- Google is your friend (search for specific errors)

**Good luck, Keith! 🚀**

