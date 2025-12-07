# Team Coordination Plan - Cars & Hotels Implementation

## ✅ **Already Done by Team**
- Database schema: `owner_id`, `approval_status`, `images` columns exist in cars & hotels
- Bookings table: `listing_type`, `listing_id` columns exist
- UI: Traveler portal (5175), Owner portal (5174), Admin portal (5174)
- Auth: Role-based system (traveler/owner) working

---

## 🚧 **What's Missing & Who Does What**

### **YOU (Cars Module)**

#### **Step 1: Update Car Model to use owner_id**
File: `/kayak-microservices/services/listing-service/src/modules/cars/model.js`

Add owner_id to create function:
```javascript
async create(carData) {
  const {
    owner_id,  // ADD THIS
    company_name, brand, model, year, type, transmission,
    seats, daily_rental_price, location, availability_status
  } = carData;

  const query = `
    INSERT INTO cars 
    (id, owner_id, company_name, brand, model, year, type, transmission, seats, daily_rental_price, location, availability_status, approval_status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `;

  await pool.execute(query, [
    id, owner_id, company_name, brand, model, year, type, transmission,
    seats, daily_rental_price, location, availability_status !== undefined ? availability_status : true
  ]);
}
```

#### **Step 2: Create Owner Car Listing API**
File: `/kayak-microservices/services/listing-service/src/modules/cars/controller.js`

Add these functions:
```javascript
// Owner lists their own cars
async getMyListings(req, res) {
  const owner_id = req.user.id; // From JWT middleware
  const cars = await CarModel.findByOwner(owner_id);
  res.json({ cars });
}

// Owner adds new car
async createListing(req, res) {
  const owner_id = req.user.id;
  const carData = { ...req.body, owner_id, approval_status: 'pending' };
  const car = await CarModel.create(carData);
  res.status(201).json({ car });
}
```

#### **Step 3: Create Admin Approval API**
File: `/kayak-microservices/services/admin-service/src/controllers/admin.controller.js`

```javascript
async getPendingCars(req, res) {
  const [cars] = await pool.execute(
    'SELECT * FROM kayak_listings.cars WHERE approval_status = "pending"'
  );
  res.json({ cars });
}

async approveCar(req, res) {
  const { id, status } = req.body; // status: 'approved' or 'rejected'
  await pool.execute(
    'UPDATE kayak_listings.cars SET approval_status = ? WHERE id = ?',
    [status, id]
  );
  res.json({ message: `Car ${status}` });
}
```

---

### **YOUR FRIEND (Hotels/Stays Module)**

#### **Step 1: Update Hotel Model to use owner_id**
File: `/kayak-microservices/services/listing-service/src/modules/hotels/model.js`

Same as cars - add `owner_id` parameter to create function.

#### **Step 2: Create Owner Hotel Listing API**
File: `/kayak-microservices/services/listing-service/src/modules/hotels/controller.js`

Same pattern as cars:
```javascript
async getMyListings(req, res) { ... }
async createListing(req, res) { ... }
```

#### **Step 3: Create Admin Approval API**
Same as cars but for hotels table.

---

### **BOTH TOGETHER (Booking Service)**

#### **Update Booking Model**
File: `/kayak-microservices/services/booking-service/src/models/booking.model.js`

```javascript
async create(bookingData) {
  const {
    user_id,
    listing_type,  // 'car' or 'hotel'
    listing_id,    // car_id or hotel_id
    travel_date,
    total_amount
  } = bookingData;

  // Get owner_id from the listing
  let owner_id;
  if (listing_type === 'car') {
    const [car] = await pool.execute('SELECT owner_id FROM kayak_listings.cars WHERE id = ?', [listing_id]);
    owner_id = car[0].owner_id;
  } else if (listing_type === 'hotel') {
    const [hotel] = await pool.execute('SELECT owner_id FROM kayak_listings.hotels WHERE id = ?', [listing_id]);
    owner_id = hotel[0].owner_id;
  }

  // Calculate commission
  const platform_commission = total_amount * 0.10;
  const owner_earnings = total_amount - platform_commission;

  const query = `
    INSERT INTO bookings 
    (id, user_id, listing_type, listing_id, owner_id, travel_date, total_amount, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `;

  await pool.execute(query, [uuidv4(), user_id, listing_type, listing_id, owner_id, travel_date, total_amount]);
}
```

---

## 📋 **API Routes to Add**

### **Owner Routes** (Both of you share this)
File: `/kayak-microservices/services/listing-service/src/routes/owner.routes.js` (NEW FILE)

```javascript
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth'); // JWT middleware

// Cars endpoints (YOU)
router.get('/cars', authMiddleware, carsController.getMyListings);
router.post('/cars', authMiddleware, carsController.createListing);
router.put('/cars/:id', authMiddleware, carsController.updateListing);
router.delete('/cars/:id', authMiddleware, carsController.deleteListing);

// Hotels endpoints (FRIEND)
router.get('/hotels', authMiddleware, hotelsController.getMyListings);
router.post('/hotels', authMiddleware, hotelsController.createListing);
router.put('/hotels/:id', authMiddleware, hotelsController.updateListing);
router.delete('/hotels/:id', authMiddleware, hotelsController.deleteListing);

module.exports = router;
```

### **Admin Routes**
File: `/kayak-microservices/services/admin-service/src/routes/admin.routes.js`

```javascript
// Add these to existing admin routes
router.get('/cars/pending', adminMiddleware, adminController.getPendingCars);
router.put('/cars/:id/approve', adminMiddleware, adminController.approveCar);
router.get('/hotels/pending', adminMiddleware, adminController.getPendingHotels);
router.put('/hotels/:id/approve', adminMiddleware, adminController.approveHotel);
```

---

## 🎯 **Work Distribution**

### **IMMEDIATE (Today - YOU)**
1. Create `owner.routes.js` file
2. Update `cars/controller.js` with owner functions
3. Update `cars/model.js` to include owner_id in create
4. Test: Owner can list cars with owner_id

### **TOMORROW (When Friend Wakes Up)**
Share this file with them and tell them to:
1. Update `hotels/controller.js` with same pattern as cars
2. Update `hotels/model.js` to include owner_id
3. Test: Owner can list hotels with owner_id

### **TOGETHER (Later)**
1. Fix booking service to handle cars & hotels
2. Update admin panel UI to show pending listings
3. Update owner portal UI to add listings
4. Test end-to-end flow

---

## 🚀 **Quick Test Plan**

### **Test 1: Owner Creates Car**
```bash
# Login as owner
POST localhost:3001/api/auth/login
{ "email": "owner@test.com", "password": "..." }

# Create car (should set owner_id automatically from JWT)
POST localhost:3003/api/owner/cars
{
  "company_name": "Johns Rentals",
  "brand": "Toyota",
  "model": "Camry",
  "year": 2024,
  "type": "sedan",
  "transmission": "automatic",
  "seats": 5,
  "daily_rental_price": 45,
  "location": "LAX"
}

# Response should have owner_id and approval_status='pending'
```

### **Test 2: Admin Approves Car**
```bash
# Login as admin
POST localhost:3001/api/auth/login

# Get pending cars
GET localhost:3007/api/admin/cars/pending

# Approve car
PUT localhost:3007/api/admin/cars/:id/approve
{ "status": "approved" }
```

### **Test 3: Traveler Searches**
```bash
# Search should only show approved cars
GET localhost:3004/api/search/cars?location=LAX

# Should NOT show pending or rejected cars
```

---

## 💡 **Important Notes**

1. **JWT Middleware**: Make sure auth middleware extracts `user.id` from JWT and attaches it to `req.user`
2. **Approval Status**: Default is 'pending', admin must approve before travelers can see
3. **Owner ID**: Automatically set from JWT, owners can't specify someone else's ID
4. **Commission**: 10% platform fee, 90% goes to owner
5. **Images**: JSON array of URLs, store in `images` column

---

## 📞 **Tell Your Friend Tomorrow**

"Hey! I updated the database and created a coordination plan. Check the file `TEAM_COORDINATION_PLAN.md` in the repo. 

**For Stays/Hotels:**
1. Update `hotels/model.js` - add owner_id to create function (line ~29)
2. Update `hotels/controller.js` - add getMyListings and createListing functions
3. Make sure approval_status defaults to 'pending'
4. Test that owners can add hotels and see them in their dashboard

I'm doing the same for Cars. We'll integrate booking service together later!"

---

## ✅ **Success Criteria**

- [ ] Owner can add car listing → saves with their owner_id
- [ ] Owner can view their own listings
- [ ] Admin can see pending listings
- [ ] Admin can approve/reject listings
- [ ] Travelers only see approved listings
- [ ] Same for hotels (friend's work)
- [ ] Booking creates record with correct owner_id
- [ ] Commission calculated correctly
