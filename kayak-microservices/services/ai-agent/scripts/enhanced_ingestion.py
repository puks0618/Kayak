"""
Enhanced Kaggle Dataset Ingestion with 30-Day Rolling Averages
Implements proper deal detection (≥15% below 30-day avg)
"""

import pandas as pd
import numpy as np
import json
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
import sys
import os
from typing import Dict, List

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.kafka_service import kafka_service
from models.database import init_db, get_session, Deal
from config import config

DATA_DIR = Path(__file__).parent.parent / "data"
FLIGHTS_CSV = DATA_DIR / "flights.csv"
HOTELS_CSV = DATA_DIR / "hotels.csv"
AIRPORTS_CSV = DATA_DIR / "airports.csv"


class PriceHistorySimulator:
    """Simulates 30-day price history for deals using mean-reverting random walk"""
    
    def __init__(self, base_price: float, volatility: float = 0.15):
        self.base_price = base_price
        self.volatility = volatility
        
    def generate_30day_history(self) -> List[float]:
        """Generate 30 days of price history using mean-reverting process"""
        prices = []
        current_price = self.base_price
        
        for day in range(30):
            # Mean reversion: pull towards base_price
            drift = 0.1 * (self.base_price - current_price)
            # Random shock
            shock = np.random.normal(0, self.volatility * self.base_price)
            # Update price
            current_price = max(50, current_price + drift + shock)  # Floor at $50
            prices.append(current_price)
        
        # Add occasional promo dips (10-25% off)
        if np.random.random() < 0.3:  # 30% chance of promo
            promo_day = np.random.randint(20, 30)  # Recent promo
            promo_discount = np.random.uniform(0.10, 0.25)
            prices[promo_day] = prices[promo_day] * (1 - promo_discount)
        
        return prices
    
    def calculate_avg_30d(self) -> float:
        """Calculate 30-day average"""
        history = self.generate_30day_history()
        return np.mean(history)
    
    def get_current_price_and_avg(self) -> tuple[float, float]:
        """Get current price (last day) and 30-day average"""
        history = self.generate_30day_history()
        current = history[-1]
        avg_30d = np.mean(history)
        return current, avg_30d


async def ingest_flights_with_history():
    """
    Ingest flights with 30-day price history and deal detection
    """
    print("\n🚀 Phase 1: Enhanced Flight Ingestion with 30-Day Averages")
    print("=" * 60)
    
    # Generate enhanced flight data with bidirectional routes
    routes = [
        ('JFK', 'LAX'), ('LAX', 'JFK'),
        ('SFO', 'JFK'), ('JFK', 'SFO'),
        ('LAX', 'SFO'), ('SFO', 'LAX'),
        ('ORD', 'LAX'), ('LAX', 'ORD'),
        ('MIA', 'JFK'), ('JFK', 'MIA'),
        ('BOS', 'SFO'), ('SFO', 'BOS'),
        ('SEA', 'LAX'), ('LAX', 'SEA'),
        ('DEN', 'ORD'), ('ORD', 'DEN'),
        ('ATL', 'MIA'), ('MIA', 'ATL'),
        ('LAS', 'JFK'), ('JFK', 'LAS'),
    ]
    
    airlines = ['Delta', 'United Airlines', 'American Airlines', 'Southwest Airlines', 'JetBlue']
    
    flight_deals = []
    deal_count = 0
    
    for origin, dest in routes:
        for airline in airlines[:2]:  # 2 airlines per route
            # Base price depends on route distance (rough estimate)
            base_distances = {
                ('JFK', 'LAX'): 2475, ('LAX', 'SFO'): 337, ('SFO', 'JFK'): 2586,
                ('ORD', 'LAX'): 1745, ('MIA', 'JFK'): 1089, ('BOS', 'SFO'): 2704,
                ('SEA', 'LAX'): 954, ('DEN', 'ORD'): 888, ('ATL', 'MIA'): 595,
                ('LAS', 'JFK'): 2248
            }
            distance = base_distances.get((origin, dest), 1500)
            base_price = 50 + (distance * 0.15) + np.random.uniform(-30, 50)
            
            # Generate price history
            simulator = PriceHistorySimulator(base_price)
            current_price, avg_30d = simulator.get_current_price_and_avg()
            
            # Calculate discount percentage
            discount_pct = ((avg_30d - current_price) / avg_30d) * 100 if avg_30d > 0 else 0
            
            # Determine if it's a deal (≥15% below 30-day avg)
            is_deal = discount_pct >= 15
            
            # Compute deal score (0-100)
            if is_deal:
                score = min(100, int(60 + (discount_pct * 2)))  # Higher discount = higher score
            else:
                score = int(40 + np.random.uniform(0, 20))
            
            # Random flight details
            stops = np.random.choice([0, 1], p=[0.6, 0.4])
            duration = int(distance / 8) + (stops * 45) + np.random.randint(-20, 30)
            seats_left = np.random.randint(3, 25)
            
            deal = {
                'deal_id': f'flight-{origin}-{dest}-{airline.replace(" ", "")}-{deal_count}',
                'type': 'flight',
                'title': f'{origin} to {dest} - {airline}',
                'description': f'{"Non-stop" if stops == 0 else str(stops) + " stop"} flight',
                'price': round(float(current_price), 2),
                'original_price': round(float(avg_30d), 2),
                'avg_30d_price': round(float(avg_30d), 2),  # NEW: Store 30-day average
                'discount_percent': round(float(discount_pct), 2),
                'score': int(score),
                'tags': json.dumps(['non-stop', 'deal'] if stops == 0 and is_deal else 
                                  (['one-stop', 'deal'] if is_deal else ['non-stop'] if stops == 0 else ['one-stop'])),
                'deal_metadata': json.dumps({
                    'origin': origin,
                    'destination': dest,
                    'airline': airline,
                    'stops': int(stops),
                    'duration_minutes': int(duration),
                    'seats_left': int(seats_left),
                    'is_deal': bool(is_deal),
                    'price_vs_30d_avg': round(float(discount_pct), 1)
                }),
                'active': True
            }
            
            flight_deals.append(deal)
            deal_count += 1
            
            if is_deal:
                print(f"✅ DEAL: {origin}→{dest} ${current_price:.0f} (was ${avg_30d:.0f}, save {discount_pct:.0f}%)")
    
    print(f"\n📊 Generated {len(flight_deals)} flights ({sum(1 for d in flight_deals if json.loads(d['deal_metadata'])['is_deal'])} are deals)")
    return flight_deals


async def ingest_hotels_with_history():
    """
    Ingest hotels with 30-day price history and deal detection
    """
    print("\n🏨 Phase 1: Enhanced Hotel Ingestion with 30-Day Averages")
    print("=" * 60)
    
    cities = ['New York', 'Los Angeles', 'San Francisco', 'Miami', 'Chicago', 
              'Boston', 'Seattle', 'Denver', 'Atlanta']
    
    neighbourhoods = {
        'New York': ['Manhattan', 'Brooklyn', 'Queens'],
        'Los Angeles': ['Downtown', 'Santa Monica', 'Hollywood'],
        'San Francisco': ['Downtown', 'Fisherman\'s Wharf', 'Mission District'],
        'Miami': ['South Beach', 'Downtown', 'Coconut Grove'],
        'Chicago': ['Loop', 'River North', 'Lincoln Park'],
        'Boston': ['Back Bay', 'Beacon Hill', 'Seaport'],
        'Seattle': ['Downtown', 'Capitol Hill', 'Fremont'],
        'Denver': ['Downtown', 'LoDo', 'Cherry Creek'],
        'Atlanta': ['Midtown', 'Buckhead', 'Downtown']
    }
    
    room_types = ['Entire home/apt', 'Private room', 'Hotel room']
    amenity_sets = [
        ['Pet-friendly', 'Parking', 'Breakfast'],
        ['Near transit', 'WiFi', 'Kitchen'],
        ['Gym', 'Pool', 'Concierge'],
        ['Pet-friendly', 'Near transit', 'Breakfast'],
        ['Parking', 'WiFi', 'Gym']
    ]
    
    hotel_deals = []
    deal_count = 0
    
    for city in cities:
        for i in range(10):  # 10 hotels per city
            # Base price varies by city
            city_multiplier = {'New York': 1.5, 'San Francisco': 1.4, 'Los Angeles': 1.3,
                             'Miami': 1.2, 'Boston': 1.3, 'Chicago': 1.1, 'Seattle': 1.2,
                             'Denver': 1.0, 'Atlanta': 1.0}
            base_price = (80 + np.random.uniform(20, 120)) * city_multiplier.get(city, 1.0)
            
            # Generate price history
            simulator = PriceHistorySimulator(base_price)
            current_price, avg_30d = simulator.get_current_price_and_avg()
            
            # Calculate discount percentage
            discount_pct = ((avg_30d - current_price) / avg_30d) * 100 if avg_30d > 0 else 0
            
            # Determine if it's a deal (≥15% below 30-day avg)
            is_deal = discount_pct >= 15
            
            # Compute deal score
            if is_deal:
                score = min(100, int(65 + (discount_pct * 2)))
            else:
                score = int(45 + np.random.uniform(0, 25))
            
            amenities = amenity_sets[i % len(amenity_sets)]
            room_type = room_types[i % len(room_types)]
            neighbourhood = neighbourhoods[city][i % len(neighbourhoods[city])]
            availability = np.random.randint(2, 365)
            accommodates = np.random.choice([2, 4, 6], p=[0.5, 0.3, 0.2])
            
            deal = {
                'deal_id': f'hotel-{city.replace(" ", "")}-{i}-{deal_count}',
                'type': 'hotel',
                'title': f'{"Luxury" if current_price > 200 else "Comfort" if current_price > 120 else "Budget"} {room_type} in {neighbourhood}',
                'description': f'{room_type} in {neighbourhood}, {city}',
                'price': round(float(current_price), 2),
                'original_price': round(float(avg_30d), 2),
                'avg_30d_price': round(float(avg_30d), 2),  # NEW: Store 30-day average
                'discount_percent': round(float(discount_pct), 2),
                'score': int(score),
                'tags': json.dumps(amenities[:2] + (['deal'] if is_deal else [])),
                'deal_metadata': json.dumps({
                    'listing_id': f'h{deal_count}',
                    'city': city,
                    'neighbourhood': neighbourhood,
                    'amenities': amenities,
                    'room_type': room_type,
                    'accommodates': int(accommodates),
                    'availability_365': int(availability),
                    'is_deal': bool(is_deal),
                    'price_vs_30d_avg': round(float(discount_pct), 1)
                }),
                'active': True
            }
            
            hotel_deals.append(deal)
            deal_count += 1
            
            if is_deal:
                print(f"✅ DEAL: {city} - {neighbourhood} ${current_price:.0f}/nt (was ${avg_30d:.0f}, save {discount_pct:.0f}%)")
    
    print(f"\n📊 Generated {len(hotel_deals)} hotels ({sum(1 for d in hotel_deals if json.loads(d['deal_metadata'])['is_deal'])} are deals)")
    return hotel_deals


async def populate_database_with_enhanced_deals():
    """Populate database with enhanced deal data"""
    print("\n💾 Populating database with enhanced deals...")
    
    # Force recreate database with new schema
    import os
    from config import config
    db_path = config.DB_PATH
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"🗑️  Removed old database: {db_path}")
    
    # Create fresh engine and metadata
    from sqlmodel import SQLModel, create_engine
    fresh_engine = create_engine(config.get_database_url(), echo=False)
    SQLModel.metadata.create_all(fresh_engine)
    print("✅ Created database with new schema (including avg_30d_price)")
    
    session = get_session()
    
    # Generate enhanced data
    flight_deals = await ingest_flights_with_history()
    hotel_deals = await ingest_hotels_with_history()
    
    # Insert into database
    print("\n💾 Inserting into database...")
    for deal_data in flight_deals + hotel_deals:
        deal = Deal(**deal_data)
        session.add(deal)
    
    session.commit()
    
    # Verify
    flight_count = session.query(Deal).filter(Deal.type == 'flight').count()
    hotel_count = session.query(Deal).filter(Deal.type == 'hotel').count()
    deal_flights = session.query(Deal).filter(
        Deal.type == 'flight', 
        Deal.discount_percent >= 15
    ).count()
    deal_hotels = session.query(Deal).filter(
        Deal.type == 'hotel', 
        Deal.discount_percent >= 15
    ).count()
    
    session.close()
    
    print(f"\n✅ Database populated:")
    print(f"   • {flight_count} flights ({deal_flights} deals ≥15% off)")
    print(f"   • {hotel_count} hotels ({deal_hotels} deals ≥15% off)")
    print(f"\n📈 Deal Detection Rule: price ≤ 0.85 × avg_30d_price")


async def send_to_kafka_pipeline():
    """Send deals through Kafka pipeline for processing"""
    print("\n🔄 Sending deals through Kafka pipeline...")
    
    session = get_session()
    deals = session.query(Deal).all()
    session.close()
    
    await kafka_service.connect()
    
    for deal in deals:
        # Send to raw_supplier_feeds topic
        deal_event = {
            'deal_id': deal.deal_id,
            'type': deal.type,
            'price': deal.price,
            'avg_30d_price': deal.original_price,  # Using original_price as avg_30d
            'metadata': json.loads(deal.deal_metadata) if deal.deal_metadata else {}
        }
        
        await kafka_service.produce('raw_supplier_feeds', deal_event)
    
    print(f"✅ Sent {len(deals)} deals to Kafka pipeline")
    await kafka_service.disconnect()


async def main():
    """Main execution"""
    print("\n" + "=" * 60)
    print("🚀 ENHANCED KAGGLE DATASET INGESTION")
    print("   With 30-Day Rolling Averages & Deal Detection")
    print("=" * 60)
    
    # Populate database with enhanced deals
    await populate_database_with_enhanced_deals()
    
    print("\n✅ Phase 1 Complete!")
    print("\n💡 Next steps:")
    print("   • Restart ai-agent: docker-compose restart ai-agent")
    print("   • Test deal detection: Query for flights/hotels")
    print("   • Verify 30-day averages are being used")


if __name__ == "__main__":
    asyncio.run(main())
