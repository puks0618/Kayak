# Docker Analytics Testing Guide 🐳

Complete guide to build and test the analytics feature using Docker.

---

## 🚀 Quick Start (One Command)

```bash
cd kayak-microservices
./start-analytics-test.sh
```

That's it! The script will:
1. ✅ Check Docker is running
2. ✅ Build admin-service image
3. ✅ Build admin-portal image
4. ✅ Start MySQL database
5. ✅ Start all services
6. ✅ Wait for services to be ready
7. ✅ Display access URLs

---

## 📦 What Gets Built

### 1. MySQL Container
- **Image:** `mysql:8.0`
- **Container:** `kayak-mysql-analytics`
- **Port:** `3306`
- **Databases:** Initializes all Kayak databases from `infrastructure/databases/mysql/init/`

### 2. Admin Service Container
- **Build:** `services/admin-service/Dockerfile`
- **Container:** `kayak-admin-service-analytics`
- **Port:** `3007`
- **Features:** Analytics API endpoints, health checks

### 3. Admin Portal Container
- **Build:** `frontend/admin-portal/Dockerfile`
- **Container:** `kayak-admin-portal-analytics`
- **Port:** `5173` (mapped to 80 inside container)
- **Tech:** React + Vite + Nginx

---

## 🌐 Access Points

Once running, access:

| Service | URL | Description |
|---------|-----|-------------|
| **Admin Portal** | http://localhost:5173 | Full admin dashboard |
| **Analytics Page** | http://localhost:5173/analytics | Analytics & Reports |
| **Health Check** | http://localhost:3007/health | Service health status |
| **API Overview** | http://localhost:3007/api/admin/analytics/overview?year=2025 | Overview API |

---

## 🧪 Testing Steps

### Step 1: Start the Environment
```bash
cd kayak-microservices
./start-analytics-test.sh
```

**Expected Output:**
```
🚀 Starting Analytics Feature Test with Docker
==============================================

✅ Docker is running
🔨 Building Docker images...
📦 Building admin-service image...
✅ Admin service built
📦 Building admin-portal image...
✅ Admin portal built
🚀 Starting services...
⏳ Waiting for services to be ready...
  - MySQL: ✅ Ready
  - Admin Service: ✅ Ready
  - Admin Portal: ✅ Ready

🎉 Analytics Test Environment is Ready!
```

### Step 2: Access the Analytics Dashboard
1. Open browser: **http://localhost:5173/analytics**
2. You should see the analytics page with 4 tabs

### Step 3: Add Test Data (First Time Only)

If you see "No data available", add test data:

```bash
# From kayak-microservices directory
docker exec -i kayak-mysql-analytics mysql -uroot -pSomalwar1! < scripts/create-analytics-test-data.sql
```

**OR** manually add bookings:

```bash
# Connect to MySQL
docker exec -it kayak-mysql-analytics mysql -uroot -pSomalwar1!

# Then run:
USE kayak_bookings;

-- Get sample IDs
SET @hotel_id = (SELECT id FROM kayak_listings.hotels LIMIT 1);
SET @user_id = (SELECT id FROM kayak_users.users LIMIT 1);

-- Insert test booking
INSERT INTO bookings (id, user_id, listing_id, listing_type, status, travel_date, total_amount, booking_date)
VALUES (UUID(), @user_id, @hotel_id, 'hotel', 'completed', '2025-06-15', 299.99, '2025-01-15');

EXIT;
```

### Step 4: Test Each Report

#### Overview Tab
- Should show 4 summary cards
- Pie chart for booking breakdown
- Line chart for monthly trends

#### Top Properties Tab
- Bar chart with top 10 properties
- Table with rankings
- Property type badges

#### City Revenue Tab
- Bar chart for cities
- Pie chart for top 10 cities
- Complete city table

#### Top Providers Tab
- Dual-axis chart
- Provider rankings table
- Period filter (last month / 3 months)

### Step 5: Test API Directly

```bash
# Test health
curl http://localhost:3007/health

# Test overview
curl http://localhost:3007/api/admin/analytics/overview?year=2025

# Test top properties
curl http://localhost:3007/api/admin/analytics/top-properties?year=2025

# Test city revenue
curl http://localhost:3007/api/admin/analytics/city-revenue?year=2025

# Test top providers
curl http://localhost:3007/api/admin/analytics/top-providers?period=last_month
```

---

## 🔍 Monitoring & Debugging

### View Logs

**Admin Service Logs:**
```bash
docker-compose -f docker-compose-analytics-test.yml logs -f admin-service
```

**Admin Portal Logs:**
```bash
docker-compose -f docker-compose-analytics-test.yml logs -f admin-portal
```

**MySQL Logs:**
```bash
docker-compose -f docker-compose-analytics-test.yml logs -f mysql
```

**All Logs:**
```bash
docker-compose -f docker-compose-analytics-test.yml logs -f
```

### Check Container Status

```bash
docker-compose -f docker-compose-analytics-test.yml ps
```

**Expected:**
```
NAME                              STATUS   PORTS
kayak-admin-portal-analytics      Up       0.0.0.0:5173->80/tcp
kayak-admin-service-analytics     Up       0.0.0.0:3007->3007/tcp
kayak-mysql-analytics             Up       0.0.0.0:3306->3306/tcp
```

### Verify Database

```bash
# Connect to MySQL
docker exec -it kayak-mysql-analytics mysql -uroot -pSomalwar1!

# Check databases
SHOW DATABASES;

# Check bookings
USE kayak_bookings;
SELECT COUNT(*) FROM bookings;

# Check hotels
USE kayak_listings;
SELECT COUNT(*) FROM hotels;

# Exit
EXIT;
```

---

## 🛑 Stop & Cleanup

### Stop Services (Keep Data)
```bash
docker-compose -f docker-compose-analytics-test.yml stop
```

### Stop & Remove Containers (Keep Data)
```bash
docker-compose -f docker-compose-analytics-test.yml down
```

### Remove Everything (Including Data)
```bash
docker-compose -f docker-compose-analytics-test.yml down -v
```

### Clean Up Images
```bash
# Remove built images
docker rmi kayak-microservices-admin-service
docker rmi kayak-microservices-admin-portal

# Clean up unused Docker resources
docker system prune -a
```

---

## 🔄 Restart Services

```bash
# Quick restart
docker-compose -f docker-compose-analytics-test.yml restart

# Or restart individual service
docker-compose -f docker-compose-analytics-test.yml restart admin-service
```

---

## 🐛 Troubleshooting

### Issue 1: "Docker is not running"

**Fix:**
```bash
# On Mac
open /Applications/Docker.app

# On Linux
sudo systemctl start docker

# Verify
docker info
```

---

### Issue 2: "Port already in use"

**Symptoms:** Error like `port 3306 is already allocated`

**Fix:**
```bash
# Check what's using the port
lsof -i :3306  # or :3007 or :5173

# Stop conflicting service or change port in docker-compose-analytics-test.yml
```

---

### Issue 3: "Cannot connect to database"

**Check:**
```bash
# Is MySQL ready?
docker exec kayak-mysql-analytics mysqladmin ping -h localhost -pSomalwar1!

# Check logs
docker logs kayak-mysql-analytics
```

---

### Issue 4: "Admin service returns 500 error"

**Check:**
```bash
# View admin service logs
docker logs kayak-admin-service-analytics

# Verify database connection
docker exec kayak-mysql-analytics mysql -uroot -pSomalwar1! -e "SHOW DATABASES;"
```

---

### Issue 5: "No data in analytics"

**Fix:**
```bash
# Add test data
docker exec -i kayak-mysql-analytics mysql -uroot -pSomalwar1! < scripts/create-analytics-test-data.sql

# Or manually via MySQL client
docker exec -it kayak-mysql-analytics mysql -uroot -pSomalwar1!
```

---

### Issue 6: "Build fails"

**Fix:**
```bash
# Clean Docker cache
docker builder prune

# Rebuild without cache
docker-compose -f docker-compose-analytics-test.yml build --no-cache

# Check Dockerfile exists
ls -la services/admin-service/Dockerfile
ls -la frontend/admin-portal/Dockerfile
```

---

### Issue 7: "Frontend shows 404"

**Check:**
```bash
# Is admin-portal container running?
docker ps | grep admin-portal

# Check nginx logs
docker logs kayak-admin-portal-analytics

# Verify build
docker exec kayak-admin-portal-analytics ls -la /usr/share/nginx/html
```

---

## 📊 Verify Everything Works

Run this checklist:

```bash
# 1. Health check
curl http://localhost:3007/health
# Expected: {"status":"OK","service":"admin-service"}

# 2. Database check
docker exec kayak-mysql-analytics mysql -uroot -pSomalwar1! -e "SELECT COUNT(*) FROM kayak_bookings.bookings;"

# 3. API check
curl http://localhost:3007/api/admin/analytics/overview?year=2025 | jq

# 4. Frontend check
curl -I http://localhost:5173
# Expected: HTTP/1.1 200 OK
```

---

## 🎯 Complete Test Sequence

```bash
# 1. Start environment
./start-analytics-test.sh

# 2. Wait for services (script does this)

# 3. Add test data
docker exec -i kayak-mysql-analytics mysql -uroot -pSomalwar1! < scripts/create-analytics-test-data.sql

# 4. Test API
curl http://localhost:3007/api/admin/analytics/overview?year=2025

# 5. Test frontend
open http://localhost:5173/analytics

# 6. Check all tabs work
# - Overview
# - Top Properties
# - City Revenue
# - Top Providers

# 7. Test filters
# - Change year
# - Change period

# 8. Check logs for errors
docker-compose -f docker-compose-analytics-test.yml logs --tail=50

# 9. Stop when done
docker-compose -f docker-compose-analytics-test.yml down
```

---

## 🏗️ Production Deployment

For production, use the full docker-compose:

```bash
# Build all services
cd kayak-microservices/infrastructure/docker
docker-compose up -d

# Or just update admin services
docker-compose up -d admin-service admin-portal
```

---

## 📝 Notes

- **Data Persistence:** MySQL data is stored in Docker volume `mysql_analytics_data`
- **Network:** All containers use `kayak-analytics-network` bridge
- **Health Checks:** Services have built-in health checks for reliability
- **Logs:** All service logs available via `docker logs` or `docker-compose logs`

---

## 🎉 Success Criteria

Your Docker setup is successful when:

✅ All containers start without errors
✅ Health checks pass
✅ http://localhost:3007/health returns OK
✅ http://localhost:5173/analytics loads
✅ All 4 tabs display data
✅ Charts render properly
✅ API endpoints return valid JSON
✅ No errors in container logs

---

## 🚀 Next Steps

1. ✅ Test with Docker
2. Share with team (they can use the same script)
3. Deploy to staging/production
4. Add monitoring and alerting

**Happy Docker Testing! 🐳📊✨**

