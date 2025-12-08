#!/usr/bin/env python3
"""
Generate realistic booking data for Kayak analytics dashboard
Handles hotels and flights with proper date logic and billing
"""

import mysql.connector
from datetime import datetime, timedelta
import random
import uuid
from decimal import Decimal

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 3307,
    'user': 'root',
    'password': 'Somalwar1!',
    'autocommit': False  # We'll use transactions
}

def connect_db(database=None):
    """Create database connection"""
    config = DB_CONFIG.copy()
    if database:
        config['database'] = database
    return mysql.connector.connect(**config)

def get_travellers(conn):
    """Get list of traveller IDs"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, email 
        FROM kayak_users.users 
        WHERE role = 'traveller' AND email LIKE 'traveller%@test.com'
        ORDER BY email
        LIMIT 500
    """)
    return cursor.fetchall()

def get_hotels(conn):
    """Get list of hotels with owners"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name, city, state, price_per_night 
        FROM kayak_listings.hotels 
        WHERE owner_id IS NOT NULL 
          AND approval_status = 'approved'
        ORDER BY RAND()
        LIMIT 50
    """)
    return cursor.fetchall()

def get_flights(conn):
    """Get list of flights"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, flight_code, airline, price 
        FROM kayak_listings.flights 
        ORDER BY RAND()
        LIMIT 30
    """)
    return cursor.fetchall()

def generate_booking_date(year, quarter):
    """Generate a random booking date in a specific quarter"""
    quarter_start = {
        1: (1, 1),
        2: (4, 1),
        3: (7, 1),
        4: (10, 1)
    }
    month, day = quarter_start[quarter]
    start_date = datetime(year, month, day)
    
    # Add random days within the quarter (90 days)
    random_days = random.randint(0, 89)
    return start_date + timedelta(days=random_days)

def generate_travel_date(booking_date, days_ahead_min=14, days_ahead_max=60):
    """Generate travel date ahead of booking date"""
    days_ahead = random.randint(days_ahead_min, days_ahead_max)
    return booking_date + timedelta(days=days_ahead)

def insert_booking(cursor, booking_data):
    """Insert a booking record"""
    query = """
    INSERT INTO kayak_bookings.bookings 
    (id, user_id, listing_id, listing_type, status, booking_date, travel_date, return_date, rental_days, total_amount)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(query, booking_data)
    return booking_data[0]  # Return booking_id

def insert_billing(cursor, billing_data):
    """Insert a billing record"""
    query = """
    INSERT INTO kayak_bookings.billing
    (id, booking_id, user_id, amount, tax, total, payment_method, status, invoice_details)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(query, billing_data)

def main():
    print("=" * 60)
    print("KAYAK BOOKING DATA GENERATION")
    print("=" * 60)
    print()
    
    # Connect to database
    print("🔗 Connecting to database...")
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        # Start transaction
        print("🔄 Starting transaction...")
        conn.start_transaction()
        
        # Get data
        print("📥 Loading travellers, hotels, and flights...")
        travellers = get_travellers(conn)
        hotels = get_hotels(conn)
        flights = get_flights(conn)
        
        print(f"   ✅ {len(travellers)} travellers loaded")
        print(f"   ✅ {len(hotels)} hotels loaded")
        print(f"   ✅ {len(flights)} flights loaded")
        print()
        
        # Generate hotel bookings
        print("🏨 Generating Hotel Bookings...")
        hotel_count = 0
        payment_methods = ['credit_card', 'debit_card', 'paypal']
        
        # Historical bookings (2024 - completed)
        print("   📅 2024 Historical bookings...")
        for quarter in [1, 2, 3, 4]:
            for _ in range(25):  # 25 per quarter = 100 total
                traveller_id, _ = random.choice(travellers)
                hotel_id, hotel_name, city, state, price_per_night = random.choice(hotels)
                
                booking_date = generate_booking_date(2024, quarter)
                travel_date = generate_travel_date(booking_date)
                rental_days = random.randint(3, 7)
                return_date = travel_date + timedelta(days=rental_days)
                total_amount = float(price_per_night) * rental_days
                
                booking_id = str(uuid.uuid4())
                
                # Insert booking
                booking_data = (
                    booking_id, traveller_id, hotel_id, 'hotel', 'completed',
                    booking_date, travel_date.date(), return_date.date(), rental_days, total_amount
                )
                insert_booking(cursor, booking_data)
                
                # Insert billing
                tax = round(total_amount * 0.10, 2)
                total = round(total_amount + tax, 2)
                billing_data = (
                    str(uuid.uuid4()), booking_id, traveller_id, total_amount, tax, total,
                    random.choice(payment_methods), 'paid',
                    f'{{"listing_id": "{hotel_id}", "listing_type": "hotel", "travel_date": "{travel_date.date()}"}}'
                )
                insert_billing(cursor, billing_data)
                
                hotel_count += 1
        
        print(f"      ✅ {hotel_count} historical hotel bookings")
        
        # 2025 Historical bookings (completed)
        print("   📅 2025 Historical bookings...")
        for quarter in [1, 2, 3]:
            for _ in range(33):  # 33 per quarter = 100 total
                traveller_id, _ = random.choice(travellers)
                hotel_id, hotel_name, city, state, price_per_night = random.choice(hotels)
                
                booking_date = generate_booking_date(2025, quarter)
                travel_date = generate_travel_date(booking_date)
                rental_days = random.randint(3, 7)
                return_date = travel_date + timedelta(days=rental_days)
                total_amount = float(price_per_night) * rental_days
                
                booking_id = str(uuid.uuid4())
                
                booking_data = (
                    booking_id, traveller_id, hotel_id, 'hotel', 'completed',
                    booking_date, travel_date.date(), return_date.date(), rental_days, total_amount
                )
                insert_booking(cursor, booking_data)
                
                tax = round(total_amount * 0.10, 2)
                total = round(total_amount + tax, 2)
                billing_data = (
                    str(uuid.uuid4()), booking_id, traveller_id, total_amount, tax, total,
                    random.choice(payment_methods), 'paid',
                    f'{{"listing_id": "{hotel_id}", "listing_type": "hotel", "travel_date": "{travel_date.date()}"}}'
                )
                insert_billing(cursor, billing_data)
                
                hotel_count += 1
        
        print(f"      ✅ {hotel_count} total historical hotel bookings")
        
        # Current bookings (December 2025 - confirmed)
        print("   📅 Current bookings (Dec 2025)...")
        for _ in range(15):
            traveller_id, _ = random.choice(travellers)
            hotel_id, hotel_name, city, state, price_per_night = random.choice(hotels)
            
            booking_date = datetime.now() - timedelta(days=random.randint(5, 20))
            travel_date = datetime.now() + timedelta(days=random.randint(-2, 7))
            rental_days = random.randint(3, 7)
            return_date = travel_date + timedelta(days=rental_days)
            total_amount = float(price_per_night) * rental_days
            
            booking_id = str(uuid.uuid4())
            
            booking_data = (
                booking_id, traveller_id, hotel_id, 'hotel', 'confirmed',
                booking_date, travel_date.date(), return_date.date(), rental_days, total_amount
            )
            insert_booking(cursor, booking_data)
            
            tax = round(total_amount * 0.10, 2)
            total = round(total_amount + tax, 2)
            billing_data = (
                str(uuid.uuid4()), booking_id, traveller_id, total_amount, tax, total,
                random.choice(payment_methods), 'paid',
                f'{{"listing_id": "{hotel_id}", "listing_type": "hotel", "travel_date": "{travel_date.date()}"}}'
            )
            insert_billing(cursor, billing_data)
            
            hotel_count += 1
        
        print(f"      ✅ {hotel_count} total with current bookings")
        
        # Future bookings (2026 - confirmed/pending)
        print("   📅 Future bookings (2026)...")
        for _ in range(30):
            traveller_id, _ = random.choice(travellers)
            hotel_id, hotel_name, city, state, price_per_night = random.choice(hotels)
            
            booking_date = datetime.now()
            travel_date = datetime(2026, 1, 1) + timedelta(days=random.randint(0, 180))
            rental_days = random.randint(3, 7)
            return_date = travel_date + timedelta(days=rental_days)
            total_amount = float(price_per_night) * rental_days
            
            status = 'confirmed' if random.random() > 0.3 else 'pending'
            billing_status = 'paid' if status == 'confirmed' else 'pending'
            
            booking_id = str(uuid.uuid4())
            
            booking_data = (
                booking_id, traveller_id, hotel_id, 'hotel', status,
                booking_date, travel_date.date(), return_date.date(), rental_days, total_amount
            )
            insert_booking(cursor, booking_data)
            
            tax = round(total_amount * 0.10, 2)
            total = round(total_amount + tax, 2)
            billing_data = (
                str(uuid.uuid4()), booking_id, traveller_id, total_amount, tax, total,
                random.choice(payment_methods), billing_status,
                f'{{"listing_id": "{hotel_id}", "listing_type": "hotel", "travel_date": "{travel_date.date()}"}}'
            )
            insert_billing(cursor, billing_data)
            
            hotel_count += 1
        
        print(f"      ✅ {hotel_count} TOTAL HOTEL BOOKINGS")
        print()
        
        # Generate flight bookings
        print("✈️  Generating Flight Bookings...")
        flight_count = 0
        
        # Historical flight bookings (2024)
        print("   📅 2024 Historical flight bookings...")
        for quarter in [1, 2, 3, 4]:
            for _ in range(19):  # 19 per quarter = 76 total
                traveller_id, _ = random.choice(travellers)
                flight_id, flight_code, airline, price = random.choice(flights)
                
                booking_date = generate_booking_date(2024, quarter)
                travel_date = generate_travel_date(booking_date)
                total_amount = float(price)
                
                booking_id = str(uuid.uuid4())
                
                booking_data = (
                    booking_id, traveller_id, flight_id, 'flight', 'completed',
                    booking_date, travel_date.date(), None, None, total_amount
                )
                insert_booking(cursor, booking_data)
                
                tax = round(total_amount * 0.10, 2)
                total = round(total_amount + tax, 2)
                billing_data = (
                    str(uuid.uuid4()), booking_id, traveller_id, total_amount, tax, total,
                    random.choice(payment_methods), 'paid',
                    f'{{"listing_id": "{flight_id}", "listing_type": "flight", "travel_date": "{travel_date.date()}"}}'
                )
                insert_billing(cursor, billing_data)
                
                flight_count += 1
        
        print(f"      ✅ {flight_count} historical flight bookings")
        
        # 2025 Historical flight bookings
        print("   📅 2025 Historical flight bookings...")
        for quarter in [1, 2, 3]:
            for _ in range(25):  # 25 per quarter = 75 total
                traveller_id, _ = random.choice(travellers)
                flight_id, flight_code, airline, price = random.choice(flights)
                
                booking_date = generate_booking_date(2025, quarter)
                travel_date = generate_travel_date(booking_date)
                total_amount = float(price)
                
                booking_id = str(uuid.uuid4())
                
                booking_data = (
                    booking_id, traveller_id, flight_id, 'flight', 'completed',
                    booking_date, travel_date.date(), None, None, total_amount
                )
                insert_booking(cursor, booking_data)
                
                tax = round(total_amount * 0.10, 2)
                total = round(total_amount + tax, 2)
                billing_data = (
                    str(uuid.uuid4()), booking_id, traveller_id, total_amount, tax, total,
                    random.choice(payment_methods), 'paid',
                    f'{{"listing_id": "{flight_id}", "listing_type": "flight", "travel_date": "{travel_date.date()}"}}'
                )
                insert_billing(cursor, billing_data)
                
                flight_count += 1
        
        print(f"      ✅ {flight_count} total historical flight bookings")
        
        # Current flight bookings (December 2025)
        print("   📅 Current flight bookings (Dec 2025)...")
        for _ in range(9):
            traveller_id, _ = random.choice(travellers)
            flight_id, flight_code, airline, price = random.choice(flights)
            
            booking_date = datetime.now() - timedelta(days=random.randint(5, 20))
            travel_date = datetime.now() + timedelta(days=random.randint(0, 10))
            total_amount = float(price)
            
            booking_id = str(uuid.uuid4())
            
            booking_data = (
                booking_id, traveller_id, flight_id, 'flight', 'confirmed',
                booking_date, travel_date.date(), None, None, total_amount
            )
            insert_booking(cursor, booking_data)
            
            tax = round(total_amount * 0.10, 2)
            total = round(total_amount + tax, 2)
            billing_data = (
                str(uuid.uuid4()), booking_id, traveller_id, total_amount, tax, total,
                random.choice(payment_methods), 'paid',
                f'{{"listing_id": "{flight_id}", "listing_type": "flight", "travel_date": "{travel_date.date()}"}}'
            )
            insert_billing(cursor, billing_data)
            
            flight_count += 1
        
        print(f"      ✅ {flight_count} total with current bookings")
        
        # Future flight bookings (2026)
        print("   📅 Future flight bookings (2026)...")
        for _ in range(20):
            traveller_id, _ = random.choice(travellers)
            flight_id, flight_code, airline, price = random.choice(flights)
            
            booking_date = datetime.now()
            travel_date = datetime(2026, 1, 1) + timedelta(days=random.randint(0, 180))
            total_amount = float(price)
            
            status = 'confirmed' if random.random() > 0.3 else 'pending'
            billing_status = 'paid' if status == 'confirmed' else 'pending'
            
            booking_id = str(uuid.uuid4())
            
            booking_data = (
                booking_id, traveller_id, flight_id, 'flight', status,
                booking_date, travel_date.date(), None, None, total_amount
            )
            insert_booking(cursor, booking_data)
            
            tax = round(total_amount * 0.10, 2)
            total = round(total_amount + tax, 2)
            billing_data = (
                str(uuid.uuid4()), booking_id, traveller_id, total_amount, tax, total,
                random.choice(payment_methods), billing_status,
                f'{{"listing_id": "{flight_id}", "listing_type": "flight", "travel_date": "{travel_date.date()}"}}'
            )
            insert_billing(cursor, billing_data)
            
            flight_count += 1
        
        print(f"      ✅ {flight_count} TOTAL FLIGHT BOOKINGS")
        print()
        
        # Summary
        print("=" * 60)
        print("📊 SUMMARY")
        print("=" * 60)
        print(f"   Total Hotel Bookings: {hotel_count}")
        print(f"   Total Flight Bookings: {flight_count}")
        print(f"   GRAND TOTAL: {hotel_count + flight_count}")
        print()
        
        # Verification queries
        print("🔍 Verification:")
        cursor.execute("""
            SELECT listing_type, status, COUNT(*) as count, SUM(total_amount) as revenue
            FROM kayak_bookings.bookings
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
            GROUP BY listing_type, status
            ORDER BY listing_type, status
        """)
        
        print("   By Type and Status:")
        for row in cursor.fetchall():
            print(f"      {row[0]:8} | {row[1]:10} | Count: {row[2]:3} | Revenue: ${row[3]:,.2f}")
        
        print()
        print("⚠️  TRANSACTION IS OPEN - Review results above")
        print()
        
        # Ask for confirmation
        response = input("Do you want to COMMIT these changes? (yes/no): ").strip().lower()
        
        if response == 'yes':
            conn.commit()
            print("✅ COMMITTED - All bookings saved successfully!")
        else:
            conn.rollback()
            print("🔄 ROLLED BACK - No changes made")
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        print("🔄 Rolling back transaction...")
        conn.rollback()
        raise
    
    finally:
        cursor.close()
        conn.close()
        print("🔌 Database connection closed")

if __name__ == '__main__':
    main()

