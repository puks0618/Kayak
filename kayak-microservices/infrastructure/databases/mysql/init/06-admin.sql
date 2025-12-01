-- Admin Database Schema

-- Create kayak_admin database
CREATE DATABASE IF NOT EXISTS kayak_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE kayak_admin;

-- Administrator entity table
CREATE TABLE IF NOT EXISTS administrators (
    admin_id VARCHAR(36) PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100),
    state CHAR(2),
    zip_code VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE NOT NULL,
    access_level ENUM('super_admin', 'admin', 'support', 'analyst') DEFAULT 'admin',
    reports_managed JSON,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_access_level (access_level),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample administrators
INSERT INTO administrators (admin_id, first_name, last_name, email, access_level, reports_managed, is_active)
VALUES 
  (UUID(), 'Super', 'Admin', 'superadmin@kayak.com', 'super_admin', JSON_ARRAY('all'), TRUE),
  (UUID(), 'John', 'Manager', 'john.manager@kayak.com', 'admin', JSON_ARRAY('revenue', 'bookings'), TRUE),
  (UUID(), 'Sarah', 'Analyst', 'sarah.analyst@kayak.com', 'analyst', JSON_ARRAY('analytics', 'reports'), TRUE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
