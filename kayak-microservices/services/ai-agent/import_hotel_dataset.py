"""
Import realistic hotel data into AI agent database
Generates diverse cities, amenities, ratings, and price ranges
"""

import sys
from datetime import datetime, timedelta
from models.database import init_db, get_session, Deal
import json
import uuid
import random

# Major cities with typical hotel price ranges
CITIES = {
    'New York': {'base_price': 250, 'country': 'USA', 'region': 'Northeast'},
    'Los Angeles': {'base_price': 200, 'country': 'USA', 'region': 'West'},
    'Miami': {'base_price': 180, 'country': 'USA', 'region': 'Southeast'},
    'San Francisco': {'base_price': 220, 'country': 'USA', 'region': 'West'},
    'Chicago': {'base_price': 160, 'country': 'USA', 'region': 'Midwest'},
    'Las Vegas': {'base_price': 120, 'country': 'USA', 'region': 'West'},
    'Seattle': {'base_price': 180, 'country': 'USA', 'region': 'Northwest'},
    'Boston': {'base_price': 200, 'country': 'USA', 'region': 'Northeast'},
    'Atlanta': {'base_price': 140, 'country': 'USA', 'region': 'Southeast'},
    'Denver': {'base_price': 150, 'country': 'USA', 'region': 'West'},
    'London': {'base_price': 220, 'country': 'UK', 'region': 'Europe'},
    'Paris': {'base_price': 210, 'country': 'France', 'region': 'Europe'},
    'Tokyo': {'base_price': 180, 'country': 'Japan', 'region': 'Asia'},
    'Dubai': {'base_price': 200, 'country': 'UAE', 'region': 'Middle East'},
    'Singapore': {'base_price': 170, 'country': 'Singapore', 'region': 'Asia'},
    'Barcelona': {'base_price': 150, 'country': 'Spain', 'region': 'Europe'},
    'Rome': {'base_price': 160, 'country': 'Italy', 'region': 'Europe'},
    'Sydney': {'base_price': 190, 'country': 'Australia', 'region': 'Oceania'},
    'Bangkok': {'base_price': 80, 'country': 'Thailand', 'region': 'Asia'},
    'Mexico City': {'base_price': 90, 'country': 'Mexico', 'region': 'Latin America'},
}

HOTEL_TYPES = [
    {'type': 'Luxury Resort', 'multiplier': 2.5, 'rating_min': 4.5},
    {'type': 'Boutique Hotel', 'multiplier': 1.8, 'rating_min': 4.0},
    {'type': 'Business Hotel', 'multiplier': 1.4, 'rating_min': 3.5},
    {'type': 'Budget Inn', 'multiplier': 0.6, 'rating_min': 3.0},
    {'type': 'Airport Hotel', 'multiplier': 1.0, 'rating_min': 3.5},
    {'type': 'Downtown Hotel', 'multiplier': 1.5, 'rating_min': 4.0},
    {'type': 'Beach Resort', 'multiplier': 2.0, 'rating_min': 4.2},
    {'type': 'Hostel', 'multiplier': 0.3, 'rating_min': 2.8},
]

AMENITIES_POOL = [
    'wifi', 'parking', 'pool', 'gym', 'spa', 'restaurant', 'bar', 
    'room-service', 'concierge', 'breakfast', 'airport-shuttle',
    'pet-friendly', 'business-center', 'meeting-rooms', 'laundry',
    'air-conditioning', 'ocean-view', 'city-view', 'balcony'
]

def get_hotel_tags(hotel_type, amenities, rating, discount):
    """Generate tags based on hotel characteristics"""
    tags = []
    
    # Location tags
    if 'downtown' in hotel_type.lower():
        tags.extend(['downtown', 'near-transit'])
    if 'beach' in hotel_type.lower():
        tags.extend(['beach', 'resort'])
    if 'airport' in hotel_type.lower():
        tags.extend(['airport', 'convenient'])
    
    # Quality tags
    if rating >= 4.5:
        tags.append('luxury')
    elif rating >= 4.0:
        tags.append('upscale')
    elif rating >= 3.5:
        tags.append('mid-range')
    else:
        tags.append('budget')
    
    # Amenity tags
    if 'pool' in amenities:
        tags.append('pool')
    if 'spa' in amenities:
        tags.append('spa')
    if 'gym' in amenities:
        tags.append('fitness')
    if 'breakfast' in amenities:
        tags.append('breakfast-included')
    if 'business-center' in amenities:
        tags.append('business-friendly')
    if 'pet-friendly' in amenities:
        tags.append('pet-friendly')
    
    # Deal tags
    if discount > 30:
        tags.append('hot-deal')
    elif discount > 15:
        tags.append('deal')
    
    # Other tags
    if rating >= 4.5 and random.random() > 0.6:
        tags.append('popular')
    if 'family' in hotel_type.lower() or 'resort' in hotel_type.lower():
        tags.append('family-friendly')
    
    return tags

def generate_hotel_name(city, hotel_type):
    """Generate realistic hotel name"""
    prefixes = ['The', 'Grand', 'Royal', 'Elegant', 'Modern', 'Urban', 'Classic']
    suffixes = ['Plaza', 'Suites', 'Inn', 'Lodge', 'Residence', 'Tower']
    
    if random.random() > 0.5:
        return f"{random.choice(prefixes)} {city} {hotel_type}"
    else:
        return f"{city} {hotel_type} {random.choice(suffixes)}"

def generate_hotels(count=3000):
    """Generate diverse hotel deals"""
    print(f"🏨 Generating {count} hotel deals...")
    
    session = get_session()
    hotels = []
    
    for i in range(count):
        # Pick random city and hotel type
        city_name = random.choice(list(CITIES.keys()))
        city_data = CITIES[city_name]
        hotel_type_data = random.choice(HOTEL_TYPES)
        
        # Calculate price
        base_price = city_data['base_price'] * hotel_type_data['multiplier']
        base_price = round(base_price * random.uniform(0.8, 1.3), 2)  # Add variance
        
        # Apply discount
        discount_percent = random.uniform(0, 40)
        price = base_price * (1 - discount_percent / 100)
        
        # Rating
        rating_min = hotel_type_data['rating_min']
        rating = round(random.uniform(rating_min, min(5.0, rating_min + 0.5)), 1)
        
        # Amenities (random selection)
        num_amenities = random.randint(3, 12)
        amenities = random.sample(AMENITIES_POOL, num_amenities)
        
        # Generate tags
        tags = get_hotel_tags(hotel_type_data['type'], amenities, rating, discount_percent)
        
        # Score (higher for better deals)
        score = min(100, int(discount_percent * 2 + (rating - 3) * 10 + random.uniform(-10, 10)))
        score = max(0, score)
        
        # Generate name
        hotel_name = generate_hotel_name(city_name, hotel_type_data['type'])
        
        # Metadata
        metadata = {
            'city': city_name,
            'country': city_data['country'],
            'region': city_data['region'],
            'hotel_type': hotel_type_data['type'],
            'rating': rating,
            'amenities': amenities,
            'check_in': '3:00 PM',
            'check_out': '11:00 AM',
        }
        
        # Create deal
        deal = Deal(
            deal_id=str(uuid.uuid4()),
            type='hotel',
            title=hotel_name,
            description=f"{hotel_type_data['type']} in {city_name} with {len(amenities)} amenities - {rating}★",
            price=round(price, 2),
            original_price=round(base_price, 2),
            discount_percent=round(discount_percent, 1),
            score=score,
            active=True,
            expires_at=datetime.utcnow() + timedelta(days=random.randint(1, 30))
        )
        deal.set_tags(tags)
        deal.set_metadata(metadata)
        
        hotels.append(deal)
        
        # Progress indicator
        if (i + 1) % 500 == 0:
            print(f"  ✓ Generated {i + 1}/{count} hotels")
    
    # Bulk insert
    print("💾 Saving to database...")
    session.bulk_save_objects(hotels)
    session.commit()
    session.close()
    
    print(f"✅ Successfully imported {count} hotels!")
    return count

if __name__ == "__main__":
    print("🚀 Hotel Dataset Import")
    print("=" * 50)
    
    # Initialize database
    init_db()
    
    # Generate hotels
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    generate_hotels(count)
    
    # Summary
    session = get_session()
    total = session.query(Deal).filter(Deal.type == 'hotel').count()
    avg_price = session.query(Deal).filter(Deal.type == 'hotel').with_entities(Deal.price).all()
    avg_price = sum([p[0] for p in avg_price]) / len(avg_price) if avg_price else 0
    
    cities = {}
    all_hotels = session.query(Deal).filter(Deal.type == 'hotel').all()
    for hotel in all_hotels:
        city = hotel.get_metadata().get('city', 'Unknown')
        cities[city] = cities.get(city, 0) + 1
    
    print("\n📊 Summary:")
    print(f"   Total hotels: {total}")
    print(f"   Average price: ${avg_price:.2f}/night")
    print(f"   Cities covered: {len(cities)}")
    print(f"   Top 5 cities: {sorted(cities.items(), key=lambda x: x[1], reverse=True)[:5]}")
    
    session.close()
