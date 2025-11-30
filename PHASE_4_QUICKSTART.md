# Phase 4 - Quick Start Guide

## 🚀 Getting Started with Bookings Management

### Prerequisites
- Node.js installed
- MySQL database running (with kayak_bookings database)
- Admin Portal dependencies installed

### Step 1: Start the Booking Service

```bash
cd kayak-microservices/services/booking-service
node src/server.js
```

Expected output:
```
Booking Service running on port 3005
```

### Step 2: Verify Service is Running

```bash
curl http://localhost:3005/health
```

Expected response:
```json
{"status":"OK","service":"booking-service"}
```

### Step 3: Test Bookings API

Get all bookings:
```bash
curl http://localhost:3005/bookings
```

### Step 4: Start Admin Portal (if not already running)

```bash
cd kayak-microservices/frontend/admin-portal
npm run dev
```

### Step 5: Access Bookings Management

Open your browser to:
```
http://localhost:5173/bookings
```

## 🧪 Testing the Features

### 1. View Bookings
- Navigate to the Bookings page
- You should see a table with all bookings
- If no bookings exist, you'll see "No bookings found"

### 2. Filter Bookings
- Use the filter dropdowns to filter by:
  - Status (Pending, Confirmed, Completed, Cancelled)
  - Listing Type (Flight, Hotel, Car)
  - User ID
  - Date Range
- Click "Search" to apply filters
- Click "Reset" to clear filters

### 3. View Booking Details
- Click the "👁️ View" button on any booking
- A modal will open showing full booking details
- Close the modal or use action buttons

### 4. Update Booking Status
For **Pending** bookings:
- Click "✓ Confirm" to mark as confirmed
- Click "✗ Cancel" to cancel the booking

For **Confirmed** bookings:
- Click "✓ Complete" to mark as completed

### 5. Test Pagination
- If you have more than 20 bookings, pagination will appear
- Click "Previous" or "Next" to navigate pages

## 🔧 Troubleshooting

### Issue: Bookings service won't start
**Solution**: Check if MySQL is running and the database exists
```bash
mysql -u root -p -e "SHOW DATABASES LIKE 'kayak_bookings';"
```

### Issue: CORS errors in browser console
**Solution**: Make sure the booking service has CORS enabled (already implemented)

### Issue: "Failed to load bookings"
**Solution**: 
1. Check booking service is running: `curl http://localhost:3005/health`
2. Check API Gateway routes are configured
3. Check browser console for specific errors

### Issue: Empty bookings list
**Solution**: This is normal if no bookings exist in database. You can:
- Create test bookings via the booking API
- Or wait for users to create bookings through the web client

## 📊 Sample Test Data

To create a test booking for testing:

```bash
curl -X POST http://localhost:3005/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-123",
    "listing_id": "test-flight-456",
    "listing_type": "flight",
    "travel_date": "2024-12-15T10:00:00Z",
    "total_amount": 350.00,
    "payment_details": {
      "method": "credit_card"
    }
  }'
```

## ✅ Success Criteria

You've successfully completed Phase 4 if:
- ✅ Booking service starts without errors
- ✅ Admin portal displays the Bookings Management page
- ✅ You can view bookings in the table
- ✅ Filters work correctly
- ✅ You can view booking details in the modal
- ✅ Status updates work (Pending → Confirmed → Completed)
- ✅ Cancel booking functionality works
- ✅ No console errors in browser

## 🎯 Next Steps

After verifying Phase 4 works:
1. Test with real booking data
2. Integrate with User Service for user details
3. Add authentication to protect admin routes
4. Implement email notifications for booking confirmations
5. Add export functionality (CSV/Excel)

## 📝 API Reference

### GET /bookings
List all bookings with optional filters

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (string): Filter by status
- `user_id` (string): Filter by user
- `listing_type` (string): Filter by type
- `sortBy` (string): Sort field (default: booking_date)
- `sortOrder` (string): asc/desc (default: desc)

**Example:**
```bash
curl "http://localhost:3005/bookings?status=pending&limit=10"
```

### GET /bookings/:id
Get single booking by ID

**Example:**
```bash
curl http://localhost:3005/bookings/abc-123-def-456
```

### PUT /bookings/:id/status
Update booking status

**Body:**
```json
{
  "status": "confirmed"
}
```

**Example:**
```bash
curl -X PUT http://localhost:3005/bookings/abc-123-def-456/status \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed"}'
```

### DELETE /bookings/:id
Cancel booking

**Example:**
```bash
curl -X DELETE http://localhost:3005/bookings/abc-123-def-456
```

## 🐛 Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| Connection refused | Service not running | Start booking service |
| 404 Not Found | Wrong URL | Check port and path |
| CORS error | Browser security | Already handled in code |
| Database error | MySQL not running | Start MySQL server |
| Empty response | No bookings | Create test data |

---

**Phase 4 Implementation Complete! 🎉**

For detailed documentation, see `PHASE_4_COMPLETE.md`
