#!/bin/bash

# Local Development Setup Script for Kayak Microservices

set -e

echo "🚀 Setting up Kayak Microservices locally..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed. Aborting." >&2; exit 1; }

echo "✅ Prerequisites check passed"

# Copy environment file
if [ ! -f infrastructure/docker/.env ]; then
  echo "📝 Creating .env file..."
  cp infrastructure/docker/.env.example infrastructure/docker/.env
  echo "⚠️  Please update .env file with your configuration"
fi

# Start infrastructure services
echo "🐳 Starting infrastructure services (MySQL, MongoDB, Redis, Kafka)..."
cd infrastructure/docker
docker-compose up -d mysql mongodb redis zookeeper kafka
cd ../..

echo "⏳ Waiting for services to be ready..."
sleep 30

# Create Kafka topics
echo "📊 Creating Kafka topics..."
chmod +x infrastructure/kafka/topics/create-topics.sh
# infrastructure/kafka/topics/create-topics.sh

# Install dependencies for all services
echo "📦 Installing dependencies..."

echo "  - API Gateway"
cd api-gateway && npm install && cd ..

echo "  - Auth Service"
cd services/auth-service && npm install && cd ../..

echo "  - User Service"
cd services/user-service && npm install && cd ../..

echo "  - Listing Service"
cd services/listing-service && npm install && cd ../..

echo "  - Search Service"
cd services/search-service && npm install && cd ../..

echo "  - Booking Service"
cd services/booking-service && npm install && cd ../..

echo "  - Analytics Service"
cd services/analytics-service && npm install && cd ../..

echo "  - Admin Service"
cd services/admin-service && npm install && cd ../..

echo "  - AI Agent"
cd services/ai-agent && pip install -r requirements.txt && cd ../..

echo "  - Web Client"
cd frontend/web-client && npm install && cd ../..

echo "  - Admin Portal"
cd frontend/admin-portal && npm install && cd ../..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update infrastructure/docker/.env with your configuration"
echo "2. Start services with: docker-compose up"
echo "3. Or start individual services manually"
echo ""
echo "Service URLs:"
echo "  API Gateway:     http://localhost:3000"
echo "  Auth Service:    http://localhost:3001"
echo "  User Service:    http://localhost:3002"
echo "  Listing Service: http://localhost:3003"
echo "  Search Service:  http://localhost:3004"
echo "  Booking Service: http://localhost:3005"
echo "  Analytics:       http://localhost:3006"
echo "  Admin Service:   http://localhost:3007"
echo "  AI Agent:        http://localhost:8000"
echo "  Web Client:      http://localhost:5173"
echo "  Admin Portal:    http://localhost:5174"

