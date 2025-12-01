# 🚗 Cars Module - Integration Guide for Team

## Overview
This Cars module provides Kayak.com-style car rental search functionality. It's fully integrated into the listing-service and ready to use alongside Flights and Stays modules.

---

## 📋 Quick Start for Teammates

### Step 1: Pull the Cars Branch
```bash
git checkout Cars  # or your cars branch name
git pull origin Cars
```

### Step 2: Run Database Migration

**Option A: If starting fresh (recommended):**
```bash
cd infrastructure/docker
docker-compose down
docker-compose up -d
```
The migration scripts will run automatically on fresh MySQL container.

**Option B: If your MySQL container is already running:**
```bash
# Run the migration script
docker exec -i kayak-mysql mysql -uroot -pSomalwar1! kayak_listings < infrastructure/databases/mysql/init/09-cars-migration-v2.sql

# Load sample data
docker exec -i kayak-mysql mysql -uroot -pSomalwar1! kayak_listings < infrastructure/databases/mysql/init/10-cars-seed-data.sql
```

### Step 3: Verify Migration
```bash
# Check if new columns exist
docker exec -it kayak-mysql mysql -uroot -pSomalwar1! -e "DESCRIBE kayak_listings.cars;"

# Check sample data
docker exec -it kayak-mysql mysql -uroot -pSomalwar1! -e "SELECT COUNT(*) FROM kayak_listings.cars;"
```

### Step 4: Test the API
```bash
# Search for cars
curl "http://localhost:3003/api/listings/cars/search?location=Los%20Angeles&pickupDate=2025-12-14&dropoffDate=2025-12-18"

# Get car types
curl "http://localhost:3003/api/listings/cars/types?location=Los%20Angeles"

# Get rental companies
curl "http://localhost:3003/api/listings/cars/companies?location=Los%20Angeles"
```

---

## 🗄️ Database Changes

### New Columns Added to `cars` Table:
| Column | Type | Description |
|--------|------|-------------|
| `owner_id` | VARCHAR(36) | Links car to owner account |
| `approval_status` | ENUM | pending, approved, rejected |
| `images` | JSON | Array of image URLs |
| `features` | JSON | Array of features (GPS, Bluetooth, etc.) |
| `fuel_type` | ENUM | gasoline, diesel, electric, hybrid |
| `doors` | INT | Number of doors (default: 4) |
| `baggage_capacity` | INT | Number of bags (default: 2) |
| `mileage_limit` | INT | Daily mileage limit (0 = unlimited) |
| `insurance_included` | BOOLEAN | Is insurance included? |
| `cancellation_policy` | VARCHAR(255) | Cancellation terms |
| `description` | TEXT | Detailed car description |

### New Tables Created:
1. **`car_bookings`** - Tracks car rental bookings
2. **`car_availability`** - Manages car availability calendar
3. **`car_reviews`** - Stores customer reviews

---

## 🔌 API Endpoints

### Public Search Endpoints

#### 1. Search Cars (Main endpoint)
```http
GET /api/listings/cars/search

Query Parameters:
- location* (required): "Los Angeles", "New York", etc.
- pickupDate: "2025-12-14" (YYYY-MM-DD)
- dropoffDate: "2025-12-18" (YYYY-MM-DD)
- type: "sedan", "suv", "economy", "luxury", "compact", "van"
- transmission: "automatic", "manual"
- seats: minimum number of seats (e.g., 5, 7)
- minPrice: minimum daily price
- maxPrice: maximum daily price
- company: "Hertz", "Enterprise", etc.
- sortBy: "price", "rating", "brand", "popularity"
- sortOrder: "asc", "desc"
- limit: results per page (default: 50)
- offset: pagination offset (default: 0)

Example Response:
{
  "success": true,
  "cars": [{
    "id": "car-001",
    "company_name": "Hertz",
    "brand": "Toyota",
    "model": "Camry",
    "year": 2024,
    "type": "sedan",
    "transmission": "automatic",
    "daily_rental_price": 54.99,
    "rental_days": 4,
    "total_price": "219.96",
    "location": "Los Angeles (LAX)",
    "rating": 4.8,
    "images": ["..."],
    "features": ["Air Conditioning", "Bluetooth", ...]
  }],
  "count": 15,
  "rental_days": 4
}
```

#### 2. Get Available Car Types
```http
GET /api/listings/cars/types?location=Los Angeles

Response:
{
  "success": true,
  "types": [
    {
      "type": "economy",
      "count": 8,
      "min_price": 32.99,
      "max_price": 42.99
    },
    ...
  ]
}
```

#### 3. Get Rental Companies
```http
GET /api/listings/cars/companies?location=Los Angeles

Response:
{
  "success": true,
  "companies": [
    {
      "company_name": "Hertz",
      "car_count": 12,
      "avg_rating": 4.7
    },
    ...
  ]
}
```

#### 4. Get Car Details
```http
GET /api/listings/cars/:id

Response:
{
  "success": true,
  "car": { ... full car details ... }
}
```

#### 5. Check Availability
```http
POST /api/listings/cars/:id/check-availability
Body: {
  "pickupDate": "2025-12-14",
  "dropoffDate": "2025-12-18"
}

Response:
{
  "success": true,
  "car_id": "car-001",
  "available": true,
  "pickup_date": "2025-12-14",
  "dropoff_date": "2025-12-18"
}
```

#### 6. Get Price Statistics
```http
GET /api/listings/cars/price-stats?location=Los Angeles

Response:
{
  "success": true,
  "location": "Los Angeles",
  "stats": [
    {
      "type": "economy",
      "min_price": 32.99,
      "max_price": 42.99,
      "avg_price": 37.50
    },
    ...
  ]
}
```

---

## 🎨 Frontend Integration

### Sample Search Request
```javascript
// src/services/carService.js
export const searchCars = async (searchParams) => {
  const query = new URLSearchParams(searchParams).toString();
  const response = await fetch(`/api/listings/cars/search?${query}`);
  return response.json();
};

// Usage in component
const handleSearch = async () => {
  const results = await searchCars({
    location: 'Los Angeles',
    pickupDate: '2025-12-14',
    dropoffDate: '2025-12-18',
    type: 'suv',
    sortBy: 'price'
  });
  
  console.log(results.cars); // Array of cars
};
```

### Car Card Component Example
```jsx
<CarCard 
  car={car}
  rentalDays={4}
  onSelect={() => navigate(`/cars/${car.id}`)}
/>
```

---

## 🔒 Owner & Admin Features

### Owner Endpoints (Require Authentication)
```http
GET /api/owner/cars - Get my car listings
POST /api/owner/cars - Create new listing (approval required)
PATCH /api/owner/cars/:id - Update my listing
DELETE /api/owner/cars/:id - Delete my listing
```

### Admin Endpoints
```http
POST /api/listings/cars - Create car (auto-approved)
PATCH /api/listings/cars/:id - Update car
DELETE /api/listings/cars/:id - Delete car
```

---

## 🧪 Testing

### Test with Sample Data
The seed script (`10-cars-seed-data.sql`) includes 20 sample cars across multiple locations:
- Los Angeles (LAX) - 12 cars
- New York (JFK) - 3 cars
- San Francisco (SFO) - 2 cars
- Las Vegas (LAS) - 3 cars

### Test Scenarios
```bash
# 1. Basic search
curl "http://localhost:3003/api/listings/cars/search?location=Los%20Angeles"

# 2. Filtered search (SUVs only, sorted by price)
curl "http://localhost:3003/api/listings/cars/search?location=Los%20Angeles&type=suv&sortBy=price"

# 3. Price range filter
curl "http://localhost:3003/api/listings/cars/search?location=Los%20Angeles&minPrice=30&maxPrice=60"

# 4. With dates (checks availability)
curl "http://localhost:3003/api/listings/cars/search?location=Los%20Angeles&pickupDate=2025-12-14&dropoffDate=2025-12-18"

# 5. Specific company
curl "http://localhost:3003/api/listings/cars/search?location=Los%20Angeles&company=Hertz"
```

---

## 🔄 Integration with Your Branches

### For Flights Team:
- Cars module follows the same pattern as flights
- Located in: `services/listing-service/src/modules/cars/`
- Uses same database: `kayak_listings`
- API Gateway routing already configured

### For Stays Team:
- Similar structure to hotels module
- Shares Redis caching infrastructure
- Uses same approval workflow for owner listings

### Common Patterns:
```javascript
// All modules follow this structure:
/services/listing-service/src/modules/
  ├── flights/
  │   ├── controller.js  // API handlers
  │   ├── model.js       // Database queries
  │   └── route.js       // Express routes
  ├── hotels/
  │   └── ...
  └── cars/
      └── ...
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Migration Fails
**Solution:**
```bash
# Drop and recreate
docker-compose down -v
docker-compose up -d
```

### Issue 2: No Cars Returned
**Solution:**
```bash
# Verify data exists
docker exec -it kayak-mysql mysql -uroot -pSomalwar1! -e "SELECT COUNT(*) FROM kayak_listings.cars WHERE approval_status='approved';"

# Re-run seed script if needed
docker exec -i kayak-mysql mysql -uroot -pSomalwar1! kayak_listings < infrastructure/databases/mysql/init/10-cars-seed-data.sql
```

### Issue 3: Port 3003 Not Responding
**Solution:**
```bash
# Restart listing-service
docker-compose restart kayak-listing-service
docker logs kayak-listing-service
```

---

## 📝 Code Structure

```
services/listing-service/
├── src/
│   ├── modules/
│   │   ├── cars/
│   │   │   ├── controller.js  ← All API logic (search, filters, etc.)
│   │   │   ├── model.js       ← Database queries with complex joins
│   │   │   └── route.js       ← Route definitions
│   │   ├── flights/
│   │   └── hotels/
│   ├── server.js              ← Includes cars routes
│   └── ...
└── tests/
    └── listing.test.js        ← Add car tests here
```

---

## 🎯 Next Steps for Your Work

1. **Frontend Team**: Create CarResults.jsx and CarDetail.jsx pages
2. **Booking Team**: Integrate car bookings with booking-service
3. **Analytics Team**: Add car search analytics
4. **Owner Portal**: Build car listing management UI

---

## 📞 Questions?

If you encounter issues:
1. Check the migration ran successfully
2. Verify sample data loaded
3. Test API endpoints with curl
4. Check Docker logs: `docker logs kayak-listing-service`

---

## 📚 Additional Resources

- **Kayak.com Cars Reference**: https://www.kayak.com/cars
- **API Gateway Config**: `api-gateway/src/config/routes.js`
- **Database Schema**: `infrastructure/databases/mysql/init/03-listings.sql`
- **Sample Data**: `infrastructure/databases/mysql/init/10-cars-seed-data.sql`

---

**Last Updated**: November 30, 2025  
**Module Version**: 1.0.0  
**Compatible with**: Flights & Stays branches
