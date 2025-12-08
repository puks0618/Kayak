#!/usr/bin/env python3
"""
Redistribute properties to top 30 owners for better dashboard KPIs
- Hotels: Redistribute 4,997 hotels to owner00001-00030
- Cars: Redistribute 106 cars to owner00001-00030
- Focus on owner00010@test.com for testing
"""

import mysql.connector
import random

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

def get_top_30_owners(conn):
    """Get IDs of owner00001 to owner00030"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, email 
        FROM kayak_users.users 
        WHERE role = 'owner' 
          AND email IN (
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
        ORDER BY email
    """)
    return cursor.fetchall()

def redistribute_hotels(conn, owners):
    """Redistribute hotels to top 30 owners with weighted distribution"""
    cursor = conn.cursor()
    
    print("🏨 Redistributing Hotels...")
    
    # Get all hotel IDs
    cursor.execute("SELECT id FROM kayak_listings.hotels ORDER BY id")
    hotel_ids = [row[0] for row in cursor.fetchall()]
    total_hotels = len(hotel_ids)
    
    print(f"   📊 Total hotels to redistribute: {total_hotels}")
    
    # Create weighted distribution
    # Top 5 owners get more hotels, next 10 get medium, last 15 get fewer
    weights = []
    for i in range(30):
        if i < 5:  # Top 5: owner00001-00005
            weights.append(250)  # ~250 hotels each
        elif i < 15:  # Next 10: owner00006-00015
            weights.append(200)  # ~200 hotels each
        else:  # Last 15: owner00016-00030
            weights.append(116)  # ~116 hotels each
    
    # Assign hotels
    hotel_assignments = {}
    hotel_idx = 0
    
    for owner_idx, (owner_id, owner_email) in enumerate(owners):
        num_hotels = weights[owner_idx]
        
        # Give owner00010@test.com extra hotels for testing
        if owner_email == 'owner00010@test.com':
            num_hotels = 250  # Extra hotels for testing
        
        # Don't exceed available hotels
        if hotel_idx + num_hotels > total_hotels:
            num_hotels = total_hotels - hotel_idx
        
        # Assign hotels to this owner
        assigned_hotels = hotel_ids[hotel_idx:hotel_idx + num_hotels]
        hotel_assignments[owner_email] = {
            'owner_id': owner_id,
            'hotels': assigned_hotels,
            'count': len(assigned_hotels)
        }
        
        hotel_idx += num_hotels
        
        if hotel_idx >= total_hotels:
            break
    
    # Update database
    print("   💾 Updating hotel ownership...")
    total_updated = 0
    
    for owner_email, data in hotel_assignments.items():
        if data['count'] > 0:
            # Update in batches of 500
            for i in range(0, len(data['hotels']), 500):
                batch = data['hotels'][i:i+500]
                placeholders = ','.join(['%s'] * len(batch))
                query = f"""
                    UPDATE kayak_listings.hotels 
                    SET owner_id = %s 
                    WHERE id IN ({placeholders})
                """
                cursor.execute(query, [data['owner_id']] + batch)
                total_updated += cursor.rowcount
    
    print(f"   ✅ Updated {total_updated} hotels")
    
    # Show distribution
    print("\n   📋 Top 10 Owners by Hotel Count:")
    sorted_owners = sorted(hotel_assignments.items(), key=lambda x: x[1]['count'], reverse=True)
    for i, (email, data) in enumerate(sorted_owners[:10], 1):
        print(f"      {i:2}. {email:30} → {data['count']:4} hotels")
    
    return hotel_assignments

def redistribute_cars(conn, owners):
    """Redistribute cars to top 30 owners"""
    cursor = conn.cursor()
    
    print("\n🚗 Redistributing Cars...")
    
    # Get all car IDs
    cursor.execute("SELECT id FROM kayak_listings.cars ORDER BY id")
    car_ids = [row[0] for row in cursor.fetchall()]
    total_cars = len(car_ids)
    
    print(f"   📊 Total cars to redistribute: {total_cars}")
    
    # Shuffle for random distribution
    random.shuffle(car_ids)
    
    # Create weighted distribution for cars
    weights = []
    for i in range(30):
        if i < 10:  # Top 10: owner00001-00010
            weights.append(5)  # 5-6 cars each
        elif i < 20:  # Next 10: owner00011-00020
            weights.append(3)  # 3-4 cars each
        else:  # Last 10: owner00021-00030
            weights.append(1)  # 1-2 cars each
    
    # Assign cars
    car_assignments = {}
    car_idx = 0
    
    for owner_idx, (owner_id, owner_email) in enumerate(owners):
        num_cars = weights[owner_idx]
        
        # Give owner00010@test.com extra cars
        if owner_email == 'owner00010@test.com':
            num_cars = 6  # Extra cars for testing
        
        # Don't exceed available cars
        if car_idx + num_cars > total_cars:
            num_cars = total_cars - car_idx
        
        if num_cars > 0:
            assigned_cars = car_ids[car_idx:car_idx + num_cars]
            car_assignments[owner_email] = {
                'owner_id': owner_id,
                'cars': assigned_cars,
                'count': len(assigned_cars)
            }
            car_idx += num_cars
        
        if car_idx >= total_cars:
            break
    
    # Update database
    print("   💾 Updating car ownership...")
    total_updated = 0
    
    for owner_email, data in car_assignments.items():
        if data['count'] > 0:
            placeholders = ','.join(['%s'] * len(data['cars']))
            query = f"""
                UPDATE kayak_listings.cars 
                SET owner_id = %s 
                WHERE id IN ({placeholders})
            """
            cursor.execute(query, [data['owner_id']] + data['cars'])
            total_updated += cursor.rowcount
    
    print(f"   ✅ Updated {total_updated} cars")
    
    # Show distribution
    print("\n   📋 Top 10 Owners by Car Count:")
    sorted_owners = sorted(car_assignments.items(), key=lambda x: x[1]['count'], reverse=True)
    for i, (email, data) in enumerate(sorted_owners[:10], 1):
        print(f"      {i:2}. {email:30} → {data['count']:2} cars")
    
    return car_assignments

def main():
    print("=" * 60)
    print("OWNER REDISTRIBUTION - TOP 30 OWNERS")
    print("=" * 60)
    print()
    
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        print("🔄 Starting transaction...")
        conn.start_transaction()
        
        # Get top 30 owners
        print("📥 Loading top 30 owners (owner00001-00030)...")
        owners = get_top_30_owners(conn)
        print(f"   ✅ {len(owners)} owners loaded")
        
        if len(owners) != 30:
            print(f"   ⚠️  Warning: Expected 30 owners, got {len(owners)}")
        
        print()
        
        # Redistribute hotels
        hotel_assignments = redistribute_hotels(conn, owners)
        
        # Redistribute cars
        car_assignments = redistribute_cars(conn, owners)
        
        # Check owner00010@test.com
        print("\n" + "=" * 60)
        print("🎯 SPECIAL FOCUS: owner00010@test.com")
        print("=" * 60)
        
        if 'owner00010@test.com' in hotel_assignments:
            print(f"   Hotels: {hotel_assignments['owner00010@test.com']['count']}")
        if 'owner00010@test.com' in car_assignments:
            print(f"   Cars:   {car_assignments['owner00010@test.com']['count']}")
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 SUMMARY")
        print("=" * 60)
        
        cursor.execute("""
            SELECT 
                'Hotels' as type,
                COUNT(DISTINCT owner_id) as num_owners,
                COUNT(*) as total_properties
            FROM kayak_listings.hotels
            WHERE owner_id IN (
                SELECT id FROM kayak_users.users 
                WHERE email LIKE 'owner0000%@test.com' OR email LIKE 'owner0001%@test.com'
                OR email LIKE 'owner0002%@test.com' OR email LIKE 'owner0003%@test.com'
            )
            UNION ALL
            SELECT 
                'Cars' as type,
                COUNT(DISTINCT owner_id) as num_owners,
                COUNT(*) as total_properties
            FROM kayak_listings.cars
            WHERE owner_id IN (
                SELECT id FROM kayak_users.users 
                WHERE email LIKE 'owner0000%@test.com' OR email LIKE 'owner0001%@test.com'
                OR email LIKE 'owner0002%@test.com' OR email LIKE 'owner0003%@test.com'
            )
        """)
        
        for row in cursor.fetchall():
            print(f"   {row[0]:10} → {row[1]} owners, {row[2]} properties")
        
        print()
        print("⚠️  TRANSACTION IS OPEN - Review results above")
        print()
        
        # Ask for confirmation
        response = input("Do you want to COMMIT these changes? (yes/no): ").strip().lower()
        
        if response == 'yes':
            conn.commit()
            print("✅ COMMITTED - Owner redistribution successful!")
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

