"""
Populate test deals into the AI agent database
"""
import sys
import json
from datetime import datetime, timedelta
from models.database import init_db, get_session, Deal
import uuid

def create_test_deals():
    """Create test flight and hotel deals"""
    init_db()
    session = get_session()
    
    # Sample flights to Miami
    flights = [
        {
            "title": "SFO to MIA - Direct Flight",
            "description": "Nonstop service with complimentary snacks",
            "price": 350.00,
            "original_price": 450.00,
            "score": 85,
            "tags": ["direct", "popular", "family-friendly"],
            "metadata": {
                "origin": "SFO",
                "destination": "MIA",
                "airline": "United Airlines",
                "duration": "5h 30m",
                "class": "economy"
            }
        },
        {
            "title": "SFO to MIA - Budget Carrier",
            "description": "Affordable option with 1 stop",
            "price": 220.00,
            "original_price": 280.00,
            "score": 75,
            "tags": ["budget", "value"],
            "metadata": {
                "origin": "SFO",
                "destination": "MIA",
                "airline": "Spirit Airlines",
                "duration": "7h 15m",
                "stops": 1,
                "class": "economy"
            }
        },
        {
            "title": "SFO to MIA - Premium Service",
            "description": "Extra legroom and priority boarding",
            "price": 580.00,
            "original_price": 720.00,
            "score": 92,
            "tags": ["premium", "comfort", "priority-boarding"],
            "metadata": {
                "origin": "SFO",
                "destination": "MIA",
                "airline": "American Airlines",
                "duration": "5h 45m",
                "class": "premium-economy"
            }
        }
    ]
    
    # Sample hotels in Miami
    hotels = [
        {
            "title": "Miami Beach Resort",
            "description": "Oceanfront luxury resort with spa",
            "price": 180.00,
            "original_price": 250.00,
            "score": 88,
            "tags": ["beachfront", "luxury", "spa", "pool"],
            "metadata": {
                "city": "MIA",
                "location": "Miami Beach",
                "stars": 4,
                "amenities": ["wifi", "pool", "spa", "restaurant"]
            }
        },
        {
            "title": "Downtown Miami Hotel",
            "description": "Modern hotel in the heart of the city",
            "price": 120.00,
            "original_price": 160.00,
            "score": 80,
            "tags": ["downtown", "near-transit", "business-friendly"],
            "metadata": {
                "city": "MIA",
                "location": "Downtown Miami",
                "stars": 3,
                "amenities": ["wifi", "gym", "business-center"]
            }
        },
        {
            "title": "Budget Inn Miami Airport",
            "description": "Convenient airport location",
            "price": 75.00,
            "original_price": 95.00,
            "score": 70,
            "tags": ["budget", "airport-shuttle", "convenient"],
            "metadata": {
                "city": "MIA",
                "location": "Near MIA Airport",
                "stars": 2,
                "amenities": ["wifi", "shuttle", "parking"]
            }
        },
        {
            "title": "South Beach Boutique Hotel",
            "description": "Trendy boutique hotel steps from the beach",
            "price": 210.00,
            "original_price": 300.00,
            "score": 91,
            "tags": ["boutique", "beachfront", "trendy", "romantic"],
            "metadata": {
                "city": "MIA",
                "location": "South Beach",
                "stars": 4,
                "amenities": ["wifi", "rooftop-bar", "beach-access", "concierge"]
            }
        }
    ]
    
    print("🚀 Creating test deals...")
    
    # Insert flights
    for flight_data in flights:
        deal = Deal(
            deal_id=str(uuid.uuid4()),
            type="flight",
            title=flight_data["title"],
            description=flight_data["description"],
            price=flight_data["price"],
            original_price=flight_data["original_price"],
            discount_percent=round((1 - flight_data["price"] / flight_data["original_price"]) * 100, 1),
            score=flight_data["score"],
            tags=json.dumps(flight_data["tags"]),
            deal_metadata=json.dumps(flight_data["metadata"]),
            expires_at=datetime.utcnow() + timedelta(days=7),
            active=True
        )
        session.add(deal)
        print(f"✈️  Added: {flight_data['title']}")
    
    # Insert hotels
    for hotel_data in hotels:
        deal = Deal(
            deal_id=str(uuid.uuid4()),
            type="hotel",
            title=hotel_data["title"],
            description=hotel_data["description"],
            price=hotel_data["price"],
            original_price=hotel_data["original_price"],
            discount_percent=round((1 - hotel_data["price"] / hotel_data["original_price"]) * 100, 1),
            score=hotel_data["score"],
            tags=json.dumps(hotel_data["tags"]),
            deal_metadata=json.dumps(hotel_data["metadata"]),
            expires_at=datetime.utcnow() + timedelta(days=14),
            active=True
        )
        session.add(deal)
        print(f"🏨 Added: {hotel_data['title']}")
    
    session.commit()
    
    # Verify
    count = session.query(Deal).count()
    print(f"\n✅ Successfully created {count} deals!")
    print(f"   - Flights: {session.query(Deal).filter(Deal.type == 'flight').count()}")
    print(f"   - Hotels: {session.query(Deal).filter(Deal.type == 'hotel').count()}")
    
    session.close()

if __name__ == "__main__":
    create_test_deals()
