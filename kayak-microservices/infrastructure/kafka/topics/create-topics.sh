#!/bin/bash

# Create Kafka Topics for Kayak Microservices

KAFKA_HOST="${KAFKA_HOST:-localhost:9092}"

echo "Creating Kafka topics on $KAFKA_HOST..."

# User topics
kafka-topics --create --if-not-exists --bootstrap-server $KAFKA_HOST --topic user.created --partitions 3 --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server $KAFKA_HOST --topic user.updated --partitions 3 --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server $KAFKA_HOST --topic user.deleted --partitions 3 --replication-factor 1

# Listing topics
kafka-topics --create --if-not-exists --bootstrap-server $KAFKA_HOST --topic listing.created --partitions 5 --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server $KAFKA_HOST --topic listing.updated --partitions 5 --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server $KAFKA_HOST --topic listing.deleted --partitions 5 --replication-factor 1

# Booking topics
kafka-topics --create --if-not-exists --bootstrap-server $KAFKA_HOST --topic booking.created --partitions 5 --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server $KAFKA_HOST --topic booking.completed --partitions 5 --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server $KAFKA_HOST --topic booking.cancelled --partitions 5 --replication-factor 1

# Payment topics
kafka-topics --create --if-not-exists --bootstrap-server $KAFKA_HOST --topic payment.initiated --partitions 5 --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server $KAFKA_HOST --topic payment.completed --partitions 5 --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server $KAFKA_HOST --topic payment.failed --partitions 5 --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server $KAFKA_HOST --topic payment.refunded --partitions 5 --replication-factor 1

# Admin topics
kafka-topics --create --if-not-exists --bootstrap-server $KAFKA_HOST --topic admin.command --partitions 3 --replication-factor 1

echo "Topics created successfully!"
kafka-topics --list --bootstrap-server $KAFKA_HOST

