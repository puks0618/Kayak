# Role Separation - Quick Start Guide

## 🎯 What Changed?

**Before:** Admin portal allowed both owner and admin roles. Owners could approve listings.

**After:** 
- **Owners** can only manage their own car/hotel listings (create/edit/delete)
- **Admins** can only approve/reject pending listings (cannot create)
- **Separation enforced** at API Gateway level with role-based middleware

---

## 🚀 How to Test (5 Minutes)

### Step 1: Restart Services
```bash
cd kayak-microservices
docker-compose restart api-gateway listing-service admin-service
```

### Step 2: Create Admin User
```bash
docker exec -it kayak-mysql mysql -uroot -pSomalwar1! -e "
USE kayak_users;
INSERT INTO users (id, email, password, first_name, last_name, role, phone, ssn, zip_code, state_code)
VALUES (
  UUID(),
  'admin@kayak.com',
  '\$2b\$10\$YPFzHJZ5x5J5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5',
  'System',
  'Admin',
  'admin',
  '1234567890',
  '123456789',
  '12345',
  'CA'
) ON DUPLICATE KEY UPDATE email=email;
"
```

### Step 3: Test Owner Endpoints

**Get JWT Token for Owner:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "owner@kayak.com", "password": "password123"}'
```

**Create Car Listing (Owner):**
```bash
curl -X POST http://localhost:3000/api/owner/cars \
  -H "Authorization: Bearer <OWNER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Budget Rentals",
    "brand": "Toyota",
    "model": "Camry",
    "year": 2022,
    "type": "sedan",
    "transmission": "automatic",
    "seats": 5,
    "daily_rental_price": 45.00,
    "location": "Los Angeles"
  }'
```

**Expected:** `201 Created, status: pending`

**Try to Approve as Owner (Should Fail):**
```bash
curl -X PUT http://localhost:3000/api/admin/listings/cars/<car_id>/approve \
  -H "Authorization: Bearer <OWNER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

**Expected:** `403 Forbidden - This endpoint requires admin role`

### Step 4: Test Admin Endpoints

**Get JWT Token for Admin:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@kayak.com", "password": "Admin@123"}'
```

**Get Pending Listings (Admin):**
```bash
curl http://localhost:3000/api/admin/listings/pending \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected:** `200 OK, list of pending cars and hotels`

**Approve Car Listing (Admin):**
```bash
curl -X PUT http://localhost:3000/api/admin/listings/cars/<car_id>/approve \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved", "admin_comment": "Approved!"}'
```

**Expected:** `200 OK, car status updated to approved`

**Try to Create Car as Admin (Should Fail):**
```bash
curl -X POST http://localhost:3000/api/owner/cars \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"brand": "Toyota", ...}'
```

**Expected:** `403 Forbidden - This endpoint requires owner role`

---

## 📋 API Endpoints Reference

### Owner Endpoints
```
GET    /api/owner/cars              → Get my cars
POST   /api/owner/cars              → Create car (pending)
PUT    /api/owner/cars/:id          → Update my car
DELETE /api/owner/cars/:id          → Delete my car
GET    /api/owner/stats             → Owner dashboard stats
```

### Admin Endpoints
```
GET    /api/admin/listings/pending          → All pending listings
GET    /api/admin/listings/cars/pending     → Pending cars
PUT    /api/admin/listings/cars/:id/approve → Approve/reject car
GET    /api/admin/listings/stats            → Admin stats
```

---

## 🔐 Role Matrix

| Action | Owner | Admin |
|--------|-------|-------|
| Create listing | ✅ | ❌ |
| Edit own listing | ✅ | ❌ |
| Approve listings | ❌ | ✅ |
| View all listings | ❌ | ✅ |

---

## 🐛 Troubleshooting

### Issue: 403 Forbidden on owner endpoints
**Solution:** Make sure you're using owner JWT token, not admin token

### Issue: 502 Bad Gateway
**Solution:** Restart services: `docker-compose restart api-gateway listing-service`

### Issue: Cannot login to admin portal with owner account
**Solution:** This is correct behavior! Admin portal now only allows admin role.

### Issue: Admin service host not found
**Solution:** In docker-compose.yml, ensure service names match:
```yaml
services:
  admin-service:
    container_name: admin-service
```

---

## 📁 Files Created/Modified

**Created:**
- `api-gateway/src/middleware/rbac.js`
- `listing-service/src/routes/owner.routes.js`
- `listing-service/src/routes/admin.routes.js`
- `listing-service/src/controllers/admin-listings.controller.js`
- `ROLE_SEPARATION_STRATEGY.md`
- `ROLE_SEPARATION_COMPLETE.md`

**Modified:**
- `listing-service/src/modules/cars/controller.js` (added owner functions)
- `listing-service/src/modules/cars/model.js` (added findByOwner)
- `listing-service/src/server.js` (mounted new routes)
- `api-gateway/src/server.js` (added RBAC routes)
- `frontend/admin-portal/src/context/AuthContext.jsx` (admin-only)

---

## ✅ Success Indicators

1. Owner can create car → Status pending ✅
2. Owner tries to approve → 403 Forbidden ✅
3. Admin can approve pending car → Status approved ✅
4. Admin tries to create car → 403 Forbidden ✅
5. Admin portal rejects owner login → "Admin account required" ✅

---

## 🎯 Next: Implement Cars Module

Now that roles are separated, you can implement the Cars listing module:

1. **Owner Portal** (for owners to add cars)
   - Copy admin-portal structure
   - Change role check to `owner`
   - Add "Add Car" form

2. **Traveller Search** (web-client)
   - Search approved cars only
   - Book car functionality

3. **Hotels Module** (same pattern as Cars)
   - Your friend implements hotel owner functions
   - Admin approves hotel listings

See `TEAM_COORDINATION_PLAN.md` for full implementation guide.

---

**Ready to Test!** 🚀

Run the test steps above to verify role separation is working correctly.
