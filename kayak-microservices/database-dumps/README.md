# Database Dumps - Import Instructions

## 📦 What's Included

- **mysql-all-databases.sql** (99MB) - Complete MySQL dump with all databases
- **mongodb-all-databases.archive** (18KB) - Complete MongoDB dump with all databases

## 🚀 How to Import on Your Machine

### Prerequisites
1. Clone this repository
2. Have Docker and Docker Compose installed
3. Navigate to `kayak-microservices/infrastructure/docker`

---

## Step-by-Step Import Instructions

### 1. Start the Database Containers (ONLY)

```bash
cd kayak-microservices/infrastructure/docker
docker-compose up -d mysql mongodb
```

Wait 30 seconds for databases to initialize.

---

### 2. Import MySQL Database

```bash
# Navigate to where the dumps are
cd ../../database-dumps

# Import all MySQL databases
docker exec -i kayak-mysql mysql -uroot -pSomalwar1! < mysql-all-databases.sql
```

**This imports:**
- `kayak_auth` - Authentication data
- `kayak_users` - User profiles
- `kayak_listings` - Hotels, flights data
- `kayak_bookings` - Booking records
- All tables, data, indexes, triggers

---

### 3. Import MongoDB Database

```bash
# Import all MongoDB databases
docker exec -i kayak-mongodb mongorestore --archive < mongodb-all-databases.archive
```

**This imports:**
- `kayak_listings` - Listing metadata
- `kayak_analytics` - Analytics data
- All collections and documents

---

### 4. Verify Import

```bash
# Check MySQL databases
docker exec kayak-mysql mysql -uroot -pSomalwar1! -e "SHOW DATABASES;"

# Check MySQL table counts
docker exec kayak-mysql mysql -uroot -pSomalwar1! -e "
  SELECT table_schema, COUNT(*) as table_count 
  FROM information_schema.tables 
  WHERE table_schema IN ('kayak_auth', 'kayak_users', 'kayak_listings', 'kayak_bookings')
  GROUP BY table_schema;"

# Check MongoDB databases
docker exec kayak-mongodb mongosh --eval "db.adminCommand('listDatabases')"
```

---

### 5. Start All Services

```bash
cd ../infrastructure/docker
docker-compose up -d
```

Now all services will have the complete database with real data!

---

## 🎯 Quick One-Liner Import

```bash
# After starting mysql and mongodb containers:
cd kayak-microservices/database-dumps && \
docker exec -i kayak-mysql mysql -uroot -pSomalwar1! < mysql-all-databases.sql && \
docker exec -i kayak-mongodb mongorestore --archive < mongodb-all-databases.archive && \
echo "✅ All databases imported successfully!"
```

---

## 📊 What You'll Get

### MySQL Data:
- **Users**: All registered users with authentication
- **Hotels**: 100+ hotel listings
- **Flights**: 76+ flight listings  
- **Bookings**: 176+ booking records
- **Analytics**: Revenue and booking data

### MongoDB Data:
- **Listing metadata**: Additional hotel/flight information
- **Analytics collections**: Dashboard and reporting data

---

## 🔧 Troubleshooting

### Issue: "ERROR 1227 Access denied"
**Solution:** Add `--force` flag
```bash
docker exec -i kayak-mysql mysql -uroot -pSomalwar1! --force < mysql-all-databases.sql
```

### Issue: MongoDB restore fails
**Solution:** Drop existing databases first
```bash
docker exec kayak-mongodb mongosh --eval "db.adminCommand({dropDatabase: 1})"
# Then retry the restore
```

### Issue: "No such file or directory"
**Solution:** Make sure you're in the `database-dumps` directory
```bash
cd kayak-microservices/database-dumps
pwd  # Should show: .../kayak-microservices/database-dumps
```

---

## ✅ Success Indicators

You'll know the import worked if you see:

### MySQL:
```
Database: kayak_auth
Tables: users (with data)

Database: kayak_listings  
Tables: hotels, flights, cars (with hundreds of records)

Database: kayak_bookings
Tables: bookings (with 176+ records)
```

### MongoDB:
```
kayak_listings database with collections
kayak_analytics database with collections
```

---

## 🎉 After Import

1. Start all services: `docker-compose up -d`
2. Visit web client: http://localhost:5175
3. Visit admin portal: http://localhost:5174
4. Login credentials from the original setup apply
5. All data should be present and functional!

---

## 📝 Notes

- **Database Dumps Created**: December 8, 2025
- **MySQL Version**: 8.0
- **MongoDB Version**: 7.0
- **Total Data Size**: ~99MB MySQL + 18KB MongoDB
- **Import Time**: ~30-60 seconds

---

## 💡 Tips

1. Import databases BEFORE starting application services
2. Wait for MySQL/MongoDB containers to be fully ready (30 seconds)
3. Check container logs if import fails: `docker logs kayak-mysql`
4. These dumps contain the complete production-like dataset
5. You can re-import anytime to reset to this state

---

## 🚨 Important

- Password in dumps: `Somalwar1!` (as configured in docker-compose.yml)
- Make sure your docker-compose.yml uses the same password
- These dumps are complete - no need for init scripts after import

---

**Need help? Check the main project README or contact the project owner.**
