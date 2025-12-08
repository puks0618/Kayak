-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables
DROP TABLE IF EXISTS hotel_amenities;
DROP TABLE IF EXISTS room_types;
DROP TABLE IF EXISTS hotels;

SET FOREIGN_KEY_CHECKS = 1;

-- Create hotels table matching Python script expectations
CREATE TABLE hotels (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state CHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    star_rating INT CHECK (star_rating BETWEEN 1 AND 5),
    rating DECIMAL(3, 2) DEFAULT 0.00,
    price_per_night DECIMAL(10, 2) NOT NULL,
    num_rooms INT NOT NULL,
    room_type VARCHAR(50),
    amenities JSON,
    approval_status VARCHAR(20) DEFAULT 'approved',
    images JSON,
    listing_id INT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location (city, state),
    INDEX idx_price (price_per_night),
    INDEX idx_rating (rating),
    INDEX idx_listing (listing_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create hotel_amenities table
CREATE TABLE hotel_amenities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id VARCHAR(36) NOT NULL,
    amenity VARCHAR(100) NOT NULL,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_hotel (hotel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
