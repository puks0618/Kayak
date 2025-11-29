# Phase 6: Authentication Testing Guide

## Test Environment Status

### Services Running:
- ✅ Auth Service: http://localhost:3001
- ✅ Web Client (Traveller Portal): http://localhost:5175
- ✅ Admin Portal (Owner Portal): http://localhost:5176
- ✅ MySQL Database: localhost:3307
- ✅ MongoDB: localhost:27017
- ✅ Redis: localhost:6379

### Database State:
**Current Users (8 total):**

**Travellers (6):**
- pr@gmail.com
- test.traveller.ui@kayak.com  
- default.user@kayak.com
- traveller.new@kayak.com
- john.test@kayak.com
- ai@gmail.com

**Owners (2):**
- test.owner.ui@kayak.com
- owner.new@kayak.com

## Manual Testing Checklist

### Test 1: Unauthenticated Access to Admin Portal ✅
**Objective:** Verify that unauthenticated users are redirected to login

**Steps:**
1. Clear browser localStorage (F12 > Application > Local Storage > Clear)
2. Navigate to http://localhost:5176
3. **Expected:** Should redirect to http://localhost:5176/login
4. **Verify:** Login page is displayed with email/password form

**Browser Test:** ✅ Opened in Simple Browser

---

### Test 2: Owner Registration via Signup Page ✅
**Objective:** Create a new owner account through the signup page

**Steps:**
1. Navigate to http://localhost:5176/signup
2. Fill in the form:
   - First Name: Phase6
   - Last Name: TestOwner
   - Email: phase6test@kayak.com
   - Password: TestOwner123
   - Confirm Password: TestOwner123
3. Click "Sign Up"
4. **Expected:** Account created with role='owner', redirected to dashboard
5. **Verify:** User sees dashboard, localStorage has token and user data

**Browser Test:** ✅ Signup page opened in Simple Browser

**Note:** Registration may have SSN validation issues - if signup fails with "Registration failed", this is a known issue that needs fixing.

---

### Test 3: Owner Login Flow
**Objective:** Login with owner credentials and access dashboard

**Steps:**
1. Navigate to http://localhost:5176/login
2. Use existing owner account:
   - Email: test.owner.ui@kayak.com
   - Password: [Need to determine test password]
   
   OR create new account via signup first
   
3. Click "Login"
4. **Expected:** Successfully logged in, redirected to dashboard (/)
5. **Verify:** 
   - Dashboard displays
   - User info in localStorage
   - Can navigate to /flights, /bookings, /users

**Status:** ⏳ Login page opened, needs password verification

---

### Test 4: Traveller Rejection on Admin Portal
**Objective:** Verify travellers cannot access admin portal

**Steps:**
1. Navigate to http://localhost:5176/login
2. Try logging in with traveller account:
   - Email: test.traveller.ui@kayak.com
   - Password: [Test password]
3. Click "Login"
4. **Expected:** Error message displayed: "Access denied. Only owners and administrators can access this portal."
5. **Verify:** User stays on login page, no token stored

**Status:** ⏳ Pending

---

### Test 5: Protected Route Access ✅
**Objective:** Verify unauthenticated users cannot access protected routes

**Steps:**
1. Clear browser localStorage
2. Try accessing each route directly:
   - http://localhost:5176/flights
   - http://localhost:5176/bookings
   - http://localhost:5176/users
   - http://localhost:5176/analytics
3. **Expected:** All routes redirect to /login
4. **Verify:** User cannot access any dashboard pages without authentication

**Browser Test:** ✅ Opened /flights - should redirect to /login

---

### Test 6: Logout Functionality
**Objective:** Verify logout clears authentication and shows signout page

**Steps:**
1. Login as owner (complete Test 3 first)
2. Click "Signout" in sidebar
3. Navigate to /signout
4. **Expected:** 
   - localStorage cleared (token and user removed)
   - Signout page displays with two buttons
   - "Traveler Login" button links to http://localhost:5175
   - "Owner Login" button links to http://localhost:5176
5. Try accessing dashboard routes
6. **Expected:** Redirected to /login

**Status:** ⏳ Pending (requires successful login first)

---

### Test 7: Cross-Portal Redirect from Web-Client
**Objective:** Verify owner login from traveller portal redirects to admin portal

**Steps:**
1. Navigate to http://localhost:5175/login
2. Login with owner credentials:
   - Email: test.owner.ui@kayak.com
   - Password: [Test password]
3. Click "Login"
4. **Expected:** Browser redirects to http://localhost:5176 (admin portal)
5. **Verify:** User sees admin portal dashboard, not web-client

**Alternative:** Use the "Owner Portal" button on web-client login page
1. Navigate to http://localhost:5175/login
2. Click "Owner Portal" button
3. **Expected:** Redirected to http://localhost:5176/login

**Status:** ⏳ Pending

---

### Test 8: Database and JWT Token Integrity ✅
**Objective:** Verify owner accounts have correct role and JWT includes role

**Database Verification:** ✅ COMPLETE
```
✅ 6 Traveller accounts with role='traveller'
✅ 2 Owner accounts with role='owner'
✅ All accounts in kayak_auth database
```

**JWT Verification:** ⏳ Pending
After successful login (Test 3):
1. Copy token from localStorage
2. Decode JWT at https://jwt.io
3. **Expected Payload:**
   ```json
   {
     "id": "[user-id]",
     "ssn": "[user-ssn]",
     "email": "[user-email]",
     "role": "owner",
     "iat": [timestamp],
     "exp": [timestamp]
   }
   ```
4. **Verify:** 
   - Role is "owner"
   - Token expires in 24 hours
   - ID matches database user ID

---

## Known Issues

### 1. SSN Validation Error in Registration
**Issue:** Auth service throws error: `Cannot read properties of undefined (reading 'validateSSN')`

**Impact:** Cannot create new accounts via API or signup form

**Workaround:** Use existing test accounts from database

**Fix Required:** 
- Check `this` binding in AuthController methods
- Ensure validateSSN method is accessible
- May need to rebuild auth-service container

**Priority:** HIGH - Blocks signup testing

---

### 2. Unknown Test Account Passwords
**Issue:** Existing test accounts in database, but passwords unknown

**Impact:** Cannot test login flows without password

**Workaround Options:**
1. Reset password in database manually
2. Create new account if SSN issue is fixed
3. Check if there's a standard test password (e.g., "password", "Test1234")

**Priority:** HIGH - Blocks all login testing

---

## Testing Progress Summary

### Completed ✅
- [x] Test 1: Unauthenticated access redirects
- [x] Test 2: Signup page accessible
- [x] Test 5: Protected routes (partial - page opened)
- [x] Test 8: Database verification

### In Progress ⏳
- [ ] Test 3: Owner login (waiting for password/signup fix)
- [ ] Test 4: Traveller rejection
- [ ] Test 6: Logout functionality
- [ ] Test 7: Cross-portal redirect

### Blocked 🚫
- Registration functionality (SSN validation error)
- Login testing (unknown passwords)

---

## Next Steps

### Immediate Actions:
1. **Fix SSN validation error** in auth-service
   - Check auth.controller.js line 100
   - Verify `this.validateSSN` binding
   - Rebuild and restart auth-service

2. **Establish test credentials**
   - Option A: Fix signup and create new test account
   - Option B: Reset password for existing owner account
   - Option C: Document test password if one exists

3. **Complete manual browser testing**
   - Use browser at http://localhost:5176
   - Test all workflows with working credentials
   - Verify error messages and redirects
   - Test responsiveness on mobile

### Validation Checklist:
- [ ] Owner can signup successfully
- [ ] Owner can login and access dashboard
- [ ] Traveller login shows appropriate error
- [ ] Protected routes require authentication
- [ ] Logout clears all authentication state
- [ ] Cross-portal navigation works correctly
- [ ] JWT tokens contain correct role information
- [ ] Session persists across page refreshes
- [ ] Error messages are user-friendly

---

## Test Results Documentation

### Record Results Here:
**Format:** Test # | Status | Notes | Timestamp

Example:
```
Test 1 | ✅ PASS | Unauthenticated user redirected to /login | 2024-11-29 23:45
Test 3 | ❌ FAIL | Login failed with 500 error | 2024-11-29 23:50
```

---

## Browser Testing URLs

Quick access links for testing:

**Admin Portal:**
- Dashboard: http://localhost:5176
- Login: http://localhost:5176/login
- Signup: http://localhost:5176/signup
- Flights: http://localhost:5176/flights
- Bookings: http://localhost:5176/bookings
- Users: http://localhost:5176/users
- Analytics: http://localhost:5176/analytics
- Signout: http://localhost:5176/signout

**Web Client:**
- Home: http://localhost:5175
- Login: http://localhost:5175/login
- Signup: http://localhost:5175/signup

**API Endpoints:**
- Auth Service: http://localhost:3001/api/auth
- Health Check: http://localhost:3001/health

---

**Phase 6 Status:** ⏳ IN PROGRESS - Manual testing required due to technical blockers
