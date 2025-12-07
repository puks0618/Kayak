"""
Manually initialize the database and check ingestion
"""
import sys
sys.path.insert(0, '.')

from models.database import init_db, get_session, Deal

# Initialize database
print("🔧 Initializing database...")
init_db()
print("✅ Database initialized")

# Check tables
session = get_session()
try:
    deals = session.query(Deal).all()
    print(f"\n📊 Total deals in database: {len(deals)}")
    
    flights = [d for d in deals if d.type == 'flight']
    hotels = [d for d in deals if d.type == 'hotel']
    
    print(f"   Flights: {len(flights)}")
    print(f"   Hotels: {len(hotels)}")
    
    if deals:
        print("\n📋 Sample deals:")
        for deal in deals[:5]:
            print(f"   {deal.type}: {deal.title} - ${deal.price} (score: {deal.score})")
    else:
        print("\n⚠️  No deals found in database!")
        print("   The feed ingestion worker needs to run to pull data from MySQL")
        
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    session.close()
