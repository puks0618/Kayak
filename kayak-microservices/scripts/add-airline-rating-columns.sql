-- Add airline rating columns to flights table
-- Run this to prepare MySQL for airline reviews integration

USE kayak_listings;

-- Add columns (will show warning if already exist, but won't fail)
ALTER TABLE flights 
ADD COLUMN airline_rating DECIMAL(2,1) DEFAULT 0 COMMENT 'Average rating from MongoDB reviews',
ADD COLUMN airline_review_count INT DEFAULT 0 COMMENT 'Total review count from MongoDB';

-- Create index for faster queries
CREATE INDEX idx_airline_rating ON flights(airline, airline_rating);

-- Verify changes
DESCRIBE flights;
