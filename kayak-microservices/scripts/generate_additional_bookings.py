#!/usr/bin/env python3
"""
Generate additional bookings for top 30 owners' properties
Focus on owner00010@test.com for testing
"""

import mysql.connector
from datetime import datetime, timedelta
import random
import uuid

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 3307,
    'user': 'root',
    'password': 'Somalwar1!',
    'autocommit': False
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
        ORDER BY RAND()
        LIMIT 300
    """)
    return cursor.fetchall()

def get_top_30_owner_hotels(conn):
    """Get hotels owned by top 30 owners"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT h.id, h.name, h.city, h.state, h.price_per_night, u.email as owner_email
        FROM kayak_listings.hotels h
        INNER JOIN kayak_users.users u ON h.owner_id = u.id
        WHERE u.email IN (
            'owner00001@test.com', 'owner00002@test.com', 'owner00003@test.com',
            'owner00004@test.com', 'owner00005@test.com', 'owner00006@test.com',
            'owner00007@test.com', 'owner00008@test.com', 'owner00009@test.com',
            'owner00010@test.com', 'owner00011@test.com', 'owner00012@test.com',
            'owner00013@test.com', 'owner00014@test.com', 'owner00015@test.com',
            'owner00016@test.com', 'owner00017@test.com', 'owner00018@test.com',
            'owner00019@test.com', 'owner00020@test.com', 'owner00021@test.com',
            'owner00022@test.com', 'owner00023@test.com', 'owner00024@test.com',
            'owner00025@test.com', 'owner00026@test.com', 'owner00027@test.com',
            'owner00028@test.com', 'owner00029@test.com', 'owner00030@test.com'
        )
        ORDER BY RAND()
        LIMIT 100
    """)
    return cursor.fetchall()

def get_owner10_hotels(conn):
    """Get hotels specifically owned by owner00010@test.com"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT h.id, h.name, h.city, h.state, h.price_per_night
        FROM kayak_listings.hotels h
        INNER JOIN kayak_users.users u ON h.owner_id = u.id
        WHERE u.email = 'owner00010@test.com'
        ORDER BY RAND()
        LIMIT 50
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
    return booking_data[0]

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
    print("ADDITIONAL BOOKINGS FOR TOP 30 OWNERS")
    print("=" * 60)
    print()
    
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        conn.start_transaction()
        
        print("📥 Loading data...")
        travellers = get_travellers(conn)
        all_hotels = get_top_30_owner_hotels(conn)
        owner10_hotels = get_owner10_hotels(conn)
        
        print(f"   ✅ {len(travellers)} travellers loaded")
        print(f"   ✅ {len(all_hotels)} hotels from top 30 owners")
        print(f"   ✅ {len(owner10_hotels)} hotels from owner00010@test.com")
        print()
        
        payment_methods = ['credit_card', 'debit_card', 'paypal']
        total_bookings = 0
        owner10_bookings = 0
        
        # Generate bookings for owner00010@test.com properties (50% of new bookings)
        print("🏨 Generating bookings for owner00010@test.com properties...")
        
        # Historical 2025 bookings for owner10
        for quarter in [1, 2, 3]:
            for _ in range(10):  # 10 per quarter = 30 total
                traveller_id, _ = random.choice(travellers)
                hotel_id, hotel_name, city, state, price_per_night = random.choice(owner10_hotels)
                
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
                    f'{{"listing_id": "{hotel_id}", "listing_type": "hotel", "owner": "owner00010@test.com"}}'
                )
                insert_billing(cursor, billing_data)
                
                total_bookings += 1
                owner10_bookings += 1
        
        # Current bookings for owner10 (December 2025)
        for _ in range(10):
            traveller_id, _ = random.choice(travellers)
            hotel_id, hotel_name, city, state, price_per_night = random.choice(owner10_hotels)
            
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
                f'{{"listing_id": "{hotel_id}", "listing_type": "hotel", "owner": "owner00010@test.com"}}'
            )
            insert_billing(cursor, billing_data)
            
            total_bookings += 1
            owner10_bookings += 1
        
        # Future bookings for owner10 (2026)
        for _ in range(20):
            traveller_id, _ = random.choice(travellers)
            hotel_id, hotel_name, city, state, price_per_night = random.choice(owner10_hotels)
            
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
                f'{{"listing_id": "{hotel_id}", "listing_type": "hotel", "owner": "owner00010@test.com"}}'
            )
            insert_billing(cursor, billing_data)
            
            total_bookings += 1
            owner10_bookings += 1
        
        print(f"      ✅ {owner10_bookings} bookings for owner00010@test.com")
        print()
        
        # Generate bookings for other top 30 owners (50% of new bookings)
        print("🏨 Generating bookings for other top 30 owners...")
        
        # Historical 2025 bookings
        for quarter in [1, 2, 3]:
            for _ in range(20):  # 20 per quarter = 60 total
                traveller_id, _ = random.choice(travellers)
                hotel_id, hotel_name, city, state, price_per_night, owner_email = random.choice(all_hotels)
                
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
                    f'{{"listing_id": "{hotel_id}", "listing_type": "hotel", "owner": "{owner_email}"}}'
                )
                insert_billing(cursor, billing_data)
                
                total_bookings += 1
        
        # Current bookings (December 2025)
        for _ in range(15):
            traveller_id, _ = random.choice(travellers)
            hotel_id, hotel_name, city, state, price_per_night, owner_email = random.choice(all_hotels)
            
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
                f'{{"listing_id": "{hotel_id}", "listing_type": "hotel", "owner": "{owner_email}"}}'
            )
            insert_billing(cursor, billing_data)
            
            total_bookings += 1
        
        # Future bookings (2026)
        for _ in range(30):
            traveller_id, _ = random.choice(travellers)
            hotel_id, hotel_name, city, state, price_per_night, owner_email = random.choice(all_hotels)
            
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
                f'{{"listing_id": "{hotel_id}", "listing_type": "hotel", "owner": "{owner_email}"}}'
            )
            insert_billing(cursor, billing_data)
            
            total_bookings += 1
        
        print(f"      ✅ {total_bookings - owner10_bookings} bookings for other owners")
        print()
        
        # Summary
        print("=" * 60)
        print("📊 SUMMARY")
        print("=" * 60)
        print(f"   Total New Bookings: {total_bookings}")
        print(f"   owner00010@test.com: {owner10_bookings}")
        print(f"   Other Top 30 Owners: {total_bookings - owner10_bookings}")
        print()
        
        # Verification
        print("🔍 Verification:")
        cursor.execute("""
            SELECT listing_type, status, COUNT(*) as count
            FROM kayak_bookings.bookings
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
            GROUP BY listing_type, status
            ORDER BY listing_type, status
        """)
        
        print("   New Bookings by Status:")
        for row in cursor.fetchall():
            print(f"      {row[0]:8} | {row[1]:10} | {row[2]:3}")
        
        print()
        print("⚠️  TRANSACTION IS OPEN - Review results above")
        print()
        
        response = input("Do you want to COMMIT these changes? (yes/no): ").strip().lower()
        
        if response == 'yes':
            conn.commit()
            print("✅ COMMITTED - Additional bookings created successfully!")
            return True
        else:
            conn.rollback()
            print("🔄 ROLLED BACK - No changes made")
            return False
    
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
    success = main()
    exit(0 if success else 1)

