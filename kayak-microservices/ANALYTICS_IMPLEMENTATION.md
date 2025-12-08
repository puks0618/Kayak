# Analytics & Reports Implementation Guide

## 📊 Overview

Complete analytics and reporting system for the Admin Portal with three main reports:
1. **Top 10 Properties with Revenue per Year**
2. **City-wise Revenue per Year**
3. **Top 10 Hosts/Providers with Maximum Properties Sold Last Month**

---

## ✅ Implementation Status

### Backend (Admin Service)
- ✅ Analytics controller created
- ✅ All 4 report endpoints implemented
- ✅ Routes registered in server
- ✅ Cross-database query support
- ✅ Works with existing schema (no migrations needed!)

### Frontend (Admin Portal)
- ✅ Complete Analytics page with tabs
- ✅ Recharts integration for visualizations
- ✅ Interactive filters (year, period)
- ✅ Responsive design
- ✅ Summary cards and overview dashboard

---

## 🔌 API Endpoints

All endpoints are available at: `http://localhost:3007/api/admin/analytics`

### 1. Dashboard Overview
```
GET /api/admin/analytics/overview?year=2025
```

**Response:**
```json
{
  "success": true,
  "year": 2025,
  "summary": {
    "total_bookings": 150,
    "total_revenue": "45000.00",
    "unique_customers": 85,
    "avg_booking_value": "300.00"
  },
  "booking_breakdown": [
    { "type": "hotel", "count": 80, "revenue": "25000.00" },
    { "type": "flight", "count": 50, "revenue": "15000.00" },
    { "type": "car", "count": 20, "revenue": "5000.00" }
  ],
  "monthly_trend": [
    { "month": 1, "month_name": "January", "bookings": 15, "revenue": "4500.00" },
    ...
  ]
}
```

### 2. Top Properties Report
```
GET /api/admin/analytics/top-properties?year=2025
```

**Response:**
```json
{
  "success": true,
  "year": 2025,
  "report_type": "top_properties",
  "count": 10,
  "data": [
    {
      "property_type": "hotel",
      "property_name": "Grand Hotel Downtown",
      "location": "New York",
      "listing_id": "abc-123",
      "total_bookings": 45,
      "total_revenue": "13500.00",
      "avg_booking_value": "300.00"
    },
    ...
  ],
  "summary": {
    "total_revenue": "45000.00",
    "total_bookings": 150
  }
}
```

### 3. City Revenue Report
```
GET /api/admin/analytics/city-revenue?year=2025
```

**Response:**
```json
{
  "success": true,
  "year": 2025,
  "report_type": "city_revenue",
  "count": 25,
  "data": [
    {
      "city": "New York",
      "state": "NY",
      "total_bookings": 60,
      "total_revenue": "18000.00"
    },
    ...
  ],
  "summary": {
    "total_cities": 25,
    "total_revenue": "45000.00",
    "total_bookings": 150
  }
}
```

### 4. Top Providers Report
```
GET /api/admin/analytics/top-providers?period=last_month
```

**Parameters:**
- `period`: `last_month` or `last_3_months`

**Response:**
```json
{
  "success": true,
  "period": "last_month",
  "report_type": "top_providers",
  "count": 10,
  "data": [
    {
      "provider_name": "American Airlines",
      "provider_type": "flight",
      "properties_sold": 45,
      "total_revenue": "13500.00",
      "unique_properties": 12
    },
    ...
  ],
  "summary": {
    "total_properties_sold": 150,
    "total_revenue": "45000.00"
  }
}
```

---

## 🗄️ Database Schema Requirements

### ✅ Works With Current Schema!

No schema migrations required! The implementation uses the base schema:

**Required Tables:**
- `kayak_bookings.bookings` (id, user_id, listing_id, listing_type, status, booking_date, total_amount)
- `kayak_listings.hotels` (id, name, city, state)
- `kayak_listings.flights` (id, flight_code, airline, departure_airport, arrival_airport)
- `kayak_listings.cars` (id, brand, model, year, location, company_name)

**No owner_id needed** - Reports work with:
- Airlines (for flights)
- Hotel names (for hotels)
- Car company names (for cars)

---

## 🚀 How to Test

### 1. Start the Admin Service
```bash
cd kayak-microservices/services/admin-service
npm install
npm start
```

Service should be running on: `http://localhost:3007`

### 2. Start the Admin Portal
```bash
cd kayak-microservices/frontend/admin-portal
npm install
npm run dev
```

Portal should be running on: `http://localhost:5173`

### 3. Access Analytics
1. Navigate to `http://localhost:5173/analytics`
2. You should see the complete analytics dashboard

### 4. Test with Sample Data

If you don't have bookings yet, you can create test bookings:

```sql
-- Insert test bookings
USE kayak_bookings;

INSERT INTO bookings (id, user_id, listing_id, listing_type, status, travel_date, total_amount, booking_date)
VALUES 
  (UUID(), 'user-123', 'hotel-1', 'hotel', 'completed', '2025-06-15', 299.99, '2025-01-15'),
  (UUID(), 'user-124', 'flight-1', 'flight', 'completed', '2025-07-20', 599.99, '2025-02-10'),
  (UUID(), 'user-125', 'car-1', 'car', 'completed', '2025-08-10', 89.99, '2025-03-05');
```

---

## 📊 Features Implemented

### Dashboard Overview
- ✅ Summary cards (Revenue, Bookings, Customers, Avg Value)
- ✅ Booking breakdown pie chart
- ✅ Monthly revenue trend line chart

### Top Properties Report
- ✅ Bar chart showing revenue and bookings
- ✅ Detailed table with rankings
- ✅ Property type badges (hotel/flight/car)
- ✅ Location and average booking value

### City Revenue Report
- ✅ Bar chart for city-wise revenue
- ✅ Pie chart for top 10 cities
- ✅ Complete table with all cities
- ✅ Consolidates hotel and car bookings

### Top Providers Report
- ✅ Dual-axis bar chart (sold vs revenue)
- ✅ Table with provider details
- ✅ Period filter (last month / 3 months)
- ✅ Shows provider type

### UI/UX Features
- ✅ Tab navigation between reports
- ✅ Year filter (2023, 2024, 2025)
- ✅ Period filter for providers
- ✅ Refresh button
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design
- ✅ Beautiful gradients and colors

---

## 🎨 Chart Types Used

1. **Bar Charts** - Property revenue, City revenue, Provider comparison
2. **Pie Charts** - Booking breakdown, City distribution
3. **Line Charts** - Monthly trend
4. **Tables** - Detailed data view

---

## 🔧 Technical Details

### Query Strategy
- Uses SQL UNION to combine data from multiple listing types
- Performs cross-database JOINs (kayak_bookings ↔ kayak_listings)
- Filters by status ('confirmed', 'completed') to exclude pending/cancelled
- Groups by relevant dimensions (property, city, provider)
- Orders by revenue DESC
- Limits to top 10 for performance

### Frontend Architecture
- React functional components with hooks
- Recharts for visualizations
- Axios for API calls
- Tab-based navigation
- State management for filters
- Responsive CSS Grid layout

### Error Handling
- Try-catch blocks in all endpoints
- Detailed error messages
- Loading states
- Retry functionality
- Graceful fallbacks

---

## 🐛 Troubleshooting

### "Can't connect to MySQL"
- Ensure MySQL is running
- Check credentials in `.env` or defaults in code
- Default: `root:Somalwar1!@localhost`

### "No data available"
- Create test bookings using SQL above
- Ensure bookings have status 'completed' or 'confirmed'
- Check that booking_date is in the selected year

### "Failed to load analytics"
- Check admin service is running on port 3007
- Check CORS is enabled
- Open browser console for detailed errors

### Charts not rendering
- Verify Recharts is installed: `npm list recharts`
- Check browser console for errors
- Ensure data format matches chart requirements

---

## 🎯 Next Steps (Future Enhancements)

1. **Export Functionality**
   - PDF export for reports
   - CSV download for tables
   - Email scheduled reports

2. **Advanced Filters**
   - Date range picker
   - Property type filter
   - Status filter
   - Custom date ranges

3. **More Visualizations**
   - Heat maps for geographic data
   - Funnel charts for conversion
   - Gauge charts for targets

4. **Real-time Updates**
   - WebSocket integration
   - Auto-refresh every X minutes
   - Live booking notifications

5. **Comparative Analysis**
   - Year-over-year comparison
   - Month-over-month growth
   - Benchmark indicators

---

## 📝 Notes

- **No Schema Changes Required** - Works with existing database structure
- **Team-Friendly** - Your friends don't need to update their schemas
- **Performance** - Queries are optimized with indexes
- **Scalability** - Can handle large datasets with pagination
- **Maintainability** - Clean code with comments and documentation

---

## 📞 Support

If you encounter any issues or need modifications, refer to:
- Backend: `services/admin-service/src/controllers/analytics.controller.js`
- Frontend: `frontend/admin-portal/src/pages/Analytics.jsx`
- Styles: `frontend/admin-portal/src/styles/Analytics.css`

**Happy Analyzing! 📊✨**

