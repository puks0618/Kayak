#!/usr/bin/env python3
"""
ETL Script to generate and load flight data into MySQL
Generates realistic flight data for popular US routes
"""

import mysql.connector
from datetime import datetime, timedelta
import uuid
import random
import os

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3307)),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'Somalwar1!'),
    'database': 'kayak_listings'
}

# Configuration
DAYS_TO_GENERATE = 60  # Generate flights for next 60 days
FLIGHTS_PER_ROUTE_PER_DAY = 5  # Generate 5 flights per route per day
PRICE_VARIANCE = 0.15  # ±15% price variation
DEAL_PROBABILITY = 0.15  # 15% of flights are deals
DEAL_DISCOUNT_RANGE = (10, 30)  # 10-30% discount
BATCH_INSERT_SIZE = 1000  # Insert in batches of 1000

# Popular US airports and cities
AIRPORTS = {
    'LAX': {'name': 'Los Angeles International Airport', 'city': 'Los Angeles', 'state': 'CA'},
    'SFO': {'name': 'San Francisco International Airport', 'city': 'San Francisco', 'state': 'CA'},
    'JFK': {'name': 'John F. Kennedy International Airport', 'city': 'New York', 'state': 'NY'},
    'ORD': {'name': "O'Hare International Airport", 'city': 'Chicago', 'state': 'IL'},
    'DFW': {'name': 'Dallas/Fort Worth International Airport', 'city': 'Dallas', 'state': 'TX'},
    'ATL': {'name': 'Hartsfield-Jackson Atlanta International Airport', 'city': 'Atlanta', 'state': 'GA'},
    'MIA': {'name': 'Miami International Airport', 'city': 'Miami', 'state': 'FL'},
    'SEA': {'name': 'Seattle-Tacoma International Airport', 'city': 'Seattle', 'state': 'WA'},
    'BOS': {'name': 'Boston Logan International Airport', 'city': 'Boston', 'state': 'MA'},
    'LAS': {'name': 'Harry Reid International Airport', 'city': 'Las Vegas', 'state': 'NV'},
    'DEN': {'name': 'Denver International Airport', 'city': 'Denver', 'state': 'CO'},
    'PHX': {'name': 'Phoenix Sky Harbor International Airport', 'city': 'Phoenix', 'state': 'AZ'},
}

# Airlines with their codes
AIRLINES = [
    ('American Airlines', 'AA'),
    ('Delta Air Lines', 'DL'),
    ('United Airlines', 'UA'),
    ('Southwest Airlines', 'WN'),
    ('JetBlue Airways', 'B6'),
    ('Alaska Airlines', 'AS'),
    ('Spirit Airlines', 'NK'),
    ('Frontier Airlines', 'F9'),
]

# Base prices and durations for routes (origin -> destination)
ROUTE_DATA = {
    ('LAX', 'SFO'): {'duration': 85, 'base_price': 120},
    ('LAX', 'JFK'): {'duration': 330, 'base_price': 350},
    ('LAX', 'ORD'): {'duration': 240, 'base_price': 280},
    ('LAX', 'SEA'): {'duration': 165, 'base_price': 180},
    ('SFO', 'JFK'): {'duration': 345, 'base_price': 380},
    ('SFO', 'ORD'): {'duration': 255, 'base_price': 300},
    ('SFO', 'LAX'): {'duration': 85, 'base_price': 120},
    ('JFK', 'LAX'): {'duration': 360, 'base_price': 380},
    ('JFK', 'SFO'): {'duration': 375, 'base_price': 400},
    ('JFK', 'MIA'): {'duration': 185, 'base_price': 220},
    ('ORD', 'LAX'): {'duration': 255, 'base_price': 290},
    ('ORD', 'SFO'): {'duration': 270, 'base_price': 310},
    ('ATL', 'LAX'): {'duration': 285, 'base_price': 300},
    ('ATL', 'SFO'): {'duration': 300, 'base_price': 320},
    ('DEN', 'LAX'): {'duration': 135, 'base_price': 160},
    ('DEN', 'SFO'): {'duration': 150, 'base_price': 180},
}

def connect_db():
    """Create database connection"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        print(f"✓ Connected to MySQL database: {DB_CONFIG['database']}")
        return conn
    except mysql.connector.Error as err:
        print(f"✗ Error connecting to database: {err}")
        exit(1)

def load_airports_data(conn):
    """Load airport data into database"""
    print("\n📍 Loading Airports Data...")
    
    cursor = conn.cursor()
    insert_query = """
        INSERT INTO airports (iata_code, name, city, state, country, timezone)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            city = VALUES(city),
            state = VALUES(state)
    """
    
    inserted = 0
    for iata, data in AIRPORTS.items():
        try:
            cursor.execute(insert_query, (
                iata,
                data['name'],
                data['city'],
                data['state'],
                'USA',
                'America/New_York'
            ))
            inserted += 1
        except Exception as e:
            print(f"  ⚠ Error inserting {iata}: {e}")
            continue
    
    conn.commit()
    print(f"  ✓ Inserted {inserted} airports into database")
    return True

def simulate_time_series_price(base_price, date_offset):
    """
    Generate realistic price variation over time
    - Mean reverting around base price
    - Random fluctuations
    - Occasional promotional dips
    """
    # Add random variation
    variance = random.uniform(-PRICE_VARIANCE, PRICE_VARIANCE)
    price = base_price * (1 + variance)
    
    # Random "deal" pricing
    if random.random() < DEAL_PROBABILITY:
        discount = random.randint(*DEAL_DISCOUNT_RANGE) / 100
        price = price * (1 - discount)
        is_deal = True
        discount_percent = int(discount * 100)
    else:
        is_deal = False
        discount_percent = 0
    
    return round(price, 2), is_deal, discount_percent

def load_flights_data(conn):
    """Generate and load flight data"""
    print("\n✈️  Generating Flight Data...")
    
    cursor = conn.cursor()
    insert_query = """
        INSERT INTO flights (
            id, flight_code, airline, departure_airport, arrival_airport,
            departure_time, arrival_time, duration, price, total_seats, class, rating
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
    """
    
    inserted = 0
    today = datetime.now()
    
    print(f"  Generating flights for {len(ROUTE_DATA)} routes over {DAYS_TO_GENERATE} days...")
    
    # Generate flights for each route
    for (origin, destination), route_info in ROUTE_DATA.items():
        base_duration = route_info['duration']
        base_price = route_info['base_price']
        
        # Generate flights for multiple dates
        for day_offset in range(DAYS_TO_GENERATE):
            departure_date = today + timedelta(days=day_offset)
            
            # Generate multiple flights per day
            for flight_num in range(FLIGHTS_PER_ROUTE_PER_DAY):
                # Random departure time
                hour = random.randint(6, 22)
                minute = random.choice([0, 15, 30, 45])
                departure_time = departure_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                
                # Random airline
                airline_name, airline_code = random.choice(AIRLINES)
                
                # Stops (80% nonstop, 20% with stops)
                stops = 0 if random.random() < 0.8 else random.randint(1, 2)
                duration = base_duration + (stops * random.randint(45, 90))
                
                arrival_time = departure_time + timedelta(minutes=duration)
                
                # Cabin classes with price multipliers (matching DB schema: economy, business, first)
                cabin_classes = [
                    ('economy', 1.0),
                    ('business', 2.5),
                    ('first', 4.0)
                ]
                
                for cabin_class, multiplier in cabin_classes:
                    adjusted_base = base_price * multiplier
                    price, is_deal, discount_percent = simulate_time_series_price(adjusted_base, day_offset)
                    
                    # Generate flight data
                    flight_id = str(uuid.uuid4())
                    flight_code = f"{airline_code}{random.randint(100, 9999)}"
                    seats_total = random.randint(150, 300)
                    rating = round(random.uniform(3.8, 5.0), 2)
                    
                    try:
                        cursor.execute(insert_query, (
                            flight_id,
                            flight_code,
                            airline_name,
                            origin,
                            destination,
                            departure_time,
                            arrival_time,
                            duration,
                            price,
                            seats_total,
                            cabin_class,
                            rating
                        ))
                        inserted += 1
                        
                        if inserted % BATCH_INSERT_SIZE == 0:
                            print(f"  ⏳ Inserted {inserted:,} flights...")
                            conn.commit()
                            
                    except Exception as e:
                        print(f"  ⚠ Error inserting flight: {e}")
                        continue
    
    conn.commit()
    print(f"  ✓ Successfully inserted {inserted:,} flights into database")
    return True

def generate_route_summaries(conn):
    """Generate aggregated route summaries"""
    print("\n📊 Generating Route Summaries...")
    
    cursor = conn.cursor()
    
    # Count total flight routes
    cursor.execute("SELECT COUNT(DISTINCT CONCAT(departure_airport, '-', arrival_airport)) FROM flights")
    route_count = cursor.fetchone()[0]
    print(f"  ✓ Generated {route_count} unique routes")

def main():
    """Main ETL process"""
    print("=" * 60)
    print("🛫 KAYAK Flight Data Generator")
    print("=" * 60)
    
    # Connect to database
    conn = connect_db()
    
    try:
        # Step 1: Load airports
        load_airports_data(conn)
        
        # Step 2: Generate flights
        load_flights_data(conn)
        
        # Step 3: Generate summaries
        generate_route_summaries(conn)
        
        print("\n" + "=" * 60)
        print("✅ Flight Data Generation Complete!")
        print("=" * 60)
        print(f"\n📊 Summary:")
        
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM flights")
        flight_count = cursor.fetchone()[0]
        print(f"  • Total Flights: {flight_count:,}")
        
        cursor.execute("SELECT COUNT(DISTINCT CONCAT(departure_airport, '-', arrival_airport)) FROM flights")
        route_count = cursor.fetchone()[0]
        print(f"  • Unique Routes: {route_count}")
        
        cursor.execute("SELECT AVG(price) FROM flights")
        avg_price = cursor.fetchone()[0]
        print(f"  • Average Price: ${avg_price:.2f}")
        
        cursor.execute("SELECT class, COUNT(*) as count FROM flights GROUP BY class")
        print(f"\n  Flights by Class:")
        for row in cursor.fetchall():
            print(f"    - {row[0].title()}: {row[1]:,}")
        
    except Exception as e:
        print(f"\n✗ Data generation failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    main()

