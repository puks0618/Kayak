# 💾 Kayak System Backup & Restore Guide

## 📦 Current Backup Status

**Created:** December 8, 2025
**Tag:** `dec-8-2025`

### Backup Images Available:

- ✅ `kayak-mysql-with-data:dec-8-2025` (1.05 GB)
- ✅ `kayak-mongodb-with-data:dec-8-2025` (1.07 GB)
- ✅ `kayak-redis-with-data:dec-8-2025` (61.5 MB)

### Data Included in Backup:

- **13,339 bookings** ($11.29M revenue)
- **12,501 users** (10K travellers, 2.5K owners, 1 admin)
- **13,339 billing records** (100% coverage)
- **388,920 flights**
- **4,997 hotels**
- **106 cars**
- All authentication data
- All session data
- All cache data

---

## 🔄 How to Use Backups

### Option 1: Quick Restore (Automated)

```bash
cd /Users/spartan/Desktop/Projects/KayakMerge/kayak-microservices
./restore-from-backup.sh
```

This will:

1. Stop all containers
2. Remove old volumes
3. Restore data from backup images
4. Start all services

---

### Option 2: Create New Backup

```bash
cd /Users/spartan/Desktop/Projects/KayakMerge/kayak-microservices
./create-backup.sh
```

This creates a new backup with today's date tag.

---

## 📋 Manual Commands

### View All Backup Images:

```bash
docker images | grep "with-data"
```

### Create Manual Backup:

```bash
docker commit kayak-mysql kayak-mysql-with-data:my-backup-tag
docker commit kayak-mongodb kayak-mongodb-with-data:my-backup-tag
docker commit kayak-redis kayak-redis-with-data:my-backup-tag
```

### Export Backup to File (for transfer/archival):

```bash
# Export MySQL backup
docker save kayak-mysql-with-data:dec-8-2025 | gzip > kayak-mysql-backup.tar.gz

# Export MongoDB backup
docker save kayak-mongodb-with-data:dec-8-2025 | gzip > kayak-mongodb-backup.tar.gz

# Export Redis backup
docker save kayak-redis-with-data:dec-8-2025 | gzip > kayak-redis-backup.tar.gz
```

### Import Backup from File:

```bash
# Load MySQL backup
docker load < kayak-mysql-backup.tar.gz

# Load MongoDB backup
docker load < kayak-mongodb-backup.tar.gz

# Load Redis backup
docker load < kayak-redis-backup.tar.gz
```

### Delete Old Backup Images:

```bash
# Delete specific backup
docker rmi kayak-mysql-with-data:old-tag

# Delete all backup images
docker images | grep "with-data" | awk '{print $1":"$2}' | xargs docker rmi
```

---

## 🛡️ Protection Strategy

### What's Protected:

✅ **Docker Images**: Saved in Docker Desktop, won't be deleted unless you explicitly delete them
✅ **Database Volumes**: Persist even after `docker-compose down`
✅ **All Data**: Fully contained in the committed images

### What Will Delete Your Data:

❌ `docker-compose down -v` (with -v flag removes volumes)
❌ `docker volume rm docker_mysql_data`
❌ `docker system prune --volumes`
❌ `docker rmi kayak-mysql-with-data:dec-8-2025` (deletes backup image)

### What's Safe:

✅ `docker-compose down` (without -v flag)
✅ `docker-compose stop`
✅ `docker-compose restart`
✅ `docker system prune` (without --volumes flag)

---

## 🚀 Common Scenarios

### Scenario 1: Want to restart fresh but keep backup

```bash
# 1. Create backup first (if not done)
./create-backup.sh

# 2. Stop and remove everything
cd infrastructure/docker
docker-compose down -v

# 3. Later, restore from backup
cd ../..
./restore-from-backup.sh
```

### Scenario 2: Accidentally deleted volumes

```bash
# Just run restore script
./restore-from-backup.sh
```

### Scenario 3: Want to test something risky

```bash
# 1. Create backup with specific tag
docker commit kayak-mysql kayak-mysql-with-data:before-experiment

# 2. Do your risky operation...

# 3. If it goes wrong, restore
docker stop kayak-mysql
docker rm kayak-mysql
# Then use restore script or start new container with backup image
```

### Scenario 4: Moving to another machine

```bash
# On current machine - export
docker save kayak-mysql-with-data:dec-8-2025 | gzip > mysql-backup.tar.gz
docker save kayak-mongodb-with-data:dec-8-2025 | gzip > mongodb-backup.tar.gz
docker save kayak-redis-with-data:dec-8-2025 | gzip > redis-backup.tar.gz

# Transfer files to new machine, then import
docker load < mysql-backup.tar.gz
docker load < mongodb-backup.tar.gz
docker load < redis-backup.tar.gz

# Run restore script
./restore-from-backup.sh
```

---

## 📊 Verify Backup Data

After restore, verify data is intact:

```bash
# Check booking count
docker exec kayak-mysql mysql -uroot -pSomalwar1! kayak_bookings \
    -e "SELECT COUNT(*) as total_bookings FROM bookings;"

# Check user count
docker exec kayak-mysql mysql -uroot -pSomalwar1! kayak_users \
    -e "SELECT COUNT(*) as total_users, role FROM users GROUP BY role;"

# Check revenue
docker exec kayak-mysql mysql -uroot -pSomalwar1! kayak_bookings \
    -e "SELECT CONCAT('$', FORMAT(SUM(total_amount), 2)) as total_revenue FROM bookings;"
```

Expected results:

- Total bookings: 13,339
- Total users: 12,501 (10,000 travellers, 2,500 owners, 1 admin)
- Total revenue: $11,290,385.38

---

## 💡 Best Practices

1. **Create backups before major changes**

   ```bash
   ./create-backup.sh
   ```

2. **Tag backups meaningfully**

   ```bash
   docker commit kayak-mysql kayak-mysql-with-data:before-production-migration
   ```

3. **Export important backups to files**
   - Store outside Docker for safety
   - Easy to transfer between machines
4. **Test restore periodically**

   - Verify backups actually work
   - Practice restore process

5. **Keep multiple backup versions**
   - Don't overwrite working backups
   - Use date tags: `dec-8-2025`, `jan-15-2026`, etc.

---

## 🆘 Emergency Recovery

If everything is broken:

```bash
# 1. Check if backup images still exist
docker images | grep "with-data"

# 2. If yes, run restore
./restore-from-backup.sh

# 3. If no, but you have .tar.gz files
docker load < kayak-mysql-backup.tar.gz
docker load < kayak-mongodb-backup.tar.gz
docker load < kayak-redis-backup.tar.gz
./restore-from-backup.sh

# 4. If no backups at all, reimport base data
cd /Users/spartan/Desktop/Projects/KayakMerge/kayak-microservices
docker exec -i kayak-mysql mysql -uroot -pSomalwar1! < infrastructure/databases/mysql/kayak_base_data_final.sql
```

---

## 📞 Quick Reference

| Task           | Command                                   |
| -------------- | ----------------------------------------- |
| Create backup  | `./create-backup.sh`                      |
| Restore backup | `./restore-from-backup.sh`                |
| List backups   | `docker images \| grep with-data`         |
| Export backup  | `docker save IMAGE \| gzip > file.tar.gz` |
| Import backup  | `docker load < file.tar.gz`               |
| Check data     | See "Verify Backup Data" section          |

---

✅ **Your data is now safely backed up in Docker images!**
