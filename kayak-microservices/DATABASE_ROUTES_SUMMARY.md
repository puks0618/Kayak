# Database Routes and Configuration Summary

## ✅ Completed Setup

### 1. AWS RDS MySQL Database
**Status**: ✅ **DEPLOYED AND INITIALIZED**

**Connection Details:**
- **Endpoint**: `kayak-mysql-db.c078kkiggn44.us-east-1.rds.amazonaws.com`
- **Port**: 3306
- **Username**: admin
- **Password**: Somalwar1!

**Databases Created:**
- `kayak_auth` - Authentication and sessions
- `kayak_users` - User profiles and accounts
- `kayak_listings` - Flights, hotels, cars
- `kayak_bookings` - Bookings and billing

**Tables Initialized:**
✅ users, flights, hotels, cars, bookings, billing, admin tables

### 2. AWS DocumentDB (MongoDB) Configuration
**Status**: 🔧 **READY TO DEPLOY**

**Terraform Files Created:**
- `infrastructure/terraform/mongodb.tf` - DocumentDB cluster and instances
- Updated `variables.tf` with MongoDB variables
- Updated `outputs.tf` with MongoDB endpoints
- Updated `terraform.tfvars` with configuration

**To Deploy DocumentDB:**
```bash
cd infrastructure/terraform
terraform apply
```

**Estimated Cost**: ~$90-110/month (db.t3.medium instance)

**Collections to be Created:**
- `kayak_listings.reviews` - User reviews
- `kayak_listings.images` - Media metadata
- `kayak_analytics.analytics` - Analytics data
- `kayak_logs.application_logs` - Application logs (capped)

## 📁 Connection Libraries Created

### MySQL Connection Manager
**File**: `shared/database/mysql.js`

**Usage:**
```javascript
const { connections } = require('../shared/database/mysql');

// Connect to users database
const userDb = connections.users;
await userDb.connect();

// Execute query
const users = await userDb.query('SELECT * FROM users WHERE id = ?', [userId]);
```

### MongoDB Connection Manager
**File**: `shared/database/mongodb.js`

**Usage:**
```javascript
const { connections } = require('../shared/database/mongodb');

// Connect to listings database
const listingsDb = connections.listings;
await listingsDb.connect();

// Get collection and query
const reviews = listingsDb.getCollection('reviews');
const results = await reviews.find({ listing_id: id }).toArray();
```

### Database Configuration
**File**: `shared/config/database.js`

Central configuration for both MySQL and MongoDB connections with environment variable support.

## 🔧 Service-to-Database Routing

### MySQL Routes (RDS)

| Service | Database | Port | Tables |
|---------|----------|------|--------|
| **auth-service** | kayak_auth | 3306 | sessions, tokens |
| **user-service** | kayak_users | 3306 | users |
| **listing-service** | kayak_listings | 3306 | flights, hotels, cars |
| **booking-service** | kayak_bookings | 3306 | bookings, billing |

### MongoDB Routes (DocumentDB)

| Service | Database | Port | Collections |
|---------|----------|------|-------------|
| **listing-service** | kayak_listings | 27017 | reviews, images |
| **analytics-service** | kayak_analytics | 27017 | analytics |
| **all-services** | kayak_logs | 27017 | application_logs |

## 🌐 Network Configuration

### Security Groups Created

**MySQL RDS Security Group** (`kayak-rds-sg`):
- Inbound: Port 3306 (MySQL)
- Source: 0.0.0.0/0 (Update for production!)

**DocumentDB Security Group** (`kayak-docdb-sg`):
- Inbound: Port 27017 (MongoDB)
- Source: 0.0.0.0/0 (Update for production!)

### Subnet Configuration
- VPC: `vpc-006375288b859f83e`
- Subnets: 
  - `subnet-0e9f5d406f244bbf5` (us-east-1a)
  - `subnet-0b2f91f0169ddad77` (us-east-1f)
- Multi-AZ deployment for high availability

## 📝 Environment Variables

**File**: `.env.example` created with all database configurations

**MySQL Configuration:**
```env
MYSQL_HOST=kayak-mysql-db.c078kkiggn44.us-east-1.rds.amazonaws.com
MYSQL_PORT=3306
MYSQL_USER=admin
MYSQL_PASSWORD=Somalwar1!
```

**MongoDB Configuration:**
```env
MONGODB_HOST=<will-be-generated-after-deployment>
MONGODB_PORT=27017
MONGODB_USER=kayakadmin
MONGODB_PASSWORD=Somalwar1!
MONGODB_SSL=true
```

## 🚀 Deployment Scripts Created

### MySQL Initialization
**Script**: `infrastructure/terraform/init-rds.py`
**Status**: ✅ Already executed successfully

### MongoDB Initialization
**Script**: `infrastructure/terraform/init-docdb.sh`
**Status**: Ready to run after DocumentDB deployment

**Usage:**
```bash
cd infrastructure/terraform
./init-docdb.sh
```

## 📖 Example Usage Files

**MySQL Example**: `shared/examples/mysql-usage.js`
- getUserById()
- createUser()

**MongoDB Example**: `shared/examples/mongodb-usage.js`
- getReviewsByListingId()
- createReview()
- logAnalytics()
- writeLog()

## 🎯 Next Steps

### To Deploy MongoDB (DocumentDB):

1. **Apply Terraform** (10-15 minutes):
   ```bash
   cd infrastructure/terraform
   terraform apply
   ```

2. **Get DocumentDB Endpoint**:
   ```bash
   terraform output docdb_endpoint
   ```

3. **Initialize Collections**:
   ```bash
   ./init-docdb.sh
   ```

4. **Update .env files** in all services with MongoDB endpoint

### To Use in Microservices:

1. Copy `.env.example` to `.env` in each service directory
2. Update with actual database endpoints
3. Import connection managers:
   ```javascript
   // For MySQL
   const { connections } = require('../shared/database/mysql');
   
   // For MongoDB
   const { connections } = require('../shared/database/mongodb');
   ```

## 💰 Cost Summary

| Resource | Type | Monthly Cost |
|----------|------|--------------|
| MySQL RDS | db.t3.micro | ~$17 |
| DocumentDB | db.t3.medium | ~$95-110 |
| Storage | 20GB | ~$2-5 |
| **Total** | | **~$115-135/month** |

## ⚠️ Security Recommendations

1. ✅ SSL/TLS encryption enabled
2. ✅ Storage encryption enabled
3. ⚠️ Update security groups to restrict IP ranges
4. ⚠️ Change default passwords in production
5. ⚠️ Enable IAM authentication (optional)
6. ⚠️ Set up CloudWatch alarms
7. ⚠️ Configure automated backups

## 📚 Documentation Created

- `DATABASE_DEPLOYMENT.md` - Complete deployment guide
- `README.md` in terraform folder - Quick start guide
- Connection examples in `shared/examples/`

---

## Status Summary

✅ **MySQL RDS**: Fully deployed and operational
✅ **Terraform files**: Created for both databases  
✅ **Connection libraries**: Implemented
✅ **Security groups**: Configured
✅ **Init scripts**: Ready
🔧 **DocumentDB**: Configuration ready, awaiting deployment command
