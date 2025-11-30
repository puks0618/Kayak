# Database Deployment Guide

## Overview
This project uses AWS RDS MySQL for relational data and AWS DocumentDB (MongoDB-compatible) for document storage.

## Prerequisites
- AWS CLI configured
- Terraform installed
- MySQL client installed
- MongoDB client (mongosh) installed

## Step 1: Deploy Infrastructure

### Initialize and Deploy Both Databases
```bash
cd infrastructure/terraform

# Set AWS credentials
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_DEFAULT_REGION="us-east-1"

# Initialize Terraform
terraform init

# Review what will be created
terraform plan

# Deploy both MySQL RDS and DocumentDB
terraform apply
```

This will create:
- **MySQL RDS**: db.t3.micro instance
- **DocumentDB**: db.t3.medium cluster with 1 instance
- Security groups for both databases
- Subnet groups in multiple AZs

**Expected time**: 10-15 minutes

## Step 2: Get Connection Details

```bash
# Get MySQL endpoint
terraform output rds_endpoint

# Get DocumentDB endpoint
terraform output docdb_endpoint

# Get all outputs
terraform output -json
```

## Step 3: Initialize MySQL Tables

```bash
# Run Python script to create all MySQL tables
python3 init-rds.py
```

This creates:
- `kayak_auth` database
- `kayak_users` database with users table
- `kayak_listings` database with flights, hotels, cars tables
- `kayak_bookings` database with bookings and billing tables

## Step 4: Initialize MongoDB Collections

```bash
# Install MongoDB client if needed
brew install mongosh

# Run initialization script
./init-docdb.sh
```

This creates:
- `kayak_listings` database with reviews and images collections
- `kayak_analytics` database with analytics collection
- `kayak_logs` database with capped application_logs collection

## Step 5: Update Application Configuration

### Copy environment template
```bash
cd ../..
cp .env.example .env
```

### Update .env with actual endpoints
```env
# MySQL Configuration
MYSQL_HOST=<your-rds-endpoint>
MYSQL_PORT=3306
MYSQL_USER=admin
MYSQL_PASSWORD=Somalwar1!

# MongoDB Configuration  
MONGODB_HOST=<your-docdb-endpoint>
MONGODB_PORT=27017
MONGODB_USER=admin
MONGODB_PASSWORD=Somalwar1!
MONGODB_SSL=true
```

## Database Usage in Services

### MySQL Example
```javascript
const { connections } = require('../shared/database/mysql');

// In user service
const userDb = connections.users;
await userDb.connect();
const users = await userDb.query('SELECT * FROM users WHERE id = ?', [userId]);
```

### MongoDB Example
```javascript
const { connections } = require('../shared/database/mongodb');

// In listings service
const listingsDb = connections.listings;
await listingsDb.connect();
const reviews = listingsDb.getCollection('reviews');
const results = await reviews.find({ listing_id: id }).toArray();
```

## Service-to-Database Mapping

### MySQL (RDS)
| Service | Database | Tables |
|---------|----------|--------|
| Auth Service | `kayak_auth` | sessions, tokens |
| User Service | `kayak_users` | users |
| Listing Service | `kayak_listings` | flights, hotels, cars |
| Booking Service | `kayak_bookings` | bookings, billing |

### MongoDB (DocumentDB)
| Service | Database | Collections |
|---------|----------|-------------|
| Listing Service | `kayak_listings` | reviews, images |
| Analytics Service | `kayak_analytics` | analytics |
| All Services | `kayak_logs` | application_logs |

## Cost Estimates

### MySQL RDS (db.t3.micro)
- Instance: ~$15/month (free tier eligible)
- Storage (20GB gp3): ~$2.30/month
- **Total**: ~$17.30/month

### DocumentDB (db.t3.medium)
- Instance: ~$90/month (1 instance)
- Storage: $0.10/GB/month
- I/O: $0.20 per million requests
- **Estimated**: ~$95-110/month

## Security Best Practices

1. **Change Default Passwords**: Update passwords in production
2. **Restrict Security Groups**: Limit CIDR blocks to your VPC only
3. **Enable SSL/TLS**: Always use encrypted connections
4. **Use IAM Authentication**: For enhanced security (optional)
5. **Rotate Credentials**: Regularly update passwords and keys
6. **Enable Encryption**: Storage encryption is enabled by default

## Cleanup

To destroy all resources:
```bash
cd infrastructure/terraform
terraform destroy
```

⚠️ **Warning**: This will permanently delete all databases and data!

## Troubleshooting

### Connection Issues
- Verify security group allows inbound traffic on ports 3306 (MySQL) and 27017 (MongoDB)
- Check VPC and subnet configuration
- Ensure instances are in "available" state

### Authentication Errors
- Verify credentials in `.env` file
- Check user permissions in database
- For MongoDB, ensure SSL/TLS is enabled

### Performance Issues
- Consider upgrading instance classes
- Add read replicas for MySQL
- Add more DocumentDB instances for MongoDB
- Enable connection pooling in application

## Monitoring

View database metrics in AWS Console:
- **CloudWatch**: CPU, memory, connections
- **Performance Insights**: Query performance (RDS)
- **CloudWatch Logs**: Error logs, slow queries
