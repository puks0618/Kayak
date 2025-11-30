# Kayak Microservices Architecture Overview

## 🏗️ Current Microservices (8 Total)

### 1. **API Gateway** (Port 3000)
- **Purpose**: Single entry point for all client requests
- **Routes traffic to**: All backend services
- **Status**: ✅ Running

### 2. **Auth Service** (Port 3001)
- **Purpose**: User authentication, login, signup, JWT tokens
- **Database**: MySQL (`kayak_auth`)
- **Tables**: `users` table with authentication data
- **Status**: ✅ Running

### 3. **User Service** (Port 3002)
- **Purpose**: User profile management, CRUD operations
- **Database**: MySQL (`kayak_users`)
- **Tables**: `users`, `admins`
- **Kafka**: Publishes `user.created`, `user.updated` events
- **Status**: ✅ Running

### 4. **Listing Service** (Port 3003)
- **Purpose**: Manage flights, hotels, cars listings
- **Database**: 
  - MySQL (`kayak_listings`) - Structured data
  - MongoDB (`kayak_listings`) - Reviews, images, metadata
- **Tables**: `flights`, `hotels`, `cars`
- **Status**: ✅ Running

### 5. **Search Service** (Port 3004)
- **Purpose**: Fast search and filtering across all listings
- **Database**: MySQL (read-only queries)
- **Caching**: Redis for frequently searched queries
- **Status**: ✅ Running

### 6. **Booking Service** (Port 3005)
- **Purpose**: Handle bookings for flights, hotels, cars
- **Database**: MySQL (`kayak_bookings`)
- **Tables**: `bookings`, `billing`
- **Kafka**: Publishes `booking.created`, `booking.cancelled` events
- **Status**: ❌ Code Error (needs fixing)

### 7. **Analytics Service** (Port 3006)
- **Purpose**: Track user behavior, generate reports
- **Database**: MongoDB (`kayak_analytics`)
- **Collections**: User activity logs, booking metrics
- **Kafka**: Consumes events from all services
- **Status**: ✅ Running

### 8. **Admin Service** (Port 3007)
- **Purpose**: Admin dashboard, user management, system monitoring
- **Database**: MySQL (`kayak_users`)
- **Status**: ❌ Missing dependency (needs `mysql2` package)

### 9. **AI Agent** (Port 8000) - Python/FastAPI
- **Purpose**: AI-powered recommendations, chatbot
- **Status**: ❌ Not implemented yet (planned for last)

---

## 🗄️ Data Storage Architecture

### MySQL (Relational Data)
```
kayak_auth       → Authentication credentials
kayak_users      → User profiles, admins
kayak_listings   → Flights, Hotels, Cars (structured data)
kayak_bookings   → Bookings, Billing transactions
```

### MongoDB (Document Data)
```
kayak_listings   → Reviews, images, metadata (unstructured)
kayak_analytics  → User behavior, metrics, logs
kayak_logs       → Application logs
```

### Redis (Caching)
```
- Search query results
- Frequently accessed listings
- Session data
```

---

## 📨 Kafka & Zookeeper - Event-Driven Architecture

### What is Kafka Used For?
**Kafka** enables **asynchronous communication** between microservices through **events**.

### Current Kafka Topics (Planned):

#### 1. **User Events**
- `user.created` - When new user signs up
- `user.updated` - When profile is updated
- `user.deleted` - When account is deleted

**Publishers**: Auth Service, User Service  
**Consumers**: Analytics Service, Admin Service

#### 2. **Booking Events**
- `booking.created` - When user makes a booking
- `booking.confirmed` - Payment successful
- `booking.cancelled` - User cancels booking

**Publishers**: Booking Service  
**Consumers**: Analytics Service, Listing Service (update availability)

#### 3. **Listing Events**
- `listing.created` - New flight/hotel/car added
- `listing.updated` - Price/availability changed
- `listing.deleted` - Listing removed

**Publishers**: Listing Service  
**Consumers**: Search Service (update index), Analytics Service

#### 4. **Analytics Events**
- `search.performed` - User searches for listings
- `listing.viewed` - User views listing details
- `booking.abandoned` - User didn't complete booking

**Publishers**: All services  
**Consumers**: Analytics Service

### Why Kafka?
```
Example: User books a flight

Booking Service ──[booking.created]──> Kafka
                                         │
                                         ├──> Analytics Service (logs event)
                                         ├──> Listing Service (updates availability)
                                         └──> Admin Service (real-time dashboard)
```

### Zookeeper's Role
- **Manages Kafka cluster**: Tracks which Kafka brokers are alive
- **Coordinates**: Ensures distributed system stays in sync
- **Required for**: Kafka to function properly

---

## 🚗 Building the Cars Microservice

### Option 1: Extend Listing Service (Recommended)
**Pros**:
- Cars data already has schema in `kayak_listings` database
- Reuse existing code structure
- Faster development

**Cons**:
- Listing Service becomes larger

### Option 2: Create Separate Car Service
**Pros**:
- Independent scaling
- Clear separation of concerns
- Own database/tables

**Cons**:
- More infrastructure
- More complex deployment

### Recommended Approach:
Start with **Option 1** (extend Listing Service), then extract to separate service if needed.

---

## 🔄 Current Status Summary

| Component | Status | Database | Port |
|-----------|--------|----------|------|
| **Infrastructure** | | | |
| MySQL | ✅ Running | Local Docker | 3307 |
| MongoDB | ✅ Running | Local Docker | 27017 |
| Redis | ✅ Running | Local Docker | 6379 |
| Kafka | ✅ Running | Local Docker | 9092 |
| Zookeeper | ✅ Running | Local Docker | 2181 |
| **Backend Services** | | | |
| API Gateway | ✅ Healthy | - | 3000 |
| Auth Service | ✅ Healthy | MySQL | 3001 |
| User Service | ✅ Healthy | MySQL | 3002 |
| Listing Service | ✅ Healthy | MySQL + MongoDB | 3003 |
| Search Service | ✅ Healthy | MySQL + Redis | 3004 |
| Booking Service | ❌ Code Error | MySQL | 3005 |
| Analytics Service | ✅ Healthy | MongoDB | 3006 |
| Admin Service | ❌ Missing Dep | MySQL | 3007 |
| AI Agent | ❌ Not Started | - | 8000 |
| **Frontend** | | | |
| Web Client | ✅ Running | - | 5175 |
| Admin Portal | ✅ Running | - | 5174 |

**Total**: 13/16 services running ✅

---

## 🎯 Next Steps for Cars Microservice

### 1. **Database Schema** (Already exists!)
```sql
-- In kayak_listings database
TABLE: cars
- id (VARCHAR 36)
- location (VARCHAR 255)
- type (ENUM: 'sedan', 'suv', 'luxury', 'economy')
- daily_rental_price (DECIMAL 10,2)
- brand (VARCHAR 100)
- model (VARCHAR 100)
- year (INT)
- available (BOOLEAN)
```

### 2. **API Endpoints to Create**
```
GET    /api/listings/cars           - List all cars
GET    /api/listings/cars/:id       - Get car details
POST   /api/listings/cars           - Create new car
PUT    /api/listings/cars/:id       - Update car
DELETE /api/listings/cars/:id       - Delete car
GET    /api/listings/cars/search    - Search cars by filters
```

### 3. **Kafka Events**
```javascript
// When car is booked
{
  event: 'car.booked',
  carId: 'uuid',
  userId: 'uuid',
  startDate: '2025-12-01',
  endDate: '2025-12-05'
}

// When car becomes available
{
  event: 'car.available',
  carId: 'uuid'
}
```

---

## 📊 Migration to RDS (Future)

When ready to share data across team:

```bash
# 1. Export local data
docker exec kayak-mysql mysqldump -uroot -pSomalwar1! --databases kayak_auth kayak_users kayak_listings kayak_bookings > backup.sql

# 2. Import to RDS
mysql -h kayak-mysql-db.c078kkiggn44.us-east-1.rds.amazonaws.com -uadmin -p < backup.sql

# 3. Update .env file (instructions in .env file)
```

---

## 🤔 Questions Answered

### Q: How is Kafka used?
**A**: For **event-driven communication** between services. When something happens (booking, user signup), services publish events to Kafka. Other services listen and react.

### Q: Is Kafka used for all bookings?
**A**: YES! Kafka handles events for:
- ✅ Flight bookings
- ✅ Hotel bookings
- ✅ Car bookings (when you build it)

### Q: Where is data stored?
**A**: 
- **Structured data** (flights, users, bookings) → MySQL
- **Unstructured data** (reviews, logs, analytics) → MongoDB
- **Cache** (search results, sessions) → Redis
- **Currently**: All in local Docker containers
- **Future**: Can migrate to AWS RDS for team sharing

### Q: Can 5 people access same data?
**A**: 
- **Currently**: NO (each person has local MySQL)
- **With RDS**: YES (everyone shares same database)
- **Free Tier**: 20GB storage, 750 hours/month (enough for your team)

---

**Ready to start building the Cars service? Let me know!** 🚗
