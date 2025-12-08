-- ==========================================
-- Analytics Test Data Generator
-- Creates sample bookings for testing analytics reports
-- ==========================================

USE kayak_bookings;

-- First, let's check if we have any listings to reference
-- You'll need to replace these IDs with actual IDs from your database

-- Sample hotel booking IDs (replace with actual hotel IDs from kayak_listings.hotels)
SET @hotel_id_1 = (SELECT id FROM kayak_listings.hotels LIMIT 1);
SET @hotel_id_2 = (SELECT id FROM kayak_listings.hotels LIMIT 1 OFFSET 1);
SET @hotel_id_3 = (SELECT id FROM kayak_listings.hotels LIMIT 1 OFFSET 2);

-- Sample flight IDs (replace with actual flight IDs from kayak_listings.flights)
SET @flight_id_1 = (SELECT id FROM kayak_listings.flights LIMIT 1);
SET @flight_id_2 = (SELECT id FROM kayak_listings.flights LIMIT 1 OFFSET 1);
SET @flight_id_3 = (SELECT id FROM kayak_listings.flights LIMIT 1 OFFSET 2);

-- Sample car IDs (replace with actual car IDs from kayak_listings.cars)
SET @car_id_1 = (SELECT id FROM kayak_listings.cars LIMIT 1);
SET @car_id_2 = (SELECT id FROM kayak_listings.cars LIMIT 1 OFFSET 1);
SET @car_id_3 = (SELECT id FROM kayak_listings.cars LIMIT 1 OFFSET 2);

-- Sample user ID (replace with actual user ID from kayak_users.users)
SET @user_id = (SELECT id FROM kayak_users.users LIMIT 1);

-- ==========================================
-- Insert Test Bookings for 2025
-- ==========================================

-- Hotel Bookings (January - March 2025)
INSERT INTO bookings (id, user_id, listing_id, listing_type, status, travel_date, total_amount, booking_date)
VALUES 
  (UUID(), @user_id, @hotel_id_1, 'hotel', 'completed', '2025-02-15', 299.99, '2025-01-15'),
  (UUID(), @user_id, @hotel_id_1, 'hotel', 'completed', '2025-03-10', 349.99, '2025-02-10'),
  (UUID(), @user_id, @hotel_id_1, 'hotel', 'completed', '2025-04-05', 279.99, '2025-03-05'),
  (UUID(), @user_id, @hotel_id_2, 'hotel', 'completed', '2025-02-20', 199.99, '2025-01-20'),
  (UUID(), @user_id, @hotel_id_2, 'hotel', 'completed', '2025-03-15', 229.99, '2025-02-15'),
  (UUID(), @user_id, @hotel_id_3, 'hotel', 'completed', '2025-02-25', 399.99, '2025-01-25');

-- Flight Bookings (January - March 2025)
INSERT INTO bookings (id, user_id, listing_id, listing_type, status, travel_date, total_amount, booking_date)
VALUES 
  (UUID(), @user_id, @flight_id_1, 'flight', 'completed', '2025-02-15', 599.99, '2025-01-10'),
  (UUID(), @user_id, @flight_id_1, 'flight', 'completed', '2025-03-20', 649.99, '2025-02-15'),
  (UUID(), @user_id, @flight_id_1, 'flight', 'completed', '2025-04-10', 579.99, '2025-03-08'),
  (UUID(), @user_id, @flight_id_2, 'flight', 'completed', '2025-02-18', 449.99, '2025-01-12'),
  (UUID(), @user_id, @flight_id_2, 'flight', 'completed', '2025-03-22', 499.99, '2025-02-18'),
  (UUID(), @user_id, @flight_id_3, 'flight', 'completed', '2025-02-28', 799.99, '2025-01-28');

-- Car Bookings (January - March 2025)
INSERT INTO bookings (id, user_id, listing_id, listing_type, status, travel_date, total_amount, booking_date)
VALUES 
  (UUID(), @user_id, @car_id_1, 'car', 'completed', '2025-02-10', 89.99, '2025-01-05'),
  (UUID(), @user_id, @car_id_1, 'car', 'completed', '2025-03-15', 99.99, '2025-02-10'),
  (UUID(), @user_id, @car_id_1, 'car', 'completed', '2025-04-08', 79.99, '2025-03-03'),
  (UUID(), @user_id, @car_id_2, 'car', 'completed', '2025-02-12', 129.99, '2025-01-08'),
  (UUID(), @user_id, @car_id_2, 'car', 'completed', '2025-03-18', 139.99, '2025-02-12'),
  (UUID(), @user_id, @car_id_3, 'car', 'completed', '2025-02-22', 159.99, '2025-01-18');

-- ==========================================
-- Insert More Diverse Test Data
-- ==========================================

-- Add bookings for different months to show trends
-- April 2025
INSERT INTO bookings (id, user_id, listing_id, listing_type, status, travel_date, total_amount, booking_date)
SELECT 
  UUID(), 
  @user_id, 
  @hotel_id_1, 
  'hotel', 
  'completed', 
  DATE_ADD('2025-04-01', INTERVAL (FLOOR(RAND() * 30)) DAY),
  ROUND(200 + (RAND() * 300), 2),
  DATE_ADD('2025-03-01', INTERVAL (FLOOR(RAND() * 30)) DAY)
FROM (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) numbers;

-- May 2025
INSERT INTO bookings (id, user_id, listing_id, listing_type, status, travel_date, total_amount, booking_date)
SELECT 
  UUID(), 
  @user_id, 
  @hotel_id_2, 
  'hotel', 
  'completed', 
  DATE_ADD('2025-05-01', INTERVAL (FLOOR(RAND() * 30)) DAY),
  ROUND(200 + (RAND() * 300), 2),
  DATE_ADD('2025-04-01', INTERVAL (FLOOR(RAND() * 30)) DAY)
FROM (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) numbers;

-- June 2025
INSERT INTO bookings (id, user_id, listing_id, listing_type, status, travel_date, total_amount, booking_date)
SELECT 
  UUID(), 
  @user_id, 
  @flight_id_1, 
  'flight', 
  'completed', 
  DATE_ADD('2025-06-01', INTERVAL (FLOOR(RAND() * 30)) DAY),
  ROUND(400 + (RAND() * 400), 2),
  DATE_ADD('2025-05-01', INTERVAL (FLOOR(RAND() * 30)) DAY)
FROM (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) numbers;

-- Add some pending bookings (should not appear in analytics)
INSERT INTO bookings (id, user_id, listing_id, listing_type, status, travel_date, total_amount, booking_date)
VALUES 
  (UUID(), @user_id, @hotel_id_1, 'hotel', 'pending', '2025-12-15', 299.99, NOW()),
  (UUID(), @user_id, @flight_id_1, 'flight', 'pending', '2025-12-20', 599.99, NOW()),
  (UUID(), @user_id, @car_id_1, 'car', 'cancelled', '2025-12-10', 89.99, NOW());

-- ==========================================
-- Verify the data
-- ==========================================

SELECT 
  listing_type,
  status,
  COUNT(*) as count,
  SUM(total_amount) as total_revenue,
  MIN(booking_date) as first_booking,
  MAX(booking_date) as last_booking
FROM bookings
GROUP BY listing_type, status
ORDER BY listing_type, status;

-- Show summary
SELECT 
  'Total Bookings' as metric,
  COUNT(*) as value
FROM bookings
UNION ALL
SELECT 
  'Completed Bookings',
  COUNT(*)
FROM bookings
WHERE status IN ('completed', 'confirmed')
UNION ALL
SELECT 
  'Total Revenue',
  SUM(total_amount)
FROM bookings
WHERE status IN ('completed', 'confirmed')
UNION ALL
SELECT 
  'Bookings in 2025',
  COUNT(*)
FROM bookings
WHERE YEAR(booking_date) = 2025;

COMMIT;

-- ==========================================
-- Notes:
-- 1. Replace the listing IDs at the top with actual IDs from your database
-- 2. This creates ~50+ bookings across different types and months
-- 3. Only 'completed' bookings will show in analytics
-- 4. Run: mysql -u root -p < create-analytics-test-data.sql
-- ==========================================

