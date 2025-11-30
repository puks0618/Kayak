#!/bin/bash

# Script to initialize MongoDB collections in DocumentDB
# Run this after DocumentDB cluster is created

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Get DocumentDB endpoint from Terraform output
cd "$(dirname "$0")"
DOCDB_HOST=$(terraform output -raw docdb_endpoint 2>/dev/null || echo "")

if [ -z "$DOCDB_HOST" ]; then
    echo "Error: DocumentDB endpoint not found"
    echo "Run 'terraform apply' first to create DocumentDB cluster"
    exit 1
fi

DOCDB_USER="kayakadmin"
DOCDB_PASSWORD="Somalwar1!"
DOCDB_PORT=27017

echo "========================================="
echo "Initializing DocumentDB (MongoDB)"
echo "========================================="
echo "Host: $DOCDB_HOST"
echo ""

# Check if mongosh or mongo client is installed
if command -v mongosh &> /dev/null; then
    MONGO_CMD="mongosh"
elif command -v mongo &> /dev/null; then
    MONGO_CMD="mongo"
else
    echo "Error: MongoDB client (mongosh or mongo) not found"
    echo "Install with: brew install mongosh"
    exit 1
fi

echo "Using MongoDB client: $MONGO_CMD"
echo ""

# Download AWS DocumentDB CA certificate if not exists
CERT_FILE="../databases/mongodb/rds-combined-ca-bundle.pem"
if [ ! -f "$CERT_FILE" ]; then
    echo "Downloading AWS RDS CA certificate..."
    mkdir -p ../databases/mongodb
    curl -o "$CERT_FILE" https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
    echo "✓ Certificate downloaded"
fi

# Connection string
CONN_STR="mongodb://$DOCDB_USER:$DOCDB_PASSWORD@$DOCDB_HOST:$DOCDB_PORT/?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred"

echo "Testing connection to DocumentDB..."
$MONGO_CMD "$CONN_STR" --tls --tlsCAFile "$CERT_FILE" --eval "db.adminCommand('ping')" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Connection successful"
else
    echo "✗ Connection failed. Check credentials and security group settings."
    exit 1
fi

echo ""
echo "Creating databases and collections..."

# Initialize kayak_listings database
echo "Initializing kayak_listings database..."
$MONGO_CMD "$CONN_STR/kayak_listings" --tls --tlsCAFile "$CERT_FILE" --eval "
  db.createCollection('reviews');
  db.reviews.createIndex({ listing_id: 1 });
  db.reviews.createIndex({ user_id: 1 });
  db.reviews.createIndex({ created_at: -1 });
  
  db.createCollection('images');
  db.images.createIndex({ listing_id: 1 });
  
  print('✓ kayak_listings collections created');
"

# Initialize kayak_analytics database
echo "Initializing kayak_analytics database..."
$MONGO_CMD "$CONN_STR/kayak_analytics" --tls --tlsCAFile "$CERT_FILE" --eval "
  db.createCollection('analytics');
  db.analytics.createIndex({ date: 1 });
  db.analytics.createIndex({ type: 1 });
  db.analytics.createIndex({ 'metrics.revenue': 1 });
  
  print('✓ kayak_analytics collections created');
"

# Initialize kayak_logs database with capped collection
echo "Initializing kayak_logs database..."
$MONGO_CMD "$CONN_STR/kayak_logs" --tls --tlsCAFile "$CERT_FILE" --eval "
  db.createCollection('application_logs', { 
    capped: true, 
    size: 104857600,
    max: 100000 
  });
  db.application_logs.createIndex({ service: 1 });
  db.application_logs.createIndex({ level: 1 });
  db.application_logs.createIndex({ timestamp: -1 });
  
  print('✓ kayak_logs collections created');
"

echo ""
echo "========================================="
echo "DocumentDB initialization complete!"
echo "========================================="
echo ""
echo "Connection details:"
echo "Host: $DOCDB_HOST"
echo "Port: $DOCDB_PORT"
echo "User: $DOCDB_USER"
echo "Databases: kayak_listings, kayak_analytics, kayak_logs"
echo ""
echo "Test connection:"
echo "$MONGO_CMD \"$CONN_STR\" --tls --tlsCAFile \"$CERT_FILE\""
