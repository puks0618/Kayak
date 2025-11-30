# 🚀 Owner Dashboard - Quick Test Guide

## URLs to Test

### 🔵 Owner Features (Port 5175)
```
http://localhost:5175/owner/dashboard      # Owner Dashboard
http://localhost:5175/owner/cars           # Car Listings
http://localhost:5175/owner/cars/new       # Add New Car
```

### 🔴 Admin Portal (Port 5174)
```
http://localhost:5174                      # Admin Login
```

---

## Test Credentials

### Create Owner Account:
1. Go to: http://localhost:5175/signup
2. Fill:
   - First Name: John
   - Last Name: Doe
   - Email: owner@test.com
   - Password: password123
   - **Role: Owner** ⭐
3. Submit → Should redirect to dashboard

### Login as Owner:
1. Go to: http://localhost:5175/login
2. Email: owner@test.com
3. Password: password123
4. Submit → Should go to `/owner/dashboard`

---

## Quick Test Flow

### ✅ 5-Minute Test:
1. **Register Owner** → Check dashboard loads
2. **Click "Add New Car"** → Fill form
3. **Submit** → Check car appears with "Pending" status
4. **Click Edit** → Modify price
5. **Check Stats** → Verify counts updated

---

## Expected Behavior

| Action | Result |
|--------|--------|
| Owner registers | ✅ Redirect to `/owner/dashboard` |
| Owner logs in | ✅ Redirect to `/owner/dashboard` |
| Admin logs in | ✅ Redirect to `http://localhost:5174` |
| Add car | ✅ Status = "Pending" |
| View dashboard | ✅ Shows stats and quick actions |
| Click user menu | ✅ Shows "Owner Dashboard" & "My Car Listings" |

---

## Common Issues

❌ **Still redirecting to 5174?**
→ Make sure you selected "Owner" role during signup, not "Admin"

❌ **Menu items not showing?**
→ Check user.role in browser console: `JSON.parse(localStorage.getItem('user'))`

❌ **403 on API calls?**
→ Verify token exists: `localStorage.getItem('token')`

---

## Success Checklist

- [ ] Owner signup works
- [ ] Redirects to dashboard (not 5174)
- [ ] Dashboard shows stats
- [ ] Can add car
- [ ] Car shows "Pending" status
- [ ] Can edit car
- [ ] Can delete car
- [ ] Owner menu items visible
- [ ] Protected routes block unauthorized access

---

## API Test (Optional)

```bash
# 1. Register owner
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "owner2@test.com",
    "password": "password123",
    "role": "owner"
  }'

# 2. Save token, then get stats
curl http://localhost:3000/api/owner/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

**Ready to test!** 🎉

Start here: http://localhost:5175/signup (Select "Owner" role)
