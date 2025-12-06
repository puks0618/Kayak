#!/bin/bash

# Create Kafka Topics for Kayak Microservices
# This script creates the necessary topics for flight and hotel bookings

echo "Creating Kafka topics..."

# Flight bookings topic (consumed by admin-service)
docker exec kayak-kafka kafka-topics --create \
  --topic flight-bookings \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1 \
  --if-not-exists

# Hotel bookings topic (consumed by owner-service)
docker exec kayak-kafka kafka-topics --create \
  --topic hotel-bookings \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1 \
  --if-not-exists

echo "Listing all topics:"
docker exec kayak-kafka kafka-topics --list --bootstrap-server localhost:9092

echo "✅ Kafka topics created successfully!"
