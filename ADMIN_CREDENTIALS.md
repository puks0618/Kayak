# Admin Portal Credentials

## Admin Users

### Primary Admin Account
- **Email:** admin@kayak.com
- **Password:** password123
- **Role:** admin

### Secondary Admin Account
- **Email:** superadmin@kayak.com
- **Password:** password123
- **Role:** admin

## Owner Accounts (for testing)
- **owner@kayak.com** - password123
- **host@kayak.com** - password123
- **bob@kayak.com** - password123
- **alice@kayak.com** - password123
- **charlie@kayak.com** - password123

## Regular User Accounts
- **david@example.com** - password123
- **emma@example.com** - password123
- **frank@example.com** - password123
- **grace@example.com** - password123
- **henry@example.com** - password123

## Access Admin Portal

1. Navigate to: http://localhost:5174/login
2. Login with admin credentials
3. JWT token will be stored in localStorage as 'admin-token'

## Test API Directly

```powershell
# Login
$loginResponse = Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method POST -Body (@{email='admin@kayak.com'; password='password123'} | ConvertTo-Json) -ContentType 'application/json'

# Get token
$token = $loginResponse.token

# Test admin endpoint
Invoke-RestMethod -Uri 'http://localhost:3000/api/admin/cars' -Method GET -Headers @{Authorization="Bearer $token"}
```

## Seeded Data Summary

### Flights: 10
- AA123, UA456, DL789, SW111, BA222, AA333, UA444, DL555, SW666, AA777
- Prices: $100 - $1200
- Routes: SFO-JFK, LAX-ORD, JFK-LAX, SFO-LAS, SFO-LHR, etc.

### Hotels: 10
- Grand Hyatt, Marriott, Holiday Inn, Ritz-Carlton, Best Western, etc.
- Star Ratings: 2-5 stars
- Price per night: $120 - $600
- Cities: San Francisco, San Jose, New York, Los Angeles

### Cars: 12
- Companies: Hertz, Enterprise, Budget, Avis
- Types: sedan, SUV, luxury, economy, compact, van
- Brands: Toyota, Honda, Ford, BMW, Mercedes-Benz, etc.
- Daily rates: $38 - $180
- Locations: SFO, LAX, JFK, ORD, SEA, MIA, ATL, LAS

### Bookings: 15
- Status: completed (13), confirmed (1), pending (1)
- Total amounts: $100 - $3000

### Billing Records: 15
- Status: paid (13), pending (2)
- Total amounts (with tax): $110 - $3300
- Payment methods: credit_card, paypal, debit_card

## Available Admin Endpoints

### Cars
- GET /api/admin/cars - List all cars
- GET /api/admin/cars/:id - Get car details
- POST /api/admin/cars - Create car
- PUT /api/admin/cars/:id - Update car
- DELETE /api/admin/cars/:id - Delete car

### Flights
- GET /api/admin/flights - List all flights
- GET /api/admin/flights/:id - Get flight details
- POST /api/admin/flights - Create flight
- PUT /api/admin/flights/:id - Update flight
- DELETE /api/admin/flights/:id - Delete flight

### Hotels
- GET /api/admin/hotels - List all hotels
- GET /api/admin/hotels/:id - Get hotel details
- POST /api/admin/hotels - Create hotel
- PUT /api/admin/hotels/:id - Update hotel
- DELETE /api/admin/hotels/:id - Delete hotel

### Users
- GET /api/admin/users - List all users
- GET /api/admin/users/:id - Get user details
- POST /api/admin/users - Create user
- PUT /api/admin/users/:id - Update user
- DELETE /api/admin/users/:id - Delete user

### Billing
- GET /api/admin/bills - Search bills (query params: status, startDate, endDate, minAmount, maxAmount, userId)

### Analytics
- GET /api/admin/analytics/top-properties - Top properties by revenue
- GET /api/admin/analytics/city-revenue - Revenue by destination city
- GET /api/admin/analytics/top-hosts - Top hosts by revenue (query param: month)

## Troubleshooting

### 401 Unauthorized Error
- Ensure you're logged in with admin account
- Check that JWT token is in localStorage
- Token expires after configured time (check JWT_SECRET in .env)

### Empty Data Responses
- Verify seed data loaded: `docker exec kayak-mysql mysql -uroot -pSomalwar1! -e "USE kayak_listings; SELECT COUNT(*) FROM cars;"`
- Re-run seed scripts if needed

### Services Not Running
- Check Docker containers: `docker ps`
- Restart admin-service: `docker-compose restart admin-service`
- Check logs: `docker logs kayak-admin-service`
