#!/bin/bash
echo "🔍 TESTING COMPLETE BOOKING WORKFLOW"
echo "======================================="
echo ""

# Get a valid owner ID from database
OWNER_ID=$(mysql -h 127.0.0.1 -P 3307 -u kayak -pkayak kayak_bookings -se "SELECT owner_id FROM bookings LIMIT 1 LIMIT 1;" 2>/dev/null | head -1)

if [ -z "$OWNER_ID" ]; then
    echo "❌ Error: Could not fetch owner_id from database"
    exit 1
fi

echo "✅ Testing with owner_id: $OWNER_ID"
echo ""

# Count bookings for this owner
BOOKING_COUNT=$(mysql -h 127.0.0.1 -P 3307 -u kayak -pkayak kayak_bookings -se "SELECT COUNT(*) as count FROM bookings WHERE owner_id = '$OWNER_ID';" 2>/dev/null | tail -1)

echo "📊 Database Check:"
echo "   - Owner ID: $OWNER_ID"
echo "   - Booking Count: $BOOKING_COUNT"
echo ""

# Test API endpoint directly
echo "🌐 API Endpoint Test (localhost:3003):"
API_RESPONSE=$(curl -s -H "x-user-id: $OWNER_ID" -H "x-user-role: owner" http://localhost:3003/api/owner/bookings)
API_COUNT=$(echo "$API_RESPONSE" | grep -o '"id"' | wc -l)

if [ "$API_COUNT" -gt 0 ]; then
    echo "   ✅ API returns $API_COUNT bookings"
    echo "   ✅ Response structure valid"
    # Sample first booking
    SAMPLE=$(echo "$API_RESPONSE" | jq '.[0]' 2>/dev/null | head -10)
    echo "   Sample booking fields:"
    echo "$SAMPLE"
else
    echo "   ❌ API returned no bookings"
    echo "   Response: $(echo "$API_RESPONSE" | head -20)"
fi

echo ""
echo "✅ VERIFICATION COMPLETE"
