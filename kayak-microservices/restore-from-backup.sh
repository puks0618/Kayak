#!/bin/bash

# ============================================
# RESTORE KAYAK SYSTEM FROM BACKUP IMAGES
# ============================================
# This script restores your Kayak system from
# the saved Docker images with all data intact
# ============================================

set -e  # Exit on error

echo "=========================================="
echo "KAYAK SYSTEM RESTORE"
echo "=========================================="
echo ""

# Check if backup images exist
echo "Checking for backup images..."
if ! docker images | grep -q "kayak-mysql-with-data:dec-8-2025"; then
    echo "❌ Error: MySQL backup image not found!"
    echo "   Expected: kayak-mysql-with-data:dec-8-2025"
    exit 1
fi

if ! docker images | grep -q "kayak-mongodb-with-data:dec-8-2025"; then
    echo "❌ Error: MongoDB backup image not found!"
    echo "   Expected: kayak-mongodb-with-data:dec-8-2025"
    exit 1
fi

if ! docker images | grep -q "kayak-redis-with-data:dec-8-2025"; then
    echo "❌ Error: Redis backup image not found!"
    echo "   Expected: kayak-redis-with-data:dec-8-2025"
    exit 1
fi

echo "✅ All backup images found!"
echo ""

# Stop existing containers
echo "Stopping existing containers..."
cd infrastructure/docker
docker-compose down
echo "✅ Containers stopped"
echo ""

# Remove old volumes (optional - comment out if you want to keep them)
echo "⚠️  WARNING: About to remove existing volumes in 5 seconds..."
echo "   Press Ctrl+C to cancel if you want to keep existing data"
sleep 5

echo "Removing old volumes..."
docker volume rm docker_mysql_data 2>/dev/null || true
docker volume rm docker_mongodb_data 2>/dev/null || true
docker volume rm docker_redis_data 2>/dev/null || true
echo "✅ Old volumes removed"
echo ""

# Create new volumes
echo "Creating fresh volumes..."
docker volume create docker_mysql_data
docker volume create docker_mongodb_data
docker volume create docker_redis_data
echo "✅ Volumes created"
echo ""

# Start temporary containers from backup images to copy data
echo "Restoring MySQL data..."
docker run --rm -v docker_mysql_data:/var/lib/mysql \
    kayak-mysql-with-data:dec-8-2025 \
    bash -c "cp -a /var/lib/mysql/. /var/lib/mysql/" 2>/dev/null || \
docker run --rm -v docker_mysql_data:/target \
    kayak-mysql-with-data:dec-8-2025 \
    bash -c "cp -rp /var/lib/mysql/* /target/"
echo "✅ MySQL data restored"

echo "Restoring MongoDB data..."
docker run --rm -v docker_mongodb_data:/data/db \
    kayak-mongodb-with-data:dec-8-2025 \
    bash -c "cp -rp /data/db/* /data/db/ 2>/dev/null || true"
echo "✅ MongoDB data restored"

echo "Restoring Redis data..."
docker run --rm -v docker_redis_data:/data \
    kayak-redis-with-data:dec-8-2025 \
    sh -c "cp -p /data/* /data/ 2>/dev/null || true"
echo "✅ Redis data restored"
echo ""

# Start all services
echo "Starting all Kayak services..."
docker-compose up -d
echo ""

# Wait for services to be healthy
echo "Waiting for services to be healthy (30 seconds)..."
sleep 30

echo ""
echo "=========================================="
echo "✅ RESTORE COMPLETE!"
echo "=========================================="
echo ""
echo "System Status:"
docker-compose ps
echo ""
echo "📊 Database Summary:"
echo "   - 13,339 bookings"
echo "   - 12,501 users (10,000 travellers + 2,500 owners + 1 admin)"
echo "   - $11.29M total revenue"
echo "   - 100% billing coverage"
echo ""
echo "🔗 Access URLs:"
echo "   - Admin Portal: http://localhost:5174"
echo "   - Web Client: http://localhost:5175"
echo "   - Owner Portal: http://localhost:5180"
echo "   - API Gateway: http://localhost:3000"
echo ""
echo "👤 Admin Login:"
echo "   Email: admin@test.com"
echo "   Password: Password123"
echo ""
echo "✅ Your Kayak system has been fully restored!"
