#!/bin/bash

# Script to initialize RDS MySQL database with all tables
# Run this after Terraform creates the RDS instance

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Get RDS endpoint from Terraform output
cd "$(dirname "$0")"
RDS_HOST=$(terraform output -raw rds_address)
DB_USER="admin"
DB_PASSWORD="Somalwar1!"

echo "========================================="
echo "Initializing RDS MySQL Database"
echo "========================================="
echo "Host: $RDS_HOST"
echo ""

# Check if MySQL client is installed
if ! command -v mysql &> /dev/null; then
    echo "Error: MySQL client not found"
    echo "Install with: brew install mysql-client"
    echo "Then add to PATH: export PATH=\"/opt/homebrew/opt/mysql-client/bin:\$PATH\""
    exit 1
fi

echo "Testing connection to RDS..."
mysql -h "$RDS_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✓ Connection successful"
else
    echo "✗ Connection failed. Check credentials and security group settings."
    exit 1
fi

echo ""
echo "Creating databases and tables..."

# Run SQL scripts in order
SQL_DIR="../databases/mysql/init"

for sql_file in "$SQL_DIR"/*.sql; do
    if [ -f "$sql_file" ]; then
        echo "Running: $(basename $sql_file)"
        mysql -h "$RDS_HOST" -u "$DB_USER" -p"$DB_PASSWORD" < "$sql_file"
        if [ $? -eq 0 ]; then
            echo "✓ $(basename $sql_file) executed successfully"
        else
            echo "✗ Error executing $(basename $sql_file)"
            exit 1
        fi
    fi
done

echo ""
echo "========================================="
echo "Database initialization complete!"
echo "========================================="
echo ""
echo "Connection details:"
echo "Host: $RDS_HOST"
echo "Port: 3306"
echo "User: $DB_USER"
echo "Databases: kayak_auth, kayak_users, kayak_listings, kayak_bookings"
echo ""
echo "Test connection:"
echo "mysql -h $RDS_HOST -u $DB_USER -p"
