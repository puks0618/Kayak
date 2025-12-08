-- ========================================
-- PHASE 2: GENERATE BOOKINGS WITH BILLING
-- ========================================
-- Purpose: Create realistic booking data for hotels and flights
-- Timeline: Historical (2024-2025), Current (Dec 2025), Future (2026)
-- Bookings: 425 total (245 hotels + 180 flights)
-- Mode: Set DRY_RUN = 1 to test without committing
-- ========================================

SET @DRY_RUN = 1; -- Set to 0 for actual execution

-- Start transaction
START TRANSACTION;

-- ========================================
-- PREPARATION: Create helper function for random selection
-- ========================================

-- Seed for randomization (change for different distributions)
SET @seed = UNIX_TIMESTAMP();

-- ========================================
-- STEP 1: Verify Prerequisites
-- ========================================
SELECT '========================================' AS '';
SELECT 'STEP 1: Verifying Prerequisites' AS '';
SELECT '========================================' AS '';

-- Check travellers
SELECT 
    'Travellers' as user_type,
    COUNT(*) as count
FROM kayak_users.users
WHERE role = 'traveller' AND email LIKE 'traveller%@test.com';

-- Check owners
SELECT 
    'Owners' as user_type,
    COUNT(*) as count
FROM kayak_users.users
WHERE role = 'owner' AND email LIKE 'owner%@test.com';

-- Check hotels with owners
SELECT 
    'Hotels with Owners' as listing_type,
    COUNT(*) as count
FROM kayak_listings.hotels
WHERE owner_id IS NOT NULL AND approval_status = 'approved';

-- Check flights
SELECT 
    'Available Flights' as listing_type,
    COUNT(*) as count
FROM kayak_listings.flights;

-- Check existing bookings
SELECT 
    listing_type,
    COUNT(*) as existing_bookings
FROM kayak_bookings.bookings
GROUP BY listing_type
ORDER BY listing_type;

-- ========================================
-- STEP 2: Prepare Temporary Tables
-- ========================================
SELECT '========================================' AS '';
SELECT 'STEP 2: Preparing Temporary Tables' AS '';
SELECT '========================================' AS '';

-- Create temp table for travellers (for faster lookups)
USE kayak_bookings;
DROP TEMPORARY TABLE IF EXISTS temp_travellers;
CREATE TEMPORARY TABLE temp_travellers (
    id VARCHAR(36),
    email VARCHAR(255),
    idx INT AUTO_INCREMENT PRIMARY KEY
);

INSERT INTO temp_travellers (id, email)
SELECT id, email
FROM kayak_users.users
WHERE role = 'traveller' AND email LIKE 'traveller%@test.com'
ORDER BY email;

SELECT CONCAT('✅ Loaded ', COUNT(*), ' travellers') AS result
FROM temp_travellers;

-- Create temp table for hotels (diverse cities, with owners)
USE kayak_bookings;
DROP TEMPORARY TABLE IF EXISTS temp_hotels;
CREATE TEMPORARY TABLE temp_hotels (
    id VARCHAR(36),
    name VARCHAR(255),
    city VARCHAR(100),
    state CHAR(2),
    price_per_night DECIMAL(10,2),
    owner_id VARCHAR(36),
    idx INT AUTO_INCREMENT PRIMARY KEY
);

INSERT INTO temp_hotels (id, name, city, state, price_per_night, owner_id)
SELECT id, name, city, state, price_per_night, owner_id
FROM kayak_listings.hotels
WHERE owner_id IS NOT NULL 
  AND approval_status = 'approved'
ORDER BY RAND()
LIMIT 50; -- Select 50 hotels for bookings

SELECT CONCAT('✅ Loaded ', COUNT(*), ' hotels for bookings') AS result
FROM temp_hotels;

-- Show hotel distribution
SELECT '--- Hotel Distribution by City ---' AS '';
SELECT city, state, COUNT(*) as hotel_count
FROM temp_hotels
GROUP BY city, state
ORDER BY hotel_count DESC
LIMIT 10;

-- Create temp table for flights (diverse routes/airlines)
USE kayak_bookings;
DROP TEMPORARY TABLE IF EXISTS temp_flights;
CREATE TEMPORARY TABLE temp_flights (
    id VARCHAR(36),
    flight_code VARCHAR(20),
    airline VARCHAR(255),
    departure_airport VARCHAR(10),
    arrival_airport VARCHAR(10),
    price DECIMAL(10,2),
    idx INT AUTO_INCREMENT PRIMARY KEY
);

INSERT INTO temp_flights (id, flight_code, airline, departure_airport, arrival_airport, price)
SELECT id, flight_code, airline, departure_airport, arrival_airport, price
FROM kayak_listings.flights
ORDER BY RAND()
LIMIT 30; -- Select 30 unique flights for bookings

SELECT CONCAT('✅ Loaded ', COUNT(*), ' flights for bookings') AS result
FROM temp_flights;

-- Show flight distribution
SELECT '--- Flight Distribution by Airline ---' AS '';
SELECT airline, COUNT(*) as flight_count
FROM temp_flights
GROUP BY airline
ORDER BY flight_count DESC;

-- ========================================
-- STEP 3: Generate Historical Hotel Bookings (2024-2025)
-- ========================================
SELECT '========================================' AS '';
SELECT 'STEP 3: Generating Historical Hotel Bookings' AS '';
SELECT '========================================' AS '';

-- We'll generate 200 historical hotel bookings spread across 2024-2025
USE kayak_bookings;
DROP TEMPORARY TABLE IF EXISTS temp_hotel_bookings;
CREATE TEMPORARY TABLE temp_hotel_bookings (
    booking_id VARCHAR(36),
    user_id VARCHAR(36),
    listing_id VARCHAR(36),
    listing_type VARCHAR(10),
    status VARCHAR(20),
    booking_date TIMESTAMP,
    travel_date DATE,
    return_date DATE,
    rental_days INT,
    total_amount DECIMAL(10,2)
);

-- Generate bookings using cross join and limit
INSERT INTO temp_hotel_bookings
SELECT 
    UUID() as booking_id,
    t.id as user_id,
    h.id as listing_id,
    'hotel' as listing_type,
    'completed' as status,
    DATE_ADD('2024-01-01', INTERVAL FLOOR(RAND() * 700) DAY) as booking_date,
    DATE_ADD('2024-01-01', INTERVAL FLOOR(RAND() * 700) + 14 DAY) as travel_date,
    DATE_ADD('2024-01-01', INTERVAL FLOOR(RAND() * 700) + 14 + FLOOR(RAND() * 5) + 3 DAY) as return_date,
    FLOOR(RAND() * 5) + 3 as rental_days,
    h.price_per_night * (FLOOR(RAND() * 5) + 3) as total_amount
FROM temp_travellers t
CROSS JOIN temp_hotels h
ORDER BY RAND()
LIMIT 200;

-- Update rental_days and total_amount based on actual dates
UPDATE temp_hotel_bookings thb
INNER JOIN temp_hotels h ON thb.listing_id = h.id
SET 
    thb.rental_days = DATEDIFF(thb.return_date, thb.travel_date),
    thb.total_amount = h.price_per_night * DATEDIFF(thb.return_date, thb.travel_date);

SELECT CONCAT('✅ Generated ', COUNT(*), ' historical hotel bookings') AS result
FROM temp_hotel_bookings;

-- Show sample
SELECT '--- Sample Historical Hotel Bookings (First 10) ---' AS '';
SELECT 
    booking_date,
    travel_date,
    return_date,
    rental_days,
    total_amount,
    status
FROM temp_hotel_bookings
LIMIT 10;

-- ========================================
-- STEP 4: Generate Current Hotel Bookings (December 2025)
-- ========================================
SELECT '========================================' AS '';
SELECT 'STEP 4: Generating Current Hotel Bookings' AS '';
SELECT '========================================' AS '';

-- Generate 15 current active bookings
INSERT INTO temp_hotel_bookings
SELECT 
    UUID() as booking_id,
    t.id as user_id,
    h.id as listing_id,
    'hotel' as listing_type,
    'confirmed' as status,
    DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 30) + 5 DAY) as booking_date,
    DATE_ADD(CURDATE(), INTERVAL FLOOR(RAND() * 7) - 2 DAY) as travel_date,
    DATE_ADD(CURDATE(), INTERVAL FLOOR(RAND() * 7) + 3 DAY) as return_date,
    5 as rental_days,
    h.price_per_night * 5 as total_amount
FROM temp_travellers t
CROSS JOIN temp_hotels h
ORDER BY RAND()
LIMIT 15;

-- Update rental_days and total_amount
UPDATE temp_hotel_bookings thb
INNER JOIN temp_hotels h ON thb.listing_id = h.id
SET 
    thb.rental_days = DATEDIFF(thb.return_date, thb.travel_date),
    thb.total_amount = h.price_per_night * DATEDIFF(thb.return_date, thb.travel_date)
WHERE thb.status = 'confirmed' 
  AND thb.booking_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);

SELECT CONCAT('✅ Generated ', COUNT(*), ' current hotel bookings') AS result
FROM temp_hotel_bookings
WHERE status = 'confirmed';

-- ========================================
-- STEP 5: Generate Future Hotel Bookings (2026)
-- ========================================
SELECT '========================================' AS '';
SELECT 'STEP 5: Generating Future Hotel Bookings' AS '';
SELECT '========================================' AS '';

-- Generate 30 future bookings
INSERT INTO temp_hotel_bookings
SELECT 
    UUID() as booking_id,
    t.id as user_id,
    h.id as listing_id,
    'hotel' as listing_type,
    IF(RAND() > 0.3, 'confirmed', 'pending') as status,
    CURDATE() as booking_date,
    DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 180) DAY) as travel_date,
    DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 180) + 5 DAY) as return_date,
    5 as rental_days,
    h.price_per_night * 5 as total_amount
FROM temp_travellers t
CROSS JOIN temp_hotels h
ORDER BY RAND()
LIMIT 30;

-- Update rental_days and total_amount for future bookings
UPDATE temp_hotel_bookings thb
INNER JOIN temp_hotels h ON thb.listing_id = h.id
SET 
    thb.rental_days = DATEDIFF(thb.return_date, thb.travel_date),
    thb.total_amount = h.price_per_night * DATEDIFF(thb.return_date, thb.travel_date)
WHERE thb.travel_date >= '2026-01-01';

SELECT CONCAT('✅ Generated ', COUNT(*), ' future hotel bookings') AS result
FROM temp_hotel_bookings
WHERE travel_date >= '2026-01-01';

-- ========================================
-- STEP 6: Generate Historical Flight Bookings (2024-2025)
-- ========================================
SELECT '========================================' AS '';
SELECT 'STEP 6: Generating Historical Flight Bookings' AS '';
SELECT '========================================' AS '';

USE kayak_bookings;
DROP TEMPORARY TABLE IF EXISTS temp_flight_bookings;
CREATE TEMPORARY TABLE temp_flight_bookings (
    booking_id VARCHAR(36),
    user_id VARCHAR(36),
    listing_id VARCHAR(36),
    listing_type VARCHAR(10),
    status VARCHAR(20),
    booking_date TIMESTAMP,
    travel_date DATE,
    total_amount DECIMAL(10,2)
);

-- Generate 150 historical flight bookings
INSERT INTO temp_flight_bookings
SELECT 
    UUID() as booking_id,
    t.id as user_id,
    f.id as listing_id,
    'flight' as listing_type,
    'completed' as status,
    DATE_ADD('2024-01-01', INTERVAL FLOOR(RAND() * 700) DAY) as booking_date,
    DATE_ADD('2024-01-01', INTERVAL FLOOR(RAND() * 700) + 14 DAY) as travel_date,
    f.price as total_amount
FROM temp_travellers t
CROSS JOIN temp_flights f
ORDER BY RAND()
LIMIT 150;

SELECT CONCAT('✅ Generated ', COUNT(*), ' historical flight bookings') AS result
FROM temp_flight_bookings;

-- ========================================
-- STEP 7: Generate Current Flight Bookings (December 2025)
-- ========================================
SELECT '========================================' AS '';
SELECT 'STEP 7: Generating Current Flight Bookings' AS '';
SELECT '========================================' AS '';

-- Generate 10 current flight bookings
INSERT INTO temp_flight_bookings
SELECT 
    UUID() as booking_id,
    t.id as user_id,
    f.id as listing_id,
    'flight' as listing_type,
    'confirmed' as status,
    DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 20) + 5 DAY) as booking_date,
    DATE_ADD(CURDATE(), INTERVAL FLOOR(RAND() * 10) DAY) as travel_date,
    f.price as total_amount
FROM temp_travellers t
CROSS JOIN temp_flights f
ORDER BY RAND()
LIMIT 10;

SELECT CONCAT('✅ Generated ', COUNT(*), ' current flight bookings') AS result
FROM temp_flight_bookings
WHERE status = 'confirmed';

-- ========================================
-- STEP 8: Generate Future Flight Bookings (2026)
-- ========================================
SELECT '========================================' AS '';
SELECT 'STEP 8: Generating Future Flight Bookings' AS '';
SELECT '========================================' AS '';

-- Generate 20 future flight bookings
INSERT INTO temp_flight_bookings
SELECT 
    UUID() as booking_id,
    t.id as user_id,
    f.id as listing_id,
    'flight' as listing_type,
    IF(RAND() > 0.3, 'confirmed', 'pending') as status,
    CURDATE() as booking_date,
    DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 180) DAY) as travel_date,
    f.price as total_amount
FROM temp_travellers t
CROSS JOIN temp_flights f
ORDER BY RAND()
LIMIT 20;

SELECT CONCAT('✅ Generated ', COUNT(*), ' future flight bookings') AS result
FROM temp_flight_bookings
WHERE travel_date >= '2026-01-01';

-- ========================================
-- STEP 9: Show Summary Statistics
-- ========================================
SELECT '========================================' AS '';
SELECT 'STEP 9: Summary Statistics' AS '';
SELECT '========================================' AS '';

-- Hotel bookings summary
SELECT '--- Hotel Bookings Summary ---' AS '';
SELECT 
    status,
    COUNT(*) as count,
    MIN(booking_date) as earliest_booking,
    MAX(booking_date) as latest_booking,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_booking_value
FROM temp_hotel_bookings
GROUP BY status;

-- Flight bookings summary
SELECT '--- Flight Bookings Summary ---' AS '';
SELECT 
    status,
    COUNT(*) as count,
    MIN(booking_date) as earliest_booking,
    MAX(booking_date) as latest_booking,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_booking_value
FROM temp_flight_bookings
GROUP BY status;

-- Total summary
SELECT '--- Total Bookings to be Inserted ---' AS '';
SELECT 
    'Hotels' as type,
    COUNT(*) as bookings,
    SUM(total_amount) as revenue
FROM temp_hotel_bookings
UNION ALL
SELECT 
    'Flights' as type,
    COUNT(*) as bookings,
    SUM(total_amount) as revenue
FROM temp_flight_bookings
UNION ALL
SELECT 
    'TOTAL' as type,
    (SELECT COUNT(*) FROM temp_hotel_bookings) + (SELECT COUNT(*) FROM temp_flight_bookings) as bookings,
    (SELECT SUM(total_amount) FROM temp_hotel_bookings) + (SELECT SUM(total_amount) FROM temp_flight_bookings) as revenue;

-- ========================================
-- STEP 10: Insert Bookings into Database
-- ========================================
SELECT '========================================' AS '';
SELECT 'STEP 10: Inserting Bookings' AS '';
SELECT '========================================' AS '';

-- Insert hotel bookings
INSERT INTO kayak_bookings.bookings 
(id, user_id, listing_id, listing_type, status, booking_date, travel_date, return_date, rental_days, total_amount)
SELECT 
    booking_id,
    user_id,
    listing_id,
    listing_type,
    status,
    booking_date,
    travel_date,
    return_date,
    rental_days,
    total_amount
FROM temp_hotel_bookings;

SELECT CONCAT('✅ Inserted ', ROW_COUNT(), ' hotel bookings') AS result;

-- Insert flight bookings
INSERT INTO kayak_bookings.bookings 
(id, user_id, listing_id, listing_type, status, booking_date, travel_date, total_amount)
SELECT 
    booking_id,
    user_id,
    listing_id,
    listing_type,
    status,
    booking_date,
    travel_date,
    total_amount
FROM temp_flight_bookings;

SELECT CONCAT('✅ Inserted ', ROW_COUNT(), ' flight bookings') AS result;

-- ========================================
-- STEP 11: Insert Billing Records
-- ========================================
SELECT '========================================' AS '';
SELECT 'STEP 11: Creating Billing Records' AS '';
SELECT '========================================' AS '';

-- Insert billing for hotel bookings
INSERT INTO kayak_bookings.billing
(id, booking_id, user_id, amount, tax, total, payment_method, status, invoice_details)
SELECT 
    UUID() as id,
    b.id as booking_id,
    b.user_id,
    b.total_amount as amount,
    ROUND(b.total_amount * 0.10, 2) as tax,
    ROUND(b.total_amount * 1.10, 2) as total,
    ELT(FLOOR(1 + RAND() * 3), 'credit_card', 'debit_card', 'paypal') as payment_method,
    CASE 
        WHEN b.status IN ('completed', 'confirmed') THEN 'paid'
        WHEN b.status = 'pending' THEN 'pending'
        ELSE 'pending'
    END as status,
    JSON_OBJECT(
        'listing_id', b.listing_id,
        'listing_type', b.listing_type,
        'travel_date', b.travel_date,
        'return_date', b.return_date,
        'rental_days', b.rental_days
    ) as invoice_details
FROM kayak_bookings.bookings b
WHERE b.id IN (SELECT booking_id FROM temp_hotel_bookings);

SELECT CONCAT('✅ Created ', ROW_COUNT(), ' billing records for hotel bookings') AS result;

-- Insert billing for flight bookings
INSERT INTO kayak_bookings.billing
(id, booking_id, user_id, amount, tax, total, payment_method, status, invoice_details)
SELECT 
    UUID() as id,
    b.id as booking_id,
    b.user_id,
    b.total_amount as amount,
    ROUND(b.total_amount * 0.10, 2) as tax,
    ROUND(b.total_amount * 1.10, 2) as total,
    ELT(FLOOR(1 + RAND() * 3), 'credit_card', 'debit_card', 'paypal') as payment_method,
    CASE 
        WHEN b.status IN ('completed', 'confirmed') THEN 'paid'
        WHEN b.status = 'pending' THEN 'pending'
        ELSE 'pending'
    END as status,
    JSON_OBJECT(
        'listing_id', b.listing_id,
        'listing_type', b.listing_type,
        'travel_date', b.travel_date
    ) as invoice_details
FROM kayak_bookings.bookings b
WHERE b.id IN (SELECT booking_id FROM temp_flight_bookings);

SELECT CONCAT('✅ Created ', ROW_COUNT(), ' billing records for flight bookings') AS result;

-- ========================================
-- STEP 12: Final Verification
-- ========================================
SELECT '========================================' AS '';
SELECT 'STEP 12: Final Verification' AS '';
SELECT '========================================' AS '';

-- Verify bookings were inserted
SELECT 
    listing_type,
    status,
    COUNT(*) as booking_count,
    SUM(total_amount) as total_revenue
FROM kayak_bookings.bookings
GROUP BY listing_type, status
ORDER BY listing_type, status;

-- Verify billing records
SELECT 
    status,
    COUNT(*) as billing_count,
    SUM(total) as total_billed
FROM kayak_bookings.billing
GROUP BY status;

-- Check for orphaned bookings (should be 0)
SELECT '--- Orphaned Bookings Check (Should be 0) ---' AS '';
SELECT 
    COUNT(*) as orphaned_bookings
FROM kayak_bookings.bookings b
LEFT JOIN kayak_bookings.billing bil ON b.id = bil.booking_id
WHERE bil.id IS NULL
  AND b.id IN (
      SELECT booking_id FROM temp_hotel_bookings
      UNION ALL
      SELECT booking_id FROM temp_flight_bookings
  );

-- Top hotels by bookings
SELECT '--- Top 10 Hotels by Booking Count ---' AS '';
SELECT 
    h.name as hotel_name,
    CONCAT(h.city, ', ', h.state) as location,
    COUNT(b.id) as booking_count,
    SUM(b.total_amount) as total_revenue
FROM kayak_bookings.bookings b
INNER JOIN kayak_listings.hotels h ON b.listing_id = h.id
WHERE b.listing_type = 'hotel'
GROUP BY b.listing_id, h.name, h.city, h.state
ORDER BY booking_count DESC
LIMIT 10;

-- Top airlines by bookings
SELECT '--- Top 10 Airlines by Booking Count ---' AS '';
SELECT 
    f.airline,
    COUNT(b.id) as booking_count,
    SUM(b.total_amount) as total_revenue
FROM kayak_bookings.bookings b
INNER JOIN kayak_listings.flights f ON b.listing_id = f.id
WHERE b.listing_type = 'flight'
GROUP BY f.airline
ORDER BY booking_count DESC
LIMIT 10;

-- ========================================
-- FINAL: Transaction Decision
-- ========================================
SELECT '========================================' AS '';
SELECT 'FINAL: Transaction Decision' AS '';
SELECT '========================================' AS '';

SELECT 
    CASE 
        WHEN @DRY_RUN = 1 THEN '🔍 DRY RUN MODE: Will ROLLBACK (no changes made)'
        ELSE '✅ LIVE MODE: Will COMMIT (changes will be saved)'
    END AS status;

-- Manual commit/rollback instructions
SELECT '⚠️ IMPORTANT: Review the results above, then manually execute:' AS '';
SELECT '   COMMIT;   -- to save all bookings and billing records' AS '';
SELECT '   ROLLBACK; -- to undo everything' AS '';

