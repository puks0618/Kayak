-- Updated Cars Seed Data with Local Images
-- Maps existing car IDs to local image paths

-- Economy
UPDATE cars SET images = JSON_ARRAY('/car-images/economy/yaris.jpg') WHERE id = 'car-001'; -- Toyota Yaris
UPDATE cars SET images = JSON_ARRAY('/car-images/economy/accent.jpg') WHERE id = 'car-002'; -- Hyundai Accent

-- Compact
UPDATE cars SET images = JSON_ARRAY('/car-images/compact/corolla.jpg') WHERE id = 'car-013'; -- Toyota Corolla
UPDATE cars SET images = JSON_ARRAY('/car-images/compact/civic.jpg') WHERE id = 'car-014'; -- Honda Civic
UPDATE cars SET images = JSON_ARRAY('/car-images/compact/mazda3.jpg') WHERE id = 'car-003'; -- Nissan Versa (using Mazda3)
UPDATE cars SET images = JSON_ARRAY('/car-images/compact/elantra.jpg') WHERE id = 'car-004'; -- Chevrolet Malibu (using Elantra)

-- Sedan
UPDATE cars SET images = JSON_ARRAY('/car-images/sedan/camry.jpg') WHERE id = 'car-005'; -- Toyota Camry
UPDATE cars SET images = JSON_ARRAY('/car-images/sedan/accord.jpg') WHERE id = 'car-006'; -- Honda Accord
UPDATE cars SET images = JSON_ARRAY('/car-images/sedan/altima.jpg') WHERE id = 'car-015'; -- Nissan Altima

-- SUV
UPDATE cars SET images = JSON_ARRAY('/car-images/suv/rav4.jpg') WHERE id = 'car-008'; -- Toyota RAV4
UPDATE cars SET images = JSON_ARRAY('/car-images/suv/explorer.jpg') WHERE id = 'car-009'; -- Ford Explorer
UPDATE cars SET images = JSON_ARRAY('/car-images/suv/cherokee.jpg') WHERE id = 'car-007'; -- Jeep Wrangler (using Cherokee)
UPDATE cars SET images = JSON_ARRAY('/car-images/suv/highlander.jpg') WHERE id = 'car-020'; -- Kia Telluride (using Highlander)
UPDATE cars SET images = JSON_ARRAY('/car-images/suv/pilot.jpg') WHERE id = 'car-019'; -- Mazda CX-5 (using Pilot)
UPDATE cars SET images = JSON_ARRAY('/car-images/suv/crv.jpg') WHERE id = 'car-017'; -- Ford Escape (using CR-V)

-- Luxury
UPDATE cars SET images = JSON_ARRAY('/car-images/luxury/bmw3.jpg') WHERE id = 'car-010'; -- BMW 3 Series
UPDATE cars SET images = JSON_ARRAY('/car-images/luxury/c-class.jpg') WHERE id = 'car-011'; -- Mercedes-Benz C-Class
UPDATE cars SET images = JSON_ARRAY('/car-images/luxury/a4.jpg') WHERE id = 'car-016'; -- Tesla Model 3 (using A4)
UPDATE cars SET images = JSON_ARRAY('/car-images/luxury/genesis.jpg') WHERE id = 'car-018'; -- Chevrolet Corvette (using Genesis)

-- Van
UPDATE cars SET images = JSON_ARRAY('/car-images/van/pacifica.jpg') WHERE id = 'car-012'; -- Chrysler Pacifica
