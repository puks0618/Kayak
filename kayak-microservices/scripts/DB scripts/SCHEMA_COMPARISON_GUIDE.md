# Schema Comparison & Update Guide

## Quick Start for Your Friend

If your friend has schema differences, they can use this guide to quickly identify and fix them.

## Step 1: Check What Databases Exist

```bash
mysql -h localhost -P 3306 -u root -p -e "SHOW DATABASES LIKE 'kayak%';"
```

**Expected Output:**
```
kayak_auth
kayak_users
kayak_listings
kayak_bookings
```

## Step 2: Create Missing Databases

```sql
CREATE DATABASE IF NOT EXISTS kayak_auth;
CREATE DATABASE IF NOT EXISTS kayak_users;
CREATE DATABASE IF NOT EXISTS kayak_listings;
CREATE DATABASE IF NOT EXISTS kayak_bookings;
```

## Step 3: Check Tables in Each Database

### kayak_users
```bash
mysql -h localhost -P 3306 -u root -p kayak_users -e "SHOW TABLES;"
```

**Expected Tables:**
- users
- admins

### kayak_listings
```bash
mysql -h localhost -P 3306 -u root -p kayak_listings -e "SHOW TABLES;"
```

**Expected Tables:**
- flights
- hotels
- cars
- amenities
- hotel_amenities
- room_types

### kayak_bookings
```bash
mysql -h localhost -P 3306 -u root -p kayak_bookings -e "SHOW TABLES;"
```

**Expected Tables:**
- bookings
- payments
- billing

## Step 4: Import Complete Schema

If tables are missing or have different structures:

```bash
mysql -h localhost -P 3306 -u root -p < kayak_schema_export.sql
```

## Step 5: Verify Schema Match

Run this query to get your table structures:

```sql
SELECT 
    TABLE_SCHEMA as 'Database',
    TABLE_NAME as 'Table',
    COUNT(COLUMN_NAME) as 'Column_Count'
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA IN ('kayak_auth', 'kayak_users', 'kayak_listings', 'kayak_bookings')
GROUP BY TABLE_SCHEMA, TABLE_NAME
ORDER BY TABLE_SCHEMA, TABLE_NAME;
```

**Expected Result:**

| Database | Table | Column_Count |
|----------|-------|--------------|
| kayak_bookings | billing | 12 |
| kayak_bookings | bookings | 11 |
| kayak_bookings | payments | 9 |
| kayak_listings | amenities | 5 |
| kayak_listings | cars | 14 |
| kayak_listings | flights | 14 |
| kayak_listings | hotel_amenities | 3 |
| kayak_listings | hotels | 52 |
| kayak_listings | room_types | 10 |
| kayak_users | admins | 13 |
| kayak_users | users | 16 |

## Common Issues & Fixes

### Issue 1: Missing `billing` table

**Symptom:** Error when creating bookings
**Fix:**
```sql
USE kayak_bookings;
SOURCE infrastructure/databases/mysql/init/05-billing.sql;
```

### Issue 2: Different column types

**Symptom:** Data type mismatch errors
**Fix:** Use the `kayak_schema_export.sql` file to recreate tables:

```sql
DROP TABLE IF EXISTS kayak_bookings.billing;
SOURCE kayak_schema_export.sql;
```

### Issue 3: Missing foreign keys

**Symptom:** Referential integrity errors
**Check:**
```sql
SELECT 
    TABLE_SCHEMA,
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA IN ('kayak_listings', 'kayak_bookings')
    AND REFERENCED_TABLE_NAME IS NOT NULL;
```

**Expected Foreign Keys:**
- hotel_amenities → hotels (hotel_id)
- hotel_amenities → amenities (amenity_id)
- room_types → hotels (hotel_id)
- payments → bookings (booking_id)
- billing → bookings (booking_id)

### Issue 4: Missing indexes

**Check:**
```sql
SELECT 
    TABLE_SCHEMA,
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'kayak_bookings'
    AND TABLE_NAME = 'bookings';
```

**Important Indexes:**
- idx_user_id
- idx_listing_id
- idx_status
- idx_booking_date

## Using Copilot to Fix Schema

1. Open `DATABASE_SCHEMA_EXPORT.md` in VS Code
2. Ask Copilot:

```
"Compare my current database schema with the schema in DATABASE_SCHEMA_EXPORT.md 
and generate ALTER TABLE statements to update my database to match"
```

3. Copilot will analyze and generate migration scripts

## Alternative: Docker Setup

If you want to start fresh with the exact schema:

```bash
# Stop existing MySQL
docker stop kayak-mysql

# Remove old data
docker volume rm docker_mysql_data

# Start fresh
cd kayak-microservices/infrastructure/docker
docker-compose up -d mysql

# Tables will be auto-created from init scripts
```

## Testing Your Schema

After updating, test with:

```sql
-- Test user creation
INSERT INTO kayak_users.users (id, ssn, first_name, last_name, email, password_hash)
VALUES (UUID(), '123-45-6789', 'Test', 'User', 'test@example.com', 'hash123');

-- Test booking creation
INSERT INTO kayak_bookings.bookings (id, user_id, listing_id, listing_type, travel_date, total_amount)
VALUES (UUID(), (SELECT id FROM kayak_users.users LIMIT 1), UUID(), 'flight', CURDATE(), 299.99);

-- Test billing creation
INSERT INTO kayak_bookings.billing (id, booking_id, user_id, amount, total)
VALUES (UUID(), (SELECT id FROM kayak_bookings.bookings LIMIT 1), 
        (SELECT id FROM kayak_users.users LIMIT 1), 299.99, 329.99);
```

## Files to Share

1. **DATABASE_SCHEMA_EXPORT.md** - Complete documentation
2. **kayak_schema_export.sql** - Raw SQL schema
3. **SCHEMA_COMPARISON_GUIDE.md** - This file
4. **infrastructure/databases/mysql/init/*.sql** - Init scripts

---

**Need Help?** Ask Copilot: "Help me fix my Kayak database schema using DATABASE_SCHEMA_EXPORT.md"
