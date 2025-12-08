# 🎯 Team Database Setup Guide

## Purpose

This guide helps your team members set up the **exact same database** with identical schemas, tables, and base data. This eliminates schema mismatch errors when pulling code from different branches.

---

## 📦 What You'll Get

After following this guide, everyone will have:

✅ **Same schemas** - kayak_users, kayak_listings, kayak_bookings  
✅ **Same base data** - 2,500 travellers, 2,500 owners  
✅ **Same listings** - 4,997 hotels, 106 cars, 388,920 flights  
✅ **Same bookings** - 589 bookings with billing records  
✅ **Top 30 owners** - owner00001-00030 with multiple properties  
✅ **Test account** - owner00010@test.com with 250 hotels + 6 cars + 67 bookings  

---

## 📥 Getting the Database Dump

### Option 1: Download from Shared Location
Ask @spartan for the database dump file:
- **File:** `kayak_base_data_final.sql.gz` (24MB compressed)
- **Uncompressed:** 86MB

### Option 2: Get from Git LFS (if configured)
```bash
git lfs pull
```

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Make Sure MySQL is Running

```bash
# Check if MySQL container is running
docker ps | grep kayak-mysql

# If not running, start it
cd kayak-microservices
docker-compose up -d mysql
```

### Step 2: Import the Database

**Option A: From compressed file (recommended)**
```bash
gunzip -c kayak_base_data_final.sql.gz | docker exec -i kayak-mysql mysql -u root -p'Somalwar1!'
```

**Option B: From uncompressed file**
```bash
# First decompress
gunzip kayak_base_data_final.sql.gz

# Then import
docker exec -i kayak-mysql mysql -u root -p'Somalwar1!' < kayak_base_data_final.sql
```

**Import Time:** ~2-3 minutes depending on your machine

### Step 3: Verify Import

```bash
docker exec -i kayak-mysql mysql -u root -p'Somalwar1!' -e "
SELECT 
    'Users' as db, COUNT(*) as count FROM kayak_users.users
UNION ALL
SELECT 
    'Hotels' as db, COUNT(*) FROM kayak_listings.hotels
UNION ALL  
SELECT 
    'Cars' as db, COUNT(*) FROM kayak_listings.cars
UNION ALL
SELECT 
    'Flights' as db, COUNT(*) FROM kayak_listings.flights
UNION ALL
SELECT 
    'Bookings' as db, COUNT(*) FROM kayak_bookings.bookings;
"
```

**Expected Output:**
```
db        | count
Users     | 5000
Hotels    | 4997
Cars      | 106
Flights   | 388920
Bookings  | 8596
```

---

## 🔍 Verify Your Setup

Run this script to check everything is correct:

```bash
docker exec -i kayak-mysql mysql -u root -p'Somalwar1!' << 'EOF'
-- Verification Script
SELECT '========== DATABASE VERIFICATION ==========' as '';

-- Check databases exist
SHOW DATABASES LIKE 'kayak%';

-- Check table counts
SELECT 
    'kayak_users' as database,
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'kayak_users') as tables;
    
SELECT 
    'kayak_listings' as database,
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'kayak_listings') as tables;
    
SELECT 
    'kayak_bookings' as database,
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'kayak_bookings') as tables;

-- Check user counts by role
SELECT 
    role, 
    COUNT(*) as count 
FROM kayak_users.users 
GROUP BY role;

-- Check top 30 owners have properties
SELECT 
    'Top 30 Owners' as metric,
    COUNT(DISTINCT h.owner_id) as unique_owners,
    COUNT(h.id) as total_hotels
FROM kayak_listings.hotels h
INNER JOIN kayak_users.users u ON h.owner_id = u.id
WHERE u.email IN (
    'owner00001@test.com', 'owner00002@test.com', 'owner00003@test.com',
    'owner00004@test.com', 'owner00005@test.com', 'owner00006@test.com',
    'owner00007@test.com', 'owner00008@test.com', 'owner00009@test.com',
    'owner00010@test.com', 'owner00011@test.com', 'owner00012@test.com',
    'owner00013@test.com', 'owner00014@test.com', 'owner00015@test.com',
    'owner00016@test.com', 'owner00017@test.com', 'owner00018@test.com',
    'owner00019@test.com', 'owner00020@test.com', 'owner00021@test.com',
    'owner00022@test.com', 'owner00023@test.com', 'owner00024@test.com',
    'owner00025@test.com', 'owner00026@test.com', 'owner00027@test.com',
    'owner00028@test.com', 'owner00029@test.com', 'owner00030@test.com'
);

-- Check owner00010@test.com specifically
SELECT 
    'owner00010@test.com' as owner,
    (SELECT COUNT(*) FROM kayak_listings.hotels h 
     INNER JOIN kayak_users.users u ON h.owner_id = u.id 
     WHERE u.email = 'owner00010@test.com') as hotels,
    (SELECT COUNT(*) FROM kayak_listings.cars c 
     INNER JOIN kayak_users.users u ON c.owner_id = u.id 
     WHERE u.email = 'owner00010@test.com') as cars,
    (SELECT COUNT(*) FROM kayak_bookings.bookings b
     INNER JOIN kayak_listings.hotels h ON b.listing_id = h.id
     INNER JOIN kayak_users.users u ON h.owner_id = u.id
     WHERE u.email = 'owner00010@test.com') as bookings;

SELECT '========== VERIFICATION COMPLETE ==========' as '';
EOF
```

**Expected Results:**
- ✅ 3 databases: kayak_users, kayak_listings, kayak_bookings
- ✅ 2,500 travellers, 2,500 owners, admins
- ✅ Top 30 owners have 4,997 hotels total
- ✅ owner00010@test.com: 250 hotels, 6 cars, 67 bookings

---

## 🧪 Test Accounts

### Travellers
- **Email Pattern:** `traveller00001@test.com` to `traveller02500@test.com`
- **Password:** (check with team - likely hashed or default)
- **Use for:** Testing booking flows

### Owners
- **Top Owner (most data):** `owner00010@test.com`
  - 250 hotels
  - 6 cars
  - 67 bookings
  - $44,824 revenue
- **Other Owners:** `owner00001@test.com` to `owner00030@test.com`
  - Each has multiple properties
  - Good for dashboard testing

### Admins
- Check with team for admin credentials

---

## 🎯 What's Different From Your Old Setup

### Before (Issues):
❌ Different schemas between team members  
❌ Missing tables/columns  
❌ "Stays data related pages" throwing errors  
❌ Owners with just 1 property (not useful for dashboards)  

### After (Fixed):
✅ Everyone has identical schemas  
✅ All tables and columns present  
✅ No schema mismatch errors  
✅ Top 30 owners have substantial data for meaningful KPIs  
✅ owner00010@test.com perfect for testing  

---

## 🐛 Troubleshooting

### Problem: Import fails with "Access denied"
**Solution:** Check MySQL password in docker-compose.yml
```bash
docker exec -i kayak-mysql mysql -u root -pYOUR_PASSWORD < kayak_base_data_final.sql
```

### Problem: "Database doesn't exist" error
**Solution:** The dump file creates databases automatically. Just make sure MySQL is running.

### Problem: Import is very slow
**Solution:** 
- Make sure you're using the compressed file (.gz)
- Disable any antivirus temporarily
- Check Docker has enough resources allocated

### Problem: Verification shows wrong counts
**Solution:** 
1. Drop existing databases first:
```bash
docker exec -i kayak-mysql mysql -u root -p'Somalwar1!' -e "
DROP DATABASE IF EXISTS kayak_users;
DROP DATABASE IF EXISTS kayak_listings;
DROP DATABASE IF EXISTS kayak_bookings;
"
```
2. Re-import the dump file

### Problem: "stays data related pages" still showing errors
**Solution:**
1. Pull latest code from branch
2. Check if migrations need to run
3. Verify you're using the latest dump file

---

## 📊 Database Statistics

After import, your database will have:

### Users Database
- **Total Users:** 5,000
  - Travellers: 2,500
  - Owners: 2,500
  - Admins: (varies)
- **Tables:** users, owner_profiles, etc.

### Listings Database
- **Hotels:** 4,997 (all owned by top 30 owners)
- **Cars:** 106 (all owned by top 30 owners)
- **Flights:** 388,920
- **Tables:** hotels, cars, flights

### Bookings Database  
- **Total Bookings:** ~8,596
  - Hotels: 589
  - Flights: 180
  - Cars: 8,003 (existing)
- **Billing Records:** 853
- **Tables:** bookings, billing, payments

---

## 🔄 Keeping Database In Sync

### When to Re-Import
- Schema changes pushed to main branch
- Major data structure updates
- Someone reports schema mismatch errors

### Notification from Team Lead
When a new base dump is available:
1. Get the new dump file
2. Drop existing databases
3. Import new dump
4. Verify setup
5. Pull latest code

---

## 💾 Creating Your Own Dump (Advanced)

If you need to share your current database state:

```bash
# Create dump
docker exec kayak-mysql mysqldump -u root -p'Somalwar1!' \
  --databases kayak_users kayak_listings kayak_bookings \
  --single-transaction --quick \
  > my_database_dump.sql

# Compress it
gzip my_database_dump.sql

# Result: my_database_dump.sql.gz (~24MB)
```

---

## 🎉 You're All Set!

After following this guide:
- ✅ Your database matches the team
- ✅ No more schema errors
- ✅ You can test with rich data
- ✅ Owner dashboards work properly

**Questions?** Ask @spartan or check the team Slack channel.

---

## 📝 Quick Reference Commands

```bash
# Start MySQL
docker-compose up -d mysql

# Import database
gunzip -c kayak_base_data_final.sql.gz | docker exec -i kayak-mysql mysql -u root -p'Somalwar1!'

# Verify import
docker exec kayak-mysql mysql -u root -p'Somalwar1!' -e "SELECT COUNT(*) FROM kayak_users.users;"

# Check MySQL logs
docker logs kayak-mysql

# Connect to MySQL shell
docker exec -it kayak-mysql mysql -u root -p'Somalwar1!'
```

---

**Last Updated:** December 7, 2025  
**Dump Version:** 1.0  
**Compatible With:** All branches after Dec 7, 2025

