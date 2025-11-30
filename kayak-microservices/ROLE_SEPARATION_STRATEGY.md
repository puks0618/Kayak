# Role Separation Strategy

## 🎯 Current Problem
- Admin portal allows both `owner` and `admin` roles to access it
- Admin functionality (approve listings, manage users) is available to owners
- No clear distinction between owner operations and admin operations

## ✅ Solution: Separate Owner and Admin Roles

### Role Definitions

| Role | Capabilities | Portal Access |
|------|-------------|---------------|
| **traveller** | - Search listings<br>- Book cars/hotels<br>- View bookings | Web Client (Port 5175) |
| **owner** | - Create/Edit/Delete their own listings<br>- View their bookings<br>- See their revenue | Owner Portal (Port 5174) |
| **admin** | - Approve/Reject pending listings<br>- View all users<br>- Manage system<br>- View analytics | Admin Portal (New - Port 5173) |

---

## 🔧 Implementation Steps

### 1. Create Middleware for Role Checks

**File:** `/kayak-microservices/api-gateway/src/middleware/rbac.js`

```javascript
/**
 * Role-Based Access Control Middleware
 */
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Base authentication - verifies JWT token
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains: { id, email, role }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Check if user is an owner
const isOwner = (req, res, next) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'This endpoint requires owner role'
    });
  }
  next();
};

// Check if user is an admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'This endpoint requires admin role'
    });
  }
  next();
};

// Check if user is traveller
const isTraveller = (req, res, next) => {
  if (req.user.role !== 'traveller') {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'This endpoint requires traveller role'
    });
  }
  next();
};

// Check if user is owner or admin (for viewing certain data)
const isOwnerOrAdmin = (req, res, next) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'This endpoint requires owner or admin role'
    });
  }
  next();
};

module.exports = {
  authenticate,
  isOwner,
  isAdmin,
  isTraveller,
  isOwnerOrAdmin
};
```

---

### 2. Update Listing Service Routes

**File:** `/kayak-microservices/services/listing-service/src/routes/owner.routes.js` (NEW)

```javascript
/**
 * Owner Routes - Owners manage their own listings
 */
const express = require('express');
const router = express.Router();
const carsController = require('../modules/cars/controller');
const hotelsController = require('../modules/hotels/controller');

// Note: API Gateway will apply authenticate + isOwner middleware before reaching here

// Owner Car Management
router.get('/cars', carsController.getMyListings);           // Get owner's cars
router.post('/cars', carsController.createListing);          // Create new car (status: pending)
router.put('/cars/:id', carsController.updateMyListing);     // Update own car
router.delete('/cars/:id', carsController.deleteMyListing);  // Delete own car

// Owner Hotel Management
router.get('/hotels', hotelsController.getMyListings);
router.post('/hotels', hotelsController.createListing);
router.put('/hotels/:id', hotelsController.updateMyListing);
router.delete('/hotels/:id', hotelsController.deleteMyListing);

// Owner Dashboard Stats
router.get('/stats', async (req, res) => {
  const owner_id = req.user.id;
  // Return: total listings, approved listings, pending listings, total revenue
  // TODO: Implement stats aggregation
});

module.exports = router;
```

**File:** `/kayak-microservices/services/listing-service/src/routes/admin.routes.js` (NEW)

```javascript
/**
 * Admin Routes - Admins approve/reject listings
 */
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin-listings.controller');

// Note: API Gateway will apply authenticate + isAdmin middleware before reaching here

// Get Pending Listings
router.get('/cars/pending', adminController.getPendingCars);
router.get('/hotels/pending', adminController.getPendingHotels);
router.get('/pending', adminController.getAllPending); // All pending listings

// Approve/Reject Listings
router.put('/cars/:id/approve', adminController.approveCarListing);
router.put('/hotels/:id/approve', adminController.approveHotelListing);

// Get All Listings (for admin view)
router.get('/cars', adminController.getAllCars);
router.get('/hotels', adminController.getAllHotels);

module.exports = router;
```

---

### 3. Update Car Controller with Owner Functions

**File:** `/kayak-microservices/services/listing-service/src/modules/cars/controller.js`

Add these functions:

```javascript
// Owner gets only their listings
async getMyListings(req, res) {
  try {
    const owner_id = req.user.id;
    const cars = await CarModel.findByOwner(owner_id);
    res.json({ cars });
  } catch (error) {
    console.error('Get my listings error:', error);
    res.status(500).json({ error: 'Failed to get listings' });
  }
}

// Owner creates a new car listing (pending approval)
async createListing(req, res) {
  try {
    const owner_id = req.user.id;
    const carData = {
      ...req.body,
      owner_id,
      approval_status: 'pending' // New listings start as pending
    };
    const car = await CarModel.create(carData);
    res.status(201).json({ 
      message: 'Car listing created, pending admin approval',
      car 
    });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ error: 'Failed to create listing' });
  }
}

// Owner updates their own listing
async updateMyListing(req, res) {
  try {
    const owner_id = req.user.id;
    const car_id = req.params.id;
    
    // Verify ownership
    const car = await CarModel.findById(car_id);
    if (!car || car.owner_id !== owner_id) {
      return res.status(403).json({ error: 'Access denied: Not your listing' });
    }
    
    // Update and reset approval status if content changed
    const updatedData = {
      ...req.body,
      approval_status: 'pending' // Re-require approval after edit
    };
    
    await CarModel.update(car_id, updatedData);
    res.json({ message: 'Listing updated, pending re-approval' });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ error: 'Failed to update listing' });
  }
}

// Owner deletes their own listing
async deleteMyListing(req, res) {
  try {
    const owner_id = req.user.id;
    const car_id = req.params.id;
    
    // Verify ownership
    const car = await CarModel.findById(car_id);
    if (!car || car.owner_id !== owner_id) {
      return res.status(403).json({ error: 'Access denied: Not your listing' });
    }
    
    await CarModel.delete(car_id);
    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
}
```

---

### 4. Create Admin Listings Controller

**File:** `/kayak-microservices/services/listing-service/src/controllers/admin-listings.controller.js` (NEW)

```javascript
/**
 * Admin Listings Controller
 * Admins approve/reject owner listings
 */
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Somalwar1!',
  database: process.env.DB_NAME || 'kayak_listings',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

class AdminListingsController {
  // Get all pending car listings
  async getPendingCars(req, res) {
    try {
      const [cars] = await pool.execute(
        'SELECT * FROM kayak_listings.cars WHERE approval_status = "pending" ORDER BY created_at DESC'
      );
      res.json({ cars });
    } catch (error) {
      console.error('Get pending cars error:', error);
      res.status(500).json({ error: 'Failed to get pending cars' });
    }
  }

  // Get all pending hotel listings
  async getPendingHotels(req, res) {
    try {
      const [hotels] = await pool.execute(
        'SELECT * FROM kayak_listings.hotels WHERE approval_status = "pending" ORDER BY created_at DESC'
      );
      res.json({ hotels });
    } catch (error) {
      console.error('Get pending hotels error:', error);
      res.status(500).json({ error: 'Failed to get pending hotels' });
    }
  }

  // Get all pending listings (cars + hotels)
  async getAllPending(req, res) {
    try {
      const [cars] = await pool.execute(
        'SELECT *, "car" as listing_type FROM kayak_listings.cars WHERE approval_status = "pending"'
      );
      const [hotels] = await pool.execute(
        'SELECT *, "hotel" as listing_type FROM kayak_listings.hotels WHERE approval_status = "pending"'
      );
      
      const allPending = [...cars, ...hotels].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      res.json({ pending_listings: allPending, count: allPending.length });
    } catch (error) {
      console.error('Get all pending error:', error);
      res.status(500).json({ error: 'Failed to get pending listings' });
    }
  }

  // Approve or reject car listing
  async approveCarListing(req, res) {
    try {
      const car_id = req.params.id;
      const { status, admin_comment } = req.body; // status: 'approved' or 'rejected'
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      await pool.execute(
        'UPDATE kayak_listings.cars SET approval_status = ?, admin_comment = ?, approved_at = NOW() WHERE id = ?',
        [status, admin_comment || null, car_id]
      );

      res.json({ message: `Car listing ${status}` });
    } catch (error) {
      console.error('Approve car error:', error);
      res.status(500).json({ error: 'Failed to approve car listing' });
    }
  }

  // Approve or reject hotel listing
  async approveHotelListing(req, res) {
    try {
      const hotel_id = req.params.id;
      const { status, admin_comment } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      await pool.execute(
        'UPDATE kayak_listings.hotels SET approval_status = ?, admin_comment = ?, approved_at = NOW() WHERE id = ?',
        [status, admin_comment || null, hotel_id]
      );

      res.json({ message: `Hotel listing ${status}` });
    } catch (error) {
      console.error('Approve hotel error:', error);
      res.status(500).json({ error: 'Failed to approve hotel listing' });
    }
  }

  // Get all cars (for admin dashboard)
  async getAllCars(req, res) {
    try {
      const { status } = req.query; // approved, pending, rejected
      let query = 'SELECT * FROM kayak_listings.cars';
      const params = [];
      
      if (status && ['approved', 'pending', 'rejected'].includes(status)) {
        query += ' WHERE approval_status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY created_at DESC';
      const [cars] = await pool.execute(query, params);
      res.json({ cars });
    } catch (error) {
      console.error('Get all cars error:', error);
      res.status(500).json({ error: 'Failed to get cars' });
    }
  }

  // Get all hotels (for admin dashboard)
  async getAllHotels(req, res) {
    try {
      const { status } = req.query;
      let query = 'SELECT * FROM kayak_listings.hotels';
      const params = [];
      
      if (status && ['approved', 'pending', 'rejected'].includes(status)) {
        query += ' WHERE approval_status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY created_at DESC';
      const [hotels] = await pool.execute(query, params);
      res.json({ hotels });
    } catch (error) {
      console.error('Get all hotels error:', error);
      res.status(500).json({ error: 'Failed to get hotels' });
    }
  }
}

module.exports = new AdminListingsController();
```

---

### 5. Update Car Model with Owner Methods

**File:** `/kayak-microservices/services/listing-service/src/modules/cars/model.js`

Add these methods:

```javascript
// Find all cars by owner
async findByOwner(owner_id) {
  const [rows] = await pool.execute(
    'SELECT * FROM kayak_listings.cars WHERE owner_id = ? ORDER BY created_at DESC',
    [owner_id]
  );
  return rows;
}

// Find single car by ID (for ownership verification)
async findById(car_id) {
  const [rows] = await pool.execute(
    'SELECT * FROM kayak_listings.cars WHERE id = ?',
    [car_id]
  );
  return rows[0];
}

// Update existing car (used by owners)
async update(car_id, updates) {
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), car_id];
  
  await pool.execute(
    `UPDATE kayak_listings.cars SET ${fields} WHERE id = ?`,
    values
  );
}

// Delete car (soft delete recommended)
async delete(car_id) {
  await pool.execute(
    'UPDATE kayak_listings.cars SET deleted_at = NOW() WHERE id = ?',
    [car_id]
  );
}
```

---

### 6. Update API Gateway Routes

**File:** `/kayak-microservices/api-gateway/src/server.js`

```javascript
const { authenticate, isOwner, isAdmin, isTraveller } = require('./middleware/rbac');

// Owner routes (protected with authenticate + isOwner)
app.use('/api/owner/listings', authenticate, isOwner, proxy('http://listing-service:3003/api/owner'));

// Admin routes (protected with authenticate + isAdmin)
app.use('/api/admin/listings', authenticate, isAdmin, proxy('http://listing-service:3003/api/admin'));
app.use('/api/admin', authenticate, isAdmin, proxy('http://admin-service:3007/api/admin'));

// Public listing routes (search, view approved listings)
app.use('/api/listings', proxy('http://listing-service:3003/api/listings'));

// Booking routes (protected with authenticate only)
app.use('/api/bookings', authenticate, proxy('http://booking-service:3002/api/bookings'));
```

---

### 7. Update Listing Service to Mount New Routes

**File:** `/kayak-microservices/services/listing-service/src/server.js`

```javascript
const ownerRoutes = require('./routes/owner.routes');
const adminListingsRoutes = require('./routes/admin.routes');

// Owner routes (req.user already populated by API gateway)
app.use('/api/owner', ownerRoutes);

// Admin routes for listings
app.use('/api/admin', adminListingsRoutes);

// Existing public routes
app.use('/api/listings/flights', flightRoutes);
app.use('/api/listings/hotels', hotelRoutes);
app.use('/api/listings/cars', carRoutes);
app.use('/api/listings', listingsRoutes);
```

---

### 8. Update Admin Portal Frontend

**File:** `/kayak-microservices/frontend/admin-portal/src/context/AuthContext.jsx`

```javascript
// Only allow admin role to login to admin portal
const login = async (email, password) => {
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    
    // CRITICAL: Only admins can access admin portal
    if (data.user.role !== 'admin') {
      throw new Error('Access denied. Admin account required.');
    }
    
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    setUser(data.user);
    
    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Remove registration from admin portal (admins created via CLI/seeding)
```

---

### 9. Create Owner Portal Frontend (Separate from Admin)

**Option 1:** Use existing admin portal but rename it to "Owner Portal" and change role check to `owner`

**Option 2:** Create a new owner portal at a different port (recommended)

**File:** `/kayak-microservices/frontend/owner-portal/...` (NEW)
- Copy structure from admin-portal
- Change AuthContext to require `role === 'owner'`
- Update dashboard to show owner-specific stats
- Add pages: My Listings, Add Listing, Edit Listing

---

## 🎯 Testing Checklist

### Test 1: Owner Can Manage Own Listings ✅
- Owner logs in to Owner Portal
- Creates car listing → Status: Pending
- Views "My Listings" → Sees only their cars
- Edits own car → Status resets to Pending
- Deletes own car → Car removed

### Test 2: Owner Cannot Access Admin Functions ❌
- Owner tries `GET /api/admin/listings/pending` → 403 Forbidden
- Owner tries `PUT /api/admin/cars/:id/approve` → 403 Forbidden
- Owner tries to access Admin Portal → Login denied

### Test 3: Admin Can Approve Listings ✅
- Admin logs in to Admin Portal
- Views pending cars/hotels → Sees all pending listings
- Approves car listing → Status: Approved
- Rejects hotel listing → Status: Rejected
- Cannot create new listings (no create button in UI)

### Test 4: Admin Cannot Create Listings ❌
- Admin tries `POST /api/owner/listings/cars` → 403 Forbidden
- Admin Portal UI has no "Add Listing" button

### Test 5: Traveller Can Only Book ✅
- Traveller logs in to Web Client
- Searches cars/hotels → Sees only approved listings
- Books car → Booking created
- Cannot access Owner or Admin portals

---

## 📋 Summary

| Action | Owner | Admin | Traveller |
|--------|-------|-------|-----------|
| Create car/hotel listing | ✅ | ❌ | ❌ |
| Edit own listing | ✅ | ❌ | ❌ |
| Delete own listing | ✅ | ❌ | ❌ |
| Approve listings | ❌ | ✅ | ❌ |
| View all listings | ❌ | ✅ | Only approved |
| Manage users | ❌ | ✅ | ❌ |
| Book listings | ✅ | ✅ | ✅ |

---

## 🚀 Implementation Order

1. ✅ Create RBAC middleware (`rbac.js`)
2. Create owner routes (`owner.routes.js`)
3. Create admin routes (`admin.routes.js`)
4. Update car controller with owner functions
5. Create admin-listings controller
6. Update car model with owner methods
7. Update API gateway to use RBAC middleware
8. Update listing service server to mount new routes
9. Update admin portal to only allow admin role
10. Test role separation
