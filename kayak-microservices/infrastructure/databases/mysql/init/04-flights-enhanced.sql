-- Enhanced Flights Schema for Kaggle Dataset Integration

USE kayak_listings;

-- Drop existing flights table to recreate with new schema
DROP TABLE IF EXISTS flights;

-- Enhanced Flights table
CREATE TABLE flights (
    id VARCHAR(36) PRIMARY KEY,
    flight_code VARCHAR(20) NOT NULL,
    airline VARCHAR(255) NOT NULL,
    departure_airport VARCHAR(10) NOT NULL, -- IATA code
    arrival_airport VARCHAR(10) NOT NULL, -- IATA code
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    duration INT NOT NULL, -- in minutes
    stops INT DEFAULT 0, -- 0 = direct, 1 = 1 stop, etc.
    price DECIMAL(10, 2) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL, -- Original price before deals
    seats_total INT NOT NULL,
    seats_left INT NOT NULL,
    cabin_class ENUM('economy', 'premium economy', 'business', 'first') NOT NULL DEFAULT 'economy',
    is_deal BOOLEAN DEFAULT FALSE,
    discount_percent INT DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_route (departure_airport, arrival_airport),
    INDEX idx_departure_time (departure_time),
    INDEX idx_price (price),
    INDEX idx_stops (stops),
    INDEX idx_is_deal (is_deal),
    INDEX idx_cabin_class (cabin_class),
    INDEX idx_composite_search (departure_airport, arrival_airport, departure_time, cabin_class)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Airports Reference Table
CREATE TABLE IF NOT EXISTS airports (
    iata_code VARCHAR(10) PRIMARY KEY,
    icao_code VARCHAR(10),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    timezone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_city (city),
    INDEX idx_country (country),
    INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Flight Routes Summary (for "Cheap Flights by Destination" section)
CREATE TABLE IF NOT EXISTS flight_routes_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    origin_airport VARCHAR(10) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    destination_airport VARCHAR(10) NOT NULL,
    avg_price DECIMAL(10, 2) NOT NULL,
    min_price DECIMAL(10, 2) NOT NULL,
    flight_count INT NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_origin (origin_airport),
    INDEX idx_destination (destination_city),
    INDEX idx_min_price (min_price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


