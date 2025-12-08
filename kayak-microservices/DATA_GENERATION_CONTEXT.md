# Data Generation Context & Requirements

## 🎯 Purpose
Generate realistic dummy data for testing analytics dashboards with proper historical, current, and future bookings.

---

## 📊 Current System State

### ✅ **What's Working**
- **Analytics Dashboard:** Fully functional at `http://localhost:5174/analytics`
- **Backend API:** Running at `http://localhost:3007/api/admin/analytics`
- **3 Reports Implemented:**
  1. Top 10 Hotel Properties with Revenue per Year
  2. City-wise Revenue per Year
  3. Top 10 Hosts/Providers with Maximum Properties Sold

### ⚠️ **Current Problem**
- Only **1 hotel property** shows in Top 10 (need at least 10)
- Only **3 flight bookings** exist
- **5,736 car bookings** exist but use orphaned IDs (don't match cars table)
- Need diverse data across multiple time periods for realistic dashboard testing

---

## 🗄️ Database Schema & Relationships

### **Database: kayak_users**

#### Table: `users`
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,          -- UUID format
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role ENUM('traveller', 'owner', 'admin') DEFAULT 'traveller',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Existing Users:**
- **2,500 Travellers:** `traveller00001@test.com` to `traveller02500@test.com`
- **2,500 Owners:** `owner00001@test.com` to `owner02500@test.com`
- All have UUID format IDs (must SELECT to get actual UUIDs)

#### Table: `owner_profiles` (Optional)
```sql
CREATE TABLE owner_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,       -- FK to users.id
    business_name VARCHAR(255),
    business_type ENUM('individual', 'company', 'agency'),
    is_verified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

### **Database: kayak_listings**

#### Table: `hotels`
```sql
CREATE TABLE hotels (
    id VARCHAR(36) PRIMARY KEY,              -- UUID - USE THIS FOR BOOKINGS
    owner_id VARCHAR(36),                    -- FK to users.id (role='owner')
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state CHAR(2) NOT NULL,
    zip_code VARCHAR(10),
    star_rating INT,                         -- 1-5
    rating DECIMAL(3,2) DEFAULT 0.00,        -- 0.00-5.00
    price_per_night DECIMAL(10,2) NOT NULL,
    num_rooms INT NOT NULL,
    room_type VARCHAR(50),
    amenities JSON,
    approval_status VARCHAR(20) DEFAULT 'approved',
    images JSON,
    listing_id INT UNIQUE,                   -- Alternative ID (Airbnb) - DON'T USE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Critical Notes:**
- **USE `id` (VARCHAR UUID) for bookings.listing_id**
- `listing_id` (INT) is legacy from Airbnb data - ignore it
- **4,997 hotels available** in database
- Currently only a few have `owner_id` set

#### Table: `cars`
```sql
CREATE TABLE cars (
    id VARCHAR(36) PRIMARY KEY,              -- UUID - USE THIS FOR BOOKINGS
    owner_id VARCHAR(36),                    -- FK to users.id (role='owner')
    company_name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    type ENUM('sedan', 'suv', 'luxury', 'economy', 'compact', 'van'),
    transmission ENUM('automatic', 'manual'),
    seats INT NOT NULL,
    daily_rental_price DECIMAL(10,2) NOT NULL,
    location VARCHAR(255) NOT NULL,          -- City or Airport code
    availability_status BOOLEAN DEFAULT TRUE,
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Critical Notes:**
- **106 cars available**
- Existing 5,736 car bookings use IDs like "car-000001" (orphaned, don't match cars.id)
- Need to assign `owner_id` to cars for analytics

#### Table: `flights`
```sql
CREATE TABLE flights (
    id VARCHAR(36) PRIMARY KEY,              -- UUID - USE THIS FOR BOOKINGS
    flight_code VARCHAR(20) NOT NULL,        -- e.g., AA123
    airline VARCHAR(255) NOT NULL,
    departure_airport VARCHAR(10) NOT NULL,  -- IATA code (e.g., JFK)
    arrival_airport VARCHAR(10) NOT NULL,    -- IATA code (e.g., LAX)
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    duration INT NOT NULL,                   -- minutes
    price DECIMAL(10,2) NOT NULL,
    total_seats INT NOT NULL,
    class ENUM('economy', 'business', 'first'),
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Critical Notes:**
- Airlines (not individual owners) are the "providers" for flights
- Need diverse airlines for "Top Providers" report

---

### **Database: kayak_bookings**

#### Table: `bookings`
```sql
CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY,                    -- UUID - use UUID() function
    user_id VARCHAR(36) NOT NULL,                  -- FK to users.id (role='traveller')
    listing_id VARCHAR(36) NOT NULL,               -- FK to hotels.id OR flights.id OR cars.id
    listing_type ENUM('flight', 'hotel', 'car') NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- When booking was made
    travel_date DATE NOT NULL,                     -- When travel starts
    return_date DATE,                              -- For multi-day bookings
    rental_days INT,                               -- For cars/hotels
    total_amount DECIMAL(10,2) NOT NULL,
    payment_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_listing_id (listing_id),
    INDEX idx_status (status),
    INDEX idx_booking_date (booking_date)
);
```

**Critical Booking Status Logic:**

| Status | Meaning | When to Use | Analytics Impact |
|--------|---------|-------------|------------------|
| **pending** | Just created, awaiting payment | Future bookings, unconfirmed | ❌ Not counted in analytics |
| **confirmed** | Paid, before travel date | Active future bookings | ✅ Counted in revenue |
| **completed** | Travel finished | Past bookings | ✅ Counted in revenue |
| **cancelled** | Customer cancelled | Any time | ❌ Not counted in analytics |

**Date & Time Rules:**
- **Historical Bookings:** `booking_date` in past, `travel_date` in past, `status='completed'`
- **Active Current Bookings:** `booking_date` recent, `travel_date` = today ±7 days, `status='confirmed'`
- **Future Bookings:** `booking_date` = today, `travel_date` in future, `status='confirmed'` or `'pending'`

---

## 🎯 Data Generation Requirements

### **Goal: Generate Realistic Test Data**

#### **Time Periods to Cover:**

```
Historical (Completed):
├─ 2024 (Full Year) - 200+ bookings
│  ├─ Q1: Jan-Mar (50 bookings)
│  ├─ Q2: Apr-Jun (50 bookings)
│  ├─ Q3: Jul-Sep (50 bookings)
│  └─ Q4: Oct-Dec (50 bookings)
│
└─ 2025 (Jan-Nov) - 300+ bookings
   ├─ Jan-Mar (100 bookings)
   ├─ Apr-Jun (100 bookings)
   └─ Jul-Nov (100 bookings)

Active Current (In Progress):
└─ December 2025 (Current Month)
   ├─ Confirmed bookings (travel_date = today ±7 days)
   └─ Status: 'confirmed'
   └─ Count: 20-30 bookings

Future (Upcoming):
└─ 2026 (Jan-Jun)
   ├─ Confirmed future bookings
   └─ Status: 'confirmed' or 'pending'
   └─ Count: 50+ bookings
```

#### **Distribution by Listing Type:**

| Type | Historical | Current | Future | Total |
|------|-----------|---------|--------|-------|
| Hotels | 200 | 15 | 30 | 245 |
| Flights | 150 | 10 | 20 | 180 |
| Cars | (skip, already exist) | - | - | - |
| **Total** | **350** | **25** | **50** | **425** |

#### **Property Distribution:**

- **Hotels:** 20-30 unique hotel properties
  - Top 5 hotels: 15-20 bookings each
  - Mid-tier: 5-10 bookings each
  - Low-tier: 1-3 bookings each
  
- **Flights:** 15-20 unique flights (different routes)
  - Major airlines (AA, Delta, United): 10-15 bookings each
  - Regional airlines: 3-5 bookings each

- **Owners:** Assign 10-15 unique owners to hotels
  - Top owners: 3-5 properties each
  - Regular owners: 1-2 properties each

---

## 🔧 Step-by-Step Data Generation Plan

### **Phase 1: Preparation (Verify & Select Real IDs)**

```sql
-- 1.1: Get 100 traveller UUIDs
SELECT id, email FROM kayak_users.users 
WHERE role='traveller' AND is_active=1
LIMIT 100;
-- Save these IDs for user_id in bookings

-- 1.2: Get 15 owner UUIDs  
SELECT id, email FROM kayak_users.users 
WHERE role='owner' AND is_active=1
LIMIT 15;
-- Save these IDs for owner_id in listings

-- 1.3: Get 30 hotel UUIDs (diverse cities)
SELECT id, name, city, state, price_per_night 
FROM kayak_listings.hotels 
WHERE approval_status='approved'
ORDER BY RAND()
LIMIT 30;
-- Save these IDs for listing_id in bookings

-- 1.4: Get 20 flight UUIDs (diverse routes/airlines)
SELECT id, flight_code, airline, departure_airport, arrival_airport, price
FROM kayak_listings.flights
ORDER BY RAND()
LIMIT 20;
-- Save these IDs for listing_id in bookings

-- 1.5: Check existing bookings to avoid duplicates
SELECT listing_id, COUNT(*) as existing_count
FROM kayak_bookings.bookings
WHERE listing_type IN ('hotel', 'flight')
GROUP BY listing_id;
```

---

### **Phase 2: Assign Owners to Listings**

```sql
-- 2.1: Assign owners to hotels (10-15 owners, 1-5 hotels each)
UPDATE kayak_listings.hotels 
SET owner_id = 'owner-uuid-1'  -- Replace with actual UUID
WHERE id IN ('hotel-uuid-1', 'hotel-uuid-2', 'hotel-uuid-3');

UPDATE kayak_listings.hotels 
SET owner_id = 'owner-uuid-2'  -- Replace with actual UUID
WHERE id IN ('hotel-uuid-4', 'hotel-uuid-5');

-- Repeat for all 15 owners...

-- 2.2: Assign owners to cars (optional, for car analytics later)
UPDATE kayak_listings.cars 
SET owner_id = 'owner-uuid-1'  -- Replace with actual UUID
WHERE id IN ('car-uuid-1', 'car-uuid-2');

-- 2.3: Verify assignments
SELECT owner_id, COUNT(*) as properties_owned
FROM kayak_listings.hotels
WHERE owner_id IS NOT NULL
GROUP BY owner_id;
```

---

### **Phase 3: Generate Historical Bookings (2024-2025)**

```sql
-- 3.1: Historical Hotel Bookings (200 total)

-- Example structure for each booking:
INSERT INTO kayak_bookings.bookings 
(id, user_id, listing_id, listing_type, status, booking_date, travel_date, return_date, rental_days, total_amount)
VALUES
-- Q1 2024 (Jan-Mar): 25 bookings
(UUID(), 'traveller-uuid-1', 'hotel-uuid-1', 'hotel', 'completed', 
 '2024-01-15 10:30:00', '2024-02-10', '2024-02-15', 5, 450.00),

(UUID(), 'traveller-uuid-2', 'hotel-uuid-1', 'hotel', 'completed', 
 '2024-01-20 14:20:00', '2024-02-20', '2024-02-25', 5, 450.00),

(UUID(), 'traveller-uuid-3', 'hotel-uuid-2', 'hotel', 'completed', 
 '2024-02-05 09:15:00', '2024-03-01', '2024-03-04', 3, 360.00),

(UUID(), 'traveller-uuid-4', 'hotel-uuid-2', 'hotel', 'completed', 
 '2024-02-10 16:45:00', '2024-03-10', '2024-03-13', 3, 360.00),

(UUID(), 'traveller-uuid-5', 'hotel-uuid-3', 'hotel', 'completed', 
 '2024-03-01 11:00:00', '2024-04-05', '2024-04-10', 5, 550.00);
-- ... repeat pattern for 25 total Q1 bookings

-- Q2 2024 (Apr-Jun): 25 bookings
-- ... similar pattern with booking_date in Q2, travel_date in Q2/Q3

-- Q3 2024 (Jul-Sep): 25 bookings
-- ... similar pattern

-- Q4 2024 (Oct-Dec): 25 bookings
-- ... similar pattern

-- 2025 bookings (125 total, Jan-Nov)
-- ... similar pattern

-- 3.2: Historical Flight Bookings (150 total)
INSERT INTO kayak_bookings.bookings 
(id, user_id, listing_id, listing_type, status, booking_date, travel_date, total_amount)
VALUES
(UUID(), 'traveller-uuid-10', 'flight-uuid-1', 'flight', 'completed', 
 '2024-01-10 08:00:00', '2024-02-15', 599.00),

(UUID(), 'traveller-uuid-11', 'flight-uuid-1', 'flight', 'completed', 
 '2024-01-15 10:30:00', '2024-02-20', 599.00),

(UUID(), 'traveller-uuid-12', 'flight-uuid-2', 'flight', 'completed', 
 '2024-02-01 12:00:00', '2024-03-10', 449.00);
-- ... repeat for 150 total flight bookings
```

**Booking Rules:**
- `booking_date`: Random date in the quarter
- `travel_date`: 2-8 weeks after booking_date
- `return_date`: travel_date + 3-7 days (for hotels)
- `rental_days`: days between travel_date and return_date
- `total_amount`: `price_per_night * rental_days` (hotels) or flight price
- `status`: 'completed' (travel_date is in the past)

---

### **Phase 4: Generate Active Current Bookings (December 2025)**

```sql
-- 4.1: Current Hotel Bookings (15 bookings)
INSERT INTO kayak_bookings.bookings 
(id, user_id, listing_id, listing_type, status, booking_date, travel_date, return_date, rental_days, total_amount)
VALUES
-- Bookings for THIS WEEK (current active)
(UUID(), 'traveller-uuid-50', 'hotel-uuid-5', 'hotel', 'confirmed', 
 '2025-11-20 14:30:00', CURDATE() - INTERVAL 2 DAY, CURDATE() + INTERVAL 3 DAY, 5, 500.00),

(UUID(), 'traveller-uuid-51', 'hotel-uuid-6', 'hotel', 'confirmed', 
 '2025-11-25 10:00:00', CURDATE(), CURDATE() + INTERVAL 5 DAY, 5, 600.00),

(UUID(), 'traveller-uuid-52', 'hotel-uuid-7', 'hotel', 'confirmed', 
 '2025-12-01 09:30:00', CURDATE() + INTERVAL 3 DAY, CURDATE() + INTERVAL 8 DAY, 5, 450.00);
-- ... 15 total current hotel bookings

-- 4.2: Current Flight Bookings (10 bookings)
INSERT INTO kayak_bookings.bookings 
(id, user_id, listing_id, listing_type, status, booking_date, travel_date, total_amount)
VALUES
(UUID(), 'traveller-uuid-60', 'flight-uuid-5', 'flight', 'confirmed', 
 '2025-11-15 08:00:00', CURDATE() + INTERVAL 2 DAY, 599.00),

(UUID(), 'traveller-uuid-61', 'flight-uuid-6', 'flight', 'confirmed', 
 '2025-11-20 14:00:00', CURDATE() + INTERVAL 5 DAY, 749.00);
-- ... 10 total current flight bookings
```

---

### **Phase 5: Generate Future Bookings (2026)**

```sql
-- 5.1: Future Hotel Bookings (30 bookings)
INSERT INTO kayak_bookings.bookings 
(id, user_id, listing_id, listing_type, status, booking_date, travel_date, return_date, rental_days, total_amount)
VALUES
-- Q1 2026
(UUID(), 'traveller-uuid-70', 'hotel-uuid-8', 'hotel', 'confirmed', 
 CURDATE(), '2026-01-15', '2026-01-20', 5, 500.00),

(UUID(), 'traveller-uuid-71', 'hotel-uuid-9', 'hotel', 'pending', 
 CURDATE(), '2026-02-10', '2026-02-15', 5, 450.00),

(UUID(), 'traveller-uuid-72', 'hotel-uuid-10', 'hotel', 'confirmed', 
 CURDATE(), '2026-03-05', '2026-03-10', 5, 550.00);
-- ... 30 total future hotel bookings

-- 5.2: Future Flight Bookings (20 bookings)
INSERT INTO kayak_bookings.bookings 
(id, user_id, listing_id, listing_type, status, booking_date, travel_date, total_amount)
VALUES
(UUID(), 'traveller-uuid-80', 'flight-uuid-7', 'flight', 'confirmed', 
 CURDATE(), '2026-01-20', 599.00),

(UUID(), 'traveller-uuid-81', 'flight-uuid-8', 'flight', 'pending', 
 CURDATE(), '2026-02-15', 649.00);
-- ... 20 total future flight bookings
```

---

## ✅ Verification & Testing Queries

### **After Data Generation - Run These to Verify:**

```sql
-- V1: Check booking counts by type and status
SELECT 
  listing_type,
  status,
  COUNT(*) as count,
  SUM(total_amount) as revenue
FROM kayak_bookings.bookings
GROUP BY listing_type, status
ORDER BY listing_type, status;

-- Expected Output:
-- hotel, completed: ~200
-- hotel, confirmed: ~45
-- hotel, pending: ~10
-- flight, completed: ~150
-- flight, confirmed: ~30
-- flight, pending: ~10

-- V2: Check unique properties with bookings
SELECT 
  listing_type,
  COUNT(DISTINCT listing_id) as unique_properties,
  COUNT(*) as total_bookings
FROM kayak_bookings.bookings
WHERE status IN ('confirmed', 'completed')
GROUP BY listing_type;

-- Expected Output:
-- hotel: 20-30 unique properties, 240+ bookings
-- flight: 15-20 unique routes, 180+ bookings

-- V3: Verify no orphaned bookings
SELECT 
  b.listing_type,
  COUNT(*) as orphaned_count
FROM kayak_bookings.bookings b
LEFT JOIN kayak_listings.hotels h ON b.listing_id = h.id AND b.listing_type = 'hotel'
LEFT JOIN kayak_listings.flights f ON b.listing_id = f.id AND b.listing_type = 'flight'
WHERE (b.listing_type = 'hotel' AND h.id IS NULL)
   OR (b.listing_type = 'flight' AND f.id IS NULL)
GROUP BY b.listing_type;

-- Expected Output: 0 rows (no orphans)

-- V4: Check owner assignments
SELECT 
  u.email as owner_email,
  COUNT(h.id) as hotels_owned,
  COUNT(DISTINCT b.id) as total_bookings,
  SUM(b.total_amount) as total_revenue
FROM kayak_users.users u
INNER JOIN kayak_listings.hotels h ON u.id = h.owner_id
LEFT JOIN kayak_bookings.bookings b ON h.id = b.listing_id
WHERE u.role = 'owner' AND b.status IN ('confirmed', 'completed')
GROUP BY u.id, u.email
ORDER BY total_revenue DESC;

-- Expected Output: 10-15 owners with properties and revenue

-- V5: Check time distribution
SELECT 
  YEAR(booking_date) as year,
  QUARTER(booking_date) as quarter,
  listing_type,
  COUNT(*) as bookings
FROM kayak_bookings.bookings
GROUP BY YEAR(booking_date), QUARTER(booking_date), listing_type
ORDER BY year, quarter, listing_type;

-- Expected Output: Bookings distributed across 2024-2026

-- V6: Test analytics query (Top 10 Hotels)
SELECT 
  h.name as property_name,
  CONCAT(h.city, ', ', h.state) as location,
  COUNT(b.id) as total_bookings,
  SUM(b.total_amount) as total_revenue,
  AVG(b.total_amount) as avg_booking_value
FROM kayak_bookings.bookings b
LEFT JOIN kayak_listings.hotels h ON b.listing_id = h.id
WHERE b.listing_type = 'hotel' 
  AND b.status IN ('confirmed', 'completed')
  AND YEAR(b.booking_date) = 2025
GROUP BY b.listing_id, h.name, h.city, h.state
ORDER BY total_revenue DESC
LIMIT 10;

-- Expected Output: 10 different hotel properties with varying revenue
```

---

## 🚨 Critical Warnings & Constraints

### **❌ NEVER DO:**
1. Don't use `hotels.listing_id` (INT) - always use `hotels.id` (UUID)
2. Don't create bookings with non-existent user_id or listing_id
3. Don't use hard-coded UUIDs - always SELECT from database first
4. Don't mark future bookings as 'completed' (illogical)
5. Don't set `booking_date` after `travel_date` (illogical)
6. Don't create duplicate bookings (check existing first)
7. Don't modify existing car bookings (5,736 exist, leave them)
8. Don't assign hotels to non-owner users

### **✅ ALWAYS DO:**
1. SELECT actual UUIDs before INSERT
2. Verify foreign keys exist before INSERT
3. Use realistic dates (booking before travel)
4. Use appropriate status for date ranges
5. Calculate total_amount realistically
6. Verify data after generation
7. Maintain referential integrity

---

## 📋 Realistic Pricing Guidelines

| Type | Calculation | Range |
|------|-------------|-------|
| **Hotels** | `price_per_night * rental_days` | $80-200/night × 3-7 days = $240-1400 |
| **Flights** | Fixed price from flights table | $200-1000 per ticket |
| **Cars** | `daily_rental_price * rental_days` | $40-150/day × 3-10 days = $120-1500 |

---

## 🎯 Success Metrics

After data generation, analytics dashboard should show:

1. **Top 10 Hotel Properties:** Full list of 10 different hotels
2. **City Revenue:** 10-15 different cities with bookings
3. **Top Providers:** 10-15 different owners/airlines
4. **Monthly Trends:** Clear progression through 2024-2025
5. **No Errors:** All queries return valid data, no orphaned records

---

## 📝 Script Generation Template

Use this template structure for generating the data:

```sql
-- ========================================
-- KAYAK ANALYTICS TEST DATA GENERATION
-- ========================================
-- Purpose: Generate realistic bookings for dashboard testing
-- Date Range: 2024-01-01 to 2026-06-30
-- Bookings: ~425 total (hotels + flights)
-- ========================================

-- STEP 1: Store real UUIDs in variables (if your DB supports it)
-- Or create temporary tables to hold IDs

-- STEP 2: Assign owners to listings
UPDATE kayak_listings.hotels SET owner_id = 'uuid' WHERE id IN (...);

-- STEP 3: Insert historical bookings (2024)
INSERT INTO kayak_bookings.bookings (...) VALUES (...);

-- STEP 4: Insert historical bookings (2025)
INSERT INTO kayak_bookings.bookings (...) VALUES (...);

-- STEP 5: Insert current active bookings
INSERT INTO kayak_bookings.bookings (...) VALUES (...);

-- STEP 6: Insert future bookings
INSERT INTO kayak_bookings.bookings (...) VALUES (...);

-- STEP 7: Verification queries
SELECT ...;

-- ========================================
-- END SCRIPT
-- ========================================
```

---

## 🔍 Next Steps

1. **Review this document** to understand all constraints
2. **Run Phase 1** queries to gather real UUIDs
3. **Generate SQL script** with actual IDs (not placeholders)
4. **Test on staging** if available
5. **Execute script** on development database
6. **Run verification** queries
7. **Test dashboard** to ensure all reports populate
8. **Debug** any issues with data/queries

---

**Ready for data generation!** Use this context to create a comprehensive SQL script that respects all constraints and generates realistic, testable data. 🚀📊

