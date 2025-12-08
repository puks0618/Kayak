# Kayak Application - Database Schema Documentation

**Generated:** December 6, 2025  
**Database System:** MySQL 8.0  
**Port:** 3307  
**Character Set:** utf8mb4  
**Collation:** utf8mb4_unicode_ci

---

## Table of Contents
1. [Overview](#overview)
2. [Database List](#database-list)
3. [Detailed Schema](#detailed-schema)
   - [kayak_auth](#kayak_auth)
   - [kayak_users](#kayak_users)
   - [kayak_listings](#kayak_listings)
   - [kayak_bookings](#kayak_bookings)
4. [Relationships & Foreign Keys](#relationships--foreign-keys)
5. [Setup Instructions](#setup-instructions)

---

## Overview

The Kayak application uses a **microservices architecture** with separate databases for different domains:

- **kayak_auth**: Authentication (currently empty, auth handled in kayak_users)
- **kayak_users**: User management (travelers and admins)
- **kayak_listings**: Travel inventory (flights, hotels, cars)
- **kayak_bookings**: Booking and billing transactions
- **kayak_billing**: Separate billing service (mentioned but not created in main MySQL)

---

## Database List

```sql
CREATE DATABASE IF NOT EXISTS kayak_auth;
CREATE DATABASE IF NOT EXISTS kayak_users;
CREATE DATABASE IF NOT EXISTS kayak_listings;
CREATE DATABASE IF NOT EXISTS kayak_bookings;
```

---

## Detailed Schema

### kayak_auth

**Status:** Empty - Authentication is handled through `kayak_users.users` and `kayak_users.admins` tables.

---

### kayak_users

Contains user and administrator information.

#### Table: `users`

**Purpose:** Store traveler/customer accounts

```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    ssn VARCHAR(11) NOT NULL UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100),
    state CHAR(2),
    zip_code VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    profile_image_url VARCHAR(255),
    credit_card_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_email (email),
    INDEX idx_ssn (ssn),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Key Fields:**
- `id`: UUID primary key
- `ssn`: Social Security Number (unique, sensitive)
- `email`: Unique email for login
- `password_hash`: Hashed password
- `deleted_at`: Soft delete support

---

#### Table: `admins`

**Purpose:** Store administrator accounts with role-based access

```sql
CREATE TABLE admins (
    id VARCHAR(36) PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100),
    state CHAR(2),
    zip_code VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'manager', 'support') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Roles:**
- `super_admin`: Full system access
- `manager`: Management operations
- `support`: Customer support functions

---

### kayak_listings

Contains all travel inventory across flights, hotels, and cars.

#### Table: `flights`

**Purpose:** Store flight listings

```sql
CREATE TABLE flights (
    id VARCHAR(36) PRIMARY KEY,
    flight_code VARCHAR(20) NOT NULL,
    airline VARCHAR(255) NOT NULL,
    departure_airport VARCHAR(10) NOT NULL,
    arrival_airport VARCHAR(10) NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    duration INT NOT NULL COMMENT 'Duration in minutes',
    price DECIMAL(10,2) NOT NULL,
    total_seats INT NOT NULL,
    class ENUM('economy', 'business', 'first') NOT NULL,
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_route (departure_airport, arrival_airport),
    INDEX idx_departure (departure_time),
    INDEX idx_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Key Features:**
- Airport codes (IATA format)
- Duration in minutes
- Class-based pricing
- Rating system (0.00 - 5.00)

---

#### Table: `hotels`

**Purpose:** Store hotel/accommodation listings (from Airbnb data)

```sql
CREATE TABLE hotels (
    hotel_id INT AUTO_INCREMENT PRIMARY KEY,
    listing_id VARCHAR(255) NOT NULL UNIQUE COMMENT 'Original Airbnb listing ID',
    hotel_name VARCHAR(500) NOT NULL,
    description TEXT,
    neighborhood_overview TEXT,
    address VARCHAR(500),
    city VARCHAR(255),
    state VARCHAR(100),
    neighbourhood VARCHAR(255),
    neighbourhood_cleansed VARCHAR(255),
    latitude DECIMAL(10,7),
    longitude DECIMAL(11,7),
    property_type VARCHAR(255),
    room_type VARCHAR(100) COMMENT 'Entire home/apt, Private room, Shared room',
    accommodates INT DEFAULT 2,
    bedrooms INT,
    beds INT,
    bathrooms DECIMAL(3,1),
    bathrooms_text VARCHAR(100),
    price_per_night DECIMAL(10,2) NOT NULL,
    minimum_nights INT DEFAULT 1,
    maximum_nights INT DEFAULT 365,
    star_rating DECIMAL(3,2) DEFAULT 0.00 COMMENT 'Overall review score',
    number_of_reviews INT DEFAULT 0,
    review_scores_rating DECIMAL(4,2),
    review_scores_accuracy DECIMAL(4,2),
    review_scores_cleanliness DECIMAL(4,2),
    review_scores_checkin DECIMAL(4,2),
    review_scores_communication DECIMAL(4,2),
    review_scores_location DECIMAL(4,2),
    review_scores_value DECIMAL(4,2),
    host_id VARCHAR(255),
    host_name VARCHAR(255),
    host_since DATE,
    host_location VARCHAR(255),
    host_response_time VARCHAR(100),
    host_response_rate VARCHAR(50),
    host_is_superhost TINYINT(1) DEFAULT 0,
    has_availability TINYINT(1) DEFAULT 1,
    availability_30 INT DEFAULT 0,
    availability_60 INT DEFAULT 0,
    availability_90 INT DEFAULT 0,
    availability_365 INT DEFAULT 0,
    instant_bookable TINYINT(1) DEFAULT 0,
    picture_url TEXT,
    first_review DATE,
    last_review DATE,
    last_scraped DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
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
```

**Key Features:**
- Comprehensive Airbnb-style data
- Geolocation support (lat/long)
- Multiple review score dimensions
- Host information
- Availability tracking (30/60/90/365 days)

---

#### Table: `amenities`

**Purpose:** Master list of hotel amenities

```sql
CREATE TABLE amenities (
    amenity_id INT AUTO_INCREMENT PRIMARY KEY,
    amenity_name VARCHAR(100) NOT NULL UNIQUE,
    amenity_category VARCHAR(50) COMMENT 'General, Room, Wellness, Entertainment',
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Categories:**
- General (WiFi, Parking, etc.)
- Room (Air conditioning, TV, etc.)
- Wellness (Gym, Pool, Spa)
- Entertainment (Game room, etc.)

---

#### Table: `hotel_amenities`

**Purpose:** Junction table linking hotels to amenities

```sql
CREATE TABLE hotel_amenities (
    hotel_id INT NOT NULL,
    amenity_id INT NOT NULL,
    is_free TINYINT(1) DEFAULT 1,
    
    PRIMARY KEY (hotel_id, amenity_id),
    INDEX idx_amenity (amenity_id),
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE,
    FOREIGN KEY (amenity_id) REFERENCES amenities(amenity_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

#### Table: `room_types`

**Purpose:** Different room types for each hotel

```sql
CREATE TABLE room_types (
    room_type_id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NOT NULL,
    room_type VARCHAR(50) NOT NULL COMMENT 'Single, Double, Suite, etc.',
    room_name VARCHAR(100),
    price_per_night DECIMAL(10,2) NOT NULL,
    max_occupancy INT DEFAULT 2,
    bed_type VARCHAR(50) COMMENT 'King, Queen, Twin, etc.',
    available_rooms INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_hotel_price (hotel_id, price_per_night),
    INDEX idx_room_type (room_type),
    
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

#### Table: `cars`

**Purpose:** Store car rental listings

```sql
CREATE TABLE cars (
    id VARCHAR(36) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    type ENUM('sedan', 'suv', 'luxury', 'economy', 'compact', 'van') NOT NULL,
    transmission ENUM('automatic', 'manual') NOT NULL,
    seats INT NOT NULL,
    daily_rental_price DECIMAL(10,2) NOT NULL,
    location VARCHAR(255) NOT NULL,
    availability_status TINYINT(1) DEFAULT 1,
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_location (location),
    INDEX idx_type (type),
    INDEX idx_price (daily_rental_price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Car Types:**
- sedan
- suv
- luxury
- economy
- compact
- van

---

### kayak_bookings

Handles booking transactions, payments, and billing.

#### Table: `bookings`

**Purpose:** Store all booking records

```sql
CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    listing_id VARCHAR(36) NOT NULL,
    listing_type ENUM('flight', 'hotel', 'car') NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    travel_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_listing_id (listing_id),
    INDEX idx_status (status),
    INDEX idx_booking_date (booking_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Booking Statuses:**
- `pending`: Just created
- `confirmed`: Payment successful
- `cancelled`: User or system cancelled
- `completed`: Travel completed

---

#### Table: `payments`

**Purpose:** Track payment transactions

```sql
CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_booking_id (booking_id),
    INDEX idx_status (status),
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Payment Statuses:**
- `pending`: Payment initiated
- `completed`: Successfully processed
- `failed`: Payment failed
- `refunded`: Money returned to customer

---

#### Table: `billing`

**Purpose:** Generate invoices and track billing records

```sql
CREATE TABLE billing (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    status ENUM('paid', 'pending', 'refunded', 'overdue') NOT NULL DEFAULT 'pending',
    invoice_details JSON COMMENT 'Stores snapshot of items billed',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_booking_id (booking_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Billing Statuses:**
- `paid`: Invoice paid
- `pending`: Awaiting payment
- `refunded`: Refund issued
- `overdue`: Payment past due

---

## Relationships & Foreign Keys

### kayak_listings Relationships

```
hotels (hotel_id) ←─── hotel_amenities (hotel_id)
amenities (amenity_id) ←─── hotel_amenities (amenity_id)
hotels (hotel_id) ←─── room_types (hotel_id)
```

### kayak_bookings Relationships

```
bookings (id) ←─── payments (booking_id)
bookings (id) ←─── billing (booking_id)
```

### Cross-Database Logical Relationships (Not enforced by FK)

```
kayak_users.users (id) ──→ kayak_bookings.bookings (user_id)
kayak_users.users (id) ──→ kayak_bookings.billing (user_id)
kayak_listings.flights (id) ──→ kayak_bookings.bookings (listing_id) [when listing_type='flight']
kayak_listings.hotels (hotel_id) ──→ kayak_bookings.bookings (listing_id) [when listing_type='hotel']
kayak_listings.cars (id) ──→ kayak_bookings.bookings (listing_id) [when listing_type='car']
```

---

## Setup Instructions

### For Your Friend to Update Their Database

**Option 1: Using this Markdown with Copilot**

1. Open this markdown file in VS Code
2. Ask Copilot: "Create SQL migration scripts based on this schema to update my database"
3. Copilot will generate the necessary ALTER TABLE statements

**Option 2: Direct SQL Import**

Download the schema export from your database:

```bash
mysqldump -h localhost -P 3307 -u root -p'Somalwar1!' \
  --no-data \
  --databases kayak_auth kayak_users kayak_listings kayak_bookings \
  > kayak_schema.sql
```

Then import on their system:

```bash
mysql -h localhost -P 3306 -u root -p < kayak_schema.sql
```

**Option 3: Use the Init Scripts**

Run these SQL files in order:

```bash
cd kayak-microservices/infrastructure/databases/mysql/init/
mysql -h localhost -P 3306 -u root -p < 01-create-db.sql
mysql -h localhost -P 3306 -u root -p < 02-users.sql
mysql -h localhost -P 3306 -u root -p < 03-listings.sql
mysql -h localhost -P 3306 -u root -p < 04-bookings.sql
mysql -h localhost -P 3306 -u root -p < 05-billing.sql
mysql -h localhost -P 3306 -u root -p < 06-admin.sql
mysql -h localhost -P 3306 -u root -p < 08-owner-integration.sql
```

### Quick Database Setup with Docker

```bash
cd kayak-microservices/infrastructure/docker
docker-compose up -d mysql
```

This will automatically create all databases and tables using the init scripts.

---

## Notable Schema Features

### UUID Primary Keys
Most tables use `VARCHAR(36)` for UUID primary keys instead of auto-increment integers for:
- Distributed system compatibility
- Better security (non-sequential IDs)
- Easier merging of datasets

### Soft Deletes
The `users` table includes `deleted_at` for soft delete functionality, preserving data integrity.

### JSON Storage
The `billing.invoice_details` field uses JSON type to store flexible invoice data snapshots.

### Timestamps
All tables include:
- `created_at`: Record creation timestamp
- `updated_at`: Auto-updating modification timestamp

### Indexes
Strategic indexes on:
- Foreign keys
- Frequently queried fields (date, status, price)
- Search fields (location, city)
- Geolocation (latitude, longitude)

---

## Database Size & Statistics

**Current Record Counts:**
- Hotels: ~10 records
- Amenities: 30 amenities
- Users: Variable
- Bookings: Variable

**Storage:**
- Character Set: utf8mb4 (full Unicode support including emojis)
- Engine: InnoDB (ACID compliant, foreign key support)

---

## Migration Notes for Friends

### Common Schema Differences to Check

1. **Missing `billing` table in kayak_bookings**
   - Check if your friend's database has the billing table
   - If not, run `05-billing.sql`

2. **Hotel amenities junction table**
   - Ensure `hotel_amenities` table exists with proper foreign keys

3. **Admin role enum values**
   - Verify enum values match: `'super_admin','manager','support'`

4. **Booking status enum values**
   - Verify: `'pending','confirmed','cancelled','completed'`

5. **Indexes**
   - Ensure all indexes are created for performance

### Verification Query

Run this to compare table structures:

```sql
SELECT 
    TABLE_SCHEMA,
    TABLE_NAME,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_KEY
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA IN ('kayak_auth', 'kayak_users', 'kayak_listings', 'kayak_bookings')
ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION;
```

---

## Additional Resources

- **Docker Compose:** `kayak-microservices/infrastructure/docker/docker-compose.yml`
- **Init Scripts:** `kayak-microservices/infrastructure/databases/mysql/init/`
- **Connection Details:**
  - Host: localhost
  - Port: 3307 (Docker) or 3306 (standard)
  - User: root
  - Password: Somalwar1!

---

**Last Updated:** December 6, 2025  
**Maintained By:** Kayak Development Team
