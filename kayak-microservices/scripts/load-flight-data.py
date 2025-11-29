#!/usr/bin/env python3
"""
ETL Script to load Kaggle flight datasets into MySQL
Handles large datasets (6GB+) efficiently using chunking and sampling
"""

import pandas as pd
import mysql.connector
from datetime import datetime, timedelta
import uuid
import random
import numpy as np
import os
import re
from pathlib import Path

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3307)),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'Somalwar1!'),
    'database': 'kayak_listings'
}

# Data file paths
DATA_DIR = Path(__file__).parent / 'flight-data'
FLIGHTS_CSV = DATA_DIR / 'itineraries.csv'  # Expedia dataset (sampled from 31GB)
AIRPORTS_CSV = DATA_DIR / 'airports.csv'  # Global airports database

# Configuration for handling large dataset
SAMPLE_SIZE = 50000  # Sample 50k routes from 6GB dataset (manageable size)
CHUNK_SIZE = 10000  # Process CSV in 10k row chunks (memory efficient)
DAYS_TO_GENERATE = 60  # Generate flights for next 60 days
FLIGHTS_PER_ROUTE_PER_DAY = 3  # Generate 3 flights per route per day
PRICE_VARIANCE = 0.15  # ±15% price variation
DEAL_PROBABILITY = 0.10  # 10% of flights are deals
DEAL_DISCOUNT_RANGE = (10, 25)  # 10-25% discount
BATCH_INSERT_SIZE = 1000  # Insert in batches of 1000

def parse_iso_duration(duration_str):
    """Parse ISO 8601 duration format (e.g., PT12H7M) to minutes"""
    if pd.isna(duration_str) or not duration_str:
        return 120  # Default 2 hours
    
    try:
        # Handle if it's already a number
        if isinstance(duration_str, (int, float)):
            return int(duration_str) // 60 if duration_str > 1000 else int(duration_str)
        
        # Parse ISO 8601 format: PT12H7M
        duration_str = str(duration_str).strip()
        if not duration_str.startswith('PT'):
            return 120  # Default if invalid format
        
        # Extract hours and minutes
        hours = 0
        minutes = 0
        
        hour_match = re.search(r'(\d+)H', duration_str)
        if hour_match:
            hours = int(hour_match.group(1))
        
        minute_match = re.search(r'(\d+)M', duration_str)
        if minute_match:
            minutes = int(minute_match.group(1))
        
        total_minutes = (hours * 60) + minutes
        return total_minutes if total_minutes > 0 else 120
    except:
        return 120  # Default 2 hours

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
    """Load and process airports data"""
    print("\n📍 Processing Airports Data...")
    
    if not AIRPORTS_CSV.exists():
        print(f"✗ Airports CSV not found at: {AIRPORTS_CSV}")
        print("  Please ensure airports.csv is in the flight-data folder")
        return False
    
    # Read airports CSV
    # Columns: AirportName,IATA,ICAO,TimeZone,City_Name,City_IATA,UTC_Offset_Hours,UTC_Offset_Seconds,Country_CodeA2,Country_CodeA3,Country_Name,GeoPointLat,GeoPointLong
    df = pd.read_csv(AIRPORTS_CSV)
    print(f"  Loaded {len(df)} airports from CSV")
    
    # Clean and prepare data
    df = df.dropna(subset=['IATA'])  # Remove airports without IATA code
    df['IATA'] = df['IATA'].str.upper().str.strip()
    
    # Filter out empty IATA codes
    df = df[df['IATA'].str.len() > 0]
    
    print(f"  Filtered to {len(df)} airports with valid IATA codes")
    
    # Insert into database
    cursor = conn.cursor()
    insert_query = """
        INSERT INTO airports (iata_code, icao_code, name, city, state, country, latitude, longitude, timezone)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            city = VALUES(city),
            country = VALUES(country)
    """
    
    inserted = 0
    for _, row in df.iterrows():
        try:
            cursor.execute(insert_query, (
                row.get('IATA'),
                row.get('ICAO'),
                row.get('AirportName'),
                row.get('City_Name'),
                None,  # state (not in this dataset)
                row.get('Country_Name'),
                row.get('GeoPointLat'),
                row.get('GeoPointLong'),
                row.get('TimeZone')
            ))
            inserted += 1
        except Exception as e:
            # Skip duplicates or invalid entries
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
    """Load and process flight prices data using chunking for large files"""
    print("\n✈️  Processing Flight Data...")
    
    if not FLIGHTS_CSV.exists():
        print(f"✗ Flights CSV not found at: {FLIGHTS_CSV}")
        print(f"  Please ensure itineraries.csv is in the flight-data folder")
        return False
    
    # Actual columns from Expedia dataset:
    # legId,searchDate,flightDate,startingAirport,destinationAirport,fareBasisCode,travelDuration,
    # elapsedDays,isBasicEconomy,isRefundable,isNonStop,baseFare,totalFare,seatsRemaining,
    # totalTravelDistance,segmentsDepartureTimeEpochSeconds,segmentsDepartureTimeRaw,
    # segmentsArrivalTimeEpochSeconds,segmentsArrivalTimeRaw,segmentsArrivalAirportCode,
    # segmentsDepartureAirportCode,segmentsAirlineName,segmentsAirlineCode,
    # segmentsEquipmentDescription,segmentsDurationInSeconds,segmentsDistance,segmentsCabinCode
    
    print(f"  Reading CSV in chunks (this may take a few minutes)...")
    
    # Sample routes from the CSV
    sampled_routes = []
    chunk_count = 0
    
    for chunk in pd.read_csv(FLIGHTS_CSV, chunksize=CHUNK_SIZE):
        chunk_count += 1
        # Clean data
        chunk = chunk.dropna(subset=['startingAirport', 'destinationAirport', 'totalFare', 'travelDuration'])
        # Sample from this chunk
        sample_size = min(len(chunk), 500)
        sampled_routes.append(chunk.sample(n=sample_size))
        
        if len(sampled_routes) * 500 >= SAMPLE_SIZE:
            break
        
        if chunk_count % 10 == 0:
            print(f"  Processed {chunk_count} chunks, sampled {len(sampled_routes) * 500} routes...")
    
    # Combine all sampled chunks
    df = pd.concat(sampled_routes, ignore_index=True).head(SAMPLE_SIZE)
    print(f"  ✓ Sampled {len(df)} unique routes from CSV")
    
    cursor = conn.cursor()
    insert_query = """
        INSERT INTO flights (
            id, flight_code, airline, departure_airport, arrival_airport,
            departure_time, arrival_time, duration, stops, price, base_price,
            seats_total, seats_left, cabin_class, is_deal, discount_percent, rating
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
    """
    
    inserted = 0
    today = datetime.now()
    
    print(f"  Generating flights for next {DAYS_TO_GENERATE} days...")
    
    
    # Generate flights from sampled routes
    for idx, row in df.iterrows():
        # Extract base data from CSV
        origin = str(row.get('startingAirport', 'SFO'))[:3].upper()
        destination = str(row.get('destinationAirport', 'LAX'))[:3].upper()
        
        # Get airline name from segments
        airline_raw = row.get('segmentsAirlineName', 'Unknown')
        if pd.notna(airline_raw):
            # Take first airline if multiple segments
            airline = str(airline_raw).split('||')[0].strip()
        else:
            airline = 'Unknown Airline'
        
        base_fare = float(row.get('totalFare', 300))
        duration = parse_iso_duration(row.get('travelDuration', 'PT2H'))
        
        # Determine if non-stop
        is_non_stop = row.get('isNonStop', False)
        stops = 0 if is_non_stop else random.randint(1, 2)
        
        # Generate flights for multiple dates
        for day_offset in range(DAYS_TO_GENERATE):
            departure_date = today + timedelta(days=day_offset)
            
            # Generate multiple flights per day
            for flight_num in range(FLIGHTS_PER_ROUTE_PER_DAY):
                # Random departure time
                hour = random.randint(6, 22)
                minute = random.choice([0, 15, 30, 45])
                departure_time = departure_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                arrival_time = departure_time + timedelta(minutes=duration)
                
                # Cabin classes with price multipliers
                cabin_classes = [
                    ('economy', 1.0),
                    ('premium economy', 1.4),
                    ('business', 2.5),
                    ('first', 4.0)
                ]
                
                for cabin_class, multiplier in cabin_classes:
                    adjusted_base = base_fare * multiplier
                    price, is_deal, discount_percent = simulate_time_series_price(adjusted_base, day_offset)
                    
                    # Generate flight data
                    flight_id = str(uuid.uuid4())
                    airline_code = airline[:2].upper() if len(airline) >= 2 else 'XX'
                    flight_code = f"{airline_code}{random.randint(100, 999)}"
                    seats_total = random.randint(120, 180)
                    seats_left = random.randint(0, seats_total)
                    rating = round(random.uniform(3.5, 5.0), 2)
                    
                    try:
                        cursor.execute(insert_query, (
                            flight_id,
                            flight_code,
                            airline,
                            origin,
                            destination,
                            departure_time,
                            arrival_time,
                            duration,
                            stops,
                            price,
                            adjusted_base,
                            seats_total,
                            seats_left,
                            cabin_class,
                            is_deal,
                            discount_percent,
                            rating
                        ))
                        inserted += 1
                        
                        if inserted % BATCH_INSERT_SIZE == 0:
                            print(f"  ⏳ Inserted {inserted:,} flights...")
                            conn.commit()
                            
                    except Exception as e:
                        # Skip errors
                        continue
        
        if (idx + 1) % 100 == 0:
            print(f"  Processed {idx + 1}/{len(df)} routes...")
    
    conn.commit()
    print(f"  ✓ Inserted {inserted:,} flights into database")
    return True

def generate_route_summaries(conn):
    """Generate aggregated route summaries for 'Cheap Flights by Destination'"""
    print("\n📊 Generating Route Summaries...")
    
    cursor = conn.cursor()
    
    # Aggregate flight data by route
    summary_query = """
        INSERT INTO flight_routes_summary (origin_airport, destination_city, destination_airport, avg_price, min_price, flight_count)
        SELECT 
            f.departure_airport,
            a.city as destination_city,
            f.arrival_airport,
            AVG(f.price) as avg_price,
            MIN(f.price) as min_price,
            COUNT(*) as flight_count
        FROM flights f
        JOIN airports a ON f.arrival_airport = a.iata_code
        WHERE f.cabin_class = 'economy'
        GROUP BY f.departure_airport, a.city, f.arrival_airport
        ON DUPLICATE KEY UPDATE
            avg_price = VALUES(avg_price),
            min_price = VALUES(min_price),
            flight_count = VALUES(flight_count)
    """
    
    cursor.execute(summary_query)
    conn.commit()
    print(f"  ✓ Generated route summaries")

def main():
    """Main ETL process"""
    print("=" * 60)
    print("🛫 KAYAK Flight Data ETL Script")
    print("=" * 60)
    
    # Check if data directory exists
    if not DATA_DIR.exists():
        print(f"\n✗ Data directory not found: {DATA_DIR}")
        print("  Creating directory...")
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        print(f"  ✓ Created {DATA_DIR}")
        print("\n📥 Please download the following datasets:")
        print("  1. Expedia Flight Prices → place as 'data/flightprices.csv'")
        print("  2. Global Airports → place as 'data/GlobalAirportDatabase.csv'")
        print("\nThen run this script again.")
        return
    
    # Connect to database
    conn = connect_db()
    
    try:
        # Step 1: Load airports
        if not load_airports_data(conn):
            print("\n⚠ Skipping airports - CSV not found")
        
        # Step 2: Load flights
        if not load_flights_data(conn):
            print("\n⚠ Skipping flights - CSV not found")
        else:
            # Step 3: Generate summaries
            generate_route_summaries(conn)
        
        print("\n" + "=" * 60)
        print("✅ ETL Process Complete!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ ETL process failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    main()

