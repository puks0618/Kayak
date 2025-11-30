# 🚀 Kayak Microservices - Docker Quick Start

## Prerequisites
- ✅ Docker Desktop installed and **running**
- ✅ At least 8GB RAM allocated to Docker
- ✅ Ports available: 3000-3007, 5174-5175, 6379, 9092, 27017, 3307

---

## Quick Start (3 commands)

### 1. Start Docker Desktop
Open Docker Desktop and wait for it to fully start (whale icon steady in menu bar)

### 2. Run the startup script
```bash
cd /Users/spartan/Desktop/Projects/Kayak/Kayak/kayak-microservices
./start.sh
```

### 3. Open your browser
- **Web Client**: http://localhost:5175
- **Admin Portal**: http://localhost:5174
- **API Gateway**: http://localhost:3000

---

## What Gets Started

### 📦 Infrastructure (5 containers)
- MySQL (port 3307) - Relational database
- MongoDB (port 27017) - Document database
- Redis (port 6379) - Caching
- Zookeeper (port 2181) - Kafka coordinator
- Kafka (port 9092) - Event streaming

### 🔧 Backend Services (9 containers)
- API Gateway (port 3000)
- Auth Service (port 3001)
- User Service (port 3002)
- Listing Service (port 3003)
- Search Service (port 3004)
- Booking Service (port 3005)
- Analytics Service (port 3006)
- Admin Service (port 3007)
- AI Agent (port 8000)

### 🎨 Frontend Apps (2 containers)
- Web Client (port 5175)
- Admin Portal (port 5174)

**Total: 16 containers**

---

## Useful Commands

### View all running containers
```bash
cd /Users/spartan/Desktop/Projects/Kayak/Kayak/kayak-microservices/infrastructure/docker
docker-compose ps
```

### View logs for a service
```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f api-gateway
docker-compose logs -f web-client
docker-compose logs -f mysql
```

### Restart a specific service
```bash
docker-compose restart api-gateway
docker-compose restart web-client
```

### Rebuild a service after code changes
```bash
docker-compose up -d --build auth-service
```

### Stop all services
```bash
docker-compose down
```

### Stop and remove volumes (fresh start)
```bash
docker-compose down -v
```

---

## Troubleshooting

### ❌ "Cannot connect to Docker daemon"
**Problem**: Docker Desktop is not running
```bash
# Solution: Start Docker Desktop app
# Wait for whale icon to appear in menu bar
```

### ❌ "Port already in use"
**Problem**: Another service is using a required port
```bash
# Find what's using the port (example for 3000)
lsof -i :3000

# Kill the process
kill -9 [PID]
```

### ❌ "Container exited with code 1"
**Problem**: Service failed to start
```bash
# Check logs
docker-compose logs [service-name]

# Example
docker-compose logs auth-service
```

### ❌ "Cannot connect to database"
**Problem**: Database not ready yet
```bash
# Wait 30 seconds after starting, then check
docker-compose ps mysql
docker-compose logs mysql
```

### 🔄 Fresh restart
```bash
# Stop everything
docker-compose down -v

# Start again
./start.sh
```

---

## Development Workflow

### Making code changes

1. **Edit code** in your IDE
2. **Rebuild the service**:
   ```bash
   cd infrastructure/docker
   docker-compose up -d --build [service-name]
   ```
3. **View logs**:
   ```bash
   docker-compose logs -f [service-name]
   ```

### Testing API endpoints
```bash
# Health check
curl http://localhost:3000/health

# Test auth
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'
```

---

## Database Access

### MySQL (via MySQL Workbench or CLI)
- **Host**: `localhost`
- **Port**: `3307` (not 3306!)
- **User**: `root`
- **Password**: `Somalwar1!`
- **Databases**: `kayak_auth`, `kayak_users`, `kayak_listings`, `kayak_bookings`

```bash
# Connect via CLI
docker exec -it kayak-mysql mysql -uroot -pSomalwar1!
```

### MongoDB (via MongoDB Compass or CLI)
- **Connection String**: `mongodb://localhost:27017`
- **Databases**: `kayak_listings`, `kayak_analytics`

```bash
# Connect via CLI
docker exec -it kayak-mongodb mongosh
```

### Redis (via Redis CLI)
```bash
docker exec -it kayak-redis redis-cli
```

---

## Architecture

```
┌─────────────┐     ┌─────────────┐
│ Web Client  │────▶│ API Gateway │
│  (5175)     │     │   (3000)    │
└─────────────┘     └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐      ┌─────▼──────┐    ┌─────▼──────┐
   │  Auth   │      │   User     │    │  Listing   │
   │ (3001)  │      │  (3002)    │    │  (3003)    │
   └────┬────┘      └─────┬──────┘    └─────┬──────┘
        │                 │                  │
        └────────┬────────┴──────────────────┘
                 │
        ┌────────▼────────┐
        │  MySQL (3307)   │
        │ MongoDB (27017) │
        │  Redis (6379)   │
        │  Kafka (9092)   │
        └─────────────────┘
```

---

## Next Steps

1. ✅ Start Docker Desktop
2. ✅ Run `./start.sh`
3. ✅ Visit http://localhost:5175
4. 🎯 Start building!

---

## Need Help?

- Check logs: `docker-compose logs -f`
- Restart service: `docker-compose restart [service-name]`
- Fresh start: `docker-compose down -v && ./start.sh`
