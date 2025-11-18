#!/usr/bin/env python3
"""
Generate Test Data for Kayak Microservices
"""

import json
import random
import requests
from datetime import datetime, timedelta
from faker import Faker

fake = Faker()

API_URL = "http://localhost:3000"

def generate_flights(count=50):
    """Generate flight test data"""
    airlines = ["Delta", "United", "American", "Southwest", "JetBlue"]
    cities = ["NYC", "LAX", "ORD", "DFW", "ATL", "SFO", "BOS", "MIA"]
    
    flights = []
    for _ in range(count):
        origin = random.choice(cities)
        destination = random.choice([c for c in cities if c != origin])
        departure = datetime.now() + timedelta(days=random.randint(1, 90))
        
        flight = {
            "airline": random.choice(airlines),
            "flight_number": f"{random.choice(['AA', 'UA', 'DL'])}{random.randint(100, 999)}",
            "origin": origin,
            "destination": destination,
            "departure_time": departure.isoformat(),
            "arrival_time": (departure + timedelta(hours=random.randint(2, 6))).isoformat(),
            "price": round(random.uniform(100, 800), 2),
            "seats_available": random.randint(50, 200),
            "class": random.choice(["economy", "business", "first"])
        }
        flights.append(flight)
    
    return flights

def generate_hotels(count=50):
    """Generate hotel test data"""
    cities = ["New York", "Los Angeles", "Chicago", "Miami", "San Francisco"]
    
    hotels = []
    for _ in range(count):
        hotel = {
            "name": fake.company() + " Hotel",
            "location": random.choice(cities),
            "address": fake.address(),
            "rating": round(random.uniform(3.0, 5.0), 1),
            "price_per_night": round(random.uniform(80, 400), 2),
            "rooms_available": random.randint(10, 100),
            "amenities": random.sample(["wifi", "pool", "gym", "spa", "parking"], 3)
        }
        hotels.append(hotel)
    
    return hotels

def generate_cars(count=30):
    """Generate car rental test data"""
    brands = ["Toyota", "Honda", "Ford", "Chevrolet", "BMW"]
    models = ["Camry", "Accord", "Mustang", "Malibu", "X5"]
    
    cars = []
    for _ in range(count):
        car = {
            "brand": random.choice(brands),
            "model": random.choice(models),
            "year": random.randint(2020, 2024),
            "type": random.choice(["sedan", "suv", "luxury", "economy"]),
            "seats": random.choice([4, 5, 7]),
            "price_per_day": round(random.uniform(30, 150), 2),
            "location": fake.city(),
            "available": True
        }
        cars.append(car)
    
    return cars

def main():
    print("🎲 Generating test data for Kayak Microservices...")
    
    # Generate data
    flights = generate_flights(50)
    hotels = generate_hotels(50)
    cars = generate_cars(30)
    
    # Save to files
    with open('test-data-flights.json', 'w') as f:
        json.dump(flights, f, indent=2)
    
    with open('test-data-hotels.json', 'w') as f:
        json.dump(hotels, f, indent=2)
    
    with open('test-data-cars.json', 'w') as f:
        json.dump(cars, f, indent=2)
    
    print(f"✅ Generated {len(flights)} flights")
    print(f"✅ Generated {len(hotels)} hotels")
    print(f"✅ Generated {len(cars)} cars")
    print("\n📁 Data saved to:")
    print("  - test-data-flights.json")
    print("  - test-data-hotels.json")
    print("  - test-data-cars.json")
    
    # TODO: Optionally POST data to services
    # print("\n📤 Uploading data to services...")

if __name__ == "__main__":
    main()

