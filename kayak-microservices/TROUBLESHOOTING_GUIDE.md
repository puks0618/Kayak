# Kayak Microservices Troubleshooting Guide

## Table of Contents
1. [Login Issues](#login-issues)
2. [Hotel Stays Schema Issues](#hotel-stays-schema-issues)
3. [Database Issues](#database-issues)
4. [Service Health Issues](#service-health-issues)
5. [Common Fixes](#common-fixes)

---

## Login Issues

### Problem: Unable to login - No users in database

**Symptoms:**
- Login attempts fail
- Auth service returns user not found
- Database shows 0 users

**Root Cause:**
- Users table is empty after fresh deployment
- No test data seeded

**Solution:**

1. **Check if users exist:**
```bash
docker exec kayak-mysql mysql -uroot -pSomalwar1! kayak_users -e "SELECT COUNT(*) FROM users;"
```

2. **Create test users manually:**

**Regular User:**
```bash
docker exec kayak-mysql mysql -uroot -pSomalwar1! kayak_users -e "
INSERT INTO users (email, password_hash, first_name, last_name, role, created_at) 
VALUES ('user@test.com', '\$2b\$10\$rN8L3xqJ5nY7YZQx.5mZ3eU8hE5xGKqXZ4qF2XwJ9YpL5xK8Z9mZy', 'Test', 'User', 'user', NOW());
"
```
**Password:** `password123`

**Owner User:**
```bash
docker exec kayak-mysql mysql -uroot -pSomalwar1! kayak_users -e "
INSERT INTO users (email, password_hash, first_name, last_name, role, created_at) 
VALUES ('owner@test.com', '\$2b\$10\$rN8L3xqJ5nY7YZQx.5mZ3eU8hE5xGKqXZ4qF2XwJ9YpL5xK8Z9mZy', 'Owner', 'User', 'owner', NOW());
"
```
**Password:** `password123`

**Admin User:**
```bash
docker exec kayak-mysql mysql -uroot -pSomalwar1! kayak_users -e "
INSERT INTO users (email, password_hash, first_name, last_name, role, created_at) 
VALUES ('admin@test.com', '\$2b\$10\$rN8L3xqJ5nY7YZQx.5mZ3eU8hE5xGKqXZ4qF2XwJ9YpL5xK8Z9mZy', 'Admin', 'User', 'admin', NOW());
"
```
**Password:** `password123`

3. **Verify users created:**
```bash
docker exec kayak-mysql mysql -uroot -pSomalwar1! kayak_users -e "SELECT id, email, role FROM users;"
```

4. **Test login via API:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123"}'
```

---

## Hotel Stays Schema Issues

### Problem: Hotel stays/bookings not working - Schema mismatch

**Symptoms:**
- Error: "Unknown column 'hotel_stays.check_in_date'"
- Bookings page doesn't load
- Database queries failing with column not found errors

**Root Cause:**
Multiple schema inconsistencies:
1. Column naming mismatch (`check_in_date` vs `check_in`)
2. Missing columns in database tables
3. Code expecting different column names than database has
4. Inconsistent date field formats

**Detailed Fixes:**

### Fix 1: Database Schema Update

**Step 1 - Check current schema:**
```bash
docker exec kayak-mysql mysql -uroot -pSomalwar1! kayak_bookings -e "DESCRIBE hotel_stays;"
```

**Step 2 - Add missing columns if they don't exist:**

```sql
-- Fix hotel_stays table
ALTER TABLE hotel_stays 
  ADD COLUMN IF NOT EXISTS check_in DATE,
  ADD COLUMN IF NOT EXISTS check_out DATE;

-- Rename columns if old ones exist
ALTER TABLE hotel_stays 
  CHANGE COLUMN check_in_date check_in DATE;
ALTER TABLE hotel_stays 
  CHANGE COLUMN check_out_date check_out DATE;
```

**Execute fix:**
```bash
docker exec kayak-mysql mysql -uroot -pSomalwar1! kayak_bookings -e "
ALTER TABLE hotel_stays 
  MODIFY COLUMN check_in DATE,
  MODIFY COLUMN check_out DATE;
"
```

### Fix 2: Booking Service Model Update

**File:** `kayak-microservices/services/booking-service/src/modules/hotels/model.js`

**Issue:** Model using wrong column names

**Before:**
```javascript
async createHotelBooking(bookingData) {
  const query = `
    INSERT INTO hotel_stays 
    (booking_id, hotel_id, room_type, check_in_date, check_out_date, ...) 
    VALUES (?, ?, ?, ?, ?, ...)
  `;
}
```

**After:**
```javascript
async createHotelBooking(bookingData) {
  const query = `
    INSERT INTO hotel_stays 
    (booking_id, hotel_id, room_type, check_in, check_out, ...) 
    VALUES (?, ?, ?, ?, ?, ...)
  `;
}
```

**Key Changes:**
- `check_in_date` → `check_in`
- `check_out_date` → `check_out`

Apply to ALL queries in the file:
- `createHotelBooking()`
- `getHotelStayByBookingId()`
- `updateHotelStay()`
- Any SELECT queries

### Fix 3: Search Service Integration

**File:** `kayak-microservices/services/search-service/src/modules/hotels/model.js`

**Issue:** Search queries using wrong column names when checking availability

**Before:**
```javascript
AND NOT EXISTS (
  SELECT 1 FROM kayak_bookings.hotel_stays 
  WHERE hotel_stays.hotel_id = h.id 
  AND hotel_stays.check_in_date < ? 
  AND hotel_stays.check_out_date > ?
)
```

**After:**
```javascript
AND NOT EXISTS (
  SELECT 1 FROM kayak_bookings.hotel_stays 
  WHERE hotel_stays.hotel_id = h.id 
  AND hotel_stays.check_in < ? 
  AND hotel_stays.check_out > ?
)
```

### Fix 4: Import Data Script

**File:** `kayak-microservices/scripts/import-stays-data.js`

**Issue:** Script inserting data with wrong column names

**Before:**
```javascript
const query = `
  INSERT INTO hotel_stays 
  (booking_id, hotel_id, check_in_date, check_out_date, ...) 
  VALUES ?
`;
```

**After:**
```javascript
const query = `
  INSERT INTO hotel_stays 
  (booking_id, hotel_id, check_in, check_out, ...) 
  VALUES ?
`;
```

### Fix 5: Restart Services

After making changes:

```bash
# Restart only affected services
docker restart kayak-booking-service
docker restart kayak-search-service

# Or restart all
cd kayak-microservices/infrastructure/docker
docker compose restart
```

### Fix 6: Verify the Fix

```bash
# Check schema is correct
docker exec kayak-mysql mysql -uroot -pSomalwar1! kayak_bookings -e "DESCRIBE hotel_stays;"

# Should show:
# check_in | date
# check_out | date

# Test a booking
curl -X POST http://localhost:3000/api/bookings/hotels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "hotelId": 1,
    "checkIn": "2025-12-15",
    "checkOut": "2025-12-20",
    "rooms": 1,
    "guests": 2
  }'
```

---

## Database Issues

### Problem: Database schema not initialized

**Solution:**

1. **Check init scripts exist:**
```bash
ls -la kayak-microservices/infrastructure/databases/mysql/init/
```

2. **Manually run init scripts:**
```bash
# Example: Create bookings schema
docker exec -i kayak-mysql mysql -uroot -pSomalwar1! < \
  kayak-microservices/infrastructure/databases/mysql/init/02-bookings-schema.sql
```

3. **Rebuild database if needed:**
```bash
docker compose down -v  # WARNING: Deletes all data
docker compose up -d
```

### Problem: Cannot connect to MySQL

**Check credentials in docker-compose.yml:**
```yaml
mysql:
  environment:
    MYSQL_ROOT_PASSWORD: Somalwar1!
```

**Connection command:**
```bash
docker exec kayak-mysql mysql -uroot -pSomalwar1!
```

---

## Service Health Issues

### Check all service health

```bash
# Check running containers
docker compose ps

# Check specific service logs
docker logs kayak-booking-service --tail 50

# Check all unhealthy services
docker compose ps | grep -v "healthy"

# Test service endpoint
curl http://localhost:3003/health
```

### Restart specific service

```bash
docker restart kayak-booking-service
```

### Check service dependencies

```bash
# Booking service depends on MySQL
docker logs kayak-booking-service | grep -i "database\|mysql\|connection"
```

---

## Common Fixes

### 1. Schema Mismatch Pattern

**When you see errors like:**
- "Unknown column 'table.column_name'"
- "Column not found"
- SQL syntax errors with column names

**Fix process:**
1. Check actual database schema: `DESCRIBE table_name`
2. Find all code files querying that table
3. Update column names in all queries
4. Restart affected services
5. Test the endpoint

**Files to check for hotel stays:**
- `services/booking-service/src/modules/hotels/model.js`
- `services/search-service/src/modules/hotels/model.js`
- `scripts/import-stays-data.js`
- Any migration scripts

### 2. Date Format Issues

**Standard formats:**
- Database column type: `DATE`
- JavaScript/JSON format: `"YYYY-MM-DD"` (string)
- SQL insertion: Use DATE type, not DATETIME

### 3. Service Not Responding

```bash
# 1. Check if running
docker compose ps | grep service-name

# 2. Check logs
docker logs kayak-service-name --tail 100

# 3. Check health endpoint
curl http://localhost:PORT/health

# 4. Restart service
docker restart kayak-service-name

# 5. If still failing, check environment variables
docker inspect kayak-service-name | grep -A 20 Env
```

### 4. Data Not Loading

```bash
# Check data exists
docker exec kayak-mysql mysql -uroot -pSomalwar1! DATABASE_NAME -e "SELECT COUNT(*) FROM table_name;"

# Check if import script ran
docker logs kayak-mysql | grep -i "init\|import"

# Manually run import
cd kayak-microservices/scripts
node import-script.js
```

---

## Quick Diagnostics Checklist

When something is broken, run these in order:

```bash
# 1. Are all services running?
docker compose ps

# 2. Are databases accessible?
docker exec kayak-mysql mysql -uroot -pSomalwar1! -e "SHOW DATABASES;"
docker exec kayak-mongodb mongosh --quiet --eval "db.adminCommand('listDatabases')"

# 3. Check service health
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3003/health  # Listing Service
curl http://localhost:3005/health  # Booking Service

# 4. Check recent logs
docker logs kayak-api-gateway --tail 20
docker logs kayak-booking-service --tail 20
docker logs kayak-auth-service --tail 20

# 5. Check data counts
docker exec kayak-mysql mysql -uroot -pSomalwar1! kayak_users -e "SELECT COUNT(*) FROM users;"
docker exec kayak-mysql mysql -uroot -pSomalwar1! kayak_listings -e "SELECT COUNT(*) FROM hotels;"
docker exec kayak-mysql mysql -uroot -pSomalwar1! kayak_bookings -e "SELECT COUNT(*) FROM bookings;"
```

---

## Emergency Reset

If everything is broken and you need to start fresh:

```bash
# 1. Stop everything
cd kayak-microservices/infrastructure/docker
docker compose down

# 2. Remove volumes (WARNING: Deletes all data)
docker compose down -v

# 3. Clean up
docker system prune -f

# 4. Rebuild
docker compose build --no-cache

# 5. Start fresh
docker compose up -d

# 6. Wait for services to initialize
sleep 30

# 7. Create test users (see Login Issues section above)

# 8. Verify
docker compose ps
curl http://localhost:3000/health
```

---

## Prevention

### Before deploying changes:

1. **Check schema consistency:**
```bash
# Compare column names in database
docker exec kayak-mysql mysql -uroot -pSomalwar1! kayak_bookings -e "DESCRIBE hotel_stays;"

# Search for column usage in code
cd kayak-microservices
grep -r "check_in_date" services/
grep -r "check_in" services/
```

2. **Test queries locally:**
```bash
# Test SQL query
docker exec kayak-mysql mysql -uroot -pSomalwar1! kayak_bookings -e "
SELECT * FROM hotel_stays WHERE check_in < '2025-12-15' LIMIT 1;
"
```

3. **Version control:**
```bash
# Always create a branch for fixes
git checkout -b fix/schema-issue
# Make changes
git add .
git commit -m "Fix: Update hotel_stays schema column names"
git push origin fix/schema-issue
```

---

## Notes for Future Reference

### Common Column Name Issues:
- `check_in_date` vs `check_in`
- `check_out_date` vs `check_out`
- `created_at` vs `createdAt`
- `updated_at` vs `updatedAt`

### Standard Naming Convention:
- **Database:** Use snake_case (`check_in`, `user_id`)
- **JavaScript:** Use camelCase (`checkIn`, `userId`)
- **Conversion:** Handle in model layer

### Password Hash Format:
- Algorithm: bcrypt
- Rounds: 10
- Test password: `password123`
- Test hash: `$2b$10$rN8L3xqJ5nY7YZQx.5mZ3eU8hE5xGKqXZ4qF2XwJ9YpL5xK8Z9mZy`

### Database Credentials:
- MySQL Root: `root` / `Somalwar1!`
- MySQL Port: `3307` (external), `3306` (internal)
- MongoDB Port: `27017`
- Redis Port: `6379`

### Service Ports:
- API Gateway: 3000
- Auth: 3001
- User: 3002
- Listing: 3003
- Search: 3004
- Booking: 3005
- Analytics: 3006
- Admin: 3007
- Owner: 3008

### Frontend Ports:
- Web Client: 5175
- Owner Portal: 5180
- Admin Portal: 5174
