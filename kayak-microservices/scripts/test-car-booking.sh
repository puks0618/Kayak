#!/bin/bash

# Test Car Booking Flow with Kafka Integration
echo "🚗 Testing Car Booking Flow with Kafka Integration"
echo "=================================================="
echo ""

API_URL="http://localhost:3000/api"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Get available cities${NC}"
curl -s "$API_URL/listings/cars/cities" | jq '.cities | .[0:3]'
echo ""

echo -e "${BLUE}Step 2: Search for cars in Miami${NC}"
CARS=$(curl -s "$API_URL/listings/cars/search?location=Miami&limit=1")
echo "$CARS" | jq '{total, first_car: .cars[0] | {id, brand, model, company_name, price: .daily_rental_price}}'
echo ""

# Extract car details for booking
CAR_ID=$(echo "$CARS" | jq -r '.cars[0].id')
CAR_BRAND=$(echo "$CARS" | jq -r '.cars[0].brand')
CAR_MODEL=$(echo "$CARS" | jq -r '.cars[0].model')
CAR_PRICE=$(echo "$CARS" | jq -r '.cars[0].daily_rental_price')

echo -e "${BLUE}Step 3: Create a car booking${NC}"
BOOKING_PAYLOAD=$(cat <<EOF
{
  "listing_id": "$CAR_ID",
  "listing_type": "car",
  "travel_date": "2025-12-20",
  "total_amount": $(echo "$CAR_PRICE * 3" | bc),
  "payment_details": {
    "method": "credit",
    "cardNumber": "1234"
  },
  "booking_details": {
    "car": {
      "id": "$CAR_ID",
      "brand": "$CAR_BRAND",
      "model": "$CAR_MODEL",
      "year": 2023,
      "type": "sedan",
      "company_name": "Hertz",
      "daily_rental_price": $CAR_PRICE
    },
    "pickupDate": "2025-12-20",
    "dropoffDate": "2025-12-23",
    "pickupTime": "10:00 AM",
    "dropoffTime": "10:00 AM",
    "pickupLocation": "Miami, FL",
    "days": 3,
    "driverInfo": {
      "firstName": "Test",
      "lastName": "Driver",
      "email": "test@example.com",
      "phone": "555-1234",
      "address": "123 Test St",
      "city": "Miami",
      "zipCode": "33101",
      "licenseNumber": "DL123456"
    }
  }
}
EOF
)

BOOKING_RESPONSE=$(curl -s -X POST "$API_URL/bookings" \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123" \
  -d "$BOOKING_PAYLOAD")

echo "$BOOKING_RESPONSE" | jq '.'
BOOKING_ID=$(echo "$BOOKING_RESPONSE" | jq -r '.booking_id')
echo ""

echo -e "${GREEN}✅ Car booking created: $BOOKING_ID${NC}"
echo ""

echo -e "${BLUE}Step 4: Check Kafka topics${NC}"
docker exec kayak-kafka kafka-topics --bootstrap-server localhost:9092 --list
echo ""

echo -e "${BLUE}Step 5: Wait for Kafka consumers to process...${NC}"
sleep 3
echo ""

echo -e "${BLUE}Step 6: Check Admin Service logs (last 20 lines)${NC}"
docker logs kayak-admin-service --tail 20 | grep -A 5 "car booking"
echo ""

echo -e "${BLUE}Step 7: Check Owner Service logs (last 20 lines)${NC}"
docker logs kayak-owner-service --tail 20 | grep -A 5 "car booking"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Car Booking Test Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📊 Access Kafka UI: http://localhost:8080${NC}"
echo -e "${YELLOW}🔍 View car-bookings topic to see the event${NC}"
echo ""
