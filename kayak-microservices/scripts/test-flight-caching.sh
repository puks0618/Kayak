#!/bin/bash

# Flight Search Caching Test Script
# Tests Phase 2 implementation

echo "======================================"
echo "✈️  FLIGHT SEARCH CACHING TEST - PHASE 2"
echo "======================================"
echo ""

# Configuration
LISTING_SERVICE_URL="http://localhost:3003"
API_ENDPOINT="${LISTING_SERVICE_URL}/api/listings/flights/search"

# Test parameters for round-trip flight
ORIGIN="LAX"
DESTINATION="JFK"
DEPARTURE_DATE="2024-03-15"
RETURN_DATE="2024-03-22"
CABIN_CLASS="economy"

# Build query string for round-trip
QUERY="origin=${ORIGIN}&destination=${DESTINATION}&departureDate=${DEPARTURE_DATE}&returnDate=${RETURN_DATE}&cabinClass=${CABIN_CLASS}&sortBy=price&sortOrder=asc"

echo "Test Parameters (Round-Trip Flight):"
echo "  Origin: ${ORIGIN}"
echo "  Destination: ${DESTINATION}"
echo "  Departure: ${DEPARTURE_DATE}"
echo "  Return: ${RETURN_DATE}"
echo "  Cabin: ${CABIN_CLASS}"
echo ""

# Clear Redis DB 1 to start fresh
echo "Clearing Redis DB 1..."
docker exec kayak-redis redis-cli -n 1 FLUSHDB > /dev/null
echo ""

# Test 1: First request (cache miss)
echo "----------------------------------------"
echo "Test 1: Round-Trip Search (Cache Miss)"
echo "----------------------------------------"
echo "Request URL: ${API_ENDPOINT}?${QUERY}"
echo ""

START_TIME=$(date +%s%N)
RESPONSE1=$(curl -s "${API_ENDPOINT}?${QUERY}")
END_TIME=$(date +%s%N)
DURATION1=$(( (END_TIME - START_TIME) / 1000000 ))

CACHED1=$(echo $RESPONSE1 | jq -r '.cached // "not_present"')
OUTBOUND_COUNT=$(echo $RESPONSE1 | jq -r '.flights | length // 0')
RETURN_COUNT=$(echo $RESPONSE1 | jq -r '.returnFlights | length // 0')
IS_ROUNDTRIP=$(echo $RESPONSE1 | jq -r '.isRoundTrip // false')

echo "Response:"
echo "  Cached: ${CACHED1}"
echo "  Outbound Flights: ${OUTBOUND_COUNT}"
echo "  Return Flights: ${RETURN_COUNT}"
echo "  Is Round-Trip: ${IS_ROUNDTRIP}"
echo "  Response Time: ${DURATION1}ms"
echo ""

# Wait a moment
sleep 1

# Test 2: Second request (cache hit)
echo "----------------------------------------"
echo "Test 2: Same Round-Trip Search (Cache Hit)"
echo "----------------------------------------"
echo "Request URL: ${API_ENDPOINT}?${QUERY}"
echo ""

START_TIME=$(date +%s%N)
RESPONSE2=$(curl -s "${API_ENDPOINT}?${QUERY}")
END_TIME=$(date +%s%N)
DURATION2=$(( (END_TIME - START_TIME) / 1000000 ))

CACHED2=$(echo $RESPONSE2 | jq -r '.cached // "not_present"')
OUTBOUND_COUNT2=$(echo $RESPONSE2 | jq -r '.flights | length // 0')
RETURN_COUNT2=$(echo $RESPONSE2 | jq -r '.returnFlights | length // 0')

echo "Response:"
echo "  Cached: ${CACHED2}"
echo "  Outbound Flights: ${OUTBOUND_COUNT2}"
echo "  Return Flights: ${RETURN_COUNT2}"
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
echo "Test 3: One-Way Flight (Different Cache Key)"
echo "----------------------------------------"
QUERY_ONEWAY="origin=${ORIGIN}&destination=${DESTINATION}&departureDate=${DEPARTURE_DATE}&cabinClass=${CABIN_CLASS}"
echo "Request URL: ${API_ENDPOINT}?${QUERY_ONEWAY}"
echo ""

START_TIME=$(date +%s%N)
RESPONSE3=$(curl -s "${API_ENDPOINT}?${QUERY_ONEWAY}")
END_TIME=$(date +%s%N)
DURATION3=$(( (END_TIME - START_TIME) / 1000000 ))

CACHED3=$(echo $RESPONSE3 | jq -r '.cached // "not_present"')
OUTBOUND_COUNT3=$(echo $RESPONSE3 | jq -r '.flights | length // 0')
IS_ROUNDTRIP3=$(echo $RESPONSE3 | jq -r '.isRoundTrip // false')

echo "Response:"
echo "  Cached: ${CACHED3}"
echo "  Outbound Flights: ${OUTBOUND_COUNT3}"
echo "  Is Round-Trip: ${IS_ROUNDTRIP3}"
echo "  Response Time: ${DURATION3}ms"

if [ "$CACHED3" = "false" ]; then
  echo "✅ One-way creates different cache key (correct)"
else
  echo "⚠️  Expected cache miss for one-way flight"
fi

echo ""
echo "======================================"
echo "📊 Redis Cache Verification"
echo "======================================"
echo ""

# Check Redis DB 1 for flight cache keys
CACHE_KEYS=$(docker exec kayak-redis redis-cli -n 1 KEYS "flight_search:*")
KEY_COUNT=$(echo "$CACHE_KEYS" | wc -l)

echo "Redis DB 1 (Flight Cache):"
echo "  Cache Keys Found: ${KEY_COUNT}"
echo ""

if [ -n "$CACHE_KEYS" ]; then
  echo "Cache Keys:"
  echo "$CACHE_KEYS" | while read -r key; do
    if [ -n "$key" ]; then
      TTL=$(docker exec kayak-redis redis-cli -n 1 TTL "$key")
      echo "  - $key (TTL: ${TTL}s)"
    fi
  done
fi

echo ""
echo "Open Redis Commander to view details:"
echo "  URL: http://localhost:8081"
echo "  Database: DB 1"
echo "  Pattern: flight_search:*"
echo ""
echo "======================================"
echo "✅ Phase 2 Test Complete"
echo "======================================"
