#!/usr/bin/env python3
"""
Generate realistic airline reviews with diverse reviewer names and mixed ratings.
Creates CSV file for import to MongoDB Atlas flights_reviews collection.
"""

import csv
import random
from datetime import datetime, timedelta
from uuid import uuid4

# 8 Airlines from kayak_listings.flights
AIRLINES = [
    "Alaska Airlines",
    "American Airlines", 
    "Delta",
    "Frontier",
    "JetBlue",
    "Southwest",
    "Spirit",
    "United"
]

# Diverse first names from various ethnicities
FIRST_NAMES = [
    # European/American
    "James", "Emma", "Michael", "Sophia", "Robert", "Olivia", "William", "Ava",
    "David", "Isabella", "Joseph", "Mia", "Charles", "Charlotte", "Thomas", "Amelia",
    "Daniel", "Harper", "Matthew", "Evelyn", "Andrew", "Abigail", "Christopher", "Emily",
    # Hispanic/Latino
    "Jose", "Maria", "Luis", "Carmen", "Carlos", "Rosa", "Juan", "Ana",
    "Miguel", "Isabel", "Diego", "Lucia", "Antonio", "Sofia", "Francisco", "Valentina",
    # Asian
    "Wei", "Mei", "Yuki", "Sakura", "Jin", "Li", "Kenji", "Yuna",
    "Raj", "Priya", "Arjun", "Ananya", "Hiroshi", "Akiko", "Chen", "Ming",
    # African/African American
    "Kwame", "Amara", "Jabari", "Zuri", "Malik", "Nia", "Kofi", "Aisha",
    "Tyrone", "Jasmine", "Marcus", "Destiny", "DeAndre", "Shanice", "Jamal", "Ebony",
    # Middle Eastern
    "Omar", "Fatima", "Hassan", "Zahra", "Ali", "Layla", "Ahmed", "Noor",
    "Tariq", "Amina", "Karim", "Yasmin", "Rashid", "Leila", "Samir", "Aaliyah",
    # South Asian
    "Vikram", "Kavya", "Aryan", "Diya", "Rohan", "Sanya", "Aditya", "Riya",
    "Kabir", "Ishita", "Nikhil", "Shreya", "Siddharth", "Aarav", "Pawan", "Meera"
]

LAST_NAMES = [
    # European/American
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "White",
    # Hispanic/Latino
    "Hernandez", "Lopez", "Gonzalez", "Perez", "Sanchez", "Rivera", "Torres", "Ramirez",
    "Flores", "Gomez", "Diaz", "Cruz", "Morales", "Reyes", "Gutierrez", "Ortiz",
    # Asian
    "Wang", "Li", "Zhang", "Liu", "Chen", "Yang", "Huang", "Zhao",
    "Kim", "Park", "Lee", "Choi", "Tanaka", "Suzuki", "Takahashi", "Watanabe",
    "Patel", "Singh", "Kumar", "Sharma", "Gupta", "Shah", "Mehta", "Reddy",
    # African/African American
    "Washington", "Jefferson", "Brooks", "Coleman", "Henderson", "Bennett", "Wood", "Barnes",
    "Mensah", "Okafor", "Nkrumah", "Adeyemi", "Mwangi", "Kamau", "Otieno", "Banda",
    # Middle Eastern
    "Hassan", "Ali", "Ahmed", "Mohammad", "Ibrahim", "Rahman", "Khan", "Hussein",
    "Abbas", "Malik", "Farooq", "Siddiqui", "Rizvi", "Qureshi", "Ansari", "Sheikh",
    # Mixed/Other
    "O'Brien", "Murphy", "Kelly", "Sullivan", "Rossi", "Russo", "Ferrari", "Romano",
    "Novak", "Kowalski", "Petrov", "Silva", "Santos", "Fernandez", "Costa", "Alves"
]

# Review comment templates with various sentiments (mix of positive, neutral, negative)
REVIEW_TEMPLATES = [
    # Positive (3-5 stars)
    "Excellent service from start to finish. The crew was friendly and professional.",
    "Comfortable seats and great in-flight entertainment. Would fly again!",
    "Smooth flight with no delays. Check-in process was efficient.",
    "The staff went above and beyond to accommodate my needs. Highly recommended.",
    "Clean aircraft and pleasant atmosphere. Food was surprisingly good.",
    "On-time departure and arrival. Baggage claim was quick and easy.",
    "Spacious legroom even in economy class. Very impressed overall.",
    "Professional crew and well-maintained aircraft. Great value for money.",
    "The boarding process was organized and stress-free. Nice experience.",
    "In-flight WiFi worked perfectly. Appreciated the complimentary snacks.",
    
    # Neutral/Mixed (3-4 stars)
    "Decent flight overall. Nothing exceptional but no major complaints.",
    "Average experience. The price was reasonable for what you get.",
    "Flight was on time but seats could be more comfortable.",
    "Standard service, nothing to complain about but nothing memorable either.",
    "The crew was okay, but the entertainment options were limited.",
    "Acceptable legroom for a short flight. Snacks were basic.",
    "No delays which is always appreciated. Seats were a bit cramped.",
    "Decent value for a budget airline. Set expectations accordingly.",
    "The plane was older but clean. Service was adequate.",
    "Got me from A to B safely. Can't ask for much more than that.",
    
    # Critical (3 stars - still within 3-5 range)
    "The flight was delayed but the crew handled it professionally.",
    "Seats were uncomfortable for a long flight but arrived safely.",
    "Limited overhead space made boarding challenging. Otherwise okay.",
    "Food options were disappointing but flight was smooth.",
    "Customer service could be friendlier but flight was on time.",
    "The entertainment system had issues but crew was helpful.",
    "Baggage fees seemed excessive but overall flight was acceptable.",
    "Boarding was chaotic but once in the air everything was fine.",
    "Temperature in the cabin was too cold but otherwise standard flight.",
    "WiFi didn't work properly but arrived on schedule.",
    
    # More positive variations
    "Great experience flying with this airline. Will book again.",
    "The crew made a long flight enjoyable with their warm service.",
    "Impressed by the cleanliness and comfort. Worth the price.",
    "Easy online booking and smooth check-in process. No issues.",
    "The captain provided excellent updates throughout the flight.",
    "Appreciated the extra amenities provided in economy class.",
    "Quick boarding and efficient service. Very satisfied.",
    "The new aircraft was modern and comfortable. Enjoyed the flight.",
    "Ground staff and flight attendants were all very helpful.",
    "Great leg space and the meal service exceeded expectations."
]

def generate_random_date():
    """Generate random date within last 2 years"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=730)  # 2 years ago
    
    random_days = random.randint(0, 730)
    review_date = start_date + timedelta(days=random_days)
    
    return review_date.strftime("%Y-%m-%d")

def generate_reviewer_name():
    """Generate realistic name from diverse backgrounds"""
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    return f"{first} {last}"

def generate_rating():
    """Generate rating between 3-5 (whole numbers only)"""
    # Weighted distribution: more 4s and 5s, fewer 3s
    ratings = [3] * 15 + [4] * 35 + [5] * 50  # 15% 3-star, 35% 4-star, 50% 5-star
    return random.choice(ratings)

def generate_verified_booking():
    """80% verified bookings"""
    return random.random() < 0.8

def generate_helpful_count():
    """Random helpful count (0-50)"""
    # Most reviews have few helpful votes, some have more
    if random.random() < 0.7:
        return random.randint(0, 10)
    else:
        return random.randint(11, 50)

def generate_reviews():
    """Generate 60-90 reviews per airline"""
    reviews = []
    reviewer_ids = {}  # Track unique reviewer IDs
    
    for airline in AIRLINES:
        num_reviews = random.randint(60, 90)
        
        print(f"Generating {num_reviews} reviews for {airline}...")
        
        for _ in range(num_reviews):
            reviewer_name = generate_reviewer_name()
            
            # Reuse reviewer_id if same name exists (simulates repeat customers)
            if reviewer_name not in reviewer_ids:
                reviewer_ids[reviewer_name] = str(uuid4())
            
            review = {
                'airline': airline,
                'reviewer_id': reviewer_ids[reviewer_name],
                'reviewer_name': reviewer_name,
                'review_date': generate_random_date(),
                'rating': generate_rating(),
                'comment': random.choice(REVIEW_TEMPLATES),
                'verified_booking': generate_verified_booking(),
                'helpful_count': generate_helpful_count()
            }
            
            reviews.append(review)
    
    return reviews

def save_to_csv(reviews, filename='airline_reviews.csv'):
    """Save reviews to CSV file"""
    fieldnames = ['airline', 'reviewer_id', 'reviewer_name', 'review_date', 
                  'rating', 'comment', 'verified_booking', 'helpful_count']
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(reviews)
    
    print(f"\n✅ Generated {len(reviews)} reviews saved to {filename}")
    
    # Print statistics
    print("\n📊 Statistics:")
    print(f"   Total reviews: {len(reviews)}")
    
    # Reviews per airline
    print("\n   Reviews per airline:")
    for airline in AIRLINES:
        count = sum(1 for r in reviews if r['airline'] == airline)
        avg_rating = sum(r['rating'] for r in reviews if r['airline'] == airline) / count
        print(f"      {airline}: {count} reviews (avg rating: {avg_rating:.2f})")
    
    # Rating distribution
    ratings_dist = {3: 0, 4: 0, 5: 0}
    for r in reviews:
        ratings_dist[r['rating']] += 1
    
    print("\n   Overall rating distribution:")
    for rating, count in sorted(ratings_dist.items()):
        percentage = (count / len(reviews)) * 100
        print(f"      {rating} stars: {count} reviews ({percentage:.1f}%)")
    
    # Unique reviewers
    unique_reviewers = len(set(r['reviewer_id'] for r in reviews))
    print(f"\n   Unique reviewers: {unique_reviewers}")
    
    # Verified bookings
    verified = sum(1 for r in reviews if r['verified_booking'])
    print(f"   Verified bookings: {verified} ({(verified/len(reviews)*100):.1f}%)")
    
    # File size
    import os
    file_size = os.path.getsize(filename)
    print(f"\n   File size: {file_size:,} bytes ({file_size/1024:.2f} KB)")

if __name__ == "__main__":
    print("🛫 Generating airline reviews...\n")
    reviews = generate_reviews()
    save_to_csv(reviews, 'scripts/airline_reviews.csv')
    print("\n✈️ Done! Ready to import to MongoDB Atlas.")
