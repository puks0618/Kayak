#!/usr/bin/env python3
import csv
import mysql.connector
import json
import re
import uuid
from decimal import Decimal

# Database connection
conn = mysql.connector.connect(
    host='localhost',
    port=3307,
    user='root',
    password='Somalwar1!',
    database='kayak_listings'
)
cursor = conn.cursor()

# Owner ID from existing user
OWNER_ID = '036e48a5-96a9-4086-b87f-c430d6f0d9ab'

def clean_price(price_str):
    """Convert price string like '$150.00' to decimal"""
    if not price_str or price_str == '' or price_str is None:
        return 150.00  # Default price
    try:
        # Remove all non-numeric characters except decimal point
        cleaned = re.sub(r'[^\d.]', '', str(price_str))
        if not cleaned:
            return 150.00
        price = float(cleaned)
        # Validate reasonable range
        if price < 10 or price > 10000:
            return 150.00
        return price
    except:
        return 150.00

def parse_amenities(amenities_str):
    """Parse amenities from string"""
    if not amenities_str:
        return []
    try:
        # Remove brackets and quotes, split by comma
        amenities = re.findall(r'"([^"]*)"', amenities_str)
        return amenities[:10]  # Limit to top 10 amenities
    except:
        return []

def get_star_rating(review_score):
    """Convert review score to star rating (1-5)"""
    if not review_score or review_score == '' or review_score is None:
        return 3
    try:
        # Handle non-numeric values
        score_str = str(review_score).strip()
        if not score_str or not any(c.isdigit() for c in score_str):
            return 3
        score = float(score_str)
        # Normalize to 0-5 range if needed
        if score > 5:
            score = score / 20.0  # Convert from 0-100 to 0-5
        # Convert to 1-5 stars
        if score >= 4.8:
            return 5
        elif score >= 4.5:
            return 4
        elif score >= 4.0:
            return 3
        elif score >= 3.5:
            return 2
        else:
            return 2
    except:
        return 3

def extract_location(neighbourhood, neighbourhood_cleansed, latitude, longitude):
    """Extract city and state from neighbourhood"""
    city = neighbourhood_cleansed if neighbourhood_cleansed else (neighbourhood if neighbourhood else 'Brooklyn')
    
    # Clean up city name and limit to 100 characters (database limit)
    city = str(city).replace(' ', ' ').strip()[:100]
    
    # Default to NY for NYC neighborhoods
    state = 'NY'
    
    # Generate zip code based on latitude/longitude ranges (NYC zip codes)
    try:
        lat = float(latitude) if latitude else 40.7128
        lon = float(longitude) if longitude else -74.0060
        
        # Manhattan: 10001-10282
        if lat > 40.70 and lat < 40.88 and lon > -74.02 and lon < -73.93:
            zip_code = '10001'
        # Brooklyn: 11201-11256
        elif lat > 40.57 and lat < 40.74 and lon > -74.05 and lon < -73.83:
            zip_code = '11201'
        # Queens: 11351-11697
        elif lat > 40.54 and lat < 40.80 and lon > -73.96 and lon < -73.70:
            zip_code = '11351'
        # Bronx: 10451-10475
        elif lat > 40.78 and lat < 40.92 and lon > -73.93 and lon < -73.75:
            zip_code = '10451'
        else:
            zip_code = '10001'
    except:
        zip_code = '10001'
    
    return city, state, zip_code

# Clear existing data
print("Clearing existing hotels...")
cursor.execute("DELETE FROM hotel_amenities")
cursor.execute("DELETE FROM hotels")
conn.commit()

# Read CSV and import data
print("Reading CSV file...")
import os
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, 'stays-data/listings_reduced.csv')
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    
    batch_size = 500
    hotels_batch = []
    amenities_batch = []
    count = 0
    
    for row in reader:
        try:
            # Skip if missing critical fields or row seems malformed
            if not row.get('name') or not row.get('id'):
                continue
            
            # Skip if id is not numeric (indicates malformed CSV row)
            try:
                listing_id = int(str(row['id']).strip())
            except:
                continue
            
            # Store the original listing_id for review linking
            original_listing_id = listing_id
            
            hotel_id = str(uuid.uuid4())
            name = str(row['name'])[:255] if row.get('name') else 'Unnamed Property'
            
            # Extract location with coordinates
            city, state, zip_code = extract_location(
                row.get('neighbourhood', ''),
                row.get('neighbourhood_cleansed', ''),
                row.get('latitude', ''),
                row.get('longitude', '')
            )
            
            # Get address - combine neighbourhood with city for better context
            neighbourhood = row.get('neighbourhood', '')
            if neighbourhood:
                address = f"{neighbourhood}, {city}, NY"[:255]
            else:
                address = f"{city}, NY"[:255]
            
            # Price
            price = clean_price(row.get('price', ''))
            
            # Ratings
            review_score = row.get('review_scores_rating', '')
            star_rating = get_star_rating(review_score)
            
            # Handle rating with validation
            try:
                if review_score and review_score != '' and review_score is not None:
                    rating_val = float(str(review_score).strip())
                    # Normalize rating to 0-5 scale
                    if rating_val > 5:
                        rating_val = rating_val / 20.0  # Convert from 0-100 to 0-5
                    # Ensure within valid range for DECIMAL(3,2)
                    rating = max(0.0, min(5.0, rating_val))
                else:
                    rating = 4.0
            except:
                rating = 4.0
            
            # Room details - handle invalid bedrooms data
            try:
                bedrooms_str = row.get('bedrooms', '1')
                if bedrooms_str and bedrooms_str != '' and bedrooms_str is not None:
                    # Check if it's actually a number
                    bedrooms_clean = str(bedrooms_str).strip()
                    if bedrooms_clean.replace('.', '', 1).isdigit():
                        num_rooms = max(1, int(float(bedrooms_clean)))
                    else:
                        num_rooms = 1
                else:
                    num_rooms = 1
            except:
                num_rooms = 1
            
            room_type = str(row.get('room_type', 'Entire home/apt'))[:50]
            
            # Amenities
            amenities_list = parse_amenities(row.get('amenities', ''))
            amenities_json = json.dumps(amenities_list)
            
            # Images - extract proper URLs
            picture_url = row.get('picture_url', '')
            images_list = []
            if picture_url and picture_url.startswith('http'):
                images_list.append(picture_url)
            else:
                # Use fallback images based on room type
                fallback_images = [
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945',
                    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
                    'https://images.unsplash.com/photo-1564501049412-61c2a3083791',
                    'https://images.unsplash.com/photo-1571896349842-33c89424de2d'
                ]
                import random
                images_list.append(random.choice(fallback_images))
            images_json = json.dumps(images_list)
            
            # Prepare hotel insert with listing_id for review linking
            hotels_batch.append((
                hotel_id,
                OWNER_ID,
                name,
                address,
                city,
                state,
                zip_code,
                star_rating,
                round(rating, 2),
                round(price, 2),
                num_rooms,
                room_type,
                amenities_json,
                'approved',
                images_json,
                original_listing_id
            ))
            
            # Prepare amenities inserts
            for amenity in amenities_list:
                if amenity:
                    amenities_batch.append((hotel_id, amenity[:100]))
            
            count += 1
            
            # Insert in batches
            if len(hotels_batch) >= batch_size:
                try:
                    cursor.executemany('''
                        INSERT INTO hotels (id, owner_id, name, address, city, state, zip_code, 
                                          star_rating, rating, price_per_night, num_rooms, room_type, 
                                          amenities, approval_status, images, listing_id)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ''', hotels_batch)
                    
                    if amenities_batch:
                        cursor.executemany('''
                            INSERT INTO hotel_amenities (hotel_id, amenity)
                            VALUES (%s, %s)
                        ''', amenities_batch)
                    
                    conn.commit()
                    print(f"Imported {count} hotels...")
                except Exception as batch_error:
                    conn.rollback()
                    # Insert one by one to skip duplicates
                    for hotel_data in hotels_batch:
                        try:
                            cursor.execute('''
                                INSERT INTO hotels (id, owner_id, name, address, city, state, zip_code, 
                                                  star_rating, rating, price_per_night, num_rooms, room_type, 
                                                  amenities, approval_status, images, listing_id)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ''', hotel_data)
                            conn.commit()
                        except:
                            conn.rollback()
                            continue
                hotels_batch = []
                amenities_batch = []
            
            # Limit to first 5000 for reasonable dataset size
            if count >= 5000:
                break
                
        except Exception as e:
            # Only print first 50 errors to avoid spam
            if count < 50 or count % 100 == 0:
                print(f"Error processing row {count}: {e}")
            continue
    
    # Insert remaining batch
    if hotels_batch:
        try:
            cursor.executemany('''
                INSERT INTO hotels (id, owner_id, name, address, city, state, zip_code, 
                                  star_rating, rating, price_per_night, num_rooms, room_type, 
                                  amenities, approval_status, images, listing_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', hotels_batch)
            
            if amenities_batch:
                cursor.executemany('''
                    INSERT INTO hotel_amenities (hotel_id, amenity)
                    VALUES (%s, %s)
                ''', amenities_batch)
            
            conn.commit()
        except Exception as batch_error:
            conn.rollback()
            # Insert one by one to skip duplicates
            for hotel_data in hotels_batch:
                try:
                    cursor.execute('''
                        INSERT INTO hotels (id, owner_id, name, address, city, state, zip_code, 
                                          star_rating, rating, price_per_night, num_rooms, room_type, 
                                          amenities, approval_status, images, listing_id)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ''', hotel_data)
                    conn.commit()
                except:
                    conn.rollback()
                    continue

print(f"\nTotal hotels imported: {count}")

# Show statistics
cursor.execute("SELECT COUNT(*) FROM hotels")
total = cursor.fetchone()[0]
print(f"Total hotels in database: {total}")

cursor.execute("SELECT COUNT(DISTINCT city) FROM hotels")
cities = cursor.fetchone()[0]
print(f"Total cities: {cities}")

cursor.execute("SELECT city, COUNT(*) as cnt FROM hotels GROUP BY city ORDER BY cnt DESC LIMIT 10")
print("\nTop 10 cities:")
for city, cnt in cursor.fetchall():
    print(f"  {city}: {cnt}")

cursor.close()
conn.close()

print("\nImport completed successfully!")
