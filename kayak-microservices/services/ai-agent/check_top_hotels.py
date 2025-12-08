from models.database import get_session, Deal

session = get_session()

# Get top 18 hotels by score (same as API logic)
top_hotels = session.query(Deal).filter(Deal.active == True, Deal.type == 'hotel').order_by(Deal.score.desc()).limit(18).all()

print(f"Top 18 hotels by score:")
for i, h in enumerate(top_hotels, 1):
    meta = h.get_metadata()
    city = meta.get('city', 'NO CITY')
    print(f"{i}. {h.title[:50]:<50} City: {city:<15} Score: {h.score}")

# Check if any are from New York
ny_count = len([h for h in top_hotels if 'NEW YORK' in h.get_metadata().get('city', '').upper()])
print(f"\nNew York hotels in top 18: {ny_count}")

session.close()
