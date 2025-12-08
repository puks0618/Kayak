-- Insert sample hotels for testing
USE kayak_listings;

INSERT INTO hotels (
  listing_id, hotel_name, city, state, neighbourhood, neighbourhood_cleansed,
  latitude, longitude, property_type, room_type, accommodates, bedrooms, beds,
  bathrooms, price_per_night, minimum_nights, star_rating, number_of_reviews,
  has_availability, availability_30, picture_url
) VALUES
('test001', 'Skyline Manhattan Hotel', 'New York', 'NY', 'Manhattan', 'Manhattan',
 40.7580, -73.9855, 'Hotel', 'Entire home/apt', 4, 2, 2, 1.5, 189.99, 2, 4.5, 234, TRUE, 25,
 'https://images.unsplash.com/photo-1566073771259-6a8506099945'),

('test002', 'Brooklyn Heights Inn', 'Brooklyn', 'NY', 'Brooklyn Heights', 'Brooklyn Heights',
 40.6956, -73.9946, 'Boutique hotel', 'Private room', 2, 1, 1, 1.0, 129.99, 1, 4.2, 145, TRUE, 28,
 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb'),

('test003', 'Times Square Luxury Suite', 'New York', 'NY', 'Midtown', 'Midtown',
 40.7589, -73.9851, 'Apartment', 'Entire home/apt', 6, 3, 3, 2.0, 299.99, 3, 4.8, 567, TRUE, 20,
 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'),

('test004', 'Williamsburg Loft', 'Brooklyn', 'NY', 'Williamsburg', 'Williamsburg',
 40.7081, -73.9571, 'Loft', 'Entire home/apt', 4, 2, 2, 1.0, 159.99, 2, 4.6, 89, TRUE, 30,
 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'),

('test005', 'Central Park View Apartment', 'New York', 'NY', 'Upper West Side', 'Upper West Side',
 40.7794, -73.9632, 'Apartment', 'Entire home/apt', 5, 2, 3, 1.5, 249.99, 2, 4.7, 312, TRUE, 18,
 'https://images.unsplash.com/photo-1571896349842-33c89424de2d'),

('test006', 'East Village Studio', 'New York', 'NY', 'East Village', 'East Village',
 40.7265, -73.9815, 'Studio', 'Entire home/apt', 2, 1, 1, 1.0, 99.99, 1, 4.3, 178, TRUE, 29,
 'https://images.unsplash.com/photo-1590490360182-c33d57733427'),

('test007', 'Park Slope Family Home', 'Brooklyn', 'NY', 'Park Slope', 'Park Slope',
 40.6710, -73.9778, 'Townhouse', 'Entire home/apt', 8, 4, 5, 2.5, 399.99, 3, 4.9, 423, TRUE, 15,
 'https://images.unsplash.com/photo-1613977257363-707ba9348227'),

('test008', 'SoHo Chic Apartment', 'New York', 'NY', 'SoHo', 'SoHo',
 40.7233, -74.0030, 'Apartment', 'Entire home/apt', 3, 1, 2, 1.0, 219.99, 2, 4.4, 256, TRUE, 22,
 'https://images.unsplash.com/photo-1564078516393-cf04bd966897'),

('test009', 'DUMBO Waterfront Loft', 'Brooklyn', 'NY', 'DUMBO', 'DUMBO',
 40.7033, -73.9884, 'Loft', 'Entire home/apt', 4, 2, 2, 1.5, 279.99, 2, 4.7, 189, TRUE, 25,
 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0'),

('test010', 'Chelsea Modern Studio', 'New York', 'NY', 'Chelsea', 'Chelsea',
 40.7465, -74.0014, 'Studio', 'Entire home/apt', 2, 1, 1, 1.0, 149.99, 1, 4.1, 134, TRUE, 27,
 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf');

-- Add some amenities to hotels
INSERT INTO hotel_amenities (hotel_id, amenity_id)
SELECT h.hotel_id, a.amenity_id
FROM hotels h
CROSS JOIN amenities a
WHERE a.amenity_name IN ('Wifi', 'Air conditioning', 'Kitchen')
AND h.listing_id IN ('test001', 'test002', 'test003', 'test004', 'test005');

INSERT INTO hotel_amenities (hotel_id, amenity_id)
SELECT h.hotel_id, a.amenity_id
FROM hotels h
CROSS JOIN amenities a
WHERE a.amenity_name IN ('Wifi', 'TV', 'Washer', 'Dryer')
AND h.listing_id IN ('test006', 'test007', 'test008', 'test009', 'test010');

SELECT COUNT(*) as total_hotels FROM hotels;
SELECT hotel_name, city, price_per_night FROM hotels LIMIT 5;
