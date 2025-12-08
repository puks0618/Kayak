# Quick AWS Deployment Guide - 3 Services

## Overview
Deploy **minimal Kayak system** to AWS using **3 services only**:
- `web-client` (React UI)
- `api-gateway` (routing)
- `listing-service` (flights/hotels/cars data)

**Estimated Cost**: $50-60/month (or FREE if stopped when not testing)

---

## Prerequisites

1. **AWS CLI installed and configured**:
   ```bash
   aws --version
   aws configure  # Enter Access Key, Secret Key, Region: us-east-1
   ```

2. **Docker installed and running**:
   ```bash
   docker --version
   docker compose version
   ```

3. **Get your AWS Account ID**:
   ```bash
   aws sts get-caller-identity
   # Note the "Account" number (12 digits)
   ```

---

## Phase 1: Setup Managed Services (30 minutes)

### 1.1 Create RDS MySQL Database

```bash
# Create MySQL instance (Free Tier: db.t3.micro, 20GB)
aws rds create-db-instance \
  --db-instance-identifier kayak-mysql \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --master-username admin \
  --master-user-password 'YourSecurePassword123!' \
  --allocated-storage 20 \
  --publicly-accessible \
  --backup-retention-period 7 \
  --engine-version 8.0.35

# Wait for instance to be ready (5-10 minutes)
aws rds describe-db-instances \
  --db-instance-identifier kayak-mysql \
  --query 'DBInstances[0].DBInstanceStatus'

# Get RDS endpoint
aws rds describe-db-instances \
  --db-instance-identifier kayak-mysql \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
# Save this endpoint: kayak-mysql.XXXXX.us-east-1.rds.amazonaws.com
```

### 1.2 Setup Security Group for RDS

```bash
# Get VPC ID
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text)

# Create security group
aws ec2 create-security-group \
  --group-name kayak-rds-sg \
  --description "Security group for Kayak RDS" \
  --vpc-id $VPC_ID

# Get security group ID
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=kayak-rds-sg" --query 'SecurityGroups[0].GroupId' --output text)

# Allow MySQL access from anywhere (DEMO ONLY - restrict in production)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 3306 \
  --cidr 0.0.0.0/0

# Modify RDS to use this security group
aws rds modify-db-instance \
  --db-instance-identifier kayak-mysql \
  --vpc-security-group-ids $SG_ID \
  --apply-immediately
```

### 1.3 Create Databases and Import Data

```bash
# Export local MySQL data
cd kayak-microservices/scripts
mysqldump -u root -p kayak_users > kayak_users.sql
mysqldump -u root -p kayak_listings > kayak_listings.sql
mysqldump -u root -p kayak_bookings > kayak_bookings.sql

# Connect to RDS
mysql -h kayak-mysql.XXXXX.us-east-1.rds.amazonaws.com -u admin -p

# In MySQL shell:
CREATE DATABASE kayak_users;
CREATE DATABASE kayak_listings;
CREATE DATABASE kayak_bookings;
EXIT;

# Import data to RDS
mysql -h kayak-mysql.XXXXX.us-east-1.rds.amazonaws.com -u admin -p kayak_users < kayak_users.sql
mysql -h kayak-mysql.XXXXX.us-east-1.rds.amazonaws.com -u admin -p kayak_listings < kayak_listings.sql
mysql -h kayak-mysql.XXXXX.us-east-1.rds.amazonaws.com -u admin -p kayak_bookings < kayak_bookings.sql

# Verify data imported
mysql -h kayak-mysql.XXXXX.us-east-1.rds.amazonaws.com -u admin -p kayak_listings
# In MySQL shell:
USE kayak_listings;
SELECT COUNT(*) FROM flights;  # Should show 10000+
SELECT COUNT(*) FROM hotels;   # Should show 500+
SELECT COUNT(*) FROM cars;     # Should show 300+
EXIT;
```

### 1.4 Setup Redis Cloud (Free Tier)

1. Go to https://redis.com/try-free/
2. Create free account
3. Create database:
   - Name: `kayak-cache`
   - Cloud: AWS
   - Region: us-east-1
   - Plan: Free (30MB)
4. Get endpoint: `redis-XXXXX.cloud.redislabs.com:12345`
5. Get password from database details

### 1.5 Setup Confluent Cloud Kafka (Free Tier)

1. Go to https://confluent.cloud/
2. Create free account
3. Create cluster:
   - Type: Basic
   - Region: us-east-1
   - Name: `kayak-kafka`
4. Create topics:
   - `flight-bookings`
   - `hotel-bookings`
   - `car-bookings`
5. Create API Key (save key + secret)
6. Get Bootstrap Server: `pkc-XXXXX.us-east-1.aws.confluent.cloud:9092`

---

## Phase 2: Deploy Docker Images to ECR (20 minutes)

### 2.1 Update Deployment Script

```bash
cd /Users/keith/Documents/MS\ DA\ Study/DATA\ 236-Distributed\ Systems/Kayak

# Edit deploy-minimal.sh
nano deploy-minimal.sh

# Update this line with your AWS Account ID:
AWS_ACCOUNT_ID="123456789012"  # Replace with your 12-digit account ID

# Make executable
chmod +x deploy-minimal.sh
```

### 2.2 Run Deployment Script

```bash
# This will:
# 1. Login to ECR
# 2. Create 3 repositories
# 3. Build 3 Docker images
# 4. Tag and push to ECR

./deploy-minimal.sh

# Expected output:
# ✅ Created repository: kayak-web-client
# ✅ Created repository: kayak-api-gateway
# ✅ Created repository: kayak-listing-service
# ✅ Built web-client
# ✅ Built api-gateway
# ✅ Built listing-service
# ✅ Pushed all images to ECR

# Verify images in ECR
aws ecr describe-repositories --query 'repositories[*].repositoryName'
```

---

## Phase 3: Update Task Definitions (10 minutes)

### 3.1 Update web-client-task.json

```bash
cd aws-task-definitions

# Edit web-client-task.json
nano web-client-task.json

# Replace "YOUR_AWS_ACCOUNT" with your account ID (line 8)
# Before: "YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1..."
# After:  "123456789012.dkr.ecr.us-east-1..."
```

### 3.2 Update api-gateway-task.json

```bash
# Edit api-gateway-task.json
nano api-gateway-task.json

# Replace:
# 1. Line 8: YOUR_AWS_ACCOUNT → your account ID
# 2. Line 22: AUTH_SERVICE_URL → http://localhost:3001 (dummy for now)
# 3. Line 26: USER_SERVICE_URL → http://localhost:3002 (dummy for now)
# 4. Line 30: LISTING_SERVICE_URL → http://listing-service.kayak.local:3003
# 5. Line 34: BOOKING_SERVICE_URL → http://localhost:3004 (dummy for now)
```

### 3.3 Update listing-service-task.json

```bash
# Edit listing-service-task.json
nano listing-service-task.json

# Replace:
# 1. Line 8: YOUR_AWS_ACCOUNT → your account ID
# 2. Line 21: YOUR_RDS_ENDPOINT → kayak-mysql.XXXXX.us-east-1.rds.amazonaws.com
# 3. Line 29: YOUR_RDS_PASSWORD → YourSecurePassword123!
# 4. Line 37: Already has correct MongoDB URI (no change needed)
# 5. Line 41: YOUR_REDIS_ENDPOINT → redis-XXXXX.cloud.redislabs.com:12345
# 6. Line 45: YOUR_KAFKA_BOOTSTRAP_SERVERS → pkc-XXXXX.us-east-1.aws.confluent.cloud:9092

# Add Redis password (insert after line 41):
{
  "name": "REDIS_PASSWORD",
  "value": "your-redis-password"
},

# Add Kafka credentials (insert after line 45):
{
  "name": "KAFKA_USERNAME",
  "value": "your-kafka-api-key"
},
{
  "name": "KAFKA_PASSWORD",
  "value": "your-kafka-api-secret"
},
```

---

## Phase 4: Deploy to ECS (20 minutes)

### 4.1 Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name kayak-cluster --region us-east-1

# Verify cluster created
aws ecs describe-clusters --clusters kayak-cluster
```

### 4.2 Register Task Definitions

```bash
cd aws-task-definitions

# Register all 3 task definitions
aws ecs register-task-definition --cli-input-json file://web-client-task.json
aws ecs register-task-definition --cli-input-json file://api-gateway-task.json
aws ecs register-task-definition --cli-input-json file://listing-service-task.json

# Verify task definitions registered
aws ecs list-task-definitions
```

### 4.3 Create Application Load Balancer

```bash
# Get default VPC and subnets
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text)

SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[*].SubnetId' \
  --output text | tr '\t' ' ')

# Create security group for ALB
aws ec2 create-security-group \
  --group-name kayak-alb-sg \
  --description "Security group for Kayak ALB" \
  --vpc-id $VPC_ID

ALB_SG_ID=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=kayak-alb-sg" \
  --query 'SecurityGroups[0].GroupId' \
  --output text)

# Allow HTTP traffic
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Create ALB
aws elbv2 create-load-balancer \
  --name kayak-alb \
  --subnets $SUBNET_IDS \
  --security-groups $ALB_SG_ID \
  --scheme internet-facing \
  --type application

# Get ALB ARN
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --names kayak-alb \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

# Get ALB DNS
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names kayak-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

echo "ALB DNS: http://$ALB_DNS"
```

### 4.4 Create Target Groups

```bash
# Target group for web-client (port 80)
aws elbv2 create-target-group \
  --name kayak-web-tg \
  --protocol HTTP \
  --port 80 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /

WEB_TG_ARN=$(aws elbv2 describe-target-groups \
  --names kayak-web-tg \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

# Target group for api-gateway (port 3000)
aws elbv2 create-target-group \
  --name kayak-api-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /health

API_TG_ARN=$(aws elbv2 describe-target-groups \
  --names kayak-api-tg \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)
```

### 4.5 Create Listener Rules

```bash
# Create listener for ALB (port 80)
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$WEB_TG_ARN

LISTENER_ARN=$(aws elbv2 describe-listeners \
  --load-balancer-arn $ALB_ARN \
  --query 'Listeners[0].ListenerArn' \
  --output text)

# Add rule to forward /api/* to api-gateway
aws elbv2 create-rule \
  --listener-arn $LISTENER_ARN \
  --priority 1 \
  --conditions Field=path-pattern,Values='/api/*' \
  --actions Type=forward,TargetGroupArn=$API_TG_ARN
```

### 4.6 Create ECS Services

```bash
# Create security group for ECS tasks
aws ec2 create-security-group \
  --group-name kayak-ecs-sg \
  --description "Security group for Kayak ECS tasks" \
  --vpc-id $VPC_ID

ECS_SG_ID=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=kayak-ecs-sg" \
  --query 'SecurityGroups[0].GroupId' \
  --output text)

# Allow traffic from ALB to ECS
aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG_ID \
  --protocol tcp \
  --port 80 \
  --source-group $ALB_SG_ID

aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG_ID \
  --protocol tcp \
  --port 3000 \
  --source-group $ALB_SG_ID

aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG_ID \
  --protocol tcp \
  --port 3003 \
  --source-group $ECS_SG_ID

# Get first two subnet IDs (comma-separated)
SUBNET_LIST=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[0:2].SubnetId' \
  --output text | tr '\t' ',')

# Create web-client service
aws ecs create-service \
  --cluster kayak-cluster \
  --service-name web-client \
  --task-definition kayak-web-client \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_LIST],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$WEB_TG_ARN,containerName=web-client,containerPort=80"

# Create api-gateway service
aws ecs create-service \
  --cluster kayak-cluster \
  --service-name api-gateway \
  --task-definition kayak-api-gateway \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_LIST],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$API_TG_ARN,containerName=api-gateway,containerPort=3000"

# Create listing-service (no load balancer, internal only)
aws ecs create-service \
  --cluster kayak-cluster \
  --service-name listing-service \
  --task-definition kayak-listing-service \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_LIST],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}"

# Wait for services to start (2-3 minutes)
aws ecs wait services-stable --cluster kayak-cluster --services web-client api-gateway listing-service

# Check service status
aws ecs describe-services --cluster kayak-cluster --services web-client api-gateway listing-service
```

---

## Phase 5: Testing (10 minutes)

### 5.1 Get ALB DNS Name

```bash
aws elbv2 describe-load-balancers \
  --names kayak-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text

# Output: kayak-alb-XXXXX.us-east-1.elb.amazonaws.com
```

### 5.2 Test Endpoints

```bash
# Test web client (should return HTML)
curl http://kayak-alb-XXXXX.us-east-1.elb.amazonaws.com/

# Test API gateway health
curl http://kayak-alb-XXXXX.us-east-1.elb.amazonaws.com/api/health

# Test listing service (via gateway)
curl http://kayak-alb-XXXXX.us-east-1.elb.amazonaws.com/api/listings/flights?limit=5

# Open in browser
open http://kayak-alb-XXXXX.us-east-1.elb.amazonaws.com/
```

### 5.3 Check CloudWatch Logs

```bash
# View web-client logs
aws logs tail /ecs/kayak-web-client --follow

# View api-gateway logs
aws logs tail /ecs/kayak-api-gateway --follow

# View listing-service logs
aws logs tail /ecs/kayak-listing-service --follow
```

---

## Phase 6: Monitoring & Costs

### 6.1 Monitor Costs

```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -v1d +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE

# Enable billing alerts (one-time setup)
aws cloudwatch put-metric-alarm \
  --alarm-name kayak-billing-alarm \
  --alarm-description "Alert when charges exceed $50" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold
```

### 6.2 Stop Services (When Not Testing)

```bash
# Scale down to 0 to avoid charges
aws ecs update-service --cluster kayak-cluster --service web-client --desired-count 0
aws ecs update-service --cluster kayak-cluster --service api-gateway --desired-count 0
aws ecs update-service --cluster kayak-cluster --service listing-service --desired-count 0

# Stop RDS (manual in console - saves 50% of cost)
# Console → RDS → kayak-mysql → Actions → Stop temporarily
```

### 6.3 Restart Services

```bash
# Scale back up when needed
aws ecs update-service --cluster kayak-cluster --service web-client --desired-count 1
aws ecs update-service --cluster kayak-cluster --service api-gateway --desired-count 1
aws ecs update-service --cluster kayak-cluster --service listing-service --desired-count 1

# Start RDS (manual in console)
# Console → RDS → kayak-mysql → Actions → Start
```

---

## Troubleshooting

### Services not starting

```bash
# Check task failures
aws ecs describe-tasks \
  --cluster kayak-cluster \
  --tasks $(aws ecs list-tasks --cluster kayak-cluster --query 'taskArns[0]' --output text)

# Check CloudWatch logs
aws logs tail /ecs/kayak-api-gateway --since 5m
```

### Cannot access ALB

```bash
# Verify security group allows port 80
aws ec2 describe-security-groups --group-ids $ALB_SG_ID

# Check target health
aws elbv2 describe-target-health --target-group-arn $WEB_TG_ARN
```

### Database connection errors

```bash
# Test RDS connectivity from your machine
mysql -h kayak-mysql.XXXXX.us-east-1.rds.amazonaws.com -u admin -p

# Check RDS security group allows ECS tasks
aws ec2 describe-security-groups --group-ids $SG_ID
```

---

## Cleanup (When Project Complete)

```bash
# Delete ECS services
aws ecs delete-service --cluster kayak-cluster --service web-client --force
aws ecs delete-service --cluster kayak-cluster --service api-gateway --force
aws ecs delete-service --cluster kayak-cluster --service listing-service --force

# Delete cluster
aws ecs delete-cluster --cluster kayak-cluster

# Delete ALB
aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN

# Delete target groups
aws elbv2 delete-target-group --target-group-arn $WEB_TG_ARN
aws elbv2 delete-target-group --target-group-arn $API_TG_ARN

# Delete RDS
aws rds delete-db-instance --db-instance-identifier kayak-mysql --skip-final-snapshot

# Delete ECR repositories
aws ecr delete-repository --repository-name kayak-web-client --force
aws ecr delete-repository --repository-name kayak-api-gateway --force
aws ecr delete-repository --repository-name kayak-listing-service --force

# Delete security groups (after resources deleted)
aws ec2 delete-security-group --group-id $ALB_SG_ID
aws ec2 delete-security-group --group-id $ECS_SG_ID
aws ec2 delete-security-group --group-id $SG_ID
```

---

## Summary

**Total Setup Time**: ~90 minutes

**Services Deployed**:
- ✅ Web Client (React UI on Nginx)
- ✅ API Gateway (routing and authentication)
- ✅ Listing Service (flights/hotels/cars data)

**External Services**:
- ✅ AWS RDS MySQL (free tier)
- ✅ MongoDB Atlas (already setup)
- ✅ Redis Cloud (free tier)
- ✅ Confluent Kafka (free tier)

**Monthly Cost**: 
- Running 24/7: ~$50-60
- Running 8 hours/day: ~$15-20
- Free tier optimized: ~$0-10

**Your ALB URL**: `http://kayak-alb-XXXXX.us-east-1.elb.amazonaws.com`

Share this URL with your team for testing! 🚀
