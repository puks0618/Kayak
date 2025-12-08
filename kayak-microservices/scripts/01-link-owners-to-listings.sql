-- ========================================
-- PHASE 1: LINK OWNERS TO LISTINGS
-- ========================================
-- Purpose: Assign owner00001@test.com to owner02500@test.com to cars and hotels
-- Mode: Set DRY_RUN = 1 to test without committing
-- ========================================

SET @DRY_RUN = 1; -- Set to 0 for actual execution

-- Start transaction
START TRANSACTION;

-- ========================================
-- STEP 1: Verify owners exist
-- ========================================
SELECT '========================================' AS '';
SELECT 'STEP 1: Verifying Owners' AS '';
SELECT '========================================' AS '';

SELECT 
    COUNT(*) as total_owners,
    SUM(CASE WHEN email LIKE 'owner%@test.com' THEN 1 ELSE 0 END) as test_owners
FROM kayak_users.users
WHERE role = 'owner';

-- Get sample of owners
SELECT id, email, role, created_at
FROM kayak_users.users
WHERE role = 'owner' AND email LIKE 'owner%@test.com'
ORDER BY email
LIMIT 10;

-- ========================================
-- STEP 2: Check current state of listings
-- ========================================
SELECT '========================================' AS '';
SELECT 'STEP 2: Current Listings State' AS '';
SELECT '========================================' AS '';

-- Hotels without owners
SELECT 
    'Hotels' as listing_type,
    COUNT(*) as total_count,
    SUM(CASE WHEN owner_id IS NULL THEN 1 ELSE 0 END) as without_owner,
    SUM(CASE WHEN owner_id IS NOT NULL THEN 1 ELSE 0 END) as with_owner,
    SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved_count
FROM kayak_listings.hotels

UNION ALL

-- Cars without owners
SELECT 
    'Cars' as listing_type,
    COUNT(*) as total_count,
    SUM(CASE WHEN owner_id IS NULL THEN 1 ELSE 0 END) as without_owner,
    SUM(CASE WHEN owner_id IS NOT NULL THEN 1 ELSE 0 END) as with_owner,
    SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved_count
FROM kayak_listings.cars;

-- ========================================
-- STEP 3: Link Hotels to Owners
-- ========================================
SELECT '========================================' AS '';
SELECT 'STEP 3: Linking Hotels to Owners' AS '';
SELECT '========================================' AS '';

-- Create temporary table with owner assignments for hotels
USE kayak_listings;
DROP TEMPORARY TABLE IF EXISTS temp_hotel_owner_assignments;
CREATE TEMPORARY TABLE temp_hotel_owner_assignments AS
SELECT 
    h.id as hotel_id,
    h.name as hotel_name,
    h.city,
    o.id as owner_id,
    o.email as owner_email
FROM (
    SELECT 
        id, 
        name, 
        city,
        @owner_row := @owner_row + 1 as row_num
    FROM kayak_listings.hotels
    CROSS JOIN (SELECT @owner_row := 0) r
    WHERE owner_id IS NULL 
      AND approval_status = 'approved'
    ORDER BY id
) h
INNER JOIN (
    SELECT 
        id, 
        email,
        @owner_idx := @owner_idx + 1 as owner_idx
    FROM kayak_users.users
    CROSS JOIN (SELECT @owner_idx := 0) r2
    WHERE role = 'owner' 
      AND email LIKE 'owner%@test.com'
    ORDER BY email
) o ON MOD(h.row_num - 1, (SELECT COUNT(*) FROM kayak_users.users WHERE role = 'owner' AND email LIKE 'owner%@test.com')) + 1 = o.owner_idx;

-- Show assignments that will be made
SELECT '--- Hotel Assignments (First 20) ---' AS '';
SELECT 
    hotel_name,
    city,
    owner_email,
    COUNT(*) OVER (PARTITION BY owner_email) as hotels_per_owner
FROM temp_hotel_owner_assignments
LIMIT 20;

-- Show distribution
SELECT '--- Owner Distribution for Hotels ---' AS '';
SELECT 
    owner_email,
    COUNT(*) as hotels_assigned
FROM temp_hotel_owner_assignments
GROUP BY owner_email
ORDER BY hotels_assigned DESC
LIMIT 20;

-- Update hotels (if not dry run)
UPDATE kayak_listings.hotels h
INNER JOIN temp_hotel_owner_assignments t ON h.id = t.hotel_id
SET h.owner_id = t.owner_id
WHERE h.owner_id IS NULL;

SELECT CONCAT('✅ Updated ', ROW_COUNT(), ' hotels with owner assignments') AS result;

-- ========================================
-- STEP 4: Link Cars to Owners
-- ========================================
SELECT '========================================' AS '';
SELECT 'STEP 4: Linking Cars to Owners' AS '';
SELECT '========================================' AS '';

-- Create temporary table with owner assignments for cars
USE kayak_listings;
DROP TEMPORARY TABLE IF EXISTS temp_car_owner_assignments;
CREATE TEMPORARY TABLE temp_car_owner_assignments AS
SELECT 
    c.id as car_id,
    c.brand,
    c.model,
    c.location,
    o.id as owner_id,
    o.email as owner_email
FROM (
    SELECT 
        id, 
        brand,
        model,
        location,
        @car_row := @car_row + 1 as row_num
    FROM kayak_listings.cars
    CROSS JOIN (SELECT @car_row := 0) r
    WHERE owner_id IS NULL 
      AND approval_status = 'approved'
    ORDER BY id
) c
INNER JOIN (
    SELECT 
        id, 
        email,
        @car_owner_idx := @car_owner_idx + 1 as owner_idx
    FROM kayak_users.users
    CROSS JOIN (SELECT @car_owner_idx := 0) r2
    WHERE role = 'owner' 
      AND email LIKE 'owner%@test.com'
    ORDER BY email
) o ON MOD(c.row_num - 1, (SELECT COUNT(*) FROM kayak_users.users WHERE role = 'owner' AND email LIKE 'owner%@test.com')) + 1 = o.owner_idx;

-- Show assignments that will be made
SELECT '--- Car Assignments (First 20) ---' AS '';
SELECT 
    CONCAT(brand, ' ', model) as car,
    location,
    owner_email,
    COUNT(*) OVER (PARTITION BY owner_email) as cars_per_owner
FROM temp_car_owner_assignments
LIMIT 20;

-- Show distribution
SELECT '--- Owner Distribution for Cars ---' AS '';
SELECT 
    owner_email,
    COUNT(*) as cars_assigned
FROM temp_car_owner_assignments
GROUP BY owner_email
ORDER BY cars_assigned DESC
LIMIT 20;

-- Update cars (if not dry run)
UPDATE kayak_listings.cars c
INNER JOIN temp_car_owner_assignments t ON c.id = t.car_id
SET c.owner_id = t.owner_id
WHERE c.owner_id IS NULL;

SELECT CONCAT('✅ Updated ', ROW_COUNT(), ' cars with owner assignments') AS result;

-- ========================================
-- STEP 5: Verify Changes
-- ========================================
SELECT '========================================' AS '';
SELECT 'STEP 5: Verification After Changes' AS '';
SELECT '========================================' AS '';

-- Check updated state
SELECT 
    'Hotels' as listing_type,
    COUNT(*) as total_count,
    SUM(CASE WHEN owner_id IS NULL THEN 1 ELSE 0 END) as without_owner,
    SUM(CASE WHEN owner_id IS NOT NULL THEN 1 ELSE 0 END) as with_owner
FROM kayak_listings.hotels

UNION ALL

SELECT 
    'Cars' as listing_type,
    COUNT(*) as total_count,
    SUM(CASE WHEN owner_id IS NULL THEN 1 ELSE 0 END) as without_owner,
    SUM(CASE WHEN owner_id IS NOT NULL THEN 1 ELSE 0 END) as with_owner
FROM kayak_listings.cars;

-- Top owners by property count
SELECT '--- Top 20 Owners by Total Properties ---' AS '';
SELECT 
    u.email as owner_email,
    COALESCE(h.hotel_count, 0) as hotels_owned,
    COALESCE(c.car_count, 0) as cars_owned,
    COALESCE(h.hotel_count, 0) + COALESCE(c.car_count, 0) as total_properties
FROM kayak_users.users u
LEFT JOIN (
    SELECT owner_id, COUNT(*) as hotel_count
    FROM kayak_listings.hotels
    WHERE owner_id IS NOT NULL
    GROUP BY owner_id
) h ON u.id = h.owner_id
LEFT JOIN (
    SELECT owner_id, COUNT(*) as car_count
    FROM kayak_listings.cars
    WHERE owner_id IS NOT NULL
    GROUP BY owner_id
) c ON u.id = c.owner_id
WHERE u.role = 'owner' 
  AND (h.hotel_count IS NOT NULL OR c.car_count IS NOT NULL)
ORDER BY total_properties DESC
LIMIT 20;

-- ========================================
-- FINAL: Commit or Rollback
-- ========================================
SELECT '========================================' AS '';
SELECT 'FINAL: Transaction Decision' AS '';
SELECT '========================================' AS '';

SELECT 
    CASE 
        WHEN @DRY_RUN = 1 THEN '🔍 DRY RUN MODE: Will ROLLBACK (no changes made)'
        ELSE '✅ LIVE MODE: Will COMMIT (changes will be saved)'
    END AS status;

-- Commit or rollback based on DRY_RUN flag
-- Note: You must manually execute COMMIT or ROLLBACK after reviewing results
-- 
-- If satisfied with results:
-- COMMIT;
--
-- If you want to undo:
-- ROLLBACK;

SELECT '⚠️ IMPORTANT: Review the results above, then manually execute:' AS '';
SELECT '   COMMIT;   -- to save changes' AS '';
SELECT '   ROLLBACK; -- to undo everything' AS '';

