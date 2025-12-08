from models.database import get_session, Deal

session = get_session()
all_hotels = session.query(Deal).filter(Deal.type == 'hotel').all()

print(f"Total hotels: {len(all_hotels)}")

# Check New York hotels
ny_hotels = [h for h in all_hotels if 'New York' in h.get_metadata().get('city', '')]
print(f"NY hotels (contains 'New York'): {len(ny_hotels)}")

# Check with uppercase
ny_hotels_upper = [h for h in all_hotels if 'NEW YORK' in h.get_metadata().get('city', '').upper()]
print(f"NY hotels (uppercase): {len(ny_hotels_upper)}")

# Show sample
if ny_hotels_upper:
    print("\nSample NY hotels:")
    for h in ny_hotels_upper[:5]:
        meta = h.get_metadata()
        print(f"  {h.title}")
        print(f"    City: [{meta.get('city')}]")
        print(f"    City (upper): [{meta.get('city', '').upper()}]")

session.close()
