-- Seed Data for Kayak Microservices
-- Run after all schema files

USE kayak_listings;

-- Insert Sample Flights
INSERT INTO flights (id, flight_code, airline, departure_airport, arrival_airport, departure_time, arrival_time, duration, price, base_price, seats_total, seats_left, cabin_class, rating) VALUES
('f1', 'AA123', 'American Airlines', 'SFO', 'JFK', '2025-12-01 08:00:00', '2025-12-01 16:30:00', 330, 350.00, 320.00, 180, 180, 'economy', 4.5),
('f2', 'UA456', 'United Airlines', 'LAX', 'ORD', '2025-12-01 09:00:00', '2025-12-01 15:00:00', 240, 280.00, 260.00, 200, 200, 'economy', 4.2),
('f3', 'DL789', 'Delta Airlines', 'JFK', 'LAX', '2025-12-02 10:00:00', '2025-12-02 13:00:00', 360, 400.00, 380.00, 190, 190, 'business', 4.7),
('f4', 'SW111', 'Southwest Airlines', 'SFO', 'LAS', '2025-12-02 11:30:00', '2025-12-02 13:00:00', 90, 120.00, 100.00, 150, 150, 'economy', 4.0),
('f5', 'BA222', 'British Airways', 'SFO', 'LHR', '2025-12-03 18:00:00', '2025-12-04 12:00:00', 660, 1200.00, 1100.00, 250, 250, 'first', 4.9),
('f6', 'AA333', 'American Airlines', 'ORD', 'MIA', '2025-12-03 07:00:00', '2025-12-03 11:30:00', 210, 220.00, 200.00, 180, 180, 'economy', 4.3),
('f7', 'UA444', 'United Airlines', 'SFO', 'SEA', '2025-12-04 14:00:00', '2025-12-04 16:30:00', 150, 150.00, 140.00, 160, 160, 'economy', 4.1),
('f8', 'DL555', 'Delta Airlines', 'ATL', 'BOS', '2025-12-04 08:30:00', '2025-12-04 11:00:00', 150, 180.00, 170.00, 170, 170, 'economy', 4.4),
('f9', 'SW666', 'Southwest Airlines', 'LAX', 'PHX', '2025-12-05 12:00:00', '2025-12-05 13:20:00', 80, 100.00, 90.00, 140, 140, 'economy', 3.9),
('f10', 'AA777', 'American Airlines', 'JFK', 'SFO', '2025-12-05 20:00:00', '2025-12-05 23:30:00', 330, 380.00, 360.00, 190, 190, 'business', 4.6);

-- Insert Sample Hotels
INSERT INTO hotels (id, name, address, city, state, zip_code, star_rating, rating, price_per_night, num_rooms, room_type) VALUES
('h1', 'Grand Hyatt', '345 Stockton St', 'San Francisco', 'CA', '94108', 5, 4.8, 350.00, 50, 'Suite'),
('h2', 'Marriott Downtown', '55 4th St', 'San Francisco', 'CA', '94103', 4, 4.5, 250.00, 80, 'Double'),
('h3', 'Holiday Inn Express', '1250 Columbus Ave', 'San Francisco', 'CA', '94133', 3, 4.2, 180.00, 100, 'Single'),
('h4', 'The Ritz-Carlton', '600 Stockton St', 'San Francisco', 'CA', '94108', 5, 4.9, 500.00, 40, 'Suite'),
('h5', 'Best Western', '2050 Van Ness Ave', 'San Francisco', 'CA', '94109', 3, 4.0, 150.00, 120, 'Double'),
('h6', 'Hilton Garden Inn', '1234 Main St', 'San Jose', 'CA', '95110', 4, 4.4, 200.00, 90, 'Double'),
('h7', 'Sheraton Hotel', '777 Broadway', 'New York', 'NY', '10003', 4, 4.3, 280.00, 150, 'Suite'),
('h8', 'Courtyard by Marriott', '500 Park Ave', 'New York', 'NY', '10022', 3, 4.1, 220.00, 110, 'Double'),
('h9', 'Four Seasons', '57 E 57th St', 'New York', 'NY', '10022', 5, 4.95, 600.00, 30, 'Suite'),
('h10', 'Comfort Inn', '2222 Hollywood Blvd', 'Los Angeles', 'CA', '90028', 2, 3.8, 120.00, 140, 'Single');

-- Insert Sample Cars
INSERT INTO cars (id, company_name, brand, model, year, type, transmission, seats, daily_rental_price, location, availability_status) VALUES
('c1', 'Hertz', 'Toyota', 'Camry', 2024, 'sedan', 'automatic', 5, 55.00, 'SFO', true),
('c2', 'Enterprise', 'Honda', 'Accord', 2024, 'sedan', 'automatic', 5, 50.00, 'SFO', true),
('c3', 'Budget', 'Ford', 'Explorer', 2023, 'suv', 'automatic', 7, 85.00, 'LAX', true),
('c4', 'Avis', 'Chevrolet', 'Suburban', 2024, 'suv', 'automatic', 8, 95.00, 'LAX', true),
('c5', 'Hertz', 'BMW', '5 Series', 2024, 'luxury', 'automatic', 5, 150.00, 'SFO', true),
('c6', 'Enterprise', 'Mercedes-Benz', 'E-Class', 2024, 'luxury', 'automatic', 5, 180.00, 'JFK', true),
('c7', 'Budget', 'Toyota', 'Corolla', 2024, 'economy', 'automatic', 5, 40.00, 'ORD', true),
('c8', 'Avis', 'Nissan', 'Versa', 2023, 'economy', 'automatic', 5, 38.00, 'ORD', true),
('c9', 'Hertz', 'Honda', 'Civic', 2024, 'compact', 'automatic', 5, 45.00, 'SEA', true),
('c10', 'Enterprise', 'Dodge', 'Grand Caravan', 2023, 'van', 'automatic', 7, 75.00, 'MIA', true),
('c11', 'Budget', 'Toyota', 'Sienna', 2024, 'van', 'automatic', 8, 80.00, 'ATL', true),
('c12', 'Avis', 'Ford', 'Mustang', 2024, 'luxury', 'automatic', 4, 120.00, 'LAS', true);

USE kayak_bookings;

-- Insert Sample Bookings
INSERT INTO bookings (id, user_id, listing_id, listing_type, status, booking_date, travel_date, total_amount) VALUES
('b1', 'user1', 'f1', 'flight', 'completed', '2025-11-15 10:00:00', '2025-12-01', 350.00),
('b2', 'user2', 'h1', 'hotel', 'completed', '2025-11-16 14:30:00', '2025-12-05', 1050.00),
('b3', 'user3', 'c1', 'car', 'completed', '2025-11-17 09:15:00', '2025-12-01', 165.00),
('b4', 'user4', 'f3', 'flight', 'completed', '2025-11-18 11:45:00', '2025-12-02', 400.00),
('b5', 'user5', 'h4', 'hotel', 'completed', '2025-11-19 16:20:00', '2025-12-10', 2000.00),
('b6', 'user1', 'c3', 'car', 'confirmed', '2025-11-20 08:00:00', '2025-12-15', 255.00),
('b7', 'user2', 'f5', 'flight', 'pending', '2025-11-21 13:30:00', '2025-12-03', 1200.00),
('b8', 'user6', 'h6', 'hotel', 'completed', '2025-11-22 10:10:00', '2025-12-08', 600.00),
('b9', 'user7', 'c5', 'car', 'completed', '2025-11-23 15:45:00', '2025-12-05', 450.00),
('b10', 'user8', 'f7', 'flight', 'completed', '2025-11-24 12:00:00', '2025-12-04', 150.00),
('b11', 'user9', 'h7', 'hotel', 'completed', '2025-11-25 09:30:00', '2025-12-12', 840.00),
('b12', 'user10', 'c8', 'car', 'completed', '2025-11-26 14:15:00', '2025-12-06', 114.00),
('b13', 'user3', 'f9', 'flight', 'completed', '2025-11-27 11:00:00', '2025-12-05', 100.00),
('b14', 'user4', 'h9', 'hotel', 'completed', '2025-11-28 16:45:00', '2025-12-20', 3000.00),
('b15', 'user5', 'c10', 'car', 'completed', '2025-11-29 10:30:00', '2025-12-10', 225.00);

-- Insert Sample Billing Records
INSERT INTO billing (id, booking_id, user_id, amount, tax, total, payment_method, status, invoice_details) VALUES
('bill1', 'b1', 'user1', 350.00, 35.00, 385.00, 'credit_card', 'paid', '{"items": [{"type": "flight", "amount": 350.00}]}'),
('bill2', 'b2', 'user2', 1050.00, 105.00, 1155.00, 'paypal', 'paid', '{"items": [{"type": "hotel", "nights": 3, "amount": 1050.00}]}'),
('bill3', 'b3', 'user3', 165.00, 16.50, 181.50, 'credit_card', 'paid', '{"items": [{"type": "car", "days": 3, "amount": 165.00}]}'),
('bill4', 'b4', 'user4', 400.00, 40.00, 440.00, 'debit_card', 'paid', '{"items": [{"type": "flight", "amount": 400.00}]}'),
('bill5', 'b5', 'user5', 2000.00, 200.00, 2200.00, 'credit_card', 'paid', '{"items": [{"type": "hotel", "nights": 4, "amount": 2000.00}]}'),
('bill6', 'b6', 'user1', 255.00, 25.50, 280.50, 'credit_card', 'pending', '{"items": [{"type": "car", "days": 3, "amount": 255.00}]}'),
('bill7', 'b7', 'user2', 1200.00, 120.00, 1320.00, 'credit_card', 'pending', '{"items": [{"type": "flight", "amount": 1200.00}]}'),
('bill8', 'b8', 'user6', 600.00, 60.00, 660.00, 'paypal', 'paid', '{"items": [{"type": "hotel", "nights": 3, "amount": 600.00}]}'),
('bill9', 'b9', 'user7', 450.00, 45.00, 495.00, 'credit_card', 'paid', '{"items": [{"type": "car", "days": 3, "amount": 450.00}]}'),
('bill10', 'b10', 'user8', 150.00, 15.00, 165.00, 'debit_card', 'paid', '{"items": [{"type": "flight", "amount": 150.00}]}'),
('bill11', 'b11', 'user9', 840.00, 84.00, 924.00, 'credit_card', 'paid', '{"items": [{"type": "hotel", "nights": 3, "amount": 840.00}]}'),
('bill12', 'b12', 'user10', 114.00, 11.40, 125.40, 'paypal', 'paid', '{"items": [{"type": "car", "days": 3, "amount": 114.00}]}'),
('bill13', 'b13', 'user3', 100.00, 10.00, 110.00, 'credit_card', 'paid', '{"items": [{"type": "flight", "amount": 100.00}]}'),
('bill14', 'b14', 'user4', 3000.00, 300.00, 3300.00, 'credit_card', 'paid', '{"items": [{"type": "hotel", "nights": 5, "amount": 3000.00}]}'),
('bill15', 'b15', 'user5', 225.00, 22.50, 247.50, 'debit_card', 'paid', '{"items": [{"type": "car", "days": 3, "amount": 225.00}]}');
