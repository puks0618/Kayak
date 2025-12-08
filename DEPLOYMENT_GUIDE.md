# Kayak AWS Deployment Guide

## Pre-Deployment Checklist

### 1. Setup AWS RDS MySQL (Free Tier)
```bash
# AWS Console Steps:
1. Go to RDS Console
2. Create Database
3. Choose MySQL 8.0
4. Template: Free tier
5. DB instance: db.t3.micro
6. Storage: 20 GB
7. Public access: Yes (for development)
8. Security group: Allow port 3306 from your IP

# Export local MySQL data
mysqldump -u root -p --databases kayak_users kayak_listings kayak_bookings > kayak_backup.sql

# Import to RDS
mysql -h your-rds-endpoint.rds.amazonaws.com -u admin -p < kayak_backup.sql
```

### 2. Setup MongoDB Atlas (Already Done)
- Already using: `mongodb+srv://pprathkanthiwar_db_user@cluster1.0ssglwi.mongodb.net/`
- Verify collections exist: reviews, images, logs
- No changes needed!

### 3. Setup Redis (Choose One)

**Option A: AWS ElastiCache (Free Trial)**
```bash
# AWS Console:
1. ElastiCache → Create cluster
2. Redis, t2.micro (750 hours free trial)
3. Note endpoint
```

**Option B: Redis Cloud (Free Tier - Easier)**
```bash
# https://redis.com/try-free/
1. Create account
2. Create database (30MB free)
3. Get connection string
```

### 4. Setup Kafka (Confluent Cloud Free Tier)
```bash
# https://confluent.cloud/signup
1. Create account (100+ free credits)
2. Create cluster (Basic tier)
3. Create topics: flight-bookings, hotel-bookings, car-bookings
4. Get bootstrap servers & API keys
```

## Phase 2: Prepare Docker Images

### Optimize Images for AWS
```bash
# Build production images
cd kayak-microservices/infrastructure/docker

# Build each service
docker compose build api-gateway auth-service user-service listing-service booking-service billing-service search-service web-client

# Tag for AWS ECR
docker tag docker-api-gateway:latest YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/kayak-api-gateway:latest
docker tag docker-auth-service:latest YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/kayak-auth-service:latest
docker tag docker-user-service:latest YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/kayak-user-service:latest
docker tag docker-listing-service:latest YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/kayak-listing-service:latest
docker tag docker-booking-service:latest YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/kayak-booking-service:latest
docker tag docker-billing-service:latest YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/kayak-billing-service:latest
docker tag docker-search-service:latest YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/kayak-search-service:latest
docker tag docker-web-client:latest YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/kayak-web-client:latest
```

### Update Environment Variables
Create `aws-env-config.json`:
```json
{
  "DB_HOST": "your-rds-endpoint.rds.amazonaws.com",
  "DB_USER": "admin",
  "DB_PASSWORD": "your-rds-password",
  "MONGO_URI": "mongodb+srv://user:pass@cluster1.0ssglwi.mongodb.net/kayak_listings",
  "REDIS_HOST": "your-redis-endpoint.amazonaws.com",
  "KAFKA_BROKERS": "pkc-xxxxx.us-east-1.aws.confluent.cloud:9092"
}
```

## Phase 3: Deploy to AWS ECS

### Step 1: Create ECR Repositories
```bash
# Install AWS CLI
brew install awscli  # macOS
aws configure  # Enter your credentials

# Create ECR repositories
aws ecr create-repository --repository-name kayak-api-gateway
aws ecr create-repository --repository-name kayak-auth-service
aws ecr create-repository --repository-name kayak-user-service
aws ecr create-repository --repository-name kayak-listing-service
aws ecr create-repository --repository-name kayak-booking-service
aws ecr create-repository --repository-name kayak-billing-service
aws ecr create-repository --repository-name kayak-search-service
aws ecr create-repository --repository-name kayak-web-client

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
```

### Step 2: Push Images to ECR
```bash
# Push each image
docker push YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/kayak-api-gateway:latest
docker push YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/kayak-auth-service:latest
docker push YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/kayak-user-service:latest
docker push YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/kayak-listing-service:latest
docker push YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/kayak-booking-service:latest
docker push YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/kayak-billing-service:latest
docker push YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/kayak-search-service:latest
docker push YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/kayak-web-client:latest
```

### Step 3: Create ECS Cluster
```bash
# AWS Console:
1. ECS → Create Cluster
2. Name: kayak-cluster
3. Infrastructure: AWS Fargate
4. Create
```

### Step 4: Create Task Definitions
Create task definition for each service in AWS Console or use CLI:

```bash
# Example task definition JSON for API Gateway
cat > api-gateway-task.json << 'EOF'
{
  "family": "kayak-api-gateway",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "api-gateway",
      "image": "YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/kayak-api-gateway:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "PORT", "value": "3000"},
        {"name": "DB_HOST", "value": "your-rds-endpoint.rds.amazonaws.com"},
        {"name": "REDIS_HOST", "value": "your-redis-endpoint.amazonaws.com"},
        {"name": "KAFKA_BROKERS", "value": "your-kafka-bootstrap-servers"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/kayak-api-gateway",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# Register task definition
aws ecs register-task-definition --cli-input-json file://api-gateway-task.json
```

### Step 5: Create Services
```bash
# Create service for each microservice
aws ecs create-service \
  --cluster kayak-cluster \
  --service-name api-gateway \
  --task-definition kayak-api-gateway:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}"
```

### Step 6: Setup Application Load Balancer
```bash
# AWS Console:
1. EC2 → Load Balancers → Create
2. Type: Application Load Balancer
3. Name: kayak-alb
4. Scheme: Internet-facing
5. Target groups for each service:
   - api-gateway: port 3000
   - web-client: port 80
6. Configure routing rules
```

## Phase 4: Testing Deployment

### Health Checks
```bash
# Test each service
curl http://your-alb-dns.amazonaws.com/health
curl http://your-alb-dns.amazonaws.com/api/users/health
curl http://your-alb-dns.amazonaws.com/api/listings/health
```

### Monitor Logs
```bash
# View logs in AWS Console
CloudWatch → Log Groups → /ecs/kayak-*

# Or use CLI
aws logs tail /ecs/kayak-api-gateway --follow
```

## Cost Optimization Tips

1. **Use Spot Instances for non-critical services**
2. **Stop services when not testing** (ECS charges only when running)
3. **Use AWS Free Tier limits**:
   - RDS: 750 hours/month
   - Fargate: Some credits available
   - CloudWatch: 5GB logs
4. **Single ALB** for all services (path-based routing)
5. **Minimum task count** (1 per service for demo)

## Services to Deploy (Priority Order)

### Essential (Deploy First):
1. API Gateway (Entry point)
2. Auth Service (Login required)
3. Web Client (UI)

### Core Features:
4. User Service
5. Listing Service
6. Search Service

### Booking Flow:
7. Booking Service
8. Billing Service

### Optional (Demo Only):
- Admin Portal (run locally)
- Owner Portal (run locally)
- AI Agent (separate deployment)

## Architecture Diagram
```
┌─────────────────────────────────────────────────┐
│                Internet/Users                    │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────┐
│     Application Load Balancer (ALB)              │
│  - Route /api/* → Backend Services               │
│  - Route /* → Web Client                         │
└──────────────────┬──────────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │               │
    ↓              ↓               ↓
┌─────────┐  ┌─────────┐    ┌─────────┐
│   API   │  │  Auth   │    │   Web   │
│ Gateway │  │ Service │    │ Client  │
└────┬────┘  └────┬────┘    └─────────┘
     │            │
     └────┬───────┘
          │
    ┌─────┴──────┐
    │            │
    ↓            ↓
┌─────────┐  ┌─────────┐
│  User   │  │ Listing │
│ Service │  │ Service │
└────┬────┘  └────┬────┘
     │            │
     └─────┬──────┘
           │
      ┌────┴────┐
      │         │
      ↓         ↓
┌──────────┐  ┌──────────┐
│ Booking  │  │ Billing  │
│ Service  │  │ Service  │
└────┬─────┘  └────┬─────┘
     │             │
     └──────┬──────┘
            │
    ┌───────┼───────┐
    │       │       │
    ↓       ↓       ↓
┌────────┐ ┌────────┐ ┌────────┐
│AWS RDS │ │MongoDB │ │ Redis  │
│ MySQL  │ │ Atlas  │ │ Cloud  │
└────────┘ └────────┘ └────────┘
            │
            ↓
    ┌────────────┐
    │ Confluent  │
    │   Kafka    │
    └────────────┘
```

## Performance Testing with JMeter

After deployment, run load tests:
```bash
# Install JMeter
brew install jmeter

# Create test plan for 100 concurrent users
# Measure:
# - B (Base): Just MySQL
# - B+S (SQL Caching): MySQL + Redis
# - B+S+K (Kafka): MySQL + Redis + Kafka
# - B+S+K+Other: All optimizations
```

## Troubleshooting

### Common Issues:
1. **Task keeps restarting**: Check CloudWatch logs
2. **Can't connect to RDS**: Security group rules
3. **High costs**: Stop unused services immediately
4. **Timeout errors**: Increase task memory/CPU

## Cost Estimate (Monthly)

- **RDS MySQL** (Free Tier): $0
- **MongoDB Atlas** (Free): $0
- **Redis Cloud** (Free): $0
- **Confluent Kafka** (Free credits): $0
- **ECS Fargate** (8 services, 512MB): ~$30-50
- **ALB**: ~$16
- **CloudWatch Logs**: ~$5
- **Data Transfer**: ~$5

**Total**: ~$56/month (Free tier services) or less if you stop services when not testing

## Cleanup After Demo
```bash
# Delete ECS services
aws ecs delete-service --cluster kayak-cluster --service api-gateway --force

# Delete cluster
aws ecs delete-cluster --cluster kayak-cluster

# Delete RDS
aws rds delete-db-instance --db-instance-identifier kayak-db --skip-final-snapshot

# Delete ECR images
aws ecr delete-repository --repository-name kayak-api-gateway --force
```
