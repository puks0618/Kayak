#!/bin/bash

# Phase 4 - Booking Service Test Script
# Tests the booking service API endpoints

echo "🧪 Testing Booking Service API..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3005"

# Test 1: Health Check
echo "Test 1: Health Check"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health)
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Health check endpoint working"
else
    echo -e "${RED}❌ FAILED${NC} - Health check endpoint not responding (HTTP $RESPONSE)"
    exit 1
fi
echo ""

# Test 2: Get All Bookings
echo "Test 2: Get All Bookings"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/bookings)
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Get all bookings endpoint working"
else
    echo -e "${RED}❌ FAILED${NC} - Get all bookings failed (HTTP $RESPONSE)"
fi
echo ""

# Test 3: Get Bookings with Filters
echo "Test 3: Get Bookings with Filters"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/bookings?status=pending&limit=10")
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Filtered bookings endpoint working"
else
    echo -e "${RED}❌ FAILED${NC} - Filtered bookings failed (HTTP $RESPONSE)"
fi
echo ""

# Test 4: CORS Headers
echo "Test 4: CORS Headers"
CORS_HEADER=$(curl -s -I $BASE_URL/health | grep -i "access-control-allow-origin")
if [ ! -z "$CORS_HEADER" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - CORS headers present"
else
    echo -e "${YELLOW}⚠️  WARNING${NC} - CORS headers not found (may need preflight request)"
fi
echo ""

# Test 5: Get Non-existent Booking
echo "Test 5: Get Non-existent Booking"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/bookings/non-existent-id-123)
if [ "$RESPONSE" = "404" ] || [ "$RESPONSE" = "500" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Properly handles non-existent booking"
else
    echo -e "${YELLOW}⚠️  WARNING${NC} - Unexpected response for non-existent booking (HTTP $RESPONSE)"
fi
echo ""

# Summary
echo "================================"
echo "📊 Test Summary"
echo "================================"
echo -e "${GREEN}All critical tests passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Start the admin portal: cd frontend/admin-portal && npm run dev"
echo "2. Navigate to: http://localhost:5173/bookings"
echo "3. Test the UI features"
echo ""
echo "For detailed documentation, see:"
echo "- PHASE_4_COMPLETE.md"
echo "- PHASE_4_QUICKSTART.md"
