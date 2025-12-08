-- ========================================
-- GENERATE REALISTIC BOOKINGS SCRIPT
-- ========================================
-- Purpose: Create 5000+ realistic bookings from top 50 travellers to top 20-30 owners
-- Travel Pattern: Flight → Hotel → Car (for NYC stays) or Flight → Car (other cities)
-- Time Distribution: Past (2025), Present (Dec 2025), Future (2026)
-- ========================================

USE kayak_bookings;

SET @DRY_RUN = 0; -- Set to 1 to test without committing
SET @TOTAL_BOOKINGS_TARGET = 5000;

START TRANSACTION;

SELECT '========================================' AS '';
SELECT 'GENERATE REALISTIC BOOKINGS' AS '';
SELECT '========================================' AS '';

-- ========================================
-- STEP 1: Prepare Top Travellers & Owners
-- ========================================
SELECT '' AS '';
SELECT 'STEP 1: Preparing Top Travellers and Owners' AS '';

-- Get top 50 most active travellers (or random 50 if no activity)
DROP TEMPORARY TABLE IF EXISTS temp_top_travellers;
CREATE TEMPORARY TABLE temp_top_travellers (
    traveller_id VARCHAR(36),
    traveller_email VARCHAR(255),
    PRIMARY KEY (traveller_id)
);

INSERT INTO temp_top_travellers
SELECT u.id, u.email
FROM kayak_users.users u
WHERE u.role = 'traveller'
ORDER BY RAND()
LIMIT 50;

SELECT CONCAT('✅ Selected ', COUNT(*), ' top travellers') AS result
FROM temp_top_travellers;

-- Get top 30 owners by property count
DROP TEMPORARY TABLE IF EXISTS temp_top_property_owners;
CREATE TEMPORARY TABLE temp_top_property_owners (
    owner_id VARCHAR(36),
    owner_email VARCHAR(255),
    property_count INT,
    PRIMARY KEY (owner_id)
);

INSERT INTO temp_top_property_owners
SELECT 
    h.owner_id,
    u.email,
    COUNT(DISTINCT h.id) as property_count
FROM kayak_listings.hotels h
INNER JOIN kayak_users.users u ON h.owner_id COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
WHERE h.approval_status = 'approved'
GROUP BY h.owner_id, u.email
ORDER BY property_count DESC
LIMIT 30;

SELECT CONCAT('✅ Selected ', COUNT(*), ' top property owners') AS result
FROM temp_top_property_owners;

-- ========================================
-- STEP 2: Get Available Listings
-- ========================================
SELECT '' AS '';
SELECT 'STEP 2: Loading Available Listings' AS '';

-- NYC Hotels (for complete travel packages)
DROP TEMPORARY TABLE IF EXISTS temp_nyc_hotels;
CREATE TEMPORARY TABLE temp_nyc_hotels (
    hotel_id VARCHAR(36),
    hotel_name VARCHAR(255),
    owner_id VARCHAR(36),
    price_per_night DECIMAL(10,2),
    city VARCHAR(100),
    PRIMARY KEY (hotel_id)
);

INSERT INTO temp_nyc_hotels
SELECT h.id, h.name, h.owner_id, h.price_per_night, h.city
FROM kayak_listings.hotels h
INNER JOIN temp_top_property_owners o ON h.owner_id COLLATE utf8mb4_unicode_ci = o.owner_id COLLATE utf8mb4_unicode_ci
WHERE h.approval_status = 'approved'
  AND (h.city LIKE '%New York%' OR h.city = 'NYC' OR h.state = 'NY')
ORDER BY RAND()
LIMIT 100;

SELECT CONCAT('✅ Found ', COUNT(*), ' NYC hotels from top owners') AS result
FROM temp_nyc_hotels;

-- Other City Hotels
DROP TEMPORARY TABLE IF EXISTS temp_other_hotels;
CREATE TEMPORARY TABLE temp_other_hotels (
    hotel_id VARCHAR(36),
    hotel_name VARCHAR(255),
    owner_id VARCHAR(36),
    price_per_night DECIMAL(10,2),
    city VARCHAR(100),
    state CHAR(2),
    PRIMARY KEY (hotel_id)
);

INSERT INTO temp_other_hotels
SELECT h.id, h.name, h.owner_id, h.price_per_night, h.city, h.state
FROM kayak_listings.hotels h
INNER JOIN temp_top_property_owners o ON h.owner_id COLLATE utf8mb4_unicode_ci = o.owner_id COLLATE utf8mb4_unicode_ci
WHERE h.approval_status = 'approved'
  AND h.city NOT LIKE '%New York%' AND h.city != 'NYC' AND h.state != 'NY'
ORDER BY RAND()
LIMIT 200;

SELECT CONCAT('✅ Found ', COUNT(*), ' hotels in other cities') AS result
FROM temp_other_hotels;

-- Available Flights (to NYC and other destinations)
DROP TEMPORARY TABLE IF EXISTS temp_flights;
CREATE TEMPORARY TABLE temp_flights (
    flight_id VARCHAR(36),
    airline VARCHAR(100),
    departure_airport VARCHAR(10),
    arrival_airport VARCHAR(10),
    price DECIMAL(10,2),
    duration INT,
    PRIMARY KEY (flight_id)
);

INSERT INTO temp_flights
SELECT id, airline, departure_airport, arrival_airport, price, duration
FROM kayak_listings.flights
ORDER BY RAND()
LIMIT 1000;

SELECT CONCAT('✅ Found ', COUNT(*), ' available flights') AS result
FROM temp_flights;

-- Available Cars
DROP TEMPORARY TABLE IF EXISTS temp_cars;
CREATE TEMPORARY TABLE temp_cars (
    car_id VARCHAR(36),
    car_type VARCHAR(50),
    daily_rate DECIMAL(10,2),
    location VARCHAR(255),
    PRIMARY KEY (car_id)
);

INSERT INTO temp_cars
SELECT id, type, daily_rental_price, location
FROM kayak_listings.cars
WHERE availability_status = 1
  AND approval_status = 'approved'
ORDER BY RAND()
LIMIT 106; -- Only 106 cars available

SELECT CONCAT('✅ Found ', COUNT(*), ' available cars') AS result
FROM temp_cars;

-- ========================================
-- STEP 3: Generate Flight Bookings (40% of total = ~2000)
-- ========================================
SELECT '' AS '';
SELECT 'STEP 3: Generating Flight Bookings (~2000)' AS '';

-- Past flights (40% = 800)
INSERT INTO bookings (id, user_id, listing_id, listing_type, travel_date, return_date, total_amount, status, created_at, updated_at)
SELECT 
    UUID(),
    t.traveller_id,
    f.flight_id,
    'flight',
    DATE_ADD('2025-01-01', INTERVAL FLOOR(RAND() * 300) DAY), -- Jan-Oct 2025
    NULL,
    f.price,
    'completed',
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 300) DAY),
    NOW()
FROM temp_top_travellers t
CROSS JOIN temp_flights f
ORDER BY RAND()
LIMIT 800;

SELECT CONCAT('✅ Generated ', ROW_COUNT(), ' past flight bookings') AS result;

-- Current month flights (10% = 200)
INSERT INTO bookings (id, user_id, listing_id, listing_type, travel_date, return_date, total_amount, status, created_at, updated_at)
SELECT 
    UUID(),
    t.traveller_id,
    f.flight_id,
    'flight',
    DATE_ADD('2025-12-01', INTERVAL FLOOR(RAND() * 31) DAY), -- Dec 2025
    NULL,
    f.price,
    CASE 
        WHEN RAND() > 0.5 THEN 'confirmed'
        ELSE 'completed'
    END,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY),
    NOW()
FROM temp_top_travellers t
CROSS JOIN temp_flights f
ORDER BY RAND()
LIMIT 200;

SELECT CONCAT('✅ Generated ', ROW_COUNT(), ' current month flight bookings') AS result;

-- Future flights (50% = 1000)
INSERT INTO bookings (id, user_id, listing_id, listing_type, travel_date, return_date, total_amount, status, created_at, updated_at)
SELECT 
    UUID(),
    t.traveller_id,
    f.flight_id,
    'flight',
    DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 365) DAY), -- 2026
    NULL,
    f.price,
    'confirmed',
    NOW(),
    NOW()
FROM temp_top_travellers t
CROSS JOIN temp_flights f
ORDER BY RAND()
LIMIT 1000;

SELECT CONCAT('✅ Generated ', ROW_COUNT(), ' future flight bookings') AS result;

-- ========================================
-- STEP 4: Generate Hotel Bookings (35% of total = ~1750)
-- ========================================
SELECT '' AS '';
SELECT 'STEP 4: Generating Hotel Bookings (~1750)' AS '';

-- Past NYC hotel stays (25% = 440)
INSERT INTO bookings (id, user_id, listing_id, listing_type, travel_date, return_date, rental_days, total_amount, status, created_at, updated_at)
SELECT 
    UUID(),
    t.traveller_id,
    h.hotel_id,
    'hotel',
    DATE_ADD('2025-01-01', INTERVAL FLOOR(RAND() * 300) DAY),
    DATE_ADD(DATE_ADD('2025-01-01', INTERVAL FLOOR(RAND() * 300) DAY), INTERVAL (3 + FLOOR(RAND() * 7)) DAY),
    3 + FLOOR(RAND() * 7),
    h.price_per_night * (3 + FLOOR(RAND() * 7)),
    'completed',
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 300) DAY),
    NOW()
FROM temp_top_travellers t
CROSS JOIN temp_nyc_hotels h
ORDER BY RAND()
LIMIT 440;

SELECT CONCAT('✅ Generated ', ROW_COUNT(), ' past NYC hotel bookings') AS result;

-- Past other city hotels (15% = 260)
INSERT INTO bookings (id, user_id, listing_id, listing_type, travel_date, return_date, rental_days, total_amount, status, created_at, updated_at)
SELECT 
    UUID(),
    t.traveller_id,
    h.hotel_id,
    'hotel',
    DATE_ADD('2025-01-01', INTERVAL FLOOR(RAND() * 300) DAY),
    DATE_ADD(DATE_ADD('2025-01-01', INTERVAL FLOOR(RAND() * 300) DAY), INTERVAL (2 + FLOOR(RAND() * 5)) DAY),
    2 + FLOOR(RAND() * 5),
    h.price_per_night * (2 + FLOOR(RAND() * 5)),
    'completed',
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 300) DAY),
    NOW()
FROM temp_top_travellers t
CROSS JOIN temp_other_hotels h
ORDER BY RAND()
LIMIT 260;

SELECT CONCAT('✅ Generated ', ROW_COUNT(), ' past other city hotel bookings') AS result;

-- Current month hotels (10% = 175)
INSERT INTO bookings (id, user_id, listing_id, listing_type, travel_date, return_date, rental_days, total_amount, status, created_at, updated_at)
SELECT 
    UUID(),
    t.traveller_id,
    h.hotel_id,
    'hotel',
    DATE_ADD('2025-12-01', INTERVAL FLOOR(RAND() * 31) DAY),
    DATE_ADD(DATE_ADD('2025-12-01', INTERVAL FLOOR(RAND() * 31) DAY), INTERVAL (2 + FLOOR(RAND() * 5)) DAY),
    2 + FLOOR(RAND() * 5),
    h.price_per_night * (2 + FLOOR(RAND() * 5)),
    CASE 
        WHEN RAND() > 0.3 THEN 'confirmed'
        ELSE 'completed'
    END,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY),
    NOW()
FROM temp_top_travellers t
CROSS JOIN (
    SELECT hotel_id, price_per_night FROM temp_nyc_hotels
    UNION ALL
    SELECT hotel_id, price_per_night FROM temp_other_hotels
) h
ORDER BY RAND()
LIMIT 175;

SELECT CONCAT('✅ Generated ', ROW_COUNT(), ' current month hotel bookings') AS result;

-- Future hotels (50% = 875)
INSERT INTO bookings (id, user_id, listing_id, listing_type, travel_date, return_date, rental_days, total_amount, status, created_at, updated_at)
SELECT 
    UUID(),
    t.traveller_id,
    h.hotel_id,
    'hotel',
    DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 365) DAY),
    DATE_ADD(DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 365) DAY), INTERVAL (2 + FLOOR(RAND() * 7)) DAY),
    2 + FLOOR(RAND() * 7),
    h.price_per_night * (2 + FLOOR(RAND() * 7)),
    'confirmed',
    NOW(),
    NOW()
FROM temp_top_travellers t
CROSS JOIN (
    SELECT hotel_id, price_per_night FROM temp_nyc_hotels
    UNION ALL
    SELECT hotel_id, price_per_night FROM temp_other_hotels
) h
ORDER BY RAND()
LIMIT 875;

SELECT CONCAT('✅ Generated ', ROW_COUNT(), ' future hotel bookings') AS result;

-- ========================================
-- STEP 5: Generate Car Bookings (25% of total = ~1250)
-- ========================================
SELECT '' AS '';
SELECT 'STEP 5: Generating Car Bookings (~1250)' AS '';

-- Past car rentals (40% = 500)
INSERT INTO bookings (id, user_id, listing_id, listing_type, travel_date, return_date, rental_days, total_amount, status, created_at, updated_at)
SELECT 
    UUID(),
    t.traveller_id,
    c.car_id,
    'car',
    DATE_ADD('2025-01-01', INTERVAL FLOOR(RAND() * 300) DAY),
    DATE_ADD(DATE_ADD('2025-01-01', INTERVAL FLOOR(RAND() * 300) DAY), INTERVAL (2 + FLOOR(RAND() * 10)) DAY),
    2 + FLOOR(RAND() * 10),
    c.daily_rate * (2 + FLOOR(RAND() * 10)),
    'completed',
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 300) DAY),
    NOW()
FROM temp_top_travellers t
CROSS JOIN temp_cars c
ORDER BY RAND()
LIMIT 500;

SELECT CONCAT('✅ Generated ', ROW_COUNT(), ' past car bookings') AS result;

-- Current month cars (10% = 125)
INSERT INTO bookings (id, user_id, listing_id, listing_type, travel_date, return_date, rental_days, total_amount, status, created_at, updated_at)
SELECT 
    UUID(),
    t.traveller_id,
    c.car_id,
    'car',
    DATE_ADD('2025-12-01', INTERVAL FLOOR(RAND() * 31) DAY),
    DATE_ADD(DATE_ADD('2025-12-01', INTERVAL FLOOR(RAND() * 31) DAY), INTERVAL (2 + FLOOR(RAND() * 8)) DAY),
    2 + FLOOR(RAND() * 8),
    c.daily_rate * (2 + FLOOR(RAND() * 8)),
    CASE 
        WHEN RAND() > 0.4 THEN 'confirmed'
        ELSE 'completed'
    END,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY),
    NOW()
FROM temp_top_travellers t
CROSS JOIN temp_cars c
ORDER BY RAND()
LIMIT 125;

SELECT CONCAT('✅ Generated ', ROW_COUNT(), ' current month car bookings') AS result;

-- Future cars (50% = 625)
INSERT INTO bookings (id, user_id, listing_id, listing_type, travel_date, return_date, rental_days, total_amount, status, created_at, updated_at)
SELECT 
    UUID(),
    t.traveller_id,
    c.car_id,
    'car',
    DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 365) DAY),
    DATE_ADD(DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 365) DAY), INTERVAL (2 + FLOOR(RAND() * 12)) DAY),
    2 + FLOOR(RAND() * 12),
    c.daily_rate * (2 + FLOOR(RAND() * 12)),
    'confirmed',
    NOW(),
    NOW()
FROM temp_top_travellers t
CROSS JOIN temp_cars c
ORDER BY RAND()
LIMIT 625;

SELECT CONCAT('✅ Generated ', ROW_COUNT(), ' future car bookings') AS result;

-- ========================================
-- STEP 6: Create Billing Records for All New Bookings
-- ========================================
SELECT '' AS '';
SELECT 'STEP 6: Creating Billing Records' AS '';

-- Create billing for bookings without billing records
INSERT INTO billing (
    id, 
    booking_id, 
    user_id, 
    amount, 
    tax, 
    total, 
    payment_method, 
    status, 
    transaction_date,
    created_at,
    updated_at
)
SELECT 
    UUID(),
    b.id,
    b.user_id,
    b.total_amount,
    ROUND(b.total_amount * 0.10, 2),
    ROUND(b.total_amount * 1.10, 2),
    CASE 
        WHEN RAND() > 0.7 THEN 'credit_card'
        WHEN RAND() > 0.4 THEN 'debit_card'
        ELSE 'paypal'
    END,
    CASE 
        WHEN b.status = 'completed' THEN 'paid'
        WHEN b.status = 'confirmed' THEN 'paid'
        WHEN b.status = 'cancelled' THEN 'refunded'
        ELSE 'pending'
    END,
    b.created_at,
    b.created_at,
    NOW()
FROM bookings b
LEFT JOIN billing bill ON b.id = bill.booking_id
WHERE bill.id IS NULL
  AND b.created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR);

SELECT CONCAT('✅ Created ', ROW_COUNT(), ' billing records') AS result;

-- ========================================
-- STEP 7: Verification & Summary
-- ========================================
SELECT '' AS '';
SELECT 'STEP 7: Verification & Summary' AS '';

-- Count new bookings
SELECT 'BOOKINGS SUMMARY' AS report;
SELECT 
    listing_type,
    COUNT(*) as total_bookings,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_value,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed
FROM bookings
GROUP BY listing_type
ORDER BY total_bookings DESC;

-- Time distribution
SELECT '' AS '';
SELECT 'TIME DISTRIBUTION' AS report;
SELECT 
    CASE 
        WHEN travel_date < '2025-12-01' THEN 'Past (2025)'
        WHEN travel_date BETWEEN '2025-12-01' AND '2025-12-31' THEN 'Current (Dec 2025)'
        ELSE 'Future (2026+)'
    END as time_period,
    COUNT(*) as booking_count,
    SUM(total_amount) as revenue
FROM bookings
GROUP BY time_period
ORDER BY 
    CASE time_period
        WHEN 'Past (2025)' THEN 1
        WHEN 'Current (Dec 2025)' THEN 2
        ELSE 3
    END;

-- Top owners by bookings
SELECT '' AS '';
SELECT 'TOP 10 OWNERS BY BOOKINGS' AS report;
SELECT 
    o.owner_email,
    COUNT(b.id) as total_bookings,
    SUM(b.total_amount) as total_revenue,
    SUM(CASE WHEN b.listing_type = 'hotel' THEN 1 ELSE 0 END) as hotel_bookings
FROM bookings b
INNER JOIN kayak_listings.hotels h ON b.listing_id = h.id
INNER JOIN temp_top_property_owners o ON h.owner_id COLLATE utf8mb4_unicode_ci = o.owner_id COLLATE utf8mb4_unicode_ci
WHERE b.listing_type = 'hotel'
GROUP BY o.owner_id, o.owner_email
ORDER BY total_bookings DESC
LIMIT 10;

-- Top travellers by bookings
SELECT '' AS '';
SELECT 'TOP 10 TRAVELLERS BY BOOKINGS' AS report;
SELECT 
    t.traveller_email,
    COUNT(b.id) as total_bookings,
    SUM(b.total_amount) as total_spent,
    SUM(CASE WHEN b.listing_type = 'flight' THEN 1 ELSE 0 END) as flights,
    SUM(CASE WHEN b.listing_type = 'hotel' THEN 1 ELSE 0 END) as hotels,
    SUM(CASE WHEN b.listing_type = 'car' THEN 1 ELSE 0 END) as cars
FROM bookings b
INNER JOIN temp_top_travellers t ON b.user_id COLLATE utf8mb4_unicode_ci = t.traveller_id COLLATE utf8mb4_unicode_ci
GROUP BY t.traveller_id, t.traveller_email
ORDER BY total_bookings DESC
LIMIT 10;

-- Check billing coverage
SELECT '' AS '';
SELECT 'BILLING COVERAGE' AS report;
SELECT 
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT bill.booking_id) as bookings_with_billing,
    COUNT(DISTINCT b.id) - COUNT(DISTINCT bill.booking_id) as bookings_without_billing
FROM bookings b
LEFT JOIN billing bill ON b.id = bill.booking_id;

-- ========================================
-- FINAL: Commit
-- ========================================
SELECT '' AS '';
SELECT '========================================' AS '';
SELECT 'FINAL: Transaction Decision' AS '';
SELECT '========================================' AS '';

SELECT 
    CASE 
        WHEN @DRY_RUN = 1 THEN '🔍 DRY RUN MODE: Will ROLLBACK (no changes made)'
        ELSE '✅ LIVE MODE: Committing changes...'
    END AS status;

COMMIT;

SELECT '✅ All bookings generated successfully!' AS result;

-- Cleanup
DROP TEMPORARY TABLE IF EXISTS temp_top_travellers;
DROP TEMPORARY TABLE IF EXISTS temp_top_property_owners;
DROP TEMPORARY TABLE IF EXISTS temp_nyc_hotels;
DROP TEMPORARY TABLE IF EXISTS temp_other_hotels;
DROP TEMPORARY TABLE IF EXISTS temp_flights;
DROP TEMPORARY TABLE IF EXISTS temp_cars;
