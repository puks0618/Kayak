# Kayak Microservices Platform

A comprehensive travel booking platform built with microservices architecture, featuring flight, hotel, and car rental services with AI-powered recommendations.

## 🏗️ Architecture Overview

This project consists of:
- **8 Microservices** (API Gateway, Auth, User, Listing, Search, Booking, Analytics, Admin)
- **AI Agent** for intelligent recommendations and trip planning
- **2 Frontend Applications** (Web Client & Admin Portal)
- **Infrastructure** (MySQL, MongoDB, Redis, Kafka, Zookeeper)

## 📋 Prerequisites

Before getting started, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.9 or higher) - [Download](https://python.org/)
- **Docker** & **Docker Compose** - [Download](https://docker.com/)
- **Git** - [Download](https://git-scm.com/)

### Verify Installation
```bash
node --version    # Should be v18+
python --version  # Should be v3.9+
docker --version
docker-compose --version
```

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/puks0618/Kayak.git
cd Kayak/kayak-microservices
```

### 2. Automated Setup (Recommended)
```bash
# Make setup script executable and run
chmod +x scripts/setup-local.sh
./scripts/setup-local.sh
```

### 3. Manual Setup (Alternative)

#### Step 3a: Install Dependencies
```bash
# API Gateway
cd api-gateway && npm install && cd ..

# Install all service dependencies
for service in auth-service user-service listing-service search-service booking-service analytics-service admin-service; do
  cd services/$service && npm install && cd ../..
done

# AI Agent (Python)
cd services/ai-agent && pip install -r requirements.txt && cd ../..

# Frontend Applications
cd frontend/web-client && npm install && cd ../..
cd frontend/admin-portal && npm install && cd ../..
```

#### Step 3b: Start Infrastructure
```bash
cd infrastructure/docker
docker-compose up -d mysql mongodb redis zookeeper kafka
cd ../..
```

#### Step 3c: Create Kafka Topics
```bash
# Wait for Kafka to be ready (30-60 seconds)
sleep 60

# Create topics
chmod +x infrastructure/kafka/topics/create-topics.sh
docker exec kayak-kafka /bin/bash -c "
  kafka-topics --create --if-not-exists --bootstrap-server localhost:9092 --topic user.created --partitions 3 --replication-factor 1
  kafka-topics --create --if-not-exists --bootstrap-server localhost:9092 --topic listing.created --partitions 5 --replication-factor 1
  kafka-topics --create --if-not-exists --bootstrap-server localhost:9092 --topic booking.created --partitions 5 --replication-factor 1
"
```

### 4. Start All Services

#### Option A: Using Docker Compose (Recommended)
```bash
cd infrastructure/docker
docker-compose up --build
```

#### Option B: Start Services Individually
```bash
# Terminal 1 - API Gateway
cd api-gateway && npm start

# Terminal 2 - Auth Service
cd services/auth-service && npm start

# Terminal 3 - User Service
cd services/user-service && npm start

# Terminal 4 - Listing Service
cd services/listing-service && npm start

# Terminal 5 - Search Service
cd services/search-service && npm start

# Terminal 6 - Booking Service
cd services/booking-service && npm start

# Terminal 7 - Analytics Service
cd services/analytics-service && npm start

# Terminal 8 - Admin Service
cd services/admin-service && npm start

# Terminal 9 - AI Agent
cd services/ai-agent && python main.py

# Terminal 10 - Web Client
cd frontend/web-client && npm run dev

# Terminal 11 - Admin Portal
cd frontend/admin-portal && npm run dev
```

## 🌐 Service URLs

Once all services are running, you can access:

| Service | URL | Description |
|---------|-----|-------------|
| **API Gateway** | http://localhost:3000 | Main entry point for all API requests |
| **Web Client** | http://localhost:5173 | Customer-facing web application |
| **Admin Portal** | http://localhost:5174 | Administrative dashboard |
| Auth Service | http://localhost:3001 | User authentication & authorization |
| User Service | http://localhost:3002 | User profile management |
| Listing Service | http://localhost:3003 | Hotels, flights, cars listings |
| Search Service | http://localhost:3004 | Search and filtering |
| Booking Service | http://localhost:3005 | Reservation management |
| Analytics Service | http://localhost:3006 | Business intelligence |
| Admin Service | http://localhost:3007 | Administrative operations |
| AI Agent | http://localhost:8000 | AI recommendations & trip planning |

## 🗄️ Database Access

| Database | URL | Credentials |
|----------|-----|-------------|
| **MySQL** | localhost:3306 | root / rootpassword |
| **MongoDB** | localhost:27017 | No authentication |
| **Redis** | localhost:6379 | No authentication |
| **Kafka** | localhost:9092 | No authentication |

## 🔍 Health Checks

Check if all services are running properly:

```bash
# Run health check script
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

Or check individual services:
```bash
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
curl http://localhost:8000/health  # AI Agent
```

## 🧪 Testing

### Generate Test Data
```bash
# Generate sample data for testing
python scripts/generate-test-data.py
```

### Run Tests
```bash
# Unit tests for individual services
cd services/auth-service && npm test
cd services/user-service && npm test

# Integration tests
cd testing/integration-tests && npm test

# Contract tests
cd testing/contract-tests && npm test
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find and kill process using port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Docker Services Won't Start**
   ```bash
   # Clean up Docker
   docker-compose down -v
   docker system prune -f
   docker-compose up --build
   ```

3. **Kafka Connection Issues**
   ```bash
   # Restart Kafka services
   docker-compose restart zookeeper kafka
   # Wait 60 seconds, then restart dependent services
   ```

4. **Database Connection Errors**
   ```bash
   # Check if databases are running
   docker ps | grep -E "(mysql|mongo|redis)"
   
   # Restart databases
   docker-compose restart mysql mongodb redis
   ```

### Logs
```bash
# View logs for specific service
docker-compose logs -f api-gateway
docker-compose logs -f auth-service

# View all logs
docker-compose logs -f
```

## 📁 Project Structure

```
kayak-microservices/
├── api-gateway/           # API Gateway service
├── services/              # All microservices
│   ├── auth-service/      # Authentication & authorization
│   ├── user-service/      # User management
│   ├── listing-service/   # Hotels, flights, cars
│   ├── search-service/    # Search & filtering
│   ├── booking-service/   # Reservations & payments
│   ├── analytics-service/ # Business intelligence
│   ├── admin-service/     # Admin operations
│   └── ai-agent/          # AI recommendations (Python)
├── frontend/              # Frontend applications
│   ├── web-client/        # Customer web app (React)
│   └── admin-portal/      # Admin dashboard (React)
├── infrastructure/        # Infrastructure setup
│   ├── docker/            # Docker Compose files
│   ├── databases/         # Database initialization
│   └── kafka/             # Kafka configuration
├── shared/                # Shared utilities & models
├── scripts/               # Setup & utility scripts
└── testing/               # Test suites
```

## 🔧 Development

### Environment Variables

Create `.env` files in each service directory with required configurations:

```bash
# Example for auth-service/.env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=kayak_auth
JWT_SECRET=your-secret-key
```

### Adding New Services

1. Create service directory in `services/`
2. Add Dockerfile
3. Update `docker-compose.yml`
4. Add service routes to API Gateway
5. Update this README

## 📚 API Documentation

API documentation is available in the `docs/` directory:
- [API Design](docs/API-Design.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review service logs: `docker-compose logs -f [service-name]`
3. Run health checks: `./scripts/health-check.sh`
4. Open an issue on GitHub

---

**Happy Coding! 🚀**
