-- =====================================================
-- CARS SAMPLE DATA SEEDING
-- Run this AFTER the migration script (09-cars-migration.sql)
-- =====================================================
-- This provides realistic car rental data for testing the Cars module

USE kayak_listings;

-- Insert sample car rental companies and their vehicles
-- Data matches real-world car rental options similar to Kayak.com

INSERT INTO cars (id, owner_id, company_name, brand, model, year, type, fuel_type, transmission, seats, doors, baggage_capacity, daily_rental_price, location, availability_status, approval_status, rating, mileage_limit, insurance_included, cancellation_policy, description, images, features) VALUES

-- Economy Cars - Los Angeles
('car-001', NULL, 'Hertz', 'Toyota', 'Yaris', 2024, 'economy', 'gasoline', 'automatic', 5, 4, 2, 35.99, 'Los Angeles (LAX)', TRUE, 'approved', 4.5, 200, FALSE, 'Free cancellation up to 48 hours before pickup', 'Compact and fuel-efficient, perfect for city driving', 
'["https://images.hertz.com/vehicles/220x128/yaris.jpg"]', 
'["Air Conditioning", "Bluetooth", "USB Port", "Cruise Control"]'),

('car-002', NULL, 'Budget', 'Hyundai', 'Accent', 2024, 'economy', 'gasoline', 'automatic', 5, 4, 2, 32.99, 'Los Angeles (LAX)', TRUE, 'approved', 4.3, 200, FALSE, 'Free cancellation up to 48 hours before pickup', 'Great gas mileage and reliable performance',
'["https://images.budget.com/vehicles/220x128/accent.jpg"]',
'["Air Conditioning", "AUX Input", "Power Windows"]'),

-- Compact Cars - Los Angeles
('car-003', NULL, 'Enterprise', 'Nissan', 'Versa', 2024, 'compact', 'gasoline', 'automatic', 5, 4, 2, 39.99, 'Los Angeles (LAX)', TRUE, 'approved', 4.6, 250, FALSE, 'Free cancellation up to 48 hours before pickup', 'Roomy compact with great features',
'["https://images.enterprise.com/vehicles/220x128/versa.jpg"]',
'["Air Conditioning", "Bluetooth", "Backup Camera", "Apple CarPlay"]'),

('car-004', NULL, 'Alamo', 'Chevrolet', 'Malibu', 2024, 'compact', 'gasoline', 'automatic', 5, 4, 3, 42.99, 'Los Angeles (LAX)', TRUE, 'approved', 4.7, 250, TRUE, 'Free cancellation up to 48 hours before pickup', 'Comfortable sedan with plenty of space',
'["https://images.alamo.com/vehicles/220x128/malibu.jpg"]',
'["Air Conditioning", "Bluetooth", "Backup Camera", "Blind Spot Monitor", "Android Auto"]'),

-- Sedan Cars - Los Angeles  
('car-005', NULL, 'Hertz', 'Toyota', 'Camry', 2024, 'sedan', 'hybrid', 'automatic', 5, 4, 3, 54.99, 'Los Angeles (LAX)', TRUE, 'approved', 4.8, 300, TRUE, 'Free cancellation up to 48 hours before pickup', 'Popular hybrid sedan with excellent fuel economy',
'["https://images.hertz.com/vehicles/220x128/camry.jpg"]',
'["Air Conditioning", "Bluetooth", "Backup Camera", "Lane Assist", "Apple CarPlay", "Hybrid Engine"]'),

('car-006', NULL, 'National', 'Honda', 'Accord', 2024, 'sedan', 'gasoline', 'automatic', 5, 4, 3, 52.99, 'Los Angeles (LAX)', TRUE, 'approved', 4.7, 300, TRUE, 'Free cancellation up to 48 hours before pickup', 'Reliable and spacious mid-size sedan',
'["https://images.nationalcar.com/vehicles/220x128/accord.jpg"]',
'["Air Conditioning", "Bluetooth", "Backup Camera", "Heated Seats", "Sunroof"]'),

-- SUV - Los Angeles
('car-007', NULL, 'Hertz', 'Jeep', 'Wrangler', 2024, 'suv', 'gasoline', 'automatic', 5, 4, 3, 89.99, 'Los Angeles (LAX)', TRUE, 'approved', 4.6, 250, TRUE, 'Free cancellation up to 48 hours before pickup', 'Iconic off-road SUV, perfect for adventures',
'["https://images.hertz.com/vehicles/220x128/wrangler.jpg"]',
'["Air Conditioning", "Bluetooth", "4WD", "Removable Top", "Off-Road Capable"]'),

('car-008', NULL, 'Enterprise', 'Toyota', 'RAV4', 2024, 'suv', 'hybrid', 'automatic', 5, 4, 4, 79.99, 'Los Angeles (LAX)', TRUE, 'approved', 4.8, 300, TRUE, 'Free cancellation up to 48 hours before pickup', 'Popular hybrid SUV with ample cargo space',
'["https://images.enterprise.com/vehicles/220x128/rav4.jpg"]',
'["Air Conditioning", "Bluetooth", "Backup Camera", "All-Wheel Drive", "Apple CarPlay", "Hybrid Engine"]'),

('car-009', NULL, 'Avis', 'Ford', 'Explorer', 2024, 'suv', 'gasoline', 'automatic', 7, 4, 5, 94.99, 'Los Angeles (LAX)', TRUE, 'approved', 4.7, 300, TRUE, 'Free cancellation up to 48 hours before pickup', 'Three-row SUV perfect for families',
'["https://images.avis.com/vehicles/220x128/explorer.jpg"]',
'["Air Conditioning", "Bluetooth", "Third Row Seating", "Backup Camera", "Navigation", "Panoramic Sunroof"]'),

-- Luxury - Los Angeles
('car-010', NULL, 'Hertz', 'BMW', '3 Series', 2024, 'luxury', 'gasoline', 'automatic', 5, 4, 3, 129.99, 'Los Angeles (LAX)', TRUE, 'approved', 4.9, 200, TRUE, 'Free cancellation up to 24 hours before pickup', 'Premium German engineering and performance',
'["https://images.hertz.com/vehicles/220x128/bmw3.jpg"]',
'["Leather Seats", "Premium Sound", "Navigation", "Heated Seats", "Sunroof", "Sport Mode"]'),

('car-011', NULL, 'Sixt', 'Mercedes-Benz', 'C-Class', 2024, 'luxury', 'gasoline', 'automatic', 5, 4, 3, 139.99, 'Los Angeles (LAX)', TRUE, 'approved', 4.9, 200, TRUE, 'Free cancellation up to 24 hours before pickup', 'Elegant luxury sedan with cutting-edge technology',
'["https://images.sixt.com/vehicles/220x128/c-class.jpg"]',
'["Leather Seats", "Premium Sound", "Navigation", "Heated/Cooled Seats", "Panoramic Sunroof", "Advanced Safety"]'),

-- Van - Los Angeles
('car-012', NULL, 'Budget', 'Chrysler', 'Pacifica', 2024, 'van', 'hybrid', 'automatic', 8, 4, 6, 109.99, 'Los Angeles (LAX)', TRUE, 'approved', 4.5, 300, TRUE, 'Free cancellation up to 48 hours before pickup', 'Spacious minivan perfect for large groups',
'["https://images.budget.com/vehicles/220x128/pacifica.jpg"]',
'["Air Conditioning", "Bluetooth", "Rear Entertainment", "Power Sliding Doors", "Third Row Seating", "Hybrid Engine"]'),

-- ===== NEW YORK LOCATIONS =====

('car-013', NULL, 'Hertz', 'Toyota', 'Corolla', 2024, 'compact', 'gasoline', 'automatic', 5, 4, 2, 44.99, 'New York (JFK)', TRUE, 'approved', 4.5, 200, FALSE, 'Free cancellation up to 48 hours before pickup', 'Reliable compact car for city navigation',
'["https://images.hertz.com/vehicles/220x128/corolla.jpg"]',
'["Air Conditioning", "Bluetooth", "Backup Camera", "Lane Assist"]'),

('car-014', NULL, 'Enterprise', 'Honda', 'Civic', 2024, 'compact', 'gasoline', 'automatic', 5, 4, 2, 47.99, 'New York (JFK)', TRUE, 'approved', 4.7, 250, TRUE, 'Free cancellation up to 48 hours before pickup', 'Popular compact with excellent features',
'["https://images.enterprise.com/vehicles/220x128/civic.jpg"]',
'["Air Conditioning", "Bluetooth", "Backup Camera", "Apple CarPlay", "Android Auto"]'),

('car-015', NULL, 'National', 'Nissan', 'Altima', 2024, 'sedan', 'gasoline', 'automatic', 5, 4, 3, 57.99, 'New York (JFK)', TRUE, 'approved', 4.6, 300, TRUE, 'Free cancellation up to 48 hours before pickup', 'Mid-size sedan with comfortable ride',
'["https://images.nationalcar.com/vehicles/220x128/altima.jpg"]',
'["Air Conditioning", "Bluetooth", "Backup Camera", "Heated Seats", "Remote Start"]'),

-- ===== SAN FRANCISCO LOCATIONS =====

('car-016', NULL, 'Hertz', 'Tesla', 'Model 3', 2024, 'luxury', 'electric', 'automatic', 5, 4, 2, 149.99, 'San Francisco (SFO)', TRUE, 'approved', 4.9, 0, TRUE, 'Free cancellation up to 24 hours before pickup', 'Premium electric vehicle with autopilot',
'["https://images.hertz.com/vehicles/220x128/model3.jpg"]',
'["Electric", "Autopilot", "Premium Sound", "Navigation", "Glass Roof", "Supercharger Access"]'),

('car-017', NULL, 'Budget', 'Ford', 'Escape', 2024, 'suv', 'hybrid', 'automatic', 5, 4, 4, 69.99, 'San Francisco (SFO)', TRUE, 'approved', 4.6, 300, TRUE, 'Free cancellation up to 48 hours before pickup', 'Compact SUV with hybrid efficiency',
'["https://images.budget.com/vehicles/220x128/escape.jpg"]',
'["Air Conditioning", "Bluetooth", "Backup Camera", "All-Wheel Drive", "Hybrid Engine"]'),

-- ===== LAS VEGAS LOCATIONS =====

('car-018', NULL, 'Sixt', 'Chevrolet', 'Corvette', 2024, 'luxury', 'gasoline', 'automatic', 2, 2, 1, 299.99, 'Las Vegas (LAS)', TRUE, 'approved', 5.0, 150, TRUE, 'Free cancellation up to 24 hours before pickup', 'Iconic American sports car - pure performance',
'["https://images.sixt.com/vehicles/220x128/corvette.jpg"]',
'["Leather Seats", "Premium Sound", "Sport Mode", "Performance Package", "Heads-Up Display"]'),

('car-019', NULL, 'Enterprise', 'Mazda', 'CX-5', 2024, 'suv', 'gasoline', 'automatic', 5, 4, 4, 72.99, 'Las Vegas (LAS)', TRUE, 'approved', 4.7, 300, TRUE, 'Free cancellation up to 48 hours before pickup', 'Stylish compact SUV with premium feel',
'["https://images.enterprise.com/vehicles/220x128/cx5.jpg"]',
'["Air Conditioning", "Bluetooth", "Backup Camera", "All-Wheel Drive", "Leather Seats", "Sunroof"]'),

('car-020', NULL, 'Avis', 'Kia', 'Telluride', 2024, 'suv', 'gasoline', 'automatic', 8, 4, 5, 99.99, 'Las Vegas (LAS)', TRUE, 'approved', 4.8, 300, TRUE, 'Free cancellation up to 48 hours before pickup', 'Award-winning three-row SUV with luxury features',
'["https://images.avis.com/vehicles/220x128/telluride.jpg"]',
'["Air Conditioning", "Bluetooth", "Third Row Seating", "Backup Camera", "Heated/Cooled Seats", "Panoramic Sunroof", "Premium Sound"]');

-- Verify the data insertion
SELECT COUNT(*) as total_cars_inserted FROM cars;
SELECT location, COUNT(*) as cars_per_location FROM cars GROUP BY location;
SELECT type, COUNT(*) as cars_per_type FROM cars GROUP BY type;
SELECT company_name, COUNT(*) as cars_per_company FROM cars GROUP BY company_name;
