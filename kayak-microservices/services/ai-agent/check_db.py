import sqlite3
import os

# Check if database exists
db_path = 'kayak_ai.db'
if not os.path.exists(db_path):
    print(f"❌ Database {db_path} does not exist!")
    exit(1)

# Connect and check tables
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print(f"\n📊 Tables in {db_path}:")
for table in tables:
    print(f"  - {table[0]}")

# Check if deals table exists
if ('deals',) in tables:
    cursor.execute("SELECT COUNT(*) FROM deals")
    total = cursor.fetchone()[0]
    print(f"\n✅ Deals table exists with {total} records")
    
    if total > 0:
        cursor.execute("SELECT COUNT(*) FROM deals WHERE type='flight'")
        flights = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM deals WHERE type='hotel'")
        hotels = cursor.fetchone()[0]
        print(f"   Flights: {flights}")
        print(f"   Hotels: {hotels}")
        
        # Show sample data
        cursor.execute("SELECT deal_id, type, title, price, score FROM deals LIMIT 5")
        rows = cursor.fetchall()
        print("\n📋 Sample deals:")
        for row in rows:
            print(f"   {row[1]}: {row[2]} - ${row[3]} (score: {row[4]})")
else:
    print("\n❌ Deals table does not exist!")

conn.close()
