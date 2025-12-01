# Kayak Database Setup Guide

## 🎯 Overview

This guide explains how to set up the Kayak flight search database with 373,000+ flight records for the DATA 236 Distributed Systems project.

## 📍 Where Is the Database Stored?

### Current Setup
- **Storage Type**: Docker Volume (persistent)
- **Volume Name**: `docker_mysql_data`
- **Database Name**: `kayak_listings`
- **Main Table**: `flights`
- **Records**: 373,481 flights
- **Size**: 315.39 MB
- **Date Range**: December 2025 - February 2026 (90 days)

### Important Notes
⚠️ **The database is LOCAL to each developer's machine** - stored in Docker volumes
✅ **Data persists** across container restarts
❌ **Not shared** between team members by default

---

## 🚀 Quick Start for Team Members

### Prerequisites
- Docker Desktop installed and running
- Python 3.x installed
- `mysql-connector-python` package (`pip install mysql-connector-python`)

### Step 1: Pull the Latest Code
```bash
cd ~/path/to/Kayak
git pull origin feature/billingportalinadmin
```

### Step 2: Start Docker Services
```bash
cd kayak-microservices/infrastructure/docker
docker compose up -d
```

Wait for all services to start (~30 seconds).

### Step 3: Run Database Setup Script

**Option A: Automated Setup (Recommended)**
```bash
cd kayak-microservices/scripts
chmod +x setup-database.sh
./setup-database.sh
```

This will:
- ✅ Create the `kayak_listings` database
- ✅ Create the `flights` table with proper indexes
- ✅ Generate 373,481 flight records (if table is empty)
- ✅ Display database statistics

**Option B: Manual Setup**
```bash
# 1. Create database
docker exec kayak-mysql mysql -uroot -p'Somalwar1!' -e "CREATE DATABASE IF NOT EXISTS kayak_listings;"

# 2. Create table (see SQL schema below)
docker exec kayak-mysql mysql -uroot -p'Somalwar1!' kayak_listings < infrastructure/databases/mysql/init/01_create_flights.sql

# 3. Generate flight data
cd ~/path/to/Kayak
python3 generate_complete_flights.py
```

### Step 4: Verify Setup
```bash
# Check database size
docker exec kayak-mysql mysql -uroot -p'Somalwar1!' kayak_listings -e "
SELECT 
    COUNT(*) as total_flights,
    COUNT(DISTINCT airline) as airlines,
    COUNT(DISTINCT departure_airport) as airports
FROM flights;
"

# Expected output:
# total_flights: 373,481
# airlines: 8 (American, Delta, United, Southwest, JetBlue, Spirit, Alaska, Frontier)
# airports: 16 major US airports
```

---

## 📊 Flight Data Specifications

### Airlines Included
- American Airlines
- Delta
- United
- Southwest
- JetBlue
- Alaska Airlines
- Spirit
- Frontier

### Airports Covered
ATL, BOS, CLT, DEN, DFW, DTW, EWR, IAD, JFK, LAX, LGA, MIA, OAK, ORD, PHL, SFO

### Flight Characteristics
- **Date Range**: Dec 1, 2025 - Feb 28, 2026 (90 days)
- **Flights per Route**: 3-6 flights per day per cabin class
- **Cabin Classes**: Economy, Premium Economy, Business, First
- **Stops**: 0 (60%), 1 (30%), 2 (10%)
- **Price Range**: 
  - Economy: $80-$500
  - Premium Economy: $200-$800
  - Business: $500-$1,500
  - First: $1,000-$3,000
- **Deals**: ~15% of flights marked as deals with 10-30% discount

---

## 🔄 Syncing Database Changes

### If One Team Member Makes Database Changes

**Developer who made changes:**
```bash
# Export the database
docker exec kayak-mysql mysqldump -uroot -p'Somalwar1!' kayak_listings > kayak_listings_$(date +%Y%m%d).sql

# Share the SQL file via Git LFS or Google Drive
```

**Other team members:**
```bash
# Download the SQL file and import
docker exec -i kayak-mysql mysql -uroot -p'Somalwar1!' kayak_listings < kayak_listings_20251129.sql
```

### Alternative: Regenerate from Script
Since flight data is generated via Python script, everyone can simply run:
```bash
python3 generate_complete_flights.py
```
This ensures consistent data across all team members.

---

## 🛠️ Database Schema

### Flights Table
```sql
CREATE TABLE flights (
  id VARCHAR(36) PRIMARY KEY,
  flight_code VARCHAR(20) NOT NULL,
  airline VARCHAR(255) NOT NULL,
  departure_airport VARCHAR(10) NOT NULL,
  arrival_airport VARCHAR(10) NOT NULL,
  departure_time DATETIME NOT NULL,
  arrival_time DATETIME NOT NULL,
  duration INT NOT NULL,
  stops INT DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  seats_total INT NOT NULL,
  seats_left INT NOT NULL,
  cabin_class ENUM('economy', 'premium economy', 'business', 'first') DEFAULT 'economy',
  is_deal TINYINT(1) DEFAULT 0,
  discount_percent INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_departure_airport (departure_airport),
  INDEX idx_arrival_airport (arrival_airport),
  INDEX idx_departure_time (departure_time),
  INDEX idx_price (price),
  INDEX idx_cabin_class (cabin_class),
  INDEX idx_stops (stops),
  INDEX idx_is_deal (is_deal)
);
```

---

## 🐛 Troubleshooting

### "Docker is not running"
```bash
# Start Docker Desktop application
# Wait for Docker whale icon to show in menu bar
```

### "kayak-mysql container is not running"
```bash
cd kayak-microservices/infrastructure/docker
docker compose up -d mysql
```

### "Table 'flights' doesn't exist"
```bash
# Run the setup script
cd kayak-microservices/scripts
./setup-database.sh
```

### "No flight data after running script"
```bash
# Check Python dependencies
pip install mysql-connector-python

# Run generation script manually
python3 generate_complete_flights.py
```

### "Port 3307 already in use"
```bash
# Check what's using port 3307
lsof -i :3307

# Either stop that service or change MySQL port in docker-compose.yml
```

---

## 📈 Database Performance

### Current Stats
- **Records**: 373,481
- **Database Size**: 315.39 MB
- **Indexes**: 7 indexes for fast queries
- **Query Performance**: 
  - Search by date + route: ~50ms
  - Filter by price range: ~30ms
  - Sort by price: ~40ms

### Optimization Tips
- Use indexed columns in WHERE clauses
- Limit results for pagination (LIMIT/OFFSET)
- Avoid SELECT * - only fetch needed columns
- Use connection pooling in production

---

## 🤝 Team Coordination

### Best Practices
1. **Don't modify the schema** without team discussion
2. **Use `generate_complete_flights.py`** for consistent data
3. **Share SQL dumps** only for major structural changes
4. **Document any custom data** you add in testing
5. **Reset database** to baseline before major demos:
   ```bash
   docker exec kayak-mysql mysql -uroot -p'Somalwar1!' kayak_listings -e "TRUNCATE flights;"
   python3 generate_complete_flights.py
   ```

---

## 📞 Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Ask in the team Slack/Discord channel
3. Review Docker logs: `docker logs kayak-mysql`
4. Check MySQL logs: `docker exec kayak-mysql tail -f /var/log/mysql/error.log`

---

## 🎓 For the Professor/TA

The database setup is automated and reproducible:
- All team members can generate identical flight data
- Python script (`generate_complete_flights.py`) creates consistent 373K records
- Docker volumes ensure data persistence
- Setup takes ~2-3 minutes on first run

**To demo from fresh clone:**
```bash
git clone <repo-url>
cd kayak-microservices/infrastructure/docker
docker compose up -d
cd ../../scripts
./setup-database.sh
```

Database will be ready with 373K+ flight records in ~3 minutes.
