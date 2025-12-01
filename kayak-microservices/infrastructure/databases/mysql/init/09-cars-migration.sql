-- =====================================================
-- CARS MODULE DATABASE MIGRATION
-- Run this AFTER pulling the Cars branch
-- =====================================================
-- This script adds necessary columns and tables for the Cars rental feature
-- Compatible with existing flights and stays implementations

USE kayak_listings;

-- Step 1: Add new columns to cars table
-- These columns support owner management, approval workflow, and rich car details

ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS owner_id VARCHAR(36) AFTER id,
ADD COLUMN IF NOT EXISTS approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved' AFTER availability_status,
ADD COLUMN IF NOT EXISTS images JSON AFTER approval_status,
ADD COLUMN IF NOT EXISTS features JSON AFTER images,
ADD COLUMN IF NOT EXISTS mileage_limit INT DEFAULT 0 AFTER features,
ADD COLUMN IF NOT EXISTS insurance_included BOOLEAN DEFAULT FALSE AFTER mileage_limit,
ADD COLUMN IF NOT EXISTS cancellation_policy VARCHAR(255) DEFAULT 'Free cancellation up to 48 hours before pickup' AFTER insurance_included,
ADD COLUMN IF NOT EXISTS description TEXT AFTER cancellation_policy,
ADD COLUMN IF NOT EXISTS fuel_type ENUM('gasoline', 'diesel', 'electric', 'hybrid') DEFAULT 'gasoline' AFTER type,
ADD COLUMN IF NOT EXISTS doors INT DEFAULT 4 AFTER seats,
ADD COLUMN IF NOT EXISTS baggage_capacity INT DEFAULT 2 AFTER doors;

-- Step 2: Add indexes for better query performance
ALTER TABLE cars ADD INDEX IF NOT EXISTS idx_owner (owner_id);
ALTER TABLE cars ADD INDEX IF NOT EXISTS idx_approval (approval_status);
ALTER TABLE cars ADD INDEX IF NOT EXISTS idx_fuel_type (fuel_type);
ALTER TABLE cars ADD INDEX IF NOT EXISTS idx_available (availability_status);

-- Step 3: Create car_bookings table (if doesn't exist)
-- This tracks actual car rental bookings
CREATE TABLE IF NOT EXISTS car_bookings (
    id VARCHAR(36) PRIMARY KEY,
    car_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    pickup_date DATETIME NOT NULL,
    dropoff_date DATETIME NOT NULL,
    pickup_location VARCHAR(255) NOT NULL,
    dropoff_location VARCHAR(255) NOT NULL,
    total_days INT NOT NULL,
    daily_rate DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    insurance_added BOOLEAN DEFAULT FALSE,
    additional_drivers INT DEFAULT 0,
    status ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
    INDEX idx_car_bookings_car (car_id),
    INDEX idx_car_bookings_user (user_id),
    INDEX idx_car_bookings_dates (pickup_date, dropoff_date),
    INDEX idx_car_bookings_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 4: Create car_availability table for detailed availability tracking
-- This prevents double bookings and manages inventory
CREATE TABLE IF NOT EXISTS car_availability (
    id VARCHAR(36) PRIMARY KEY,
    car_id VARCHAR(36) NOT NULL,
    blocked_from DATETIME NOT NULL,
    blocked_until DATETIME NOT NULL,
    reason ENUM('booked', 'maintenance', 'unavailable') DEFAULT 'booked',
    booking_id VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES car_bookings(id) ON DELETE CASCADE,
    INDEX idx_car_availability_car (car_id),
    INDEX idx_car_availability_dates (blocked_from, blocked_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 5: Create car_reviews table
-- For customer reviews and ratings
CREATE TABLE IF NOT EXISTS car_reviews (
    id VARCHAR(36) PRIMARY KEY,
    car_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    booking_id VARCHAR(36) NULL,
    rating DECIMAL(3, 2) NOT NULL CHECK (rating BETWEEN 0 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
    INDEX idx_car_reviews_car (car_id),
    INDEX idx_car_reviews_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify the migration was successful
-- =====================================================

-- Check cars table structure
-- DESCRIBE cars;

-- Check car_bookings table
-- DESCRIBE car_bookings;

-- Check car_availability table
-- DESCRIBE car_availability;

-- Check car_reviews table
-- DESCRIBE car_reviews;

-- Count existing cars
-- SELECT COUNT(*) as total_cars FROM cars;

-- =====================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =====================================================
-- If you need to rollback these changes:
/*
ALTER TABLE cars 
DROP COLUMN IF EXISTS owner_id,
DROP COLUMN IF EXISTS approval_status,
DROP COLUMN IF EXISTS images,
DROP COLUMN IF EXISTS features,
DROP COLUMN IF EXISTS mileage_limit,
DROP COLUMN IF EXISTS insurance_included,
DROP COLUMN IF EXISTS cancellation_policy,
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS fuel_type,
DROP COLUMN IF EXISTS doors,
DROP COLUMN IF EXISTS baggage_capacity;

DROP TABLE IF EXISTS car_reviews;
DROP TABLE IF EXISTS car_availability;
DROP TABLE IF EXISTS car_bookings;
*/
