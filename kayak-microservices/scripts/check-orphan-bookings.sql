-- ========================================
-- ORPHAN BOOKINGS CHECK SCRIPT
-- ========================================
-- Purpose: Identify and analyze orphaned bookings in the system
-- Orphaned bookings: Bookings that reference non-existent listings, users, or have no billing records
-- ========================================
SELECT
    '========================================' AS '';

SELECT
    'ORPHAN BOOKINGS ANALYSIS' AS '';

SELECT
    '========================================' AS '';

-- ========================================
-- CHECK 1: Bookings with No Listing
-- ========================================
SELECT
    '' AS '';

SELECT
    '1️⃣  ORPHANED BOOKINGS (No Listing)' AS '';

SELECT
    '   Bookings that reference listings that no longer exist or never existed' AS '';

SELECT
    '' AS '';

SELECT
    b.listing_type,
    COUNT(*) as orphaned_count,
    MIN(b.booking_date) as earliest_booking,
    MAX(b.booking_date) as latest_booking,
    SUM(b.total_amount) as total_lost_revenue
FROM
    kayak_bookings.bookings b
    LEFT JOIN kayak_listings.flights f ON b.listing_id = f.id
    AND b.listing_type = 'flight'
    LEFT JOIN kayak_listings.hotels h ON b.listing_id = h.id
    AND b.listing_type = 'hotel'
    LEFT JOIN kayak_listings.cars c ON b.listing_id = c.id
    AND b.listing_type = 'car'
WHERE
    f.id IS NULL
    AND h.id IS NULL
    AND c.id IS NULL
GROUP BY
    b.listing_type
ORDER BY
    orphaned_count DESC;

-- Sample orphaned car bookings
SELECT
    '' AS '';

SELECT
    '   Sample Orphaned Car Bookings (First 5):' AS '';

SELECT
    b.id as booking_id,
    b.listing_id as missing_car_id,
    b.user_id,
    b.status,
    b.booking_date,
    b.travel_date,
    b.total_amount
FROM
    kayak_bookings.bookings b
    LEFT JOIN kayak_listings.cars c ON b.listing_id = c.id
WHERE
    b.listing_type = 'car'
    AND c.id IS NULL
LIMIT
    5;

-- ========================================
-- CHECK 2: Bookings with No User
-- ========================================
SELECT
    '' AS '';

SELECT
    '2️⃣  ORPHANED BOOKINGS (No User)' AS '';

SELECT
    '   Bookings that reference users that no longer exist or were deleted' AS '';

SELECT
    '' AS '';

SELECT
    COUNT(*) as bookings_with_no_user,
    MIN(b.booking_date) as earliest,
    MAX(b.booking_date) as latest,
    SUM(b.total_amount) as total_amount
FROM
    kayak_bookings.bookings b
    LEFT JOIN kayak_users.users u ON b.user_id = u.id
WHERE
    u.id IS NULL;

-- Sample bookings with no user
SELECT
    '' AS '';

SELECT
    '   Sample Bookings with No User (First 5):' AS '';

SELECT
    b.id as booking_id,
    b.user_id as missing_user_id,
    b.listing_type,
    b.status,
    b.booking_date,
    b.total_amount
FROM
    kayak_bookings.bookings b
    LEFT JOIN kayak_users.users u ON b.user_id = u.id
WHERE
    u.id IS NULL
LIMIT
    5;

-- ========================================
-- CHECK 3: Bookings with No Billing
-- ========================================
SELECT
    '' AS '';

SELECT
    '3️⃣  ORPHANED BOOKINGS (No Billing Record)' AS '';

SELECT
    '   Bookings that have no corresponding billing/payment record' AS '';

SELECT
    '' AS '';

SELECT
    b.listing_type,
    b.status,
    COUNT(*) as bookings_without_billing,
    SUM(b.total_amount) as total_unbilled_amount
FROM
    kayak_bookings.bookings b
    LEFT JOIN kayak_bookings.billing bil ON b.id = bil.booking_id
WHERE
    bil.id IS NULL
GROUP BY
    b.listing_type,
    b.status
ORDER BY
    bookings_without_billing DESC;

-- ========================================
-- CHECK 4: Data Integrity Summary
-- ========================================
SELECT
    '' AS '';

SELECT
    '4️⃣  DATA INTEGRITY SUMMARY' AS '';

SELECT
    '' AS '';

SELECT
    'Total Bookings' as metric,
    COUNT(*) as count,
    SUM(total_amount) as total_revenue
FROM
    kayak_bookings.bookings
UNION ALL
SELECT
    'Valid Bookings (Has Listing)' as metric,
    COUNT(*) as count,
    SUM(b.total_amount) as total_revenue
FROM
    kayak_bookings.bookings b
    LEFT JOIN kayak_listings.flights f ON b.listing_id = f.id
    AND b.listing_type = 'flight'
    LEFT JOIN kayak_listings.hotels h ON b.listing_id = h.id
    AND b.listing_type = 'hotel'
    LEFT JOIN kayak_listings.cars c ON b.listing_id = c.id
    AND b.listing_type = 'car'
WHERE
    f.id IS NOT NULL
    OR h.id IS NOT NULL
    OR c.id IS NOT NULL
UNION ALL
SELECT
    'Valid Bookings (Has User)' as metric,
    COUNT(*) as count,
    SUM(b.total_amount) as total_revenue
FROM
    kayak_bookings.bookings b
    INNER JOIN kayak_users.users u ON b.user_id = u.id
UNION ALL
SELECT
    'Valid Bookings (Has Billing)' as metric,
    COUNT(*) as count,
    SUM(b.total_amount) as total_revenue
FROM
    kayak_bookings.bookings b
    INNER JOIN kayak_bookings.billing bil ON b.id = bil.booking_id
UNION ALL
SELECT
    'Orphaned - No Listing' as metric,
    COUNT(*) as count,
    SUM(b.total_amount) as total_revenue
FROM
    kayak_bookings.bookings b
    LEFT JOIN kayak_listings.flights f ON b.listing_id = f.id
    AND b.listing_type = 'flight'
    LEFT JOIN kayak_listings.hotels h ON b.listing_id = h.id
    AND b.listing_type = 'hotel'
    LEFT JOIN kayak_listings.cars c ON b.listing_id = c.id
    AND b.listing_type = 'car'
WHERE
    f.id IS NULL
    AND h.id IS NULL
    AND c.id IS NULL
UNION ALL
SELECT
    'Orphaned - No User' as metric,
    COUNT(*) as count,
    SUM(b.total_amount) as total_revenue
FROM
    kayak_bookings.bookings b
    LEFT JOIN kayak_users.users u ON b.user_id = u.id
WHERE
    u.id IS NULL
UNION ALL
SELECT
    'Orphaned - No Billing' as metric,
    COUNT(*) as count,
    SUM(b.total_amount) as total_revenue
FROM
    kayak_bookings.bookings b
    LEFT JOIN kayak_bookings.billing bil ON b.id = bil.booking_id
WHERE
    bil.id IS NULL;

-- ========================================
-- CHECK 5: Listings Capacity vs Bookings
-- ========================================
SELECT
    '' AS '';

SELECT
    '5️⃣  LISTINGS CAPACITY vs BOOKINGS' AS '';

SELECT
    '   Compare available listings vs booking demand' AS '';

SELECT
    '' AS '';

SELECT
    'Flights' as listing_type,
    (
        SELECT
            COUNT(*)
        FROM
            kayak_listings.flights
    ) as available_listings,
    (
        SELECT
            COUNT(*)
        FROM
            kayak_bookings.bookings
        WHERE
            listing_type = 'flight'
    ) as total_bookings,
    ROUND(
        (
            SELECT
                COUNT(*)
            FROM
                kayak_bookings.bookings
            WHERE
                listing_type = 'flight'
        ) / (
            SELECT
                COUNT(*)
            FROM
                kayak_listings.flights
        ),
        2
    ) as bookings_per_listing
UNION ALL
SELECT
    'Hotels' as listing_type,
    (
        SELECT
            COUNT(*)
        FROM
            kayak_listings.hotels
        WHERE
            approval_status = 'approved'
    ) as available_listings,
    (
        SELECT
            COUNT(*)
        FROM
            kayak_bookings.bookings
        WHERE
            listing_type = 'hotel'
    ) as total_bookings,
    ROUND(
        (
            SELECT
                COUNT(*)
            FROM
                kayak_bookings.bookings
            WHERE
                listing_type = 'hotel'
        ) / (
            SELECT
                COUNT(*)
            FROM
                kayak_listings.hotels
            WHERE
                approval_status = 'approved'
        ),
        2
    ) as bookings_per_listing
UNION ALL
SELECT
    'Cars' as listing_type,
    (
        SELECT
            COUNT(*)
        FROM
            kayak_listings.cars
    ) as available_listings,
    (
        SELECT
            COUNT(*)
        FROM
            kayak_bookings.bookings
        WHERE
            listing_type = 'car'
    ) as total_bookings,
    ROUND(
        (
            SELECT
                COUNT(*)
            FROM
                kayak_bookings.bookings
            WHERE
                listing_type = 'car'
        ) / NULLIF(
            (
                SELECT
                    COUNT(*)
                FROM
                    kayak_listings.cars
            ),
            0
        ),
        2
    ) as bookings_per_listing;

-- ========================================
-- RECOMMENDATIONS
-- ========================================
SELECT
    '' AS '';

SELECT
    '📋 RECOMMENDATIONS:' AS '';

SELECT
    '' AS '';

SELECT
    '1. Delete orphaned car bookings (8000+ bookings with no cars)' AS '';

SELECT
    '2. Either create cars to match bookings OR delete invalid bookings' AS '';

SELECT
    '3. Create billing records for 8005 bookings with no billing' AS '';

SELECT
    '4. Investigate and fix 10 bookings with invalid user IDs' AS '';

SELECT
    '' AS '';

SELECT
    '⚠️  Run cleanup script to fix these issues' AS '';