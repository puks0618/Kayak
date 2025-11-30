-- =====================================================
-- Kayak Stays Database Schema
-- Database: kayak_listings
-- =====================================================

USE kayak_listings;

-- Drop existing tables if they exist (in correct order to handle foreign keys)
DROP TABLE IF EXISTS hotel_amenities;
DROP TABLE IF EXISTS amenities;
DROP TABLE IF EXISTS room_types;
DROP TABLE IF EXISTS hotels;

-- =====================================================
-- Hotels Table (Main listing data)
-- =====================================================
CREATE TABLE hotels (
    hotel_id INT PRIMARY KEY AUTO_INCREMENT,
    listing_id VARCHAR(255) UNIQUE NOT NULL COMMENT 'Original Airbnb listing ID',
    hotel_name VARCHAR(500) NOT NULL,
    description TEXT,
    neighborhood_overview TEXT,
    
    -- Location Information
    address VARCHAR(500),
    city VARCHAR(255),
    state VARCHAR(100),
    neighbourhood VARCHAR(255),
    neighbourhood_cleansed VARCHAR(255),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(11, 7),
    
    -- Property Details
    property_type VARCHAR(255),
    room_type VARCHAR(100) COMMENT 'Entire home/apt, Private room, Shared room',
    accommodates INT DEFAULT 2,
    bedrooms INT,
    beds INT,
    bathrooms DECIMAL(3,1),
    bathrooms_text VARCHAR(100),
    
    -- Pricing
    price_per_night DECIMAL(10,2) NOT NULL,
    minimum_nights INT DEFAULT 1,
    maximum_nights INT DEFAULT 365,
    
    -- Ratings & Reviews
    star_rating DECIMAL(3,2) DEFAULT 0.00 COMMENT 'Overall review score',
    number_of_reviews INT DEFAULT 0,
    review_scores_rating DECIMAL(4,2),
    review_scores_accuracy DECIMAL(4,2),
    review_scores_cleanliness DECIMAL(4,2),
    review_scores_checkin DECIMAL(4,2),
    review_scores_communication DECIMAL(4,2),
    review_scores_location DECIMAL(4,2),
    review_scores_value DECIMAL(4,2),
    
    -- Host Information
    host_id VARCHAR(255),
    host_name VARCHAR(255),
    host_since DATE,
    host_location VARCHAR(255),
    host_response_time VARCHAR(100),
    host_response_rate VARCHAR(50),
    host_is_superhost BOOLEAN DEFAULT FALSE,
    
    -- Availability
    has_availability BOOLEAN DEFAULT TRUE,
    availability_30 INT DEFAULT 0,
    availability_60 INT DEFAULT 0,
    availability_90 INT DEFAULT 0,
    availability_365 INT DEFAULT 0,
    instant_bookable BOOLEAN DEFAULT FALSE,
    
    -- Images
    picture_url TEXT,
    
    -- Timestamps
    first_review DATE,
    last_review DATE,
    last_scraped DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for search optimization
    INDEX idx_city (city),
    INDEX idx_neighbourhood (neighbourhood_cleansed),
    INDEX idx_price (price_per_night),
    INDEX idx_star_rating (star_rating),
    INDEX idx_property_type (property_type),
    INDEX idx_room_type (room_type),
    INDEX idx_accommodates (accommodates),
    INDEX idx_location (latitude, longitude),
    INDEX idx_availability (has_availability, availability_30)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Room Types Table (Different room configurations)
-- =====================================================
CREATE TABLE room_types (
    room_type_id INT PRIMARY KEY AUTO_INCREMENT,
    hotel_id INT NOT NULL,
    room_type VARCHAR(50) NOT NULL COMMENT 'Single, Double, Suite, etc.',
    room_name VARCHAR(100),
    price_per_night DECIMAL(10,2) NOT NULL,
    max_occupancy INT DEFAULT 2,
    bed_type VARCHAR(50) COMMENT 'King, Queen, Twin, etc.',
    available_rooms INT DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE,
    INDEX idx_hotel_price (hotel_id, price_per_night),
    INDEX idx_room_type (room_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Amenities Table (Master list of amenities)
-- =====================================================
CREATE TABLE amenities (
    amenity_id INT PRIMARY KEY AUTO_INCREMENT,
    amenity_name VARCHAR(100) UNIQUE NOT NULL,
    amenity_category VARCHAR(50) COMMENT 'General, Room, Wellness, Entertainment',
    icon VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Hotel Amenities Junction Table (Many-to-Many)
-- =====================================================
CREATE TABLE hotel_amenities (
    hotel_id INT NOT NULL,
    amenity_id INT NOT NULL,
    is_free BOOLEAN DEFAULT TRUE,
    
    PRIMARY KEY (hotel_id, amenity_id),
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE,
    FOREIGN KEY (amenity_id) REFERENCES amenities(amenity_id) ON DELETE CASCADE,
    INDEX idx_amenity (amenity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Insert Common Amenities
-- =====================================================
INSERT INTO amenities (amenity_name, amenity_category, icon) VALUES
('Wifi', 'General', 'wifi'),
('Kitchen', 'Room', 'kitchen'),
('Washer', 'General', 'washer'),
('Dryer', 'General', 'dryer'),
('Air conditioning', 'General', 'ac'),
('Heating', 'General', 'heating'),
('TV', 'Entertainment', 'tv'),
('Hair dryer', 'Room', 'hair_dryer'),
('Iron', 'Room', 'iron'),
('Pool', 'Wellness', 'pool'),
('Hot tub', 'Wellness', 'hot_tub'),
('Free parking', 'General', 'parking'),
('Gym', 'Wellness', 'gym'),
('Breakfast', 'General', 'breakfast'),
('Smoking allowed', 'General', 'smoking'),
('Pets allowed', 'General', 'pets'),
('Elevator', 'General', 'elevator'),
('Fireplace', 'Room', 'fireplace'),
('Carbon monoxide alarm', 'Safety', 'alarm'),
('Smoke alarm', 'Safety', 'alarm'),
('First aid kit', 'Safety', 'first_aid'),
('Fire extinguisher', 'Safety', 'fire_extinguisher'),
('Essentials', 'Room', 'essentials'),
('Shampoo', 'Room', 'shampoo'),
('Hangers', 'Room', 'hangers'),
('Laptop friendly workspace', 'Room', 'workspace'),
('Self check-in', 'General', 'check_in'),
('Private entrance', 'General', 'entrance'),
('Long term stays allowed', 'General', 'long_term'),
('Luggage dropoff allowed', 'General', 'luggage');

-- =====================================================
-- Show table structures
-- =====================================================
SHOW TABLES;
DESCRIBE hotels;
DESCRIBE room_types;
DESCRIBE amenities;
DESCRIBE hotel_amenities;

SELECT COUNT(*) as amenity_count FROM amenities;
