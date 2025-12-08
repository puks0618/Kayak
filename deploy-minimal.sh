#!/bin/bash

# Minimal Kayak Deployment Script
# This deploys only essential services to AWS

set -e

echo "🚀 Kayak Minimal Deployment"
echo "================================"

# Configuration - CHANGE THESE!
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="YOUR_AWS_ACCOUNT_ID"  # Get from: aws sts get-caller-identity
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
CLUSTER_NAME="kayak-cluster"

# Services to deploy (minimal set)
SERVICES=("web-client" "api-gateway" "listing-service")

echo "📋 Configuration:"
echo "   Region: ${AWS_REGION}"
echo "   Account: ${AWS_ACCOUNT_ID}"
echo "   Cluster: ${CLUSTER_NAME}"
echo ""

# Step 1: Login to ECR
echo "🔐 Step 1: Logging into AWS ECR..."
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Step 2: Create ECR repositories
echo "📦 Step 2: Creating ECR repositories..."
for service in "${SERVICES[@]}"; do
  echo "   Creating repository: kayak-${service}"
  aws ecr create-repository \
    --repository-name "kayak-${service}" \
    --region ${AWS_REGION} 2>/dev/null || echo "   Repository kayak-${service} already exists"
done

# Step 3: Build Docker images
echo "🔨 Step 3: Building Docker images..."
cd kayak-microservices/infrastructure/docker

for service in "${SERVICES[@]}"; do
  echo "   Building ${service}..."
  docker compose build ${service}
done

# Step 4: Tag images for ECR
echo "🏷️  Step 4: Tagging images..."
for service in "${SERVICES[@]}"; do
  echo "   Tagging ${service}..."
  docker tag "docker-${service}:latest" \
    "${ECR_REGISTRY}/kayak-${service}:latest"
done

# Step 5: Push images to ECR
echo "⬆️  Step 5: Pushing images to ECR..."
for service in "${SERVICES[@]}"; do
  echo "   Pushing ${service}..."
  docker push "${ECR_REGISTRY}/kayak-${service}:latest"
done

echo ""
echo "✅ Images pushed successfully!"
echo ""
echo "📝 Next Steps:"
echo "1. Setup RDS MySQL: https://console.aws.amazon.com/rds"
echo "2. Get MongoDB Atlas connection string (you already have this)"
echo "3. Create ECS cluster: aws ecs create-cluster --cluster-name ${CLUSTER_NAME}"
echo "4. Create task definitions (see task-definitions/ folder)"
echo "5. Create services and deploy"
echo ""
echo "🎯 Your images are at:"
for service in "${SERVICES[@]}"; do
  echo "   ${ECR_REGISTRY}/kayak-${service}:latest"
done
