"""
Generate additional test data for stress testing
Creates 20,000+ additional deals for performance testing
"""

import sqlite3
import json
import random
from datetime import datetime, timedelta
from typing import List, Dict

# Database path
DB_PATH = "./data/kayak_ai.db"

# Data for generation
AIRLINES = [
    "American Airlines", "Delta Air Lines", "United Airlines", "Southwest Airlines",
    "JetBlue Airways", "Spirit Airlines", "Alaska Airlines", "Frontier Airlines",
    "Hawaiian Airlines", "Allegiant Air", "Sun Country Airlines", "Breeze Airways"
]

HOTELS = [
    "Marriott", "Hilton", "Hyatt", "InterContinental", "Sheraton", "Westin",
    "Four Seasons", "Ritz-Carlton", "W Hotels", "Waldorf Astoria", "Conrad",
    "Holiday Inn", "Hampton Inn", "Courtyard", "Residence Inn", "Fairfield Inn",
    "Comfort Inn", "Quality Inn", "Best Western", "La Quinta", "Motel 6"
]

CITIES = [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
    "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
    "Fort Worth", "Columbus", "Charlotte", "San Francisco", "Indianapolis",
    "Seattle", "Denver", "Boston", "Portland", "Las Vegas", "Detroit", "Memphis",
    "London", "Paris", "Tokyo", "Dubai", "Singapore", "Sydney", "Bangkok",
    "Hong Kong", "Barcelona", "Rome", "Amsterdam", "Frankfurt", "Mexico City",
    "Toronto", "Montreal", "Vancouver", "Munich", "Berlin", "Madrid", "Lisbon",
    "Athens", "Istanbul", "Prague", "Vienna", "Copenhagen", "Stockholm"
]

AIRPORTS = [
    "JFK", "LAX", "ORD", "DFW", "DEN", "ATL", "SFO", "SEA", "LAS", "MCO",
    "MIA", "BOS", "PHX", "IAH", "EWR", "MSP", "DTW", "PHL", "LGA", "SAN",
    "LHR", "CDG", "NRT", "DXB", "SIN", "SYD", "BKK", "HKG", "BCN", "FCO",
    "AMS", "FRA", "MEX", "YYZ", "YUL", "YVR", "MUC", "BER", "MAD", "LIS"
]


def generate_flight_deals(count: int) -> List[Dict]:
    """Generate flight deal records"""
    deals = []
    
    for i in range(count):
        origin = random.choice(AIRPORTS)
        destination = random.choice([a for a in AIRPORTS if a != origin])
        airline = random.choice(AIRLINES)
        
        price = random.randint(150, 2000)
        original_price = price + random.randint(50, 500)
        discount = ((original_price - price) / original_price) * 100
        
        # Calculate score based on discount and price
        score = min(100, int(discount * 1.5 + (1 - price/2000) * 30))
        
        # Generate deal metadata
        metadata = {
            "origin": origin,
            "destination": destination,
            "airline": airline,
            "duration": f"{random.randint(2, 15)}h {random.randint(0, 55)}m",
            "stops": random.choice([0, 0, 0, 1, 1, 2]),  # Weighted towards direct
            "departure_time": f"{random.randint(0, 23):02d}:{random.choice(['00', '15', '30', '45'])}",
            "arrival_time": f"{random.randint(0, 23):02d}:{random.choice(['00', '15', '30', '45'])}",
            "cabin_class": random.choice(["Economy", "Economy", "Economy", "Premium Economy", "Business"]),
            "baggage_included": random.choice([True, False]),
            "refundable": random.choice([True, False, False])
        }
        
        # Generate tags
        tags = ["flight"]
        if score >= 80:
            tags.append("hot-deal")
        if discount >= 30:
            tags.append("flash-sale")
        if metadata["stops"] == 0:
            tags.append("direct-flight")
        if metadata["refundable"]:
            tags.append("refundable")
        
        deal = {
            "deal_id": f"flight_{i}_{random.randint(10000, 99999)}",
            "type": "flight",
            "title": f"{airline} - {origin} to {destination}",
            "description": f"Round-trip flight from {origin} to {destination} with {airline}. {metadata['stops']} stops.",
            "price": price,
            "original_price": original_price,
            "discount_percent": round(discount, 1),
            "score": score,
            "tags": json.dumps(tags),
            "deal_metadata": json.dumps(metadata),
            "expires_at": (datetime.utcnow() + timedelta(days=random.randint(1, 30))).isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "active": True
        }
        
        deals.append(deal)
    
    return deals


def generate_hotel_deals(count: int) -> List[Dict]:
    """Generate hotel deal records"""
    deals = []
    
    for i in range(count):
        city = random.choice(CITIES)
        hotel_chain = random.choice(HOTELS)
        
        price_per_night = random.randint(50, 800)
        original_price = price_per_night + random.randint(20, 300)
        discount = ((original_price - price_per_night) / original_price) * 100
        
        # Calculate score
        score = min(100, int(discount * 1.5 + (1 - price_per_night/800) * 25))
        
        # Generate metadata
        rating = round(random.uniform(3.0, 5.0), 1)
        metadata = {
            "city": city,
            "hotel_chain": hotel_chain,
            "rating": rating,
            "review_count": random.randint(100, 5000),
            "amenities": random.sample([
                "WiFi", "Pool", "Gym", "Spa", "Restaurant", "Bar",
                "Room Service", "Parking", "Airport Shuttle", "Business Center"
            ], k=random.randint(3, 8)),
            "distance_to_center": f"{random.uniform(0.5, 10.0):.1f} km",
            "cancellation_policy": random.choice(["Free cancellation", "Non-refundable", "Flexible"]),
            "breakfast_included": random.choice([True, False])
        }
        
        # Generate tags
        tags = ["hotel"]
        if score >= 80:
            tags.append("hot-deal")
        if rating >= 4.5:
            tags.append("highly-rated")
        if metadata["breakfast_included"]:
            tags.append("breakfast-included")
        if "Free cancellation" in metadata["cancellation_policy"]:
            tags.append("free-cancellation")
        
        deal = {
            "deal_id": f"hotel_{i}_{random.randint(10000, 99999)}",
            "type": "hotel",
            "title": f"{hotel_chain} {city}",
            "description": f"{rating}★ hotel in {city}. {', '.join(metadata['amenities'][:3])}.",
            "price": price_per_night,
            "original_price": original_price,
            "discount_percent": round(discount, 1),
            "score": score,
            "tags": json.dumps(tags),
            "deal_metadata": json.dumps(metadata),
            "expires_at": (datetime.utcnow() + timedelta(days=random.randint(1, 45))).isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "active": True
        }
        
        deals.append(deal)
    
    return deals


def insert_deals(deals: List[Dict]):
    """Insert deals into database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create table if not exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS deals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            deal_id TEXT UNIQUE,
            type TEXT,
            title TEXT,
            description TEXT,
            price REAL,
            original_price REAL,
            discount_percent REAL,
            score INTEGER,
            tags TEXT,
            deal_metadata TEXT,
            expires_at TEXT,
            created_at TEXT,
            updated_at TEXT,
            active INTEGER
        )
    """)
    
    # Insert deals
    inserted = 0
    skipped = 0
    
    for deal in deals:
        try:
            cursor.execute("""
                INSERT INTO deals (
                    deal_id, type, title, description, price, original_price,
                    discount_percent, score, tags, deal_metadata, expires_at,
                    created_at, updated_at, active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                deal["deal_id"], deal["type"], deal["title"], deal["description"],
                deal["price"], deal["original_price"], deal["discount_percent"],
                deal["score"], deal["tags"], deal["deal_metadata"], deal["expires_at"],
                deal["created_at"], deal["updated_at"], deal["active"]
            ))
            inserted += 1
        except sqlite3.IntegrityError:
            # Duplicate deal_id
            skipped += 1
    
    conn.commit()
    conn.close()
    
    return inserted, skipped


def main():
    """Generate and insert stress test data"""
    print("="*60)
    print("STRESS TEST DATA GENERATION")
    print("="*60)
    
    # Generate deals
    print("\nGenerating flight deals...")
    flight_deals = generate_flight_deals(10000)
    print(f"✅ Generated {len(flight_deals)} flight deals")
    
    print("\nGenerating hotel deals...")
    hotel_deals = generate_hotel_deals(10000)
    print(f"✅ Generated {len(hotel_deals)} hotel deals")
    
    # Insert into database
    print("\nInserting flight deals into database...")
    flights_inserted, flights_skipped = insert_deals(flight_deals)
    print(f"✅ Inserted {flights_inserted} flight deals ({flights_skipped} skipped)")
    
    print("\nInserting hotel deals into database...")
    hotels_inserted, hotels_skipped = insert_deals(hotel_deals)
    print(f"✅ Inserted {hotels_inserted} hotel deals ({hotels_skipped} skipped)")
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Total deals generated: {len(flight_deals) + len(hotel_deals)}")
    print(f"Total deals inserted: {flights_inserted + hotels_inserted}")
    print(f"Total deals skipped: {flights_skipped + hotels_skipped}")
    
    # Verify count
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM deals WHERE active = 1")
    total_active = cursor.fetchone()[0]
    conn.close()
    
    print(f"\n✅ Database now contains {total_active} active deals")
    print("="*60)


if __name__ == "__main__":
    main()
