#!/bin/bash

# ============================================
# CREATE KAYAK SYSTEM BACKUP
# ============================================
# This script creates backup images of all
# database containers with their current data
# ============================================

set -e  # Exit on error

echo "=========================================="
echo "KAYAK SYSTEM BACKUP"
echo "=========================================="
echo ""

# Get current date for tag
BACKUP_DATE=$(date +"%b-%d-%Y" | tr '[:upper:]' '[:lower:]')
echo "Backup date tag: $BACKUP_DATE"
echo ""

# Check if containers are running
echo "Checking if containers are running..."
if ! docker ps | grep -q "kayak-mysql"; then
    echo "❌ Error: kayak-mysql container not running!"
    exit 1
fi

if ! docker ps | grep -q "kayak-mongodb"; then
    echo "❌ Error: kayak-mongodb container not running!"
    exit 1
fi

if ! docker ps | grep -q "kayak-redis"; then
    echo "❌ Error: kayak-redis container not running!"
    exit 1
fi

echo "✅ All containers running"
echo ""

# Backup MySQL
echo "📦 Backing up MySQL container with data..."
docker commit kayak-mysql kayak-mysql-with-data:${BACKUP_DATE}
docker commit kayak-mysql kayak-mysql-with-data:latest
echo "✅ MySQL backup created: kayak-mysql-with-data:${BACKUP_DATE}"

# Backup MongoDB
echo "📦 Backing up MongoDB container with data..."
docker commit kayak-mongodb kayak-mongodb-with-data:${BACKUP_DATE}
docker commit kayak-mongodb kayak-mongodb-with-data:latest
echo "✅ MongoDB backup created: kayak-mongodb-with-data:${BACKUP_DATE}"

# Backup Redis
echo "📦 Backing up Redis container with data..."
docker commit kayak-redis kayak-redis-with-data:${BACKUP_DATE}
docker commit kayak-redis kayak-redis-with-data:latest
echo "✅ Redis backup created: kayak-redis-with-data:${BACKUP_DATE}"

# Backup Kafka and Zookeeper (optional)
echo "📦 Backing up Kafka infrastructure..."
docker commit kayak-kafka kayak-kafka-with-data:${BACKUP_DATE} 2>/dev/null || true
docker commit kayak-zookeeper kayak-zookeeper-with-data:${BACKUP_DATE} 2>/dev/null || true
echo "✅ Kafka infrastructure backed up"

echo ""
echo "=========================================="
echo "✅ BACKUP COMPLETE!"
echo "=========================================="
echo ""

# Show backup images
echo "Backup Images Created:"
docker images | grep -E "kayak.*(mysql|mongodb|redis).*with-data" | grep "${BACKUP_DATE}"

echo ""
echo "Image Sizes:"
docker images | grep -E "kayak.*with-data.*${BACKUP_DATE}" --color=never | \
    awk '{printf "   %-40s %10s\n", $1":"$2, $7}'

echo ""
echo "💾 Backup Summary:"
echo "   Tag: ${BACKUP_DATE}"
echo "   Location: Local Docker images"
echo "   Total Images: 3 (MySQL, MongoDB, Redis)"
echo ""
echo "📝 To restore from this backup:"
echo "   1. Update restore-from-backup.sh with tag: ${BACKUP_DATE}"
echo "   2. Run: ./restore-from-backup.sh"
echo ""
echo "💡 To export backup to file (optional):"
echo "   docker save kayak-mysql-with-data:${BACKUP_DATE} | gzip > kayak-mysql-backup-${BACKUP_DATE}.tar.gz"
echo "   docker save kayak-mongodb-with-data:${BACKUP_DATE} | gzip > kayak-mongodb-backup-${BACKUP_DATE}.tar.gz"
echo "   docker save kayak-redis-with-data:${BACKUP_DATE} | gzip > kayak-redis-backup-${BACKUP_DATE}.tar.gz"
echo ""
echo "✅ Your Kayak system has been fully backed up!"
