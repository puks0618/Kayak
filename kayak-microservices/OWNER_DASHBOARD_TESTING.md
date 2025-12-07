# Owner Dashboard Testing Guide

## Overview
The owner and admin roles have been completely separated. Owners now have their own dashboard at port 5175 (web-client) while admins use port 5174 (admin-portal).

---

## 🎯 Testing URLs

### Admin Portal (Port 5174)
- **Admin Login**: http://localhost:5174
- **Purpose**: Admin-only portal for managing platform listings
- **Access**: Admins only (no owner access)

### Web Client (Port 5175)
- **Home/Login**: http://localhost:5175
- **Owner Dashboard**: http://localhost:5175/owner/dashboard
- **Owner Car Listings**: http://localhost:5175/owner/cars
- **Add New Car**: http://localhost:5175/owner/cars/new
- **Purpose**: Traveller booking + Owner dashboard
- **Access**: Travellers and Owners (no admin redirect)

---

## 🧪 Test Scenarios

### Test 1: Owner Registration & Dashboard Access
**Steps:**
1. Go to http://localhost:5175
2. Click "Sign Up" (or navigate to http://localhost:5175/signup)
3. Register as owner:
   - First Name: John
   - Last Name: Doe
   - Email: owner@test.com
   - Password: password123
   - Role: **Owner**
4. Submit form

**Expected Results:**
✅ Registration succeeds
✅ Automatically logged in
✅ Redirected to http://localhost:5175/owner/dashboard (NOT 5174)
✅ Dashboard shows:
   - Welcome message with owner's name
   - Stats cards (Cars, Hotels, Bookings, Revenue)
   - Quick Actions buttons (Manage Cars, Add New Car, etc.)

---

### Test 2: Owner Car Listing Management
**Prerequisites:** Logged in as owner

#### 2a. View Car Listings
1. Click "Manage Cars" OR navigate to http://localhost:5175/owner/cars

**Expected Results:**
✅ Shows "My Car Listings" page
✅ Filter tabs visible (All, Approved, Pending, Rejected)
✅ If no cars: Shows empty state with "Add Your First Car" button

#### 2b. Add New Car
1. Click "➕ Add New Car" button
2. Fill form:
   - Make: Toyota
   - Model: Camry
   - Year: 2023
   - Car Type: Sedan
   - Seats: 5
   - Price Per Day: 50.00
   - Location: Los Angeles, CA
   - Description: Well-maintained, fuel-efficient car
3. Click "Add Car"

**Expected Results:**
✅ Form validates required fields
✅ Success message: "Car added successfully!"
✅ Redirected to http://localhost:5175/owner/cars
✅ New car appears with "Pending" status badge
✅ Notice shows: "You have 1 listing(s) waiting for admin approval"

#### 2c. Edit Car Listing
1. On car card, click "✏️ Edit"
2. Change price to 45.00
3. Click "Update Car"

**Expected Results:**
✅ Pre-filled form with current car data
✅ Success message: "Car updated successfully!"
✅ Redirected back to listings
✅ Updated price reflected

#### 2d. Delete Car Listing
1. On car card, click "🗑️ Delete"
2. Confirm deletion in popup

**Expected Results:**
✅ Confirmation dialog appears
✅ Car removed from list
✅ Success message: "Car listing deleted successfully"

---

### Test 3: Owner Navigation & Menu
**Prerequisites:** Logged in as owner

1. Click user profile icon (top right)

**Expected Results:**
✅ Dropdown menu shows:
   - "Owner Dashboard" menu item
   - "My Car Listings" menu item
   - Divider line
   - "Trips"
   - "Billing"
   - Other standard menu items
✅ Clicking "Owner Dashboard" → navigates to /owner/dashboard
✅ Clicking "My Car Listings" → navigates to /owner/cars

---

### Test 4: Admin Approval Flow
**Prerequisites:** Owner created a car listing, Admin credentials

1. **Admin Login:**
   - Go to http://localhost:5174
   - Login with admin credentials
   
2. **Review Pending Listings:**
   - Navigate to pending listings section
   - Find the owner's car (Toyota Camry)
   
3. **Approve Listing:**
   - Click "Approve" button
   - Confirm approval

**Expected Results:**
✅ Admin can see pending listings
✅ Approval changes status to "approved"
✅ Owner sees "Approved" status badge when viewing their listings
✅ Car becomes visible to travellers on booking pages

---

### Test 5: Owner Login Redirect Behavior
**Steps:**
1. Logout (if logged in)
2. Go to http://localhost:5175/login
3. Login with owner credentials:
   - Email: owner@test.com
   - Password: password123

**Expected Results:**
✅ Login succeeds
✅ Redirected to http://localhost:5175/owner/dashboard (NOT 5174)
✅ Dashboard loads with owner's data

---

### Test 6: Admin Login Redirect (Verification)
**Steps:**
1. Logout
2. Go to http://localhost:5175/login
3. Login with admin credentials

**Expected Results:**
✅ Login succeeds
✅ Redirected to http://localhost:5174 (admin-portal)
✅ Owner features NOT visible on admin portal

---

### Test 7: Protected Routes
**Prerequisites:** Not logged in

1. Try accessing http://localhost:5175/owner/dashboard
2. Try accessing http://localhost:5175/owner/cars

**Expected Results:**
✅ Redirected to http://localhost:5175/login
✅ After login, redirected back to intended page

---

### Test 8: Role-Based Access Control
**Prerequisites:** Logged in as traveller

1. Try accessing http://localhost:5175/owner/dashboard

**Expected Results:**
✅ Redirected to home page (/)
✅ Cannot access owner routes

---

## 🔍 Backend API Verification

### Test Owner API Endpoints
**Using curl or Postman:**

1. **Login as Owner:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@test.com",
    "password": "password123"
  }'
```
Save the `token` from response.

2. **Get Owner's Cars:**
```bash
curl http://localhost:3000/api/owner/cars \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. **Create Car:**
```bash
curl -X POST http://localhost:3000/api/owner/cars \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "make": "Honda",
    "model": "Accord",
    "year": 2022,
    "seats": 5,
    "car_type": "sedan",
    "price_per_day": 55.00,
    "location": "San Francisco, CA"
  }'
```

4. **Get Owner Stats:**
```bash
curl http://localhost:3000/api/owner/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Results:**
✅ All endpoints return 200 OK
✅ Only owner's own cars are returned
✅ Stats show correct counts (total, approved, pending, rejected)

---

## 🐛 Common Issues & Solutions

### Issue 1: "Owner Portal" still showing on port 5174
**Solution:** Admin portal has been rebranded. Port 5174 now says "Admin Portal" and blocks signups.

### Issue 2: Owner redirected to port 5174
**Solution:** Fixed in AuthContext. Owners now stay on port 5175 and redirect to `/owner/dashboard`.

### Issue 3: Can't see owner menu items
**Solution:** Menu items only show when `user.role === 'owner'`. Check that registration used "owner" role.

### Issue 4: 403 Forbidden on owner API calls
**Solution:** Check that JWT token is being sent in Authorization header. Verify token contains correct user.id.

### Issue 5: Cars not showing in listings
**Solution:** Check `approval_status` in database. Only "approved" cars show to travellers. Owners see all their cars.

---

## ✅ Success Criteria

**Owner Dashboard Implementation:**
- ✅ Owner registration works
- ✅ Owners stay on port 5175 (no redirect to 5174)
- ✅ Owner dashboard shows at /owner/dashboard
- ✅ Owner can view/add/edit/delete their cars
- ✅ Owner menu items appear in navigation
- ✅ Protected routes prevent unauthorized access
- ✅ Backend APIs enforce ownership checks

**Admin Separation:**
- ✅ Admin portal (5174) is admin-only
- ✅ Admins redirect to 5174 on login
- ✅ Owners cannot access admin portal
- ✅ Admin can approve/reject owner listings

---

## 📊 Test Checklist

- [ ] Owner registration → dashboard redirect
- [ ] Owner login → dashboard redirect
- [ ] Admin login → admin portal redirect (5174)
- [ ] Owner can add car listing
- [ ] Owner can edit their car
- [ ] Owner can delete their car
- [ ] Owner sees pending/approved/rejected status
- [ ] Owner menu items visible to owners only
- [ ] Protected routes block unauthorized access
- [ ] Travellers cannot access owner routes
- [ ] Admin can approve owner's listings
- [ ] Backend APIs return only owner's cars
- [ ] Stats endpoint shows correct counts

---

## 🚀 Next Steps (Optional Enhancements)

1. **Hotel Listings:** Add similar pages for owner hotel management
2. **Booking Management:** Show bookings received for owner's listings
3. **Revenue Reports:** Add detailed revenue analytics
4. **Image Uploads:** Allow owners to upload car photos
5. **Availability Calendar:** Let owners set available dates
6. **Reviews:** Show reviews for owner's listings

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify Docker containers are running: `docker ps`
3. Check backend logs: `docker logs kayak-api-gateway`
4. Verify database has correct role values (owner/admin/traveller)
5. Ensure JWT tokens are valid and not expired

---

**Last Updated:** $(date)
**Version:** 1.0
**Status:** ✅ Complete
