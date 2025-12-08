-- Add available_seats column to flights table
-- Run this script to add seat tracking functionality

USE kayak_listings;

-- Add available_seats column (default to typical aircraft capacity)
ALTER TABLE flights ADD COLUMN IF NOT EXISTS available_seats INT DEFAULT 180 NOT NULL;

-- Update existing flights with random but realistic seat counts based on aircraft type
UPDATE flights SET available_seats = 
  CASE 
    WHEN LOWER(aircraft_type) LIKE '%737%' THEN FLOOR(150 + RAND() * 50)  -- 150-200 seats
    WHEN LOWER(aircraft_type) LIKE '%777%' THEN FLOOR(300 + RAND() * 80)  -- 300-380 seats
    WHEN LOWER(aircraft_type) LIKE '%787%' THEN FLOOR(240 + RAND() * 90)  -- 240-330 seats
    WHEN LOWER(aircraft_type) LIKE '%a320%' THEN FLOOR(150 + RAND() * 30) -- 150-180 seats
    WHEN LOWER(aircraft_type) LIKE '%a321%' THEN FLOOR(180 + RAND() * 40) -- 180-220 seats
    WHEN LOWER(aircraft_type) LIKE '%a380%' THEN FLOOR(500 + RAND() * 53) -- 500-553 seats
    ELSE FLOOR(150 + RAND() * 50)  -- Default 150-200 seats
  END
WHERE available_seats IS NULL OR available_seats = 180;

-- Show updated flights
SELECT 
  airline, 
  flight_code,
  aircraft_type,
  available_seats,
  departure_airport,
  arrival_airport
FROM flights
LIMIT 10;

SELECT 
  '✅ Migration complete! Flight seats column added and populated.' as status;
