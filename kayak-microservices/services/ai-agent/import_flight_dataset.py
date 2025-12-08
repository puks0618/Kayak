"""
Import realistic flight data into AI agent database
Generates diverse routes, airlines, prices, and availability
"""

import sys
import os
from datetime import datetime, timedelta
from models.database import init_db, get_session, Deal
import json
import uuid
import random

# Major airports by region
AIRPORTS = {
    'US_WEST': ['SFO', 'LAX', 'SEA', 'PDX', 'SAN', 'LAS', 'PHX'],
    'US_EAST': ['JFK', 'BOS', 'MIA', 'ATL', 'DCA', 'PHL', 'CLT'],
    'US_CENTRAL': ['ORD', 'DFW', 'DEN', 'MSP', 'DTW', 'STL'],
    'EUROPE': ['LHR', 'CDG', 'FRA', 'AMS', 'FCO', 'MAD', 'BCN'],
    'ASIA': ['NRT', 'HND', 'ICN', 'SIN', 'HKG', 'BKK', 'DEL'],
    'LATAM': ['MEX', 'GRU', 'EZE', 'BOG', 'LIM', 'SCL'],
}

AIRLINES = [
    {'name': 'Delta', 'code': 'DL', 'quality': 'premium'},
    {'name': 'United', 'code': 'UA', 'quality': 'premium'},
    {'name': 'American', 'code': 'AA', 'quality': 'premium'},
    {'name': 'Southwest', 'code': 'WN', 'quality': 'budget'},
    {'name': 'JetBlue', 'code': 'B6', 'quality': 'value'},
    {'name': 'Spirit', 'code': 'NK', 'quality': 'ultra-budget'},
    {'name': 'Frontier', 'code': 'F9', 'quality': 'ultra-budget'},
    {'name': 'Alaska', 'code': 'AS', 'quality': 'premium'},
]

def get_all_airports():
    """Get flat list of all airports"""
    airports = []
    for region_airports in AIRPORTS.values():
        airports.extend(region_airports)
    return airports

def calculate_base_price(origin, destination, airline_quality):
    """Calculate base price based on route distance and airline"""
    # Simple price model based on regions
    all_airports = get_all_airports()
    origin_region = None
    dest_region = None
    
    for region, airports in AIRPORTS.items():
        if origin in airports:
            origin_region = region
        if destination in airports:
            dest_region = region
    
    # Base price calculation
    if origin_region == dest_region:
        base_price = random.randint(150, 400)  # Domestic/Regional
    elif 'US' in origin_region and 'US' in dest_region:
        base_price = random.randint(200, 600)  # Cross-country
    elif 'US' in origin_region or 'US' in dest_region:
        base_price = random.randint(400, 1200)  # International
    else:
        base_price = random.randint(500, 1500)  # International long-haul
    
    # Adjust by airline quality
    if airline_quality == 'ultra-budget':
        base_price *= 0.6
    elif airline_quality == 'budget':
        base_price *= 0.75
    elif airline_quality == 'value':
        base_price *= 0.9
    elif airline_quality == 'premium':
        base_price *= 1.1
    
    return round(base_price, 2)

def get_flight_tags(airline_quality, is_direct, price, base_price):
    """Generate tags based on flight characteristics"""
    tags = []
    
    # Airline quality tags
    if airline_quality == 'premium':
        tags.extend(['premium', 'comfort', 'priority-boarding'])
    elif airline_quality == 'value':
        tags.extend(['value', 'reliable'])
    elif airline_quality == 'budget':
        tags.extend(['budget', 'no-frills'])
    elif airline_quality == 'ultra-budget':
        tags.extend(['ultra-budget', 'basic'])
    
    # Route tags
    if is_direct:
        tags.append('direct')
    else:
        tags.append('1-stop')
    
    # Deal tags
    discount = ((base_price - price) / base_price) * 100
    if discount > 30:
        tags.append('hot-deal')
    elif discount > 15:
        tags.append('deal')
    
    # Other tags
    if random.random() > 0.7:
        tags.append('popular')
    if random.random() > 0.8:
        tags.append('family-friendly')
    
    return tags

def generate_flights(count=5000):
    """Generate diverse flight deals"""
    print(f"🛫 Generating {count} flight deals...")
    
    session = get_session()
    flights = []
    all_airports = get_all_airports()
    
    for i in range(count):
        # Pick random origin and destination
        origin = random.choice(all_airports)
        destination = random.choice([a for a in all_airports if a != origin])
        
        # Pick airline
        airline = random.choice(AIRLINES)
        
        # Route characteristics
        is_direct = random.random() > 0.4  # 60% direct flights
        
        # Price calculation
        base_price = calculate_base_price(origin, destination, airline['quality'])
        
        # Apply random discount (0-40%)
        discount_percent = random.uniform(0, 40)
        price = base_price * (1 - discount_percent / 100)
        
        # Generate tags
        tags = get_flight_tags(airline['quality'], is_direct, price, base_price)
        
        # Score (higher for better deals)
        score = min(100, int(discount_percent * 2 + random.uniform(-10, 10)))
        score = max(0, score)
        
        # Metadata
        metadata = {
            'origin': origin,
            'destination': destination,
            'airline': airline['name'],
            'airline_code': airline['code'],
            'flight_number': f"{airline['code']}{random.randint(100, 9999)}",
            'direct': is_direct,
            'duration': f"{random.randint(2, 18)}h {random.randint(0, 55)}m",
        }
        
        # Create deal
        deal = Deal(
            deal_id=str(uuid.uuid4()),
            type='flight',
            title=f"{origin} to {destination} - {airline['name']}",
            description=f"{'Direct' if is_direct else 'One stop'} flight from {origin} to {destination}",
            price=round(price, 2),
            original_price=round(base_price, 2),
            discount_percent=round(discount_percent, 1),
            score=score,
            active=True,
            expires_at=datetime.utcnow() + timedelta(days=random.randint(1, 30))
        )
        deal.set_tags(tags)
        deal.set_metadata(metadata)
        
        flights.append(deal)
        
        # Progress indicator
        if (i + 1) % 500 == 0:
            print(f"  ✓ Generated {i + 1}/{count} flights")
    
    # Bulk insert
    print("💾 Saving to database...")
    session.bulk_save_objects(flights)
    session.commit()
    session.close()
    
    print(f"✅ Successfully imported {count} flights!")
    return count

if __name__ == "__main__":
    print("🚀 Flight Dataset Import")
    print("=" * 50)
    
    # Initialize database
    init_db()
    
    # Generate flights
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
    generate_flights(count)
    
    # Summary
    session = get_session()
    total = session.query(Deal).filter(Deal.type == 'flight').count()
    avg_price = session.query(Deal).filter(Deal.type == 'flight').with_entities(Deal.price).all()
    avg_price = sum([p[0] for p in avg_price]) / len(avg_price) if avg_price else 0
    
    print("\n📊 Summary:")
    print(f"   Total flights: {total}")
    print(f"   Average price: ${avg_price:.2f}")
    print(f"   Unique routes: ~{total}")
    
    session.close()
