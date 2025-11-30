-- Users Database Schema

USE kayak_users;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    ssn VARCHAR(11) UNIQUE NOT NULL, -- Format: ###-##-####
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100),
    state CHAR(2), -- US State abbreviation
    zip_code VARCHAR(10), -- 5 or 5-4 digit format
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_image_url VARCHAR(255),
    credit_card_token VARCHAR(255), -- Mock token for payment
    role ENUM('traveller', 'owner', 'admin') DEFAULT 'traveller',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_ssn (ssn),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Also create in kayak_auth database for auth service
USE kayak_auth;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    ssn VARCHAR(11) UNIQUE NOT NULL, -- Format: ###-##-####
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100),
    state CHAR(2), -- US State abbreviation
    zip_code VARCHAR(10), -- 5 or 5-4 digit format
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_image_url VARCHAR(255),
    credit_card_token VARCHAR(255), -- Mock token for payment
    role ENUM('traveller', 'owner', 'admin') DEFAULT 'traveller',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_ssn (ssn),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

