# Analytics Testing Guide 🧪

Quick guide to test the analytics implementation.

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Start Admin Service
```bash
cd kayak-microservices/services/admin-service
npm start
```

**Expected Output:**
```
✈️ Admin Service running on port 3007
```

### Step 2: Start Admin Portal
```bash
cd kayak-microservices/frontend/admin-portal
npm run dev
```

**Expected Output:**
```
Local: http://localhost:5173/
```

### Step 3: Access Analytics
Open browser: `http://localhost:5173/analytics`

---

## 🧪 Test Scenarios

### Scenario 1: Test with Existing Data

If you already have bookings in your database:

1. Navigate to Analytics page
2. Select year 2025
3. Click through all tabs:
   - Overview
   - Top Properties
   - City Revenue
   - Top Providers

**Expected:** Charts and tables should populate with your data.

---

### Scenario 2: Test with Sample Data

If you have no bookings yet:

#### Option A: Quick Manual Insert
```sql
USE kayak_bookings;

-- Get a sample listing ID
SET @hotel_id = (SELECT id FROM kayak_listings.hotels LIMIT 1);
SET @user_id = (SELECT id FROM kayak_users.users LIMIT 1);

-- Insert a test booking
INSERT INTO bookings (id, user_id, listing_id, listing_type, status, travel_date, total_amount, booking_date)
VALUES (UUID(), @user_id, @hotel_id, 'hotel', 'completed', '2025-06-15', 299.99, '2025-01-15');
```

#### Option B: Use Test Data Script
```bash
# From kayak-microservices directory
mysql -u root -pSomalwar1! < scripts/create-analytics-test-data.sql
```

**Note:** Edit the script first to ensure listing and user IDs exist in your database.

---

## 📊 API Testing (Direct)

Test backend endpoints directly without frontend:

### 1. Overview Report
```bash
curl http://localhost:3007/api/admin/analytics/overview?year=2025
```

### 2. Top Properties
```bash
curl http://localhost:3007/api/admin/analytics/top-properties?year=2025
```

### 3. City Revenue
```bash
curl http://localhost:3007/api/admin/analytics/city-revenue?year=2025
```

### 4. Top Providers
```bash
curl http://localhost:3007/api/admin/analytics/top-providers?period=last_month
```

---

## ✅ What to Look For

### Overview Tab
- ✅ 4 Summary cards showing: Revenue, Bookings, Customers, Avg Value
- ✅ Pie chart: Booking breakdown by type (hotel/flight/car)
- ✅ Line chart: Monthly revenue trend
- ✅ All numbers should be formatted as currency

### Top Properties Tab
- ✅ Bar chart with dual bars (revenue + bookings)
- ✅ Table with 10 properties ranked by revenue
- ✅ Property names with type badges
- ✅ Location and average booking value columns

### City Revenue Tab
- ✅ Bar chart showing top 15 cities
- ✅ Pie chart showing top 10 cities revenue distribution
- ✅ Complete table of all cities
- ✅ State abbreviations (if available)

### Top Providers Tab
- ✅ Dual-axis bar chart (sold vs revenue)
- ✅ Table with provider names and types
- ✅ Period filter working (last month vs 3 months)
- ✅ Properties sold count and revenue

---

## 🎯 Expected Behavior

### Filters
1. **Year Filter:** Changing year should reload all data for that year
2. **Provider Period:** Changing period should update only Top Providers tab
3. **Refresh Button:** Should reload all data

### Loading States
- Spinner should appear while loading
- Message: "Loading analytics data..."
- Should disappear once data loads

### Error States
- If service is down: "⚠️ Error Loading Analytics"
- "Retry" button should attempt to reload

### No Data
- If no bookings: "No data available for [report name]"

---

## 🐛 Common Issues & Fixes

### Issue 1: "Failed to load analytics data"

**Cause:** Admin service not running or wrong port

**Fix:**
```bash
# Check if service is running
curl http://localhost:3007/health

# Expected: {"status":"OK","service":"admin-service"}

# If not, restart the service
cd services/admin-service
npm start
```

---

### Issue 2: "No data available"

**Cause:** No completed bookings in database

**Fix:**
```sql
-- Check booking count
SELECT COUNT(*) FROM kayak_bookings.bookings WHERE status IN ('completed', 'confirmed');

-- If 0, add test data using the SQL script above
```

---

### Issue 3: CORS Error in Browser Console

**Cause:** CORS not configured properly

**Fix:** Check `services/admin-service/src/server.js` has:
```javascript
app.use(cors());
```

---

### Issue 4: Charts Not Rendering

**Cause:** Recharts not installed

**Fix:**
```bash
cd frontend/admin-portal
npm install recharts
npm run dev
```

---

### Issue 5: Database Connection Error

**Cause:** Wrong credentials or MySQL not running

**Fix:**
```bash
# Test MySQL connection
mysql -u root -pSomalwar1! -e "SHOW DATABASES;"

# Update credentials in admin-service if needed
# Edit: services/admin-service/src/controllers/analytics.controller.js
```

---

## 📸 Screenshots to Verify

Take screenshots of:
1. Overview tab - all 4 cards visible
2. Top Properties - bar chart and table
3. City Revenue - both charts visible
4. Top Providers - chart and table
5. Year filter - change and reload

---

## 🧮 Manual Verification Queries

Verify the backend calculations are correct:

### Verify Top Properties
```sql
SELECT 
  h.name,
  COUNT(b.id) as bookings,
  SUM(b.total_amount) as revenue
FROM kayak_bookings.bookings b
INNER JOIN kayak_listings.hotels h ON b.listing_id = h.id
WHERE b.listing_type = 'hotel' 
  AND b.status IN ('confirmed', 'completed')
  AND YEAR(b.booking_date) = 2025
GROUP BY h.id, h.name
ORDER BY revenue DESC
LIMIT 10;
```

### Verify City Revenue
```sql
SELECT 
  h.city,
  COUNT(b.id) as bookings,
  SUM(b.total_amount) as revenue
FROM kayak_bookings.bookings b
INNER JOIN kayak_listings.hotels h ON b.listing_id = h.id
WHERE b.listing_type = 'hotel'
  AND b.status IN ('confirmed', 'completed')
  AND YEAR(b.booking_date) = 2025
GROUP BY h.city
ORDER BY revenue DESC;
```

### Verify Top Providers (Last Month)
```sql
SELECT 
  f.airline as provider,
  COUNT(b.id) as sold,
  SUM(b.total_amount) as revenue
FROM kayak_bookings.bookings b
INNER JOIN kayak_listings.flights f ON b.listing_id = f.id
WHERE b.listing_type = 'flight'
  AND b.status IN ('confirmed', 'completed')
  AND b.booking_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
GROUP BY f.airline
ORDER BY sold DESC
LIMIT 10;
```

---

## 📋 Test Checklist

Print this and check off as you test:

- [ ] Admin service starts without errors
- [ ] Admin portal starts and loads
- [ ] Analytics page loads (no 404)
- [ ] Overview tab displays all cards
- [ ] Overview charts render
- [ ] Top Properties tab shows chart
- [ ] Top Properties table has data
- [ ] City Revenue bar chart renders
- [ ] City Revenue pie chart renders
- [ ] City Revenue table populated
- [ ] Top Providers chart displays
- [ ] Top Providers table has data
- [ ] Year filter changes data
- [ ] Period filter changes providers
- [ ] Refresh button reloads data
- [ ] Loading spinner appears/disappears
- [ ] Numbers formatted as currency
- [ ] Responsive design (resize window)
- [ ] No console errors in browser
- [ ] Backend responds to curl requests

---

## 🎉 Success Criteria

Your implementation is successful if:

✅ All 4 tabs load without errors
✅ Charts are visible and interactive
✅ Tables show ranked data
✅ Filters work and update data
✅ Currency formatting is correct ($X,XXX.XX)
✅ Page is responsive (mobile friendly)
✅ No linter errors
✅ Backend queries complete in < 2 seconds

---

## 📞 Troubleshooting Help

If you're stuck:

1. Check browser console (F12) for errors
2. Check admin service terminal for backend errors
3. Verify MySQL is running: `mysql -u root -p -e "SELECT 1;"`
4. Test each API endpoint with curl
5. Check network tab in browser DevTools
6. Verify CORS headers in response

---

## 🚀 Next Steps After Testing

Once testing is complete:

1. ✅ Take screenshots for documentation
2. ✅ Share with your team
3. ✅ Deploy to staging environment
4. ✅ Add more test data for realistic demos
5. ✅ Consider adding export functionality (PDF/CSV)

**Happy Testing! 🎯✨**

