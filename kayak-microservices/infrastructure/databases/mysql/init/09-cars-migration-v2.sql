-- =====================================================
-- CARS MODULE DATABASE MIGRATION v2
-- Compatible SQL for existing MySQL setup
-- Run this AFTER pulling the Cars branch
-- =====================================================

USE kayak_listings;

-- Check and add columns one by one
-- MySQL doesn't support IF NOT EXISTS in ALTER TABLE, so we'll use procedures

DELIMITER $$

CREATE PROCEDURE AddCarColumns()
BEGIN
    -- Add owner_id if it doesn't exist
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'kayak_listings' 
        AND TABLE_NAME = 'cars' 
        AND COLUMN_NAME = 'owner_id'
    ) THEN
        ALTER TABLE cars ADD COLUMN owner_id VARCHAR(36) AFTER id;
    END IF;

    -- Add approval_status if it doesn't exist
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'kayak_listings' 
        AND TABLE_NAME = 'cars' 
        AND COLUMN_NAME = 'approval_status'
    ) THEN
        ALTER TABLE cars ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved' AFTER availability_status;
    END IF;

    -- Add images if it doesn't exist
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'kayak_listings' 
        AND TABLE_NAME = 'cars' 
        AND COLUMN_NAME = 'images'
    ) THEN
        ALTER TABLE cars ADD COLUMN images JSON AFTER approval_status;
    END IF;

    -- Add features if it doesn't exist
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'kayak_listings' 
        AND TABLE_NAME = 'cars' 
        AND COLUMN_NAME = 'features'
    ) THEN
        ALTER TABLE cars ADD COLUMN features JSON AFTER images;
    END IF;

    -- Add mileage_limit if it doesn't exist
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'kayak_listings' 
        AND TABLE_NAME = 'cars' 
        AND COLUMN_NAME = 'mileage_limit'
    ) THEN
        ALTER TABLE cars ADD COLUMN mileage_limit INT DEFAULT 0 AFTER features;
    END IF;

    -- Add insurance_included if it doesn't exist
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'kayak_listings' 
        AND TABLE_NAME = 'cars' 
        AND COLUMN_NAME = 'insurance_included'
    ) THEN
        ALTER TABLE cars ADD COLUMN insurance_included BOOLEAN DEFAULT FALSE AFTER mileage_limit;
    END IF;

    -- Add cancellation_policy if it doesn't exist
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'kayak_listings' 
        AND TABLE_NAME = 'cars' 
        AND COLUMN_NAME = 'cancellation_policy'
    ) THEN
        ALTER TABLE cars ADD COLUMN cancellation_policy VARCHAR(255) DEFAULT 'Free cancellation up to 48 hours before pickup' AFTER insurance_included;
    END IF;

    -- Add description if it doesn't exist
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'kayak_listings' 
        AND TABLE_NAME = 'cars' 
        AND COLUMN_NAME = 'description'
    ) THEN
        ALTER TABLE cars ADD COLUMN description TEXT AFTER cancellation_policy;
    END IF;

    -- Add fuel_type if it doesn't exist
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'kayak_listings' 
        AND TABLE_NAME = 'cars' 
        AND COLUMN_NAME = 'fuel_type'
    ) THEN
        ALTER TABLE cars ADD COLUMN fuel_type ENUM('gasoline', 'diesel', 'electric', 'hybrid') DEFAULT 'gasoline' AFTER type;
    END IF;

    -- Add doors if it doesn't exist
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'kayak_listings' 
        AND TABLE_NAME = 'cars' 
        AND COLUMN_NAME = 'doors'
    ) THEN
        ALTER TABLE cars ADD COLUMN doors INT DEFAULT 4 AFTER seats;
    END IF;

    -- Add baggage_capacity if it doesn't exist
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'kayak_listings' 
        AND TABLE_NAME = 'cars' 
        AND COLUMN_NAME = 'baggage_capacity'
    ) THEN
        ALTER TABLE cars ADD COLUMN baggage_capacity INT DEFAULT 2 AFTER doors;
    END IF;

END$$

DELIMITER ;

-- Execute the procedure
CALL AddCarColumns();

-- Drop the procedure
DROP PROCEDURE IF EXISTS AddCarColumns;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_owner ON cars(owner_id);
CREATE INDEX IF NOT EXISTS idx_approval ON cars(approval_status);
CREATE INDEX IF NOT EXISTS idx_fuel_type ON cars(fuel_type);
CREATE INDEX IF NOT EXISTS idx_available ON cars(availability_status);

-- Create car_bookings table (if doesn't exist)
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
    INDEX idx_car_bookings_car (car_id),
    INDEX idx_car_bookings_user (user_id),
    INDEX idx_car_bookings_dates (pickup_date, dropoffdate),
    INDEX idx_car_bookings_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create car_availability table for detailed availability tracking
CREATE TABLE IF NOT EXISTS car_availability (
    id VARCHAR(36) PRIMARY KEY,
    car_id VARCHAR(36) NOT NULL,
    blocked_from DATETIME NOT NULL,
    blocked_until DATETIME NOT NULL,
    reason ENUM('booked', 'maintenance', 'unavailable') DEFAULT 'booked',
    booking_id VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_car_availability_car (car_id),
    INDEX idx_car_availability_dates (blocked_from, blocked_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create car_reviews table
CREATE TABLE IF NOT EXISTS car_reviews (
    id VARCHAR(36) PRIMARY KEY,
    car_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    booking_id VARCHAR(36) NULL,
    rating DECIMAL(3, 2) NOT NULL CHECK (rating BETWEEN 0 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_car_reviews_car (car_id),
    INDEX idx_car_reviews_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Migration completed successfully!' AS Status;
