# Kayak Admin System - Quick Start Script
# Run this to start everything with docker-compose

Write-Host "🚀 Starting Kayak Admin System..." -ForegroundColor Green
Write-Host ""

# Navigate to docker directory
$dockerPath = "kayak-microservices\infrastructure\docker"
if (-Not (Test-Path $dockerPath)) {
    Write-Host "❌ Error: Docker directory not found at $dockerPath" -ForegroundColor Red
    Write-Host "   Make sure you're running this from the project root directory" -ForegroundColor Yellow
    exit 1
}

Set-Location $dockerPath

# Check if Docker is running
try {
    docker ps | Out-Null
} catch {
    Write-Host "❌ Error: Docker is not running" -ForegroundColor Red
    Write-Host "   Please start Docker Desktop and try again" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Docker is running" -ForegroundColor Green

# Stop existing containers
Write-Host ""
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Start all services
Write-Host ""
Write-Host "🐳 Starting all services with docker-compose..." -ForegroundColor Cyan
docker-compose up -d

# Wait for services to be ready
Write-Host ""
Write-Host "⏳ Waiting for services to start (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service status
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Green
docker-compose ps

Write-Host ""
Write-Host "✅ Kayak Admin System is starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access Points:" -ForegroundColor Cyan
Write-Host "   Admin Portal:    http://localhost:5174" -ForegroundColor White
Write-Host "   Web Client:      http://localhost:5175" -ForegroundColor White
Write-Host "   API Gateway:     http://localhost:3000" -ForegroundColor White
Write-Host "   Admin Service:   http://localhost:3007" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Default Admin Credentials:" -ForegroundColor Cyan
Write-Host "   Email:    admin@kayak.com" -ForegroundColor White
Write-Host "   Password: Admin123!" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   Implementation Guide:  ADMIN_IMPLEMENTATION_GUIDE.md" -ForegroundColor White
Write-Host "   Complete Summary:      IMPLEMENTATION_COMPLETE.md" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Wait 1-2 minutes for all services to fully initialize" -ForegroundColor Yellow
Write-Host ""

# Return to original directory
Set-Location ..\..
