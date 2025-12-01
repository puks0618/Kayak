# Kayak Admin System - Implementation Guide

## What Has Been Implemented

### Backend (Admin Service) ✅
- **Administrator Entity**: Complete data model with Sequelize ORM
- **Authentication**: JWT middleware with role-based access control
- **User Management APIs**: Full CRUD + activate/deactivate/role change
- **Listings Management APIs**: Create/Edit hotels, flights, cars
- **Billing APIs**: Search by date/month, view bill details, statistics
- **Analytics APIs**: Dashboard metrics, top properties, city revenue, host analytics, page/property clicks, user traces

### Frontend (Admin Portal) ✅
- **Enhanced Dashboard**: With Recharts visualization (bar, pie charts)
- **Billing Management Page**: Search, filter, and view bills
- **API Service Layer**: Complete integration with backend

### Database ✅
- **kayak_admin database**: Created with administrators table
- **Sample admin users**: Super admin, manager, analyst

## How to Start the System

### Prerequisites
- Docker Desktop running
- Node.js 18+ installed

### Step 1: Start Infrastructure (MySQL, Redis, Kafka, MongoDB)
```powershell
cd "c:\Users\aiish\OneDrive\Desktop\MSDA-SJSU\Fall 2025\Distributed System\kayak-admin\kayak-microservices\infrastructure\docker"
docker-compose up -d mysql redis mongodb kafka zookeeper
```

Wait 30-60 seconds for databases to initialize.

### Step 2: Install Admin Service Dependencies
```powershell
cd "c:\Users\aiish\OneDrive\Desktop\MSDA-SJSU\Fall 2025\Distributed System\kayak-admin\kayak-microservices\services\admin-service"
npm install
```

### Step 3: Start Required Backend Services

**Terminal 1 - Auth Service:**
```powershell
cd "c:\Users\aiish\OneDrive\Desktop\MSDA-SJSU\Fall 2025\Distributed System\kayak-admin\kayak-microservices\services\auth-service"
npm install  # if not already installed
npm start
```

**Terminal 2 - User Service:**
```powershell
cd "c:\Users\aiish\OneDrive\Desktop\MSDA-SJSU\Fall 2025\Distributed System\kayak-admin\kayak-microservices\services\user-service"
npm install  # if not already installed
npm start
```

**Terminal 3 - Listing Service:**
```powershell
cd "c:\Users\aiish\OneDrive\Desktop\MSDA-SJSU\Fall 2025\Distributed System\kayak-admin\kayak-microservices\services\listing-service"
npm install  # if not already installed
npm start
```

**Terminal 4 - Booking Service:**
```powershell
cd "c:\Users\aiish\OneDrive\Desktop\MSDA-SJSU\Fall 2025\Distributed System\kayak-admin\kayak-microservices\services\booking-service"
npm install  # if not already installed
npm start
```

**Terminal 5 - Admin Service (NEW):**
```powershell
cd "c:\Users\aiish\OneDrive\Desktop\MSDA-SJSU\Fall 2025\Distributed System\kayak-admin\kayak-microservices\services\admin-service"
npm start
```

### Step 4: Start Admin Portal Frontend
```powershell
cd "c:\Users\aiish\OneDrive\Desktop\MSDA-SJSU\Fall 2025\Distributed System\kayak-admin\kayak-microservices\frontend\admin-portal"
npm install  # if not already installed
npm run dev
```

### Step 5: Access the Application
- **Admin Portal**: http://localhost:5174
- **Admin Service API**: http://localhost:3007
- **API Gateway**: http://localhost:3000

## Testing the Admin APIs

### 1. Login as Admin User
First, create an admin user in the auth system (if not already exists):

```bash
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@kayak.com",
  "password": "Admin123!",
  "role": "admin"
}
```

Then login:
```bash
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@kayak.com",
  "password": "Admin123!"
}
```

Copy the JWT token from the response.

### 2. Test Admin Endpoints (use the JWT token)

**Get Dashboard Metrics:**
```bash
GET http://localhost:3007/api/admin/analytics/dashboard
Authorization: Bearer <your-jwt-token>
```

**Search Bills:**
```bash
GET http://localhost:3007/api/admin/billing/search?year=2025&month=11
Authorization: Bearer <your-jwt-token>
```

**Get All Users:**
```bash
GET http://localhost:3007/api/admin/users
Authorization: Bearer <your-jwt-token>
```

**Search Listings:**
```bash
GET http://localhost:3007/api/admin/listings?type=flights&page=1
Authorization: Bearer <your-jwt-token>
```

## Database Information

**MySQL Connection (for debugging):**
- Host: localhost
- Port: 3307 (not 3306!)
- User: root
- Password: Somalwar1!
- Databases: kayak_auth, kayak_admin, kayak_users, kayak_listings, kayak_bookings

## Common Issues & Solutions

### Issue: "Cannot connect to MySQL"
**Solution**: Make sure you're using port 3307, not 3306. Check if MySQL container is running:
```powershell
docker ps | Select-String mysql
```

### Issue: "Authentication required" error
**Solution**: You need to login and get a JWT token first. The admin portal should handle this automatically through the AuthContext.

### Issue: Admin service won't start - "Cannot find module"
**Solution**: 
```powershell
cd kayak-microservices\services\admin-service
npm install
```

### Issue: "Database kayak_admin does not exist"
**Solution**: Restart MySQL container to run init scripts:
```powershell
docker-compose down
docker-compose up -d mysql
```
Wait 30 seconds, then start services.

## What's Next

The following features still need to be implemented:

1. **User Management UI** - Page to list, view, and modify users
2. **Listings Management UI** - Forms to create/edit hotels, flights, cars
3. **Host Analytics Page** - Complete analytics with all charts (clicks, reviews, traces)
4. **Enhanced Listings Pages** - Update existing pages with admin create/edit capabilities
5. **Toast Notifications** - Error and success messages throughout the app
6. **CSS Styling** - Make all new pages look consistent with existing design
7. **Update App.jsx Routes** - Add BillingManagement and other new pages to routing

## API Endpoints Summary

### Administrator Management
- `POST /api/admin/administrators` - Create administrator
- `GET /api/admin/administrators` - List administrators
- `GET /api/admin/administrators/:id` - Get administrator
- `PUT /api/admin/administrators/:id` - Update administrator
- `DELETE /api/admin/administrators/:id` - Delete administrator

### User Management
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `PATCH /api/admin/users/:id/activate` - Activate user
- `PATCH /api/admin/users/:id/deactivate` - Deactivate user
- `PATCH /api/admin/users/:id/role` - Change user role

### Listings Management
- `GET /api/admin/listings?type=hotels` - Search listings
- `GET /api/admin/listings/:type/:id` - Get listing
- `POST /api/admin/listings/:type` - Create listing
- `PUT /api/admin/listings/:type/:id` - Update listing
- `DELETE /api/admin/listings/:type/:id` - Delete listing

### Billing Management
- `GET /api/admin/billing/search` - Search bills (by date, month, etc.)
- `GET /api/admin/billing/:id` - Get bill details
- `GET /api/admin/billing/stats` - Get billing statistics
- `GET /api/admin/billing/monthly-revenue` - Monthly revenue report

### Analytics
- `GET /api/admin/analytics/dashboard` - Dashboard metrics
- `GET /api/admin/analytics/top-properties` - Top 10 properties by revenue
- `GET /api/admin/analytics/city-revenue` - City-wise revenue
- `GET /api/admin/analytics/top-hosts` - Top hosts/providers
- `GET /api/admin/analytics/page-clicks` - Page click analytics
- `GET /api/admin/analytics/property-clicks` - Property click analytics
- `GET /api/admin/analytics/user-trace` - User journey tracking
- `GET /api/admin/analytics/bidding-trace` - Bidding/offers tracking
- `GET /api/admin/analytics/reviews` - Reviews analytics
- `GET /api/admin/analytics/least-viewed` - Least viewed sections

## Notes
- All admin endpoints require JWT authentication with admin role
- The system uses port 3307 for MySQL (not the default 3306)
- Recharts is used for data visualization
- The admin portal uses React + Vite
- Backend services communicate via HTTP (in production, use service mesh)
