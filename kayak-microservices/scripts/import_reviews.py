#!/usr/bin/env python3
import csv
from pymongo import MongoClient
from datetime import datetime

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['kayak']
reviews_collection = db['reviews']

# Clear existing reviews
print("Clearing existing reviews...")
reviews_collection.delete_many({})

# Read CSV and import reviews
print("Reading reviews CSV file...")
with open('/Users/spartan/Stays/kayak-microservices/scripts/stays-data/reviews_reduced.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    
    batch_size = 1000
    reviews_batch = []
    count = 0
    
    for row in reader:
        try:
            # Skip if missing critical fields
            if not row.get('listing_id') or not row.get('id'):
                continue
            
            # Parse listing_id as integer
            try:
                listing_id = int(str(row['listing_id']).strip())
            except:
                continue
            
            # Parse date
            try:
                date_str = row.get('date', '')
                if date_str:
                    review_date = datetime.strptime(date_str, '%Y-%m-%d')
                else:
                    review_date = datetime.now()
            except:
                review_date = datetime.now()
            
            # Create review document
            review_doc = {
                'review_id': int(row['id']),
                'listing_id': listing_id,
                'date': review_date,
                'reviewer_id': row.get('reviewer_id', ''),
                'reviewer_name': row.get('reviewer_name', 'Anonymous')[:100],
                'comments': row.get('comments', '')[:1000] if row.get('comments') else 'Great place to stay!'
            }
            
            reviews_batch.append(review_doc)
            count += 1
            
            # Insert in batches
            if len(reviews_batch) >= batch_size:
                reviews_collection.insert_many(reviews_batch)
                print(f"Imported {count} reviews...")
                reviews_batch = []
            
            # Limit to reasonable dataset size
            if count >= 10000:
                break
                
        except Exception as e:
            if count < 50 or count % 1000 == 0:
                print(f"Error processing review {count}: {e}")
            continue
    
    # Insert remaining batch
    if reviews_batch:
        reviews_collection.insert_many(reviews_batch)

print(f"\nTotal reviews imported: {count}")

# Show statistics
total = reviews_collection.count_documents({})
print(f"Total reviews in database: {total}")

# Count reviews per listing (top 10)
pipeline = [
    {"$group": {"_id": "$listing_id", "count": {"$sum": 1}}},
    {"$sort": {"count": -1}},
    {"$limit": 10}
]
top_listings = list(reviews_collection.aggregate(pipeline))
print("\nTop 10 listings by review count:")
for item in top_listings:
    print(f"  Listing {item['_id']}: {item['count']} reviews")

client.close()
print("\nReview import completed successfully!")
