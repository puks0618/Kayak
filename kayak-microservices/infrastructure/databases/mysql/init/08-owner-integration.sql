-- Phase 1: Add owner_id and approval_status to existing tables
-- This migration enables owner-based listing management

USE kayak_listings;

-- Add owner_id to cars table
ALTER TABLE cars 
ADD COLUMN owner_id VARCHAR(36) AFTER id,
ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER availability_status,
ADD COLUMN images JSON COMMENT 'Array of image URLs' AFTER approval_status,
ADD INDEX idx_owner_id (owner_id),
ADD INDEX idx_approval_status (approval_status);

-- Add owner_id to hotels table  
ALTER TABLE hotels 
ADD COLUMN owner_id VARCHAR(36) AFTER id,
ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER amenities,
ADD COLUMN images JSON COMMENT 'Array of image URLs' AFTER approval_status,
ADD INDEX idx_owner_id (owner_id),
ADD INDEX idx_approval_status (approval_status);

-- Update bookings table to support car and hotel bookings
USE kayak_bookings;

ALTER TABLE bookings 
ADD COLUMN listing_type ENUM('flight', 'hotel', 'car') DEFAULT 'flight' AFTER id,
ADD COLUMN listing_id VARCHAR(36) COMMENT 'ID of the car/hotel/flight' AFTER listing_type,
ADD COLUMN owner_id VARCHAR(36) COMMENT 'Owner who receives payment' AFTER user_id,
ADD COLUMN pickup_location VARCHAR(255) AFTER owner_id,
ADD COLUMN dropoff_location VARCHAR(255) AFTER pickup_location,
ADD COLUMN pickup_date DATE AFTER dropoff_location,
ADD COLUMN pickup_time TIME AFTER pickup_date,
ADD COLUMN return_date DATE AFTER pickup_time,
ADD COLUMN return_time TIME AFTER return_date,
ADD COLUMN platform_commission DECIMAL(10,2) COMMENT 'Platform fee (10%)' AFTER total_amount,
ADD COLUMN owner_earnings DECIMAL(10,2) COMMENT 'Amount owner receives' AFTER platform_commission,
ADD INDEX idx_listing_type (listing_type),
ADD INDEX idx_listing_id (listing_id),
ADD INDEX idx_owner_id (owner_id);

-- Create owner_profiles table for business information (optional)
USE kayak_users;

CREATE TABLE IF NOT EXISTS owner_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    business_name VARCHAR(255) COMMENT 'Company name or individual name',
    business_type ENUM('individual', 'company', 'agency') DEFAULT 'individual',
    tax_id VARCHAR(50) COMMENT 'Tax ID or SSN',
    phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    state CHAR(2),
    zip_code VARCHAR(10),
    commission_rate DECIMAL(4,2) DEFAULT 0.10 COMMENT 'Platform commission rate',
    is_verified BOOLEAN DEFAULT FALSE COMMENT 'Admin verified',
    bio TEXT COMMENT 'About the owner/company',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add some sample data for testing (optional - remove in production)
-- INSERT INTO owner_profiles (id, user_id, business_name, business_type, is_verified) 
-- VALUES 
-- ('owner-profile-1', 'user-id-here', 'Johns Car Rentals', 'company', true);
