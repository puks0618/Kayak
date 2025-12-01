-- Additional tables for Cars module
-- Creates car_bookings, car_availability, and car_reviews tables

USE kayak_listings;

-- Create car_bookings table
CREATE TABLE IF NOT EXISTS car_bookings (
    id VARCHAR(36) PRIMARY KEY,
    car_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    pickup_date DATE NOT NULL,
    dropoff_date DATE NOT NULL,
    total_days INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_car (car_id),
    INDEX idx_user (user_id),
    INDEX idx_dates (pickup_date, dropoff_date),
    INDEX idx_status (status),
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create car_availability table
CREATE TABLE IF NOT EXISTS car_availability (
    id VARCHAR(36) PRIMARY KEY,
    car_id VARCHAR(36) NOT NULL,
    blocked_date DATE NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_car_date (car_id, blocked_date),
    UNIQUE KEY unique_car_date (car_id, blocked_date),
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create car_reviews table
CREATE TABLE IF NOT EXISTS car_reviews (
    id VARCHAR(36) PRIMARY KEY,
    car_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    booking_id VARCHAR(36),
    rating DECIMAL(3,2) NOT NULL CHECK (rating >= 0 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_car (car_id),
    INDEX idx_user (user_id),
    INDEX idx_rating (rating),
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES car_bookings(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Show created tables
SELECT 'car_bookings table created' as status;
SELECT 'car_availability table created' as status;
SELECT 'car_reviews table created' as status;
