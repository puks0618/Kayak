#!/bin/bash

# Car Search Caching Test Script
# Tests Phase 1 implementation

echo "======================================"
echo "🚗 CAR SEARCH CACHING TEST - PHASE 1"
echo "======================================"
echo ""

# Configuration
LISTING_SERVICE_URL="http://localhost:3003"
API_ENDPOINT="${LISTING_SERVICE_URL}/api/listings/cars/search"

# Test parameters
LOCATION="Los Angeles"
PICKUP_DATE="2024-01-15"
DROPOFF_DATE="2024-01-20"
TYPE="SUV"

# Build query string
QUERY="location=${LOCATION}&pickupDate=${PICKUP_DATE}&dropoffDate=${DROPOFF_DATE}&type=${TYPE}&sortBy=price&sortOrder=asc"

echo "Test Parameters:"
echo "  Location: ${LOCATION}"
echo "  Pickup: ${PICKUP_DATE}"
echo "  Dropoff: ${DROPOFF_DATE}"
echo "  Type: ${TYPE}"
echo ""

# Test 1: First request (cache miss)
echo "----------------------------------------"
echo "Test 1: First Request (Cache Miss)"
echo "----------------------------------------"
echo "Request URL: ${API_ENDPOINT}?${QUERY}"
echo ""

START_TIME=$(date +%s%N)
RESPONSE1=$(curl -s "${API_ENDPOINT}?${QUERY}")
END_TIME=$(date +%s%N)
DURATION1=$(( (END_TIME - START_TIME) / 1000000 ))

CACHED1=$(echo $RESPONSE1 | grep -o '"cached":[^,}]*' | cut -d':' -f2)
TOTAL1=$(echo $RESPONSE1 | grep -o '"total":[^,}]*' | cut -d':' -f2)

echo "Response:"
echo "  Cached: ${CACHED1}"
echo "  Total Results: ${TOTAL1}"
echo "  Response Time: ${DURATION1}ms"
echo ""

# Wait a moment
sleep 1

# Test 2: Second request (cache hit)
echo "----------------------------------------"
echo "Test 2: Second Request (Cache Hit)"
echo "----------------------------------------"
echo "Request URL: ${API_ENDPOINT}?${QUERY}"
echo ""

START_TIME=$(date +%s%N)
RESPONSE2=$(curl -s "${API_ENDPOINT}?${QUERY}")
END_TIME=$(date +%s%N)
DURATION2=$(( (END_TIME - START_TIME) / 1000000 ))

CACHED2=$(echo $RESPONSE2 | grep -o '"cached":[^,}]*' | cut -d':' -f2)
TOTAL2=$(echo $RESPONSE2 | grep -o '"total":[^,}]*' | cut -d':' -f2)

echo "Response:"
echo "  Cached: ${CACHED2}"
echo "  Total Results: ${TOTAL2}"
echo "  Response Time: ${DURATION2}ms"
echo ""

# Performance improvement calculation
if [ "$CACHED1" = "false" ] && [ "$CACHED2" = "true" ]; then
  IMPROVEMENT=$(( 100 - (DURATION2 * 100 / DURATION1) ))
  echo "✅ CACHE WORKING!"
  echo "  Performance improvement: ${IMPROVEMENT}%"
  echo "  Cache speedup: ${DURATION1}ms → ${DURATION2}ms"
else
  echo "❌ CACHE NOT WORKING"
  echo "  First request cached: ${CACHED1}"
  echo "  Second request cached: ${CACHED2}"
fi

echo ""
echo "----------------------------------------"
echo "Test 3: Different Parameters (New Cache Key)"
echo "----------------------------------------"
QUERY_NEW="location=San Francisco&pickupDate=${PICKUP_DATE}&dropoffDate=${DROPOFF_DATE}&type=Sedan"
echo "Request URL: ${API_ENDPOINT}?${QUERY_NEW}"
echo ""

START_TIME=$(date +%s%N)
RESPONSE3=$(curl -s "${API_ENDPOINT}?${QUERY_NEW}")
END_TIME=$(date +%s%N)
DURATION3=$(( (END_TIME - START_TIME) / 1000000 ))

CACHED3=$(echo $RESPONSE3 | grep -o '"cached":[^,}]*' | cut -d':' -f2)
TOTAL3=$(echo $RESPONSE3 | grep -o '"total":[^,}]*' | cut -d':' -f2)

echo "Response:"
echo "  Cached: ${CACHED3}"
echo "  Total Results: ${TOTAL3}"
echo "  Response Time: ${DURATION3}ms"

if [ "$CACHED3" = "false" ]; then
  echo "✅ New parameters create new cache key (correct)"
else
  echo "⚠️  Expected cache miss for different parameters"
fi

echo ""
echo "======================================"
echo "📊 Redis Cache Verification"
echo "======================================"
echo ""
echo "Open Redis Commander to verify cache keys:"
echo "  URL: http://localhost:8081"
echo "  Database: DB 0"
echo "  Pattern: car_search:*"
echo ""
echo "Expected cache keys:"
echo "  - car_search:<md5_hash_1> (Los Angeles, SUV)"
echo "  - car_search:<md5_hash_2> (San Francisco, Sedan)"
echo ""
echo "======================================"
echo "✅ Phase 1 Test Complete"
echo "======================================"
