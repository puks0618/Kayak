#!/bin/bash

# Health Check Script for All Services

echo "🏥 Checking health of all services..."

services=(
  "API Gateway:http://localhost:3000/health"
  "Auth Service:http://localhost:3001/health"
  "User Service:http://localhost:3002/health"
  "Listing Service:http://localhost:3003/health"
  "Search Service:http://localhost:3004/health"
  "Booking Service:http://localhost:3005/health"
  "Analytics Service:http://localhost:3006/health"
  "Admin Service:http://localhost:3007/health"
  "AI Agent:http://localhost:8000/health"
)

all_healthy=true

for service in "${services[@]}"; do
  IFS=: read -r name url <<< "$service"
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
  
  if [ "$response" = "200" ]; then
    echo "✅ $name - OK"
  else
    echo "❌ $name - FAILED (HTTP $response)"
    all_healthy=false
  fi
done

echo ""
if [ "$all_healthy" = true ]; then
  echo "✅ All services are healthy!"
  exit 0
else
  echo "❌ Some services are unhealthy"
  exit 1
fi

