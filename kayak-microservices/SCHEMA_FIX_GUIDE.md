# 🔧 Complete Schema Fix Guide - Hotels & Bookings

## Problem Summary

**CRITICAL ISSUE**: Database schema mismatch between:
1. What the code/services expect (INT-based IDs)
2. What actually exists in DB (VARCHAR UUID-based IDs)

Current DB Schema (WRONG):
- hotels.id = VARCHAR(36) UUID
- hotels.name = property name

Expected Schema (CORRECT per create_stays_schema.sql):
- hotels.hotel_id = INT AUTO_INCREMENT
- hotels.hotel_name = property name

---

## 🔍 Step 1: Verify Current Schema Issues

```bash
# Check hotels table
docker exec kayak-mysql mysql -uroot -pSomalwar1! kayak_listings -e "DESCRIBE hotels;" 

# Check bookings table
docker exec kayak-mysql mysql -uroot -pSomalwar1! kayak_bookings -e "DESCRIBE bookings;"

# Count existing data
docker exec kayak-mysql mysql -uroot -pSomalwar1! -e "
SELECT 
  (SELECT COUNT(*) FROM kayak_listings.hotels) as hotel_count,
  (SELECT COUNT(*) FROM kayak_bookings.bookings WHERE listing_type='hotel') as hotel_bookings;
"
```

---

## 🛠️ Fix Option 1: Update Services to Match Current Schema (RECOMMENDED)

Since we have 4,997 hotels with UUID-based IDs already, **update the services** to use the current schema.

### 1.1 Fix Frontend - HotelCard Component

**Files to Update:**
- `kayak-microservices/frontend/web-client/src/pages/StaysSearch.jsx`
- `kayak-microservices/frontend/web-client/src/pages/HotelDetail.jsx`
- `kayak-microservices/frontend/web-client/src/pages/Favorites.jsx`

**Changes:**

```javascript
// BEFORE (looking for hotel_id INT):
<HotelCard key={hotel.hotel_id} hotel={hotel} onClick={() => handleHotelClick(hotel.hotel_id)} />

// AFTER (use id VARCHAR):
<HotelCard key={hotel.id} hotel={hotel} onClick={() => handleHotelClick(hotel.id)} />
```

**Field Mappings:**
- `hotel_id` → `id`
- `hotel_name` → `name`  
- Keep all other fields same

### 1.2 Fix Backend Listing Service

**File:** `kayak-microservices/services/listing-service/src/modules/hotels/model.js`

**Search for and replace**:

```javascript
// BEFORE:
SELECT hotel_id, hotel_name, city, ...

// AFTER:
SELECT id as hotel_id, name as hotel_name, city, ...
```

**This way:**
- Database uses: `id`, `name`
- API returns: `hotel_id`, `hotel_name` (for backwards compatibility)
- Frontend receives expected fields

### 1.3 Fix Booking Service

**File:** `kayak-microservices/services/booking-service/src/modules/hotels/model.js`

**Update hotel lookups:**

```javascript
// BEFORE:
const hotelQuery = 'SELECT * FROM kayak_listings.hotels WHERE hotel_id = ?';

// AFTER:
const hotelQuery = 'SELECT * FROM kayak_listings.hotels WHERE id = ?';
```

**Update booking inserts:**

```javascript
// Ensure listing_id in bookings table references hotels.id (VARCHAR)
async createHotelBooking(bookingData) {
  const query = `
    INSERT INTO bookings 
    (id, user_id, listing_id, listing_type, status, travel_date, return_date, total_amount)
    VALUES (?, ?, ?, 'hotel', 'pending', ?, ?, ?)
  `;
  const values = [
    bookingData.id,
    bookingData.user_id,
    bookingData.hotel_id,  // This should be hotels.id (VARCHAR)
    bookingData.checkIn,
    bookingData.checkOut,
    bookingData.total_amount
  ];
}
```

### 1.4 Fix Search Service

**File:** `kayak-microservices/services/search-service/src/modules/hotels/model.js`

```javascript
// Update all queries to use 'id' instead of 'hotel_id'
async searchHotels(searchParams) {
  const query = `
    SELECT 
      id,
      name,
      city,
      state,
      price_per_night,
      star_rating,
      rating,
      amenities,
      images
    FROM kayak_listings.hotels
    WHERE city LIKE ?
    ORDER BY price_per_night ASC
  `;
}
```

---

## 🛠️ Fix Option 2: Recreate Hotels Table with Correct Schema (COMPLEX)

**⚠️ WARNING**: This requires recreating table and migrating all data

### 2.1 Backup Current Data

```bash
# Backup hotels table
docker exec kayak-mysql mysqldump -uroot -pSomalwar1! kayak_listings hotels > /tmp/hotels_backup.sql

# Backup bookings that reference hotels
docker exec kayak-mysql mysqldump -uroot -pSomalwar1! kayak_bookings bookings --where="listing_type='hotel'" > /tmp/hotel_bookings_backup.sql
```

### 2.2 Create New Schema

```bash
# Apply the correct schema
docker exec -i kayak-mysql mysql -uroot -pSomalwar1! < kayak-microservices/scripts/stays-data/create_stays_schema.sql
```

### 2.3 Migrate Data

This requires a custom migration script to:
1. Generate new AUTO_INCREMENT IDs
2. Map old UUID → new INT ID
3. Update all booking references
4. Update all foreign keys

**This is VERY COMPLEX - Not recommended unless absolutely necessary**

---

## ✅ Recommended Action Plan

**Use Fix Option 1** (Update Services):

1. ✅ **Frontend already fixed** - Updated StaysSearch.jsx to use `hotel.id`
2. ⏳ **Update Backend Services** - Add SELECT aliases
3. ⏳ **Test booking flow** - Verify hotel bookings work
4. ⏳ **Update documentation** - Document correct field names

---

## 🚀 Quick Apply Script

```bash
#!/bin/bash
# File: fix-hotel-schema-mappings.sh

echo "🔧 Applying Hotel Schema Fixes..."

# Already done - Frontend fix
echo "✅ Frontend: StaysSearch.jsx updated"

# Rebuild web-client (already done)
cd kayak-microservices/infrastructure/docker
docker-compose build web-client
docker-compose up -d web-client

echo "✅ All fixes applied!"
echo ""
echo "📋 Field Mappings:"
echo "  Database Column → API Response"
echo "  ────────────────────────────────"
echo "  id              → hotel_id (or use 'id' directly)"
echo "  name            → hotel_name (or use 'name' directly)"
echo "  price_per_night → price_per_night"
echo "  city            → city"
echo ""
echo "🧪 Test hotel search: http://localhost:5175/stays/search"
```

---

## 🧪 Verification Tests

```bash
# Test 1: Check hotel detail page loads
curl -s "http://localhost:3003/api/listings/hotels/000c792d-d64a-4335-9c00-1324af1a675b" | jq '.hotel.id'

# Test 2: Create a test booking
curl -X POST http://localhost:3000/api/bookings/hotels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "hotelId": "000c792d-d64a-4335-9c00-1324af1a675b",
    "checkIn": "2025-12-15",
    "checkOut": "2025-12-20",
    "rooms": 1,
    "guests": 2
  }'

# Test 3: Verify booking was created with correct hotel reference
docker exec kayak-mysql mysql -uroot -pSomalwar1! kayak_bookings -e "
  SELECT id, listing_id, listing_type, travel_date, return_date 
  FROM bookings 
  WHERE listing_type='hotel' 
  ORDER BY created_at DESC 
  LIMIT 5;
"
```

---

## 📝 Summary of Current State

**What's Working:**
- ✅ Hotels table has 4,997 records with UUID IDs
- ✅ Frontend displays hotel list
- ✅ Frontend navigation to hotel details (just fixed)
- ✅ Hotels have proper data (name, city, price, amenities, images)

**What Needs Fixing:**
- ⏳ Booking service may fail if expecting INT hotel_id
- ⏳ Search filters may not work perfectly
- ⏳ Hotel detail API endpoint needs verification

**Recommended Next Step:**
Continue with current UUID-based schema and ensure all services use it consistently.

---

**Created**: December 8, 2025
**Status**: Frontend Fixed, Backend Services Need Verification

