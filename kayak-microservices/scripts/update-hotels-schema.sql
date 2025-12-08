-- Update hotels table schema to match import script
USE kayak_listings;

-- Drop old hotels table if it has wrong schema
DROP TABLE IF EXISTS hotels;

-- Create hotels table with proper schema for Airbnb-style data
CREATE TABLE hotels (
    id VARCHAR(255) PRIMARY KEY,
    owner_id VARCHAR(255) DEFAULT NULL,
    listing_id VARCHAR(255) NOT NULL UNIQUE,
    hotel_name VARCHAR(500) NOT NULL,
    description TEXT,
    neighborhood_overview TEXT,
    city VARCHAR(255) NOT NULL,
    state VARCHAR(50) DEFAULT 'NY',
    neighbourhood VARCHAR(255),
    neighbourhood_cleansed VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    property_type VARCHAR(255),
    room_type VARCHAR(100) DEFAULT 'Entire home/apt',
    accommodates INT DEFAULT 2,
    bedrooms INT DEFAULT 1,
    beds INT DEFAULT 1,
    bathrooms DECIMAL(3, 1) DEFAULT 1.0,
    bathrooms_text VARCHAR(100),
    price_per_night DECIMAL(10, 2) NOT NULL,
    minimum_nights INT DEFAULT 1,
    maximum_nights INT DEFAULT 365,
    star_rating DECIMAL(3, 2) DEFAULT 0.00,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    number_of_reviews INT DEFAULT 0,
    host_name VARCHAR(255),
    picture_url TEXT,
    amenities JSON DEFAULT NULL,
    images JSON DEFAULT NULL,
    has_availability BOOLEAN DEFAULT TRUE,
    availability_30 INT DEFAULT 0,
    num_rooms INT GENERATED ALWAYS AS (bedrooms) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_city (city),
    INDEX idx_price (price_per_night),
    INDEX idx_rating (star_rating),
    INDEX idx_accommodates (accommodates),
    INDEX idx_listing (listing_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
