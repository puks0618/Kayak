"""
Import realistic car rental data into AI agent database
Generates diverse vehicles, locations, and rental rates
"""

import sys
from datetime import datetime, timedelta
from models.database import init_db, get_session, Deal
import json
import uuid
import random

# Car rental locations
LOCATIONS = {
    'SFO': {'city': 'San Francisco', 'base_rate': 65},
    'LAX': {'city': 'Los Angeles', 'base_rate': 55},
    'JFK': {'city': 'New York', 'base_rate': 70},
    'MIA': {'city': 'Miami', 'base_rate': 50},
    'ORD': {'city': 'Chicago', 'base_rate': 55},
    'LAS': {'city': 'Las Vegas', 'base_rate': 45},
    'SEA': {'city': 'Seattle', 'base_rate': 60},
    'DEN': {'city': 'Denver', 'base_rate': 50},
    'ATL': {'city': 'Atlanta', 'base_rate': 48},
    'BOS': {'city': 'Boston', 'base_rate': 65},
    'PHX': {'city': 'Phoenix', 'base_rate': 45},
    'DFW': {'city': 'Dallas', 'base_rate': 50},
}

CAR_TYPES = [
    {
        'category': 'Economy',
        'brands': ['Toyota Yaris', 'Honda Fit', 'Chevrolet Spark', 'Nissan Versa'],
        'multiplier': 1.0,
        'passengers': 4,
        'bags': 2
    },
    {
        'category': 'Compact',
        'brands': ['Toyota Corolla', 'Honda Civic', 'Mazda3', 'Hyundai Elantra'],
        'multiplier': 1.2,
        'passengers': 5,
        'bags': 2
    },
    {
        'category': 'Midsize',
        'brands': ['Toyota Camry', 'Honda Accord', 'Nissan Altima', 'Ford Fusion'],
        'multiplier': 1.5,
        'passengers': 5,
        'bags': 3
    },
    {
        'category': 'Full-size',
        'brands': ['Chevrolet Impala', 'Toyota Avalon', 'Chrysler 300', 'Nissan Maxima'],
        'multiplier': 1.8,
        'passengers': 5,
        'bags': 4
    },
    {
        'category': 'SUV',
        'brands': ['Toyota RAV4', 'Honda CR-V', 'Ford Explorer', 'Jeep Grand Cherokee'],
        'multiplier': 2.2,
        'passengers': 7,
        'bags': 5
    },
    {
        'category': 'Luxury',
        'brands': ['BMW 5 Series', 'Mercedes E-Class', 'Audi A6', 'Lexus ES'],
        'multiplier': 3.0,
        'passengers': 5,
        'bags': 3
    },
    {
        'category': 'Van',
        'brands': ['Toyota Sienna', 'Honda Odyssey', 'Chrysler Pacifica'],
        'multiplier': 2.5,
        'passengers': 8,
        'bags': 6
    },
    {
        'category': 'Convertible',
        'brands': ['Ford Mustang Convertible', 'Chevrolet Camaro Convertible', 'BMW 4 Series'],
        'multiplier': 2.8,
        'passengers': 4,
        'bags': 2
    },
]

RENTAL_COMPANIES = [
    {'name': 'Enterprise', 'quality': 'premium'},
    {'name': 'Hertz', 'quality': 'premium'},
    {'name': 'Avis', 'quality': 'standard'},
    {'name': 'Budget', 'quality': 'budget'},
    {'name': 'Dollar', 'quality': 'budget'},
    {'name': 'Thrifty', 'quality': 'budget'},
    {'name': 'National', 'quality': 'premium'},
    {'name': 'Alamo', 'quality': 'standard'},
]

def get_car_tags(category, company_quality, has_discount, rate):
    """Generate tags based on car characteristics"""
    tags = []
    
    # Category tags
    if category in ['Economy', 'Compact']:
        tags.extend(['fuel-efficient', 'easy-parking'])
    if category in ['SUV', 'Van']:
        tags.extend(['spacious', 'family-friendly'])
    if category == 'Luxury':
        tags.extend(['luxury', 'premium', 'comfort'])
    if category == 'Convertible':
        tags.extend(['fun', 'scenic-drives'])
    
    # Company quality
    if company_quality == 'premium':
        tags.append('reliable')
    elif company_quality == 'budget':
        tags.append('value')
    
    # Deal tags
    if has_discount > 25:
        tags.append('hot-deal')
    elif has_discount > 10:
        tags.append('deal')
    
    # Price tags
    if rate < 40:
        tags.append('budget')
    elif rate > 100:
        tags.append('premium')
    
    # Features
    if random.random() > 0.6:
        tags.append('unlimited-mileage')
    if random.random() > 0.7:
        tags.append('free-cancellation')
    
    return tags

def generate_cars(count=2000):
    """Generate diverse car rental deals"""
    print(f"🚗 Generating {count} car rental deals...")
    
    session = get_session()
    cars = []
    
    for i in range(count):
        # Pick random location and car type
        location_code = random.choice(list(LOCATIONS.keys()))
        location_data = LOCATIONS[location_code]
        car_type = random.choice(CAR_TYPES)
        company = random.choice(RENTAL_COMPANIES)
        
        # Pick specific car model
        car_model = random.choice(car_type['brands'])
        
        # Calculate daily rate
        base_rate = location_data['base_rate'] * car_type['multiplier']
        base_rate = round(base_rate * random.uniform(0.85, 1.25), 2)  # Add variance
        
        # Apply discount
        discount_percent = random.uniform(0, 35)
        rate = base_rate * (1 - discount_percent / 100)
        
        # Generate tags
        tags = get_car_tags(car_type['category'], company['quality'], discount_percent, rate)
        
        # Score (higher for better deals)
        score = min(100, int(discount_percent * 2.5 + random.uniform(-10, 15)))
        score = max(0, score)
        
        # Metadata
        metadata = {
            'location': location_code,
            'city': location_data['city'],
            'company': company['name'],
            'category': car_type['category'],
            'model': car_model,
            'passengers': car_type['passengers'],
            'bags': car_type['bags'],
            'transmission': random.choice(['Automatic', 'Manual']),
            'fuel_type': random.choice(['Gasoline', 'Hybrid', 'Electric']),
            'features': random.sample(['GPS', 'Child Seat', 'Bluetooth', 'USB', 'Backup Camera'], k=random.randint(2, 5)),
        }
        
        # Create deal
        deal = Deal(
            deal_id=str(uuid.uuid4()),
            type='car',
            title=f"{car_model} - {company['name']} {location_data['city']}",
            description=f"{car_type['category']} car rental in {location_data['city']} - {car_type['passengers']} passengers",
            price=round(rate, 2),
            original_price=round(base_rate, 2),
            discount_percent=round(discount_percent, 1),
            score=score,
            active=True,
            expires_at=datetime.utcnow() + timedelta(days=random.randint(1, 30))
        )
        deal.set_tags(tags)
        deal.set_metadata(metadata)
        
        cars.append(deal)
        
        # Progress indicator
        if (i + 1) % 500 == 0:
            print(f"  ✓ Generated {i + 1}/{count} cars")
    
    # Bulk insert
    print("💾 Saving to database...")
    session.bulk_save_objects(cars)
    session.commit()
    session.close()
    
    print(f"✅ Successfully imported {count} car rentals!")
    return count

if __name__ == "__main__":
    print("🚀 Car Rental Dataset Import")
    print("=" * 50)
    
    # Initialize database
    init_db()
    
    # Generate cars
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 2000
    generate_cars(count)
    
    # Summary
    session = get_session()
    total = session.query(Deal).filter(Deal.type == 'car').count()
    avg_price = session.query(Deal).filter(Deal.type == 'car').with_entities(Deal.price).all()
    avg_price = sum([p[0] for p in avg_price]) / len(avg_price) if avg_price else 0
    
    locations = {}
    all_cars = session.query(Deal).filter(Deal.type == 'car').all()
    for car in all_cars:
        loc = car.get_metadata().get('location', 'Unknown')
        locations[loc] = locations.get(loc, 0) + 1
    
    print("\n📊 Summary:")
    print(f"   Total cars: {total}")
    print(f"   Average rate: ${avg_price:.2f}/day")
    print(f"   Locations: {len(locations)}")
    print(f"   Top 5 locations: {sorted(locations.items(), key=lambda x: x[1], reverse=True)[:5]}")
    
    session.close()
