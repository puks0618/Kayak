-- Listings Database Schema

USE kayak_listings;

-- Flights table
CREATE TABLE IF NOT EXISTS flights (
    id VARCHAR(36) PRIMARY KEY,
    flight_code VARCHAR(20) NOT NULL, -- e.g. AA123
    airline VARCHAR(255) NOT NULL,
    departure_airport VARCHAR(10) NOT NULL, -- IATA code
    arrival_airport VARCHAR(10) NOT NULL, -- IATA code
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    duration INT NOT NULL, -- in minutes
    price DECIMAL(10, 2) NOT NULL,
    total_seats INT NOT NULL,
    class ENUM('economy', 'business', 'first') NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_route (departure_airport, arrival_airport),
    INDEX idx_departure (departure_time),
    INDEX idx_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hotels table
CREATE TABLE IF NOT EXISTS hotels (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state CHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    star_rating INT CHECK (star_rating BETWEEN 1 AND 5),
    rating DECIMAL(3, 2) DEFAULT 0.00,
    price_per_night DECIMAL(10, 2) NOT NULL,
    num_rooms INT NOT NULL,
    room_type VARCHAR(50), -- Single, Double, Suite
    amenities JSON, -- Wi-Fi, Breakfast, Parking, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location (city, state),
    INDEX idx_price (price_per_night),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cars table
CREATE TABLE IF NOT EXISTS cars (
    id VARCHAR(36) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    type ENUM('sedan', 'suv', 'luxury', 'economy', 'compact', 'van') NOT NULL,
    transmission ENUM('automatic', 'manual') NOT NULL,
    seats INT NOT NULL,
    daily_rental_price DECIMAL(10, 2) NOT NULL,
    location VARCHAR(255) NOT NULL, -- City or Airport code
    availability_status BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location (location),
    INDEX idx_type (type),
    INDEX idx_price (daily_rental_price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

