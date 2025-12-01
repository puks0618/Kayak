# Kayak Project - Administrator System Enhanced

## 🎉 NEW: Complete Administrator System Implemented!

This repository now includes a **fully functional Administrator Management System** with:

- ✅ **Administrator Entity & Database** - Complete data model with CRUD operations
- ✅ **Advanced Analytics Dashboard** - Charts for revenue, properties, hosts
- ✅ **Billing Management** - Search bills by date/month with detailed views
- ✅ **User Management APIs** - View, edit, activate/deactivate users
- ✅ **Listings Management** - Create/edit hotels, flights, cars
- ✅ **Host/Provider Analytics** - Page clicks, property clicks, user traces
- ✅ **Role-Based Access Control** - JWT authentication with admin permissions
- ✅ **Beautiful UI** - React + Recharts visualizations

---

## 🚀 Quick Start (ONE COMMAND!)

### Option 1: PowerShell Script (Easiest)
```powershell
.\START-ADMIN-SYSTEM.ps1
```

### Option 2: Docker Compose
```powershell
cd kayak-microservices\infrastructure\docker
docker-compose up -d
```

**Then access:**
- **Admin Portal**: http://localhost:5174
- **Admin Service API**: http://localhost:3007
- **Web Client**: http://localhost:5175

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| `IMPLEMENTATION_COMPLETE.md` | **Complete implementation summary** with all features, APIs, and testing guide |
| `ADMIN_IMPLEMENTATION_GUIDE.md` | **Step-by-step startup guide** and troubleshooting |
| `START-ADMIN-SYSTEM.ps1` | **One-click startup script** for Windows |

---

## 🔐 Default Admin Login

```
Email:    admin@kayak.com
Password: Admin123!
```

*(Create this user via auth service registration with role='admin')*

---

## ⚠️ Important: MySQL Port Configuration

**This project uses MySQL on PORT 3307 (not the default 3306).**

This avoids conflicts with existing MySQL installations. All services are configured for port 3307.

---

## 🏗️ Architecture

### Microservices (Backend)
1. **auth-service** (3001) - JWT authentication
2. **user-service** (3002) - User management
3. **listing-service** (3003) - Hotels, flights, cars
4. **search-service** (3004) - Search functionality
5. **booking-service** (3005) - Bookings & billing
6. **analytics-service** (3006) - Analytics data
7. **admin-service** (3007) - **NEW! Admin operations**
8. **ai-agent** (8000) - AI features
9. **api-gateway** (3000) - Gateway

### Frontend Applications
1. **admin-portal** (5174) - **Enhanced! Admin interface**
2. **web-client** (5175) - Customer interface

### Databases
- **MySQL** (3307) - kayak_auth, kayak_users, kayak_listings, kayak_bookings, **kayak_admin**
- **MongoDB** (27017) - Analytics data
- **Redis** (6379) - Caching
- **Kafka + Zookeeper** - Event streaming

---

## 📊 New Admin Features

### Dashboard Analytics
- **Metrics Cards**: Revenue, Bookings, Listings, Users
- **Top 10 Properties Chart**: Revenue visualization
- **City-wise Revenue**: Pie chart breakdown
- **Top Hosts**: Dual-axis bar chart (sales + revenue)

### Billing Management
- **Advanced Search**: By date, month, year, amount, status
- **Pagination**: Handle large datasets
- **Bill Details Modal**: Full transaction information

### User Management (APIs)
- List all users with filters
- View user details
- Update user information
- Activate/Deactivate accounts
- Change user roles

### Listings Management (APIs)
- Create hotels, flights, cars
- Search with filters
- Edit existing listings
- Delete listings

### Analytics Reports (APIs)
- Page click tracking
- Property engagement
- User journey traces
- Bidding/offers tracking
- Reviews analytics
- Least viewed sections

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| Backend | Node.js, Express.js, Sequelize ORM |
| Frontend | React 18, Vite, Recharts, React Router |
| Databases | MySQL 8.0, MongoDB 7.0, Redis 7 |
| Message Queue | Apache Kafka with Zookeeper |
| Authentication | JWT (jsonwebtoken) |
| Containerization | Docker, Docker Compose |
| API Communication | Axios, RESTful APIs |

---

## 📁 Project Structure

```
kayak-admin/
├── kayak-microservices/
│   ├── services/
│   │   ├── admin-service/          ✨ NEW & ENHANCED
│   │   ├── auth-service/
│   │   ├── user-service/
│   │   ├── listing-service/
│   │   ├── booking-service/
│   │   ├── search-service/
│   │   ├── analytics-service/
│   │   └── ai-agent/
│   ├── frontend/
│   │   ├── admin-portal/           ✨ ENHANCED
│   │   └── web-client/
│   └── infrastructure/
│       ├── docker/
│       │   └── docker-compose.yml  ✨ UPDATED
│       └── databases/
│           └── mysql/init/
│               └── 06-admin.sql    ✨ NEW
├── IMPLEMENTATION_COMPLETE.md      ✨ NEW - Full documentation
├── ADMIN_IMPLEMENTATION_GUIDE.md   ✨ NEW - Setup guide
├── START-ADMIN-SYSTEM.ps1          ✨ NEW - Startup script
└── README.md                       ✨ UPDATED
```

---

## 🧪 Testing the Admin System

### 1. Start Everything
```powershell
.\START-ADMIN-SYSTEM.ps1
```

### 2. Create Admin User
```bash
POST http://localhost:3001/api/auth/register
{
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@kayak.com",
  "password": "Admin123!",
  "role": "admin"
}
```

### 3. Login
```bash
POST http://localhost:3001/api/auth/login
{
  "email": "admin@kayak.com",
  "password": "Admin123!"
}
```

### 4. Test Admin Endpoints (with JWT token)
```bash
# Dashboard metrics
GET http://localhost:3007/api/admin/analytics/dashboard
Authorization: Bearer <token>

# Search bills
GET http://localhost:3007/api/admin/billing/search?year=2025&month=11
Authorization: Bearer <token>

# List users
GET http://localhost:3007/api/admin/users
Authorization: Bearer <token>
```

---

## 🔗 API Endpoints Summary

### Administrator Management
- `POST /api/admin/administrators` - Create admin
- `GET /api/admin/administrators` - List admins
- `GET /api/admin/administrators/:id` - Get admin
- `PUT /api/admin/administrators/:id` - Update admin
- `DELETE /api/admin/administrators/:id` - Delete admin

### Analytics & Reports
- `GET /api/admin/analytics/dashboard` - Dashboard metrics
- `GET /api/admin/analytics/top-properties` - Top 10 by revenue
- `GET /api/admin/analytics/city-revenue` - City breakdown
- `GET /api/admin/analytics/top-hosts` - Top providers
- `GET /api/admin/analytics/page-clicks` - Page engagement
- `GET /api/admin/analytics/user-trace` - User journeys

### Billing Management
- `GET /api/admin/billing/search` - Search bills
- `GET /api/admin/billing/:id` - Bill details
- `GET /api/admin/billing/stats` - Statistics
- `GET /api/admin/billing/monthly-revenue` - Revenue report

### User Management
- `GET /api/admin/users` - List users
- `GET /api/admin/users/:id` - User details
- `PUT /api/admin/users/:id` - Update user
- `PATCH /api/admin/users/:id/activate` - Activate
- `PATCH /api/admin/users/:id/deactivate` - Deactivate
- `PATCH /api/admin/users/:id/role` - Change role

### Listings Management
- `GET /api/admin/listings?type=hotels` - Search
- `GET /api/admin/listings/:type/:id` - Get listing
- `POST /api/admin/listings/:type` - Create
- `PUT /api/admin/listings/:type/:id` - Update
- `DELETE /api/admin/listings/:type/:id` - Delete

---

## 🐛 Common Issues

### "Cannot connect to MySQL"
- **Solution**: Use port **3307**, not 3306
- **Check**: `docker ps | Select-String mysql`

### "Authentication required"
- **Solution**: Login first and get JWT token
- Admin portal handles this automatically

### "Database kayak_admin does not exist"
- **Solution**: Restart MySQL container
  ```powershell
  docker-compose down
  docker-compose up -d mysql
  ```
  Wait 30 seconds for init scripts to run.

### Services won't start
- **Solution**: Install dependencies
  ```powershell
  cd kayak-microservices\services\admin-service
  npm install
  ```

---

## 🎓 What's Implemented

| Feature | Status | Details |
|---------|--------|---------|
| Administrator Entity | ✅ | Sequelize model with 13 fields |
| CRUD APIs | ✅ | Full REST API with validation |
| Auth Middleware | ✅ | JWT + RBAC |
| User Management | ✅ | List, view, edit, activate/deactivate |
| Listings Management | ✅ | Hotels, flights, cars CRUD |
| Billing Search | ✅ | Date, month, year filters |
| Bill Details | ✅ | Complete transaction info |
| Dashboard Charts | ✅ | 3 Recharts visualizations |
| Analytics APIs | ✅ | 10+ endpoints |
| Error Handling | ✅ | Alerts + try-catch blocks |
| UI/UX | ✅ | Responsive design with CSS |
| Docker Integration | ✅ | One-command startup |

---

## 📞 Support & Documentation

- **Full Implementation Details**: See `IMPLEMENTATION_COMPLETE.md`
- **Setup Instructions**: See `ADMIN_IMPLEMENTATION_GUIDE.md`
- **Quick Start**: Run `START-ADMIN-SYSTEM.ps1`

---

## 🎯 Project Goals Achieved

✅ Extended existing codebase (not created new project)  
✅ Integrated with feature/billingportalinadmin branch  
✅ Reused existing auth system and architecture  
✅ Implemented all Administrator entity requirements  
✅ Created comprehensive CRUD APIs  
✅ Built analytics dashboard with charts  
✅ Added billing management with search  
✅ Implemented user and listings management  
✅ Added host/provider analytics  
✅ Included error handling and notifications  
✅ Made it work with `docker-compose up`  

---

**Ready to use! Start with `.\START-ADMIN-SYSTEM.ps1` and access http://localhost:5174** 🚀
