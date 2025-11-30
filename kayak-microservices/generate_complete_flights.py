#!/usr/bin/env python3
import mysql.connector
from datetime import datetime, timedelta
import random
import uuid

# Connect to database
conn = mysql.connector.connect(
    host='localhost',
    port=3307,
    user='root',
    password='Somalwar1!',
    database='kayak_listings'
)
cursor = conn.cursor()

print("🔄 Clearing existing flights...")
cursor.execute("TRUNCATE TABLE flights")
conn.commit()

# Major US airports
airports = ["ATL", "BOS", "CLT", "DEN", "DFW", "DTW", "EWR", "IAD", "JFK", "LAX", "LGA", "MIA", "OAK", "ORD", "PHL", "SFO"]

# Airlines with variety
airlines = ["American Airlines", "Delta", "United", "Southwest", "Frontier", "JetBlue", "Spirit", "Alaska Airlines"]

# Cabin classes
cabin_classes = ["economy", "premium economy", "business", "first"]

# Flight times (morning, afternoon, evening, night)
flight_times = [
    (6, 0), (7, 30), (9, 0), (10, 30),  # Morning
    (12, 0), (13, 30), (15, 0), (16, 30),  # Afternoon
    (18, 0), (19, 30), (21, 0),  # Evening
]

print("🛫 Generating comprehensive flight data for 90 days...")
print(f"   - Airports: {len(airports)}")
print(f"   - Airlines: {len(airlines)}")
print(f"   - Cabin classes: {len(cabin_classes)}")
print(f"   - Daily time slots: {len(flight_times)}")

start_date = datetime(2025, 12, 1)
batch = []
batch_size = 1000
total_inserted = 0
day_count = 0

# Generate for 90 days (Dec 2025, Jan 2026, Feb 2026)
for day_offset in range(90):
    current_date = start_date + timedelta(days=day_offset)
    day_count += 1
    
    # For each route combination
    for origin in airports:
        for destination in airports:
            if origin == destination:
                continue
            
            # For each cabin class
            for cabin_class in cabin_classes:
                # Generate multiple flights per day for this route/cabin combo
                num_flights = random.randint(3, 6)  # 3-6 flights per route per day
                
                for _ in range(num_flights):
                    # Random time slot
                    dep_hour, dep_min = random.choice(flight_times)
                    
                    # Calculate flight duration (90 min to 6 hours)
                    duration_minutes = random.randint(90, 360)
                    
                    # Departure datetime
                    dep_datetime = current_date.replace(hour=dep_hour, minute=dep_min, second=0)
                    arr_datetime = dep_datetime + timedelta(minutes=duration_minutes)
                    
                    # Random airline
                    airline = random.choice(airlines)
                    
                    # Flight code
                    airline_code = airline[:2].upper()
                    flight_code = f"{airline_code}{random.randint(100, 999)}"
                    
                    # Stops (0, 1, or 2)
                    stops = random.choices([0, 1, 2], weights=[60, 30, 10])[0]
                    
                    # Pricing based on cabin class
                    base_prices = {
                        "economy": (80, 500),
                        "premium economy": (200, 800),
                        "business": (500, 1500),
                        "first": (1000, 3000)
                    }
                    min_price, max_price = base_prices[cabin_class]
                    
                    # Add cost for stops
                    if stops == 0:
                        price = random.uniform(min_price * 1.2, max_price)  # Nonstop is more expensive
                    else:
                        price = random.uniform(min_price, max_price * 0.8)
                    
                    base_price = price / random.uniform(0.95, 1.05)
                    
                    # Seats
                    seats_total = random.randint(100, 200)
                    seats_left = random.randint(10, seats_total)
                    
                    # Deals
                    is_deal = 1 if random.random() > 0.85 else 0
                    discount = random.randint(10, 30) if is_deal else 0
                    
                    # Rating
                    rating = round(random.uniform(3.5, 5.0), 2)
                    
                    batch.append((
                        str(uuid.uuid4()), flight_code, airline,
                        origin, destination,
                        dep_datetime, arr_datetime,
                        duration_minutes, stops, round(price, 2), round(base_price, 2),
                        seats_total, seats_left, cabin_class,
                        is_deal, discount, rating
                    ))
                    
                    if len(batch) >= batch_size:
                        cursor.executemany("""
                            INSERT INTO flights (id, flight_code, airline, departure_airport, arrival_airport,
                                               departure_time, arrival_time, duration, stops, price, base_price,
                                               seats_total, seats_left, cabin_class, is_deal, discount_percent, rating)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, batch)
                        conn.commit()
                        total_inserted += len(batch)
                        batch = []
    
    if day_count % 10 == 0:
        print(f"   📅 Day {day_count}/90 ({current_date.strftime('%Y-%m-%d')}): {total_inserted:,} flights inserted")

# Insert remaining
if batch:
    cursor.executemany("""
        INSERT INTO flights (id, flight_code, airline, departure_airport, arrival_airport,
                           departure_time, arrival_time, duration, stops, price, base_price,
                           seats_total, seats_left, cabin_class, is_deal, discount_percent, rating)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, batch)
    conn.commit()
    total_inserted += len(batch)

print(f"\n✅ Total flights inserted: {total_inserted:,}")

# Verify
cursor.execute("SELECT COUNT(*) FROM flights")
total = cursor.fetchone()[0]

cursor.execute("SELECT DATE(MIN(departure_time)), DATE(MAX(departure_time)) FROM flights")
date_range = cursor.fetchone()

cursor.execute("SELECT COUNT(DISTINCT CONCAT(departure_airport, '-', arrival_airport)) FROM flights")
unique_routes = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(DISTINCT airline) FROM flights")
unique_airlines = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(DISTINCT cabin_class) FROM flights")
unique_classes = cursor.fetchone()[0]

# Test specific queries
cursor.execute("""
    SELECT COUNT(*) FROM flights 
    WHERE departure_airport = 'LAX' AND arrival_airport = 'SFO' 
    AND DATE(departure_time) = '2025-12-07'
    AND cabin_class = 'economy'
""")
lax_sfo_dec7_economy = cursor.fetchone()[0]

cursor.execute("""
    SELECT COUNT(*) FROM flights 
    WHERE departure_airport = 'LAX' AND arrival_airport = 'SFO' 
    AND DATE(departure_time) BETWEEN '2025-12-07' AND '2025-12-11'
""")
lax_sfo_roundtrip = cursor.fetchone()[0]

cursor.execute("SELECT stops, COUNT(*) FROM flights GROUP BY stops")
stops_distribution = cursor.fetchall()

print(f"\n📊 Database Statistics:")
print(f"   Total flights: {total:,}")
print(f"   Date range: {date_range[0]} to {date_range[1]}")
print(f"   Unique routes: {unique_routes}")
print(f"   Airlines: {unique_airlines}")
print(f"   Cabin classes: {unique_classes}")
print(f"\n🧪 Sample Queries:")
print(f"   LAX→SFO on Dec 7 (economy): {lax_sfo_dec7_economy} flights")
print(f"   LAX→SFO Dec 7-11 (all classes): {lax_sfo_roundtrip} flights")
print(f"\n✈️  Stops Distribution:")
for stops, count in stops_distribution:
    stop_label = "Nonstop" if stops == 0 else f"{stops} stop(s)"
    print(f"   {stop_label}: {count:,} flights")

cursor.close()
conn.close()

print("\n🎉 Flight data generation complete!")