# Data Generation Scripts - User Guide

## 📋 Overview

These SQL scripts safely generate realistic booking data for the Kayak analytics dashboard. All operations are wrapped in **transactions** with **DRY RUN mode** for safe testing.

## 🔐 Safety Features

✅ **Transaction-based**: All changes in a single atomic operation  
✅ **DRY RUN mode**: Test before actual execution  
✅ **Rollback support**: Undo anytime if needed  
✅ **Verification queries**: Check results at each step  
✅ **Backup created**: Full database backup taken before execution

---

## 📂 Scripts

### **Script 1: Link Owners to Listings**
**File:** `01-link-owners-to-listings.sql`

**Purpose:** Assigns `owner00001@test.com` to `owner02500@test.com` to unlinked cars and hotels

**What it does:**
- Links hotels without owners to test owners
- Links cars without owners to test owners
- Distributes properties evenly across owners
- Shows assignments before applying

**Estimated Time:** 2-5 seconds

---

### **Script 2: Generate Bookings with Billing**
**File:** `02-generate-bookings-with-billing.sql`

**Purpose:** Creates 425 bookings (245 hotels + 180 flights) with billing records

**What it does:**
- Historical bookings (2024-2025): 350 completed bookings
- Current bookings (Dec 2025): 25 confirmed bookings
- Future bookings (2026): 50 pending/confirmed bookings
- Creates billing records for each booking (with 10% tax)
- Uses `traveller00001@test.com` to `traveller02500@test.com`

**Estimated Time:** 5-10 seconds

---

## 🚀 Execution Steps

### **Step 1: Backup Database** ✅ DONE
```bash
# Already completed - backup saved to:
# /Users/spartan/Desktop/Projects/KayakMerge/kayak_full_backup_20251207_193439.sql
```

### **Step 2: Run Script 1 - DRY RUN**

```bash
# Option A: Using Docker
docker exec -i kayak-mysql mysql -u root -p'Somalwar1!' < kayak-microservices/scripts/01-link-owners-to-listings.sql

# Option B: Direct MySQL
mysql -u root -p'Somalwar1!' -h localhost -P 3307 < kayak-microservices/scripts/01-link-owners-to-listings.sql
```

**What to look for:**
- ✅ Number of hotels/cars that will be updated
- ✅ Owner distribution (should be roughly even)
- ✅ No errors in output

**At the end, you'll see:**
```
⚠️ IMPORTANT: Review the results above, then manually execute:
   COMMIT;   -- to save changes
   ROLLBACK; -- to undo everything
```

### **Step 3: Review & Commit Script 1**

If satisfied with the DRY RUN results:

```bash
# Connect to MySQL
docker exec -it kayak-mysql mysql -u root -p'Somalwar1!'

# Then execute:
COMMIT;
```

Or to undo:
```sql
ROLLBACK;
```

### **Step 4: Run Script 2 - DRY RUN**

```bash
docker exec -i kayak-mysql mysql -u root -p'Somalwar1!' < kayak-microservices/scripts/02-generate-bookings-with-billing.sql
```

**What to look for:**
- ✅ 245 hotel bookings generated
- ✅ 180 flight bookings generated
- ✅ 425 total bookings
- ✅ Billing records created for each booking
- ✅ No orphaned bookings (should be 0)
- ✅ Good distribution across hotels/flights

### **Step 5: Review & Commit Script 2**

If satisfied:

```bash
docker exec -it kayak-mysql mysql -u root -p'Somalwar1!'
# Then: COMMIT;
```

---

## 🔍 DRY RUN Mode

Both scripts start with:
```sql
SET @DRY_RUN = 1; -- Set to 0 for actual execution
```

**DRY RUN = 1 (Default):**
- Shows what WOULD be changed
- No permanent changes made
- Must manually COMMIT or ROLLBACK at the end
- **Recommended for first run**

**DRY RUN = 0 (Live Mode):**
- Still uses transactions
- Still requires manual COMMIT/ROLLBACK
- Shows actual changes being made

---

## 📊 Expected Results

### After Script 1 (Owner Linking):
- **Hotels:** All approved hotels will have owners assigned
- **Cars:** All approved cars will have owners assigned
- **Distribution:** ~2-10 properties per owner (depending on total count)

### After Script 2 (Booking Generation):

| Metric | Target | Status Field |
|--------|--------|--------------|
| Historical Hotels | 200 | completed |
| Current Hotels | 15 | confirmed |
| Future Hotels | 30 | confirmed/pending |
| Historical Flights | 150 | completed |
| Current Flights | 10 | confirmed |
| Future Flights | 20 | confirmed/pending |
| **Total Bookings** | **425** | - |
| **Billing Records** | **425** | paid/pending |

---

## ✅ Verification Queries

Run these after COMMIT to verify data integrity:

```sql
-- Check total bookings
SELECT listing_type, status, COUNT(*) as count
FROM kayak_bookings.bookings
GROUP BY listing_type, status;

-- Check no orphaned bookings
SELECT COUNT(*) as orphaned_count
FROM kayak_bookings.bookings b
LEFT JOIN kayak_bookings.billing bil ON b.id = bil.booking_id
WHERE bil.id IS NULL;
-- Expected: 0

-- Top 10 hotels by revenue
SELECT 
    h.name,
    COUNT(b.id) as bookings,
    SUM(b.total_amount) as revenue
FROM kayak_bookings.bookings b
JOIN kayak_listings.hotels h ON b.listing_id = h.id
WHERE b.listing_type = 'hotel'
  AND b.status IN ('confirmed', 'completed')
GROUP BY h.id, h.name
ORDER BY revenue DESC
LIMIT 10;

-- Top owners by properties
SELECT 
    u.email,
    COUNT(DISTINCT h.id) as hotels,
    COUNT(DISTINCT c.id) as cars
FROM kayak_users.users u
LEFT JOIN kayak_listings.hotels h ON u.id = h.owner_id
LEFT JOIN kayak_listings.cars c ON u.id = c.owner_id
WHERE u.role = 'owner'
GROUP BY u.id, u.email
HAVING hotels > 0 OR cars > 0
ORDER BY (hotels + cars) DESC
LIMIT 20;
```

---

## 🔄 Rollback Instructions

If you need to undo changes:

### Before COMMIT:
```sql
ROLLBACK;  -- Undoes everything in current transaction
```

### After COMMIT (restore from backup):
```bash
# Stop the application first
docker stop kayak-mysql

# Start MySQL
docker start kayak-mysql

# Restore from backup
docker exec -i kayak-mysql mysql -u root -p'Somalwar1!' < /Users/spartan/Desktop/Projects/KayakMerge/kayak_full_backup_20251207_193439.sql
```

---

## ⚠️ Important Notes

1. **Run scripts in order**: Script 1 must complete before Script 2
2. **Check output carefully**: Review all verification results before COMMIT
3. **Backup is your safety net**: You can always restore from backup
4. **Transactions are open**: Don't close MySQL connection before COMMIT/ROLLBACK
5. **Test data integrity**: Run verification queries after execution

---

## 🎯 Success Criteria

After both scripts complete:

✅ All hotels have owners assigned  
✅ All cars have owners assigned  
✅ 425 bookings created (245 hotels + 180 flights)  
✅ 425 billing records created  
✅ No orphaned bookings (0 count)  
✅ Top 10 hotels list is populated  
✅ Analytics dashboard shows realistic data  
✅ All foreign key constraints maintained  

---

## 🆘 Troubleshooting

### Issue: Transaction timeout
**Solution:** MySQL may auto-rollback after timeout. Re-run the script.

### Issue: Duplicate key errors
**Solution:** Some bookings might already exist. Check existing data first:
```sql
SELECT COUNT(*) FROM kayak_bookings.bookings;
```

### Issue: Foreign key constraint failure
**Solution:** Verify users and listings exist:
```sql
SELECT COUNT(*) FROM kayak_users.users WHERE role='traveller';
SELECT COUNT(*) FROM kayak_listings.hotels WHERE owner_id IS NOT NULL;
```

### Issue: Want to start over
**Solution:** Restore from backup (see Rollback section above)

---

## 📞 Support

If you encounter issues:
1. Check the error message carefully
2. Run verification queries to identify the problem
3. Use ROLLBACK to undo changes
4. Restore from backup if needed
5. Review this README for troubleshooting tips

---

**Generated:** December 7, 2025  
**Scripts Version:** 1.0  
**Database Backup:** kayak_full_backup_20251207_193439.sql (86MB)

