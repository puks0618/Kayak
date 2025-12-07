#!/bin/bash

# Script to retrieve database credentials from AWS Secrets Manager
# Usage: ./get-db-credentials.sh [rds|docdb] [environment]

set -e

DATABASE_TYPE=${1:-rds}
ENVIRONMENT=${2:-dev}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Fetching ${DATABASE_TYPE} credentials for ${ENVIRONMENT} environment...${NC}"

# Determine secret name
if [ "$DATABASE_TYPE" = "rds" ]; then
    SECRET_NAME="kayak/rds/credentials-${ENVIRONMENT}"
elif [ "$DATABASE_TYPE" = "docdb" ]; then
    SECRET_NAME="kayak/docdb/credentials-${ENVIRONMENT}"
else
    echo -e "${RED}Error: Invalid database type. Use 'rds' or 'docdb'${NC}"
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install it using: brew install awscli"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

# Retrieve secret
echo -e "${YELLOW}Retrieving secret: ${SECRET_NAME}${NC}"
SECRET_JSON=$(aws secretsmanager get-secret-value \
    --secret-id "$SECRET_NAME" \
    --query SecretString \
    --output text 2>/dev/null)

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to retrieve secret${NC}"
    echo "Make sure you have run 'terraform apply' to create the secrets"
    exit 1
fi

# Parse and display credentials
echo -e "${GREEN}Credentials retrieved successfully!${NC}"
echo ""
echo "Add these to your .env file:"
echo "================================"

if [ "$DATABASE_TYPE" = "rds" ]; then
    echo "MYSQL_HOST=$(echo $SECRET_JSON | jq -r '.host')"
    echo "MYSQL_PORT=$(echo $SECRET_JSON | jq -r '.port')"
    echo "MYSQL_USER=$(echo $SECRET_JSON | jq -r '.username')"
    echo "MYSQL_PASSWORD=$(echo $SECRET_JSON | jq -r '.password')"
    echo "MYSQL_DATABASE=$(echo $SECRET_JSON | jq -r '.dbname')"
else
    echo "MONGODB_HOST=$(echo $SECRET_JSON | jq -r '.host')"
    echo "MONGODB_PORT=$(echo $SECRET_JSON | jq -r '.port')"
    echo "MONGODB_USER=$(echo $SECRET_JSON | jq -r '.username')"
    echo "MONGODB_PASSWORD=$(echo $SECRET_JSON | jq -r '.password')"
fi

echo ""
echo -e "${YELLOW}Note: Keep these credentials secure and never commit them to git${NC}"
