"""
Kaggle Dataset Ingestion Script
Downloads and processes Kaggle datasets for flight and hotel data
Feeds data into Kafka topics for the deals pipeline
"""

import pandas as pd
import json
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.kafka_service import kafka_service
from models.database import init_db, get_session, Deal
from config import config

# Dataset paths (download these manually or via Kaggle API)
DATA_DIR = Path(__file__).parent.parent / "data"
FLIGHTS_CSV = DATA_DIR / "flights.csv"  # From Kaggle Flight Price Prediction
HOTELS_CSV = DATA_DIR / "hotels.csv"    # From Inside Airbnb
AIRPORTS_CSV = DATA_DIR / "airports.csv"  # From Global Airports dataset


async def ingest_flight_data():
    """
    Process flight dataset and send to Kafka
    Expected columns: origin, destination, airline, stops, duration, price
    """
    print("📥 Ingesting flight data...")
    
    if not FLIGHTS_CSV.exists():
        print(f"⚠️  Flight CSV not found at {FLIGHTS_CSV}")
        print("💡 Please download from: https://www.kaggle.com/datasets/dilwong/flightprices")
        # Create sample data
        create_sample_flight_data()
        return
    
    df = pd.read_csv(FLIGHTS_CSV)
    print(f"✓ Loaded {len(df)} flight records")
    
    # Normalize column names
    df.columns = df.columns.str.lower().str.strip()
    
    # Map to expected schema
    flight_records = []
    for idx, row in df.iterrows():
        # Extract origin/destination
        origin = row.get('startingairport', row.get('origin', row.get('from', 'JFK')))
        destination = row.get('destinationairport', row.get('destination', row.get('to', 'LAX')))
        
        record = {
            'type': 'flight',
            'origin': str(origin).upper()[:3] if pd.notna(origin) else 'JFK',
            'destination': str(destination).upper()[:3] if pd.notna(destination) else 'LAX',
            'airline': row.get('segmentsairlinename', row.get('airline', 'United Airlines')),
            'price': float(row.get('totaltravelfare', row.get('price', 200))),
            'stops': int(row.get('segmentscabincode', row.get('stops', 0))),
            'duration': int(row.get('traveldurations', row.get('duration', 180))),
            'date': datetime.now().isoformat(),
            'seats_left': 10,
            'timestamp': datetime.now().isoformat()
        }
        flight_records.append(record)
        
        if len(flight_records) >= 100:
            break
    
    # Send to Kafka
    await kafka_service.initialize()
    for record in flight_records:
        await kafka_service.produce_message('raw_supplier_feeds', json.dumps(record))
    
    print(f"✅ Sent {len(flight_records)} flight records to Kafka")


async def ingest_hotel_data():
    """
    Process Inside Airbnb hotel dataset
    Expected columns: listing_id, price, availability, amenities, neighbourhood
    """
    print("📥 Ingesting hotel data...")
    
    if not HOTELS_CSV.exists():
        print(f"⚠️  Hotel CSV not found at {HOTELS_CSV}")
        print("💡 Please download from: https://www.kaggle.com/datasets/dominoweir/inside-airbnb-nyc")
        create_sample_hotel_data()
        return
    
    df = pd.read_csv(HOTELS_CSV)
    print(f"✓ Loaded {len(df)} hotel records")
    
    # Normalize
    df.columns = df.columns.str.lower().str.strip()
    
    hotel_records = []
    for idx, row in df.iterrows():
        # Parse amenities
        amenities_raw = row.get('amenities', '[]')
        try:
            amenities = json.loads(amenities_raw) if isinstance(amenities_raw, str) else []
        except:
            amenities = []
        
        # Extract location
        city = row.get('city', row.get('neighbourhood_cleansed', 'New York'))
        
        record = {
            'type': 'hotel',
            'listing_id': str(row.get('id', row.get('listing_id', idx))),
            'name': row.get('name', f'Hotel {idx}'),
            'city': city,
            'neighbourhood': row.get('neighbourhood', city),
            'price_per_night': float(row.get('price', row.get('price_per_night', 150))),
            'availability': int(row.get('availability_365', row.get('availability', 300))),
            'amenities': amenities,
            'room_type': row.get('room_type', 'Entire home/apt'),
            'accommodates': int(row.get('accommodates', 2)),
            'bedrooms': int(row.get('bedrooms', 1)),
            'date': datetime.now().isoformat(),
            'timestamp': datetime.now().isoformat()
        }
        hotel_records.append(record)
        
        if len(hotel_records) >= 100:
            break
    
    # Send to Kafka
    await kafka_service.initialize()
    for record in hotel_records:
        await kafka_service.produce_message('raw_supplier_feeds', json.dumps(record))
    
    print(f"✅ Sent {len(hotel_records)} hotel records to Kafka")


def create_sample_flight_data():
    """Create sample flight data with bidirectional routes"""
    print("🔧 Creating sample flight data...")
    
    routes = [
        ('JFK', 'LAX'), ('JFK', 'SFO'), ('JFK', 'MIA'), ('JFK', 'ORD'),
        ('LAX', 'SFO'), ('LAX', 'LAS'), ('LAX', 'SEA'), ('LAX', 'PHX'),
        ('SFO', 'SEA'), ('SFO', 'LAS'), ('SFO', 'DEN'), ('SFO', 'PDX'),
        ('ORD', 'DFW'), ('ORD', 'DEN'), ('ORD', 'ATL'), ('ORD', 'BOS'),
        ('MIA', 'ATL'), ('MIA', 'DFW'), ('MIA', 'FLL'), ('MIA', 'MCO'),
    ]
    
    airlines = ['United Airlines', 'Delta', 'American Airlines', 'Southwest Airlines', 'JetBlue']
    
    flights = []
    for origin, dest in routes:
        # Add both directions
        for o, d in [(origin, dest), (dest, origin)]:
            for airline in airlines[:2]:  # 2 airlines per route
                price = 100 + abs(hash(f"{o}{d}")) % 400
                flights.append({
                    'origin': o,
                    'destination': d,
                    'airline': airline,
                    'price': price,
                    'stops': 0 if price < 200 else 1,
                    'duration': 120 + abs(hash(f"{o}{d}")) % 300,
                    'seats_left': 10 + abs(hash(f"{o}{d}{airline}")) % 20,
                    'date': datetime.now().isoformat()
                })
    
    # Save to CSV
    DATA_DIR.mkdir(exist_ok=True)
    df = pd.DataFrame(flights)
    df.to_csv(FLIGHTS_CSV, index=False)
    print(f"✅ Created {len(flights)} sample flight records at {FLIGHTS_CSV}")


def create_sample_hotel_data():
    """Create sample hotel data with amenities"""
    print("🔧 Creating sample hotel data...")
    
    cities = [
        ('New York', 'JFK'), ('San Francisco', 'SFO'), ('Los Angeles', 'LAX'),
        ('Miami', 'MIA'), ('Chicago', 'ORD'), ('Boston', 'BOS'),
        ('Seattle', 'SEA'), ('Las Vegas', 'LAS'), ('Denver', 'DEN')
    ]
    
    hotels = []
    for city, code in cities:
        for i in range(10):  # 10 hotels per city
            amenities = []
            if i % 3 == 0:
                amenities.extend(['Pet-friendly', 'Parking'])
            if i % 2 == 0:
                amenities.extend(['Breakfast', 'WiFi'])
            if i > 5:
                amenities.extend(['Near transit', 'Airport shuttle'])
            
            hotels.append({
                'id': f'hotel_{code}_{i}',
                'name': f'{city} Hotel {i+1}',
                'city': city,
                'neighbourhood': f'{city} Downtown' if i < 5 else f'{city} Suburbs',
                'price_per_night': 100 + i * 30,
                'availability': 300 - i * 20,
                'amenities': json.dumps(amenities),
                'room_type': 'Entire home/apt' if i < 3 else 'Private room',
                'accommodates': 2 + (i % 4),
                'bedrooms': 1 + (i % 3)
            })
    
    # Save to CSV
    DATA_DIR.mkdir(exist_ok=True)
    df = pd.DataFrame(hotels)
    df.to_csv(HOTELS_CSV, index=False)
    print(f"✅ Created {len(hotels)} sample hotel records at {HOTELS_CSV}")


async def populate_database_directly():
    """Directly populate database for immediate testing"""
    print("💾 Populating database directly...")
    
    init_db()
    session = get_session()
    
    # Check if data already exists
    existing_count = session.query(Deal).count()
    if existing_count > 0:
        print(f"ℹ️  Database already has {existing_count} deals")
        response = input("Clear and repopulate? (yes/no): ")
        if response.lower() != 'yes':
            return
        session.query(Deal).delete()
        session.commit()
    
    # Create bidirectional flights
    create_sample_flight_data()
    df_flights = pd.read_csv(FLIGHTS_CSV)
    
    for idx, row in df_flights.iterrows():
        price = float(row['price'])
        original_price = price * 1.2  # 20% markup for deal calculation
        discount = ((original_price - price) / original_price) * 100
        
        deal = Deal(
            deal_id=f"flight-{row['origin']}-{row['destination']}-{row['airline']}-{idx}",
            type='flight',
            title=f"{row['origin']} to {row['destination']} - {row['airline']}",
            description=f"{'Non-stop' if row['stops'] == 0 else str(row['stops']) + ' stop'} flight",
            price=price,
            original_price=original_price,
            discount_percent=round(discount, 2),
            score=80 if row['price'] < 200 else 60,
            tags=json.dumps(['non-stop'] if row['stops'] == 0 else ['one-stop']),
            deal_metadata=json.dumps({
                'origin': row['origin'],
                'destination': row['destination'],
                'airline': row['airline'],
                'stops': int(row['stops']),
                'duration_minutes': int(row['duration']),
                'seats_left': int(row['seats_left'])
            }),
            active=True
        )
        session.add(deal)
    
    # Create hotels
    create_sample_hotel_data()
    df_hotels = pd.read_csv(HOTELS_CSV)
    
    for idx, row in df_hotels.iterrows():
        amenities = json.loads(row['amenities']) if isinstance(row['amenities'], str) else []
        price = float(row['price_per_night'])
        original_price = price * 1.15
        discount = ((original_price - price) / original_price) * 100
        
        deal = Deal(
            deal_id=f"hotel-{row['city']}-{row['id']}-{idx}",
            type='hotel',
            title=row['name'],
            description=f"{row['room_type']} in {row['neighbourhood']}, {row['city']}",
            price=price,
            original_price=original_price,
            discount_percent=round(discount, 2),
            score=85 if row['price_per_night'] < 150 else 70,
            tags=json.dumps(amenities[:3] if amenities else ['standard']),
            deal_metadata=json.dumps({
                'listing_id': row['id'],
                'city': row['city'],
                'neighbourhood': row['neighbourhood'],
                'amenities': amenities,
                'room_type': row['room_type'],
                'accommodates': int(row['accommodates']),
                'availability_365': int(row['availability'])
            }),
            active=True
        )
        session.add(deal)
    
    session.commit()
    
    flight_count = session.query(Deal).filter(Deal.type == 'flight').count()
    hotel_count = session.query(Deal).filter(Deal.type == 'hotel').count()
    
    print(f"✅ Database populated:")
    print(f"   • {flight_count} flights")
    print(f"   • {hotel_count} hotels")
    
    session.close()


async def main():
    """Main ingestion workflow"""
    print("🚀 Kaggle Dataset Ingestion")
    print("=" * 50)
    
    # Option 1: Direct database population (fast, for testing)
    await populate_database_directly()
    
    # Option 2: Full Kafka pipeline (proper implementation)
    # await ingest_flight_data()
    # await ingest_hotel_data()
    
    print("\n✅ Ingestion complete!")
    print("💡 Restart the AI agent to use the new data")


if __name__ == "__main__":
    asyncio.run(main())
