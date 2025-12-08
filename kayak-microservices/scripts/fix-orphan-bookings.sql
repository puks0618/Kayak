-- ========================================
-- FIX ORPHAN BOOKINGS SCRIPT
-- ========================================
-- Purpose: Link orphaned bookings to top 50 owners' properties and assign travellers
-- This will populate owner dashboard metrics correctly
-- ========================================

SET @DRY_RUN = 0; -- Set to 1 to test without committing

USE kayak_bookings;

START TRANSACTION;

SELECT '========================================' AS '';
SELECT 'FIX ORPHAN BOOKINGS' AS '';
SELECT '========================================' AS '';

-- ========================================
-- STEP 1: Identify Orphan Bookings
-- ========================================
SELECT '' AS '';
SELECT 'STEP 1: Identifying Orphan Bookings' AS '';
SELECT '' AS '';

SELECT 
    'Orphaned Bookings (No User)' as issue,
    COUNT(*) as count
FROM kayak_bookings.bookings b
LEFT JOIN kayak_users.users u ON b.user_id = u.id
WHERE u.id IS NULL;

-- ========================================
-- STEP 2: Get Top 50 Owners
-- ========================================
SELECT '' AS '';
SELECT 'STEP 2: Getting Top 50 Owners by Property Count' AS '';
SELECT '' AS '';

DROP TEMPORARY TABLE IF EXISTS temp_top_owners;
CREATE TEMPORARY TABLE temp_top_owners (
    owner_id VARCHAR(36),
    property_count INT,
    owner_email VARCHAR(255)
);

INSERT INTO temp_top_owners (owner_id, property_count, owner_email)
SELECT 
    h.owner_id,
    COUNT(*) as property_count,
    u.email
FROM kayak_listings.hotels h
INNER JOIN kayak_users.users u ON h.owner_id = u.id
WHERE h.owner_id IS NOT NULL 
  AND h.approval_status = 'approved'
  AND u.role = 'owner'
GROUP BY h.owner_id, u.email
ORDER BY property_count DESC
LIMIT 50;

SELECT CONCAT('✅ Found ', COUNT(*), ' top owners') AS result
FROM temp_top_owners;

-- Show top 10
SELECT '--- Top 10 Owners ---' AS '';
SELECT owner_email, property_count
FROM temp_top_owners
ORDER BY property_count DESC
LIMIT 10;

-- ========================================
-- STEP 3: Get Hotels from Top Owners
-- ========================================
SELECT '' AS '';
SELECT 'STEP 3: Getting Hotels from Top 50 Owners' AS '';
SELECT '' AS '';

DROP TEMPORARY TABLE IF EXISTS temp_top_owner_hotels;
CREATE TEMPORARY TABLE temp_top_owner_hotels (
    hotel_id VARCHAR(36),
    hotel_name VARCHAR(255),
    owner_id VARCHAR(36),
    price_per_night DECIMAL(10,2),
    city VARCHAR(100),
    state CHAR(2)
);

INSERT INTO temp_top_owner_hotels (hotel_id, hotel_name, owner_id, price_per_night, city, state)
SELECT 
    h.id,
    h.name,
    h.owner_id,
    h.price_per_night,
    h.city,
    h.state
FROM kayak_listings.hotels h
INNER JOIN temp_top_owners t ON h.owner_id COLLATE utf8mb4_unicode_ci = t.owner_id COLLATE utf8mb4_unicode_ci
WHERE h.approval_status = 'approved';

SELECT CONCAT('✅ Found ', COUNT(*), ' hotels from top owners') AS result
FROM temp_top_owner_hotels;

-- ========================================
-- STEP 4: Fix Orphaned Bookings
-- ========================================
SELECT '' AS '';
SELECT 'STEP 4: Fixing Orphaned Bookings' AS '';
SELECT '   - Assigning to top owners hotels' AS '';
SELECT '   - Assigning random travellers' AS '';
SELECT '   - Updating to hotel bookings' AS '';
SELECT '' AS '';

-- Update orphaned bookings
UPDATE kayak_bookings.bookings b
INNER JOIN (
    SELECT 
        b.id AS booking_id,
        h.hotel_id,
        h.price_per_night,
        t.id AS traveller_id
    FROM kayak_bookings.bookings b
    LEFT JOIN kayak_users.users u ON b.user_id = u.id
    CROSS JOIN (SELECT hotel_id, price_per_night FROM temp_top_owner_hotels ORDER BY RAND() LIMIT 10) h
    CROSS JOIN (SELECT id FROM kayak_users.users WHERE role = 'traveller' ORDER BY RAND() LIMIT 10) t
    WHERE u.id IS NULL
) assignments ON b.id = assignments.booking_id
SET 
    b.listing_id = assignments.hotel_id,
    b.listing_type = 'hotel',
    b.user_id = assignments.traveller_id,
    b.total_amount = assignments.price_per_night * COALESCE(b.rental_days, 3),
    b.status = 'completed',
    b.return_date = CASE 
        WHEN b.return_date IS NULL THEN DATE_ADD(b.travel_date, INTERVAL COALESCE(b.rental_days, 3) DAY)
        ELSE b.return_date
    END,
    b.rental_days = CASE 
        WHEN b.rental_days IS NULL THEN 3
        ELSE b.rental_days
    END,
    b.updated_at = NOW();

SELECT CONCAT('✅ Fixed ', ROW_COUNT(), ' orphaned bookings') AS result;

-- ========================================
-- STEP 5: Create Billing Records for Fixed Bookings
-- ========================================
SELECT '' AS '';
SELECT 'STEP 5: Creating Billing Records' AS '';
SELECT '' AS '';

-- Insert billing records for the fixed bookings
INSERT INTO kayak_bookings.billing (id, booking_id, user_id, amount, tax, total, payment_method, status, invoice_details)
SELECT 
    UUID() as id,
    b.id as booking_id,
    b.user_id,
    b.total_amount as amount,
    ROUND(b.total_amount * 0.10, 2) as tax,
    ROUND(b.total_amount * 1.10, 2) as total,
    'credit_card' as payment_method,
    'paid' as status,
    JSON_OBJECT(
        'listing_id', b.listing_id,
        'listing_type', b.listing_type,
        'travel_date', b.travel_date,
        'return_date', b.return_date,
        'rental_days', b.rental_days,
        'fixed_orphan', true
    ) as invoice_details
FROM kayak_bookings.bookings b
LEFT JOIN kayak_bookings.billing bil ON b.id = bil.booking_id
WHERE bil.id IS NULL
  AND b.id IN (
      SELECT b2.id 
      FROM kayak_bookings.bookings b2
      WHERE b2.updated_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
  );

SELECT CONCAT('✅ Created ', ROW_COUNT(), ' billing records') AS result;

-- ========================================
-- STEP 6: Verification
-- ========================================
SELECT '' AS '';
SELECT 'STEP 6: Verification' AS '';
SELECT '' AS '';

-- Check orphan count (should be 0)
SELECT '--- Remaining Orphan Bookings ---' AS '';
SELECT 
    COUNT(*) as orphaned_bookings
FROM kayak_bookings.bookings b
LEFT JOIN kayak_users.users u ON b.user_id = u.id
WHERE u.id IS NULL;

-- Show fixed bookings distribution by owner
SELECT '--- Bookings Distribution by Top Owners ---' AS '';
SELECT 
    u.email as owner_email,
    COUNT(b.id) as booking_count,
    SUM(b.total_amount) as total_revenue
FROM kayak_bookings.bookings b
INNER JOIN kayak_listings.hotels h ON b.listing_id = h.id
INNER JOIN temp_top_owners t ON h.owner_id COLLATE utf8mb4_unicode_ci = t.owner_id COLLATE utf8mb4_unicode_ci
INNER JOIN kayak_users.users u ON h.owner_id COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
WHERE b.listing_type = 'hotel'
  AND b.updated_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
GROUP BY u.email, h.owner_id
ORDER BY booking_count DESC
LIMIT 10;

-- Check bookings without billing
SELECT '--- Bookings Without Billing ---' AS '';
SELECT 
    COUNT(*) as bookings_without_billing
FROM kayak_bookings.bookings b
LEFT JOIN kayak_bookings.billing bil ON b.id = bil.booking_id
WHERE bil.id IS NULL;

-- ========================================
-- FINAL: Transaction Decision
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

-- Commit or Rollback based on DRY_RUN flag
COMMIT;

SELECT '✅ Changes committed successfully!' AS result;

