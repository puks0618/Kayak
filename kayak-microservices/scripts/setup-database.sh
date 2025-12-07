#!/bin/bash
# Database Setup Script for Kayak Flight Search
# This script initializes the database with flight records
# All team members should run this after first-time setup

set -e

echo "🚀 Kayak Database Setup Script"
echo "================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if MySQL container is running
if ! docker ps | grep -q kayak-mysql; then
    echo "❌ Error: kayak-mysql container is not running."
    echo "   Please run: cd infrastructure/docker && docker compose up -d mysql"
    exit 1
fi

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
until docker exec kayak-mysql mysqladmin ping -h localhost -uroot -p'Somalwar1!' --silent &> /dev/null; do
    echo "   MySQL is unavailable - sleeping"
    sleep 2
done
echo "✅ MySQL is ready!"

# Create kayak_listings database if it doesn't exist
echo ""
echo "📊 Creating kayak_listings database..."
docker exec kayak-mysql mysql -uroot -p'Somalwar1!' -e "CREATE DATABASE IF NOT EXISTS kayak_listings;"
echo "✅ Database created!"

# Create flights table
echo ""
echo "📋 Creating flights table schema..."
docker exec kayak-mysql mysql -uroot -p'Somalwar1!' kayak_listings << 'EOF'
CREATE TABLE IF NOT EXISTS flights (
  id VARCHAR(36) PRIMARY KEY,
  flight_code VARCHAR(20) NOT NULL,
  airline VARCHAR(255) NOT NULL,
  departure_airport VARCHAR(10) NOT NULL,
  arrival_airport VARCHAR(10) NOT NULL,
  departure_time DATETIME NOT NULL,
  arrival_time DATETIME NOT NULL,
  duration INT NOT NULL,
  stops INT DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  seats_total INT NOT NULL,
  seats_left INT NOT NULL,
  cabin_class ENUM('economy', 'premium economy', 'business', 'first') NOT NULL DEFAULT 'economy',
  is_deal TINYINT(1) DEFAULT 0,
  discount_percent INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_departure_airport (departure_airport),
  INDEX idx_arrival_airport (arrival_airport),
  INDEX idx_departure_time (departure_time),
  INDEX idx_price (price),
  INDEX idx_cabin_class (cabin_class),
  INDEX idx_stops (stops),
  INDEX idx_is_deal (is_deal)
);
EOF
echo "✅ Flights table created!"

# Check if flights table is empty
FLIGHT_COUNT=$(docker exec kayak-mysql mysql -uroot -p'Somalwar1!' kayak_listings -sN -e "SELECT COUNT(*) FROM flights;")

if [ "$FLIGHT_COUNT" -eq 0 ]; then
    echo ""
    echo "📥 Flights table is empty. Generating flight data..."
    echo "   This will take a few minutes..."
    
    # Run the Python flight generation script
    if [ -f "../../generate_complete_flights.py" ]; then
        python3 ../../generate_complete_flights.py
    elif [ -f "../generate_complete_flights.py" ]; then
        python3 ../generate_complete_flights.py
    elif [ -f "generate_complete_flights.py" ]; then
        python3 generate_complete_flights.py
    else
        echo "❌ Error: generate_complete_flights.py not found!"
        echo "   Please run this script from the kayak-microservices/scripts directory"
        exit 1
    fi
    
    echo "✅ Flight data generated!"
else
    echo ""
    echo "ℹ️  Flights table already contains $FLIGHT_COUNT records"
    echo "   Skipping data generation. To regenerate, truncate the table first."
fi

# Display summary
echo ""
echo "================================"
echo "✨ Database Setup Complete!"
echo "================================"
echo ""
echo "Database Statistics:"
docker exec kayak-mysql mysql -uroot -p'Somalwar1!' kayak_listings -e "
SELECT 
    COUNT(*) as total_flights,
    COUNT(DISTINCT airline) as airlines,
    COUNT(DISTINCT departure_airport) as airports,
    MIN(DATE(departure_time)) as earliest_flight,
    MAX(DATE(departure_time)) as latest_flight,
    ROUND(AVG(price), 2) as avg_price
FROM flights;
"

echo ""
echo "🎉 Your Kayak database is ready to use!"
echo ""
