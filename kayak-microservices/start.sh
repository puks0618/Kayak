#!/bin/bash

# Kayak Microservices Startup Script
# This script starts all services in the correct order

set -e

echo "🚀 Starting Kayak Microservices..."
echo ""

# Navigate to docker directory
cd "$(dirname "$0")/infrastructure/docker"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down 2>/dev/null || true
echo ""

# Start databases and infrastructure first
echo "📦 Starting databases and infrastructure..."
echo "   - MySQL (port 3307)"
echo "   - MongoDB (port 27017)"
echo "   - Redis (port 6379)"
echo "   - Zookeeper & Kafka (port 9092)"
docker-compose up -d mysql mongodb redis zookeeper kafka
echo ""

# Wait for databases to be ready
echo "⏳ Waiting for databases to initialize (30 seconds)..."
sleep 30
echo ""

# Start backend microservices
echo "🔧 Starting backend microservices..."
echo "   - API Gateway (port 3000)"
echo "   - Auth Service (port 3001)"
echo "   - User Service (port 3002)"
echo "   - Listing Service (port 3003)"
echo "   - Search Service (port 3004)"
echo "   - Booking Service (port 3005)"
echo "   - Analytics Service (port 3006)"
echo "   - Admin Service (port 3007)"
echo "   - AI Agent (port 8000)"
docker-compose up -d api-gateway auth-service user-service listing-service search-service booking-service analytics-service admin-service ai-agent
echo ""

# Wait for backend services to build and start
echo "⏳ Building and starting services (this may take a few minutes)..."
sleep 45
echo ""

# Start frontend applications
echo "🎨 Starting frontend applications..."
echo "   - Web Client (port 5175)"
echo "   - Admin Portal (port 5174)"
docker-compose up -d web-client admin-portal
echo ""

# Final wait for frontends to build
echo "⏳ Building frontend applications..."
sleep 30
echo ""

# Show status
echo "📊 Services Status:"
docker-compose ps
echo ""

# Show logs command
echo "✅ All services started!"
echo ""
echo "📝 Access your applications:"
echo "   🌐 Web Client:    http://localhost:5175"
echo "   🔐 Admin Portal:  http://localhost:5174"
echo "   🚪 API Gateway:   http://localhost:3000"
echo ""
echo "🔍 View logs:"
echo "   docker-compose logs -f [service-name]"
echo ""
echo "🛑 Stop all services:"
echo "   docker-compose down"
echo ""
