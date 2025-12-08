#!/bin/bash

# ==========================================
# Analytics Feature Docker Test Script
# ==========================================

set -e

echo "🚀 Starting Analytics Feature Test with Docker"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
echo -e "${BLUE}📋 Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Navigate to kayak-microservices directory
cd "$(dirname "$0")"

# Stop any existing containers
echo -e "${BLUE}🛑 Stopping any existing analytics test containers...${NC}"
docker-compose -f docker-compose-analytics-test.yml down 2>/dev/null || true
echo ""

# Build images
echo -e "${BLUE}🔨 Building Docker images...${NC}"
echo -e "${YELLOW}This may take a few minutes on first run...${NC}"
echo ""

# Build admin-service
echo -e "${BLUE}📦 Building admin-service image...${NC}"
docker-compose -f docker-compose-analytics-test.yml build admin-service
echo -e "${GREEN}✅ Admin service built${NC}"
echo ""

# Build admin-portal
echo -e "${BLUE}📦 Building admin-portal image...${NC}"
docker-compose -f docker-compose-analytics-test.yml build admin-portal
echo -e "${GREEN}✅ Admin portal built${NC}"
echo ""

# Start services
echo -e "${BLUE}🚀 Starting services...${NC}"
docker-compose -f docker-compose-analytics-test.yml up -d

# Wait for services to be healthy
echo ""
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
echo -e "${YELLOW}This may take 30-60 seconds...${NC}"

# Wait for MySQL
echo -n "  - MySQL: "
for i in {1..30}; do
    if docker exec kayak-mysql-analytics mysqladmin ping -h localhost -pSomalwar1! --silent 2>/dev/null; then
        echo -e "${GREEN}✅ Ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Wait for Admin Service
echo -n "  - Admin Service: "
for i in {1..30}; do
    if curl -s http://localhost:3007/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Wait for Admin Portal
echo -n "  - Admin Portal: "
sleep 5  # Give nginx time to start
echo -e "${GREEN}✅ Ready${NC}"

echo ""
echo -e "${GREEN}=============================================="
echo "🎉 Analytics Test Environment is Ready!"
echo "==============================================${NC}"
echo ""
echo -e "${BLUE}📊 Access Points:${NC}"
echo "  • Admin Portal:  http://localhost:5173"
echo "  • Analytics API: http://localhost:3007/api/admin/analytics"
echo "  • Health Check:  http://localhost:3007/health"
echo ""
echo -e "${BLUE}📊 Test Analytics:${NC}"
echo "  1. Open browser: http://localhost:5173/analytics"
echo "  2. Click through the tabs: Overview, Top Properties, City Revenue, Top Providers"
echo ""
echo -e "${YELLOW}⚠️  Note: You may need to add test data first${NC}"
echo ""
echo -e "${BLUE}💾 Add Test Data (Optional):${NC}"
echo "  docker exec -i kayak-mysql-analytics mysql -uroot -pSomalwar1! < scripts/create-analytics-test-data.sql"
echo ""
echo -e "${BLUE}🔍 View Logs:${NC}"
echo "  docker-compose -f docker-compose-analytics-test.yml logs -f admin-service"
echo ""
echo -e "${BLUE}🛑 Stop Services:${NC}"
echo "  docker-compose -f docker-compose-analytics-test.yml down"
echo ""
echo -e "${BLUE}📊 Test API Endpoints:${NC}"
echo "  curl http://localhost:3007/api/admin/analytics/overview?year=2025"
echo "  curl http://localhost:3007/api/admin/analytics/top-properties?year=2025"
echo "  curl http://localhost:3007/api/admin/analytics/city-revenue?year=2025"
echo "  curl http://localhost:3007/api/admin/analytics/top-providers?period=last_month"
echo ""
echo -e "${GREEN}Happy Testing! 🚀${NC}"

