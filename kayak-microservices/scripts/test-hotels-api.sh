#!/bin/bash

# Test script for Hotels Search API
# Run from kayak-microservices directory

BASE_URL="http://localhost:3003"
API_URL="http://localhost:3000"  # API Gateway

echo "🧪 Testing Hotels Search API"
echo "================================"

# Test 1: Simple search by city
echo ""
echo "Test 1: Search hotels in specific cities"
curl -X POST "$BASE_URL/api/listings/hotels/search" \
  -H "Content-Type: application/json" \
  -d '{
    "cities": ["New York", "Brooklyn"],
    "guests": 2,
    "page": 1,
    "limit": 5
  }' | jq '.hotels[] | {hotel_name, city, price_per_night, star_rating}'

# Test 2: Search with price filter
echo ""
echo "================================"
echo "Test 2: Search with price range $50-$200"
curl -X POST "$BASE_URL/api/listings/hotels/search" \
  -H "Content-Type: application/json" \
  -d '{
    "cities": ["New York"],
    "priceMin": 50,
    "priceMax": 200,
    "guests": 2,
    "page": 1,
    "limit": 5
  }' | jq '{total: .pagination.total, hotels: .hotels[:3] | map({name: .hotel_name, price: .price_per_night})}'

# Test 3: Search with star rating filter
echo ""
echo "================================"
echo "Test 3: Search 4+ star hotels"
curl -X POST "$BASE_URL/api/listings/hotels/search" \
  -H "Content-Type: application/json" \
  -d '{
    "cities": ["New York"],
    "starRating": 4,
    "sortBy": "rating_desc",
    "page": 1,
    "limit": 5
  }' | jq '{total: .pagination.total, top_hotels: .hotels[:3] | map({name: .hotel_name, rating: .star_rating})}'

# Test 4: Search with amenities filter
echo ""
echo "================================"
echo "Test 4: Search hotels with WiFi and Kitchen"
curl -X POST "$BASE_URL/api/listings/hotels/search" \
  -H "Content-Type: application/json" \
  -d '{
    "cities": ["New York"],
    "amenities": ["Wifi", "Kitchen"],
    "page": 1,
    "limit": 3
  }' | jq '{total: .pagination.total, hotels: .hotels | map({name: .hotel_name, amenities: .amenity_count})}'

# Test 5: Get hotel by ID (pick first from search)
echo ""
echo "================================"
echo "Test 5: Get hotel details by ID"
HOTEL_ID=$(curl -s -X POST "$BASE_URL/api/listings/hotels/search" \
  -H "Content-Type: application/json" \
  -d '{"cities": ["New York"], "limit": 1}' | jq -r '.hotels[0].hotel_id')

if [ "$HOTEL_ID" != "null" ]; then
  echo "Fetching details for hotel ID: $HOTEL_ID"
  curl -X GET "$BASE_URL/api/listings/hotels/$HOTEL_ID" | jq '{
    name: .hotel_name,
    city: .city,
    price: .price_per_night,
    rating: .star_rating,
    reviews_count: (.reviews | length),
    images_count: (.images | length),
    amenities_count: (.amenities | length)
  }'
else
  echo "No hotels found for detail test"
fi

# Test 6: Cache test (run same query twice)
echo ""
echo "================================"
echo "Test 6: Cache test (should return cached: true on second call)"
echo "First call:"
curl -s -X POST "$BASE_URL/api/listings/hotels/search" \
  -H "Content-Type: application/json" \
  -d '{"cities": ["Brooklyn"], "limit": 1}' | jq '{cached, total: .pagination.total}'

echo "Second call (should be cached):"
curl -s -X POST "$BASE_URL/api/listings/hotels/search" \
  -H "Content-Type: application/json" \
  -d '{"cities": ["Brooklyn"], "limit": 1}' | jq '{cached, total: .pagination.total}'

echo ""
echo "================================"
echo "✅ Tests complete!"
