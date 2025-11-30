# Billing Service Docker Integration - Quick Start Guide

## Overview
The billing service has been successfully converted into a Docker microservice and integrated into the Kayak microservices architecture.

## What Was Done

1. **Created Docker Configuration**
   - Dockerfile created in `services/billing-service/`
   - Uses Node 18 Alpine base image
   - Builds TypeScript during image creation
   - Exposes port 4000
   - Includes health check endpoint

2. **Updated docker-compose.yml**
   - Added billing-service definition
   - Configured environment variables for Docker network
   - Set up dependencies on mysql and mongodb
   - Added BILLING_SERVICE_URL to API gateway environment

3. **Service Configuration**
   - Port: 4000
   - MySQL: Uses Docker service `mysql` instead of localhost
   - MongoDB: Uses existing Atlas connection
   - Networks: Connected to `kayak-network`

## Starting the Services

### Option 1: Start All Services
```bash
cd kayak-microservices/infrastructure/docker
docker-compose up --build
```

This will start:
- MySQL (port 3307)
- MongoDB (port 27017)
- Redis (port 6379)
- Kafka & Zookeeper
- API Gateway (port 3000)
- All 8 microservices (ports 3001-3007, 4000, 8000)
- Web Client (port 5175)
- Admin Portal (port 5174)

### Option 2: Start Only Billing and Dependencies
```bash
cd kayak-microservices/infrastructure/docker
docker-compose up --build mysql mongodb billing-service
```

### Option 3: Start Billing with Web Client
```bash
cd kayak-microservices/infrastructure/docker
docker-compose up --build mysql mongodb billing-service web-client
```

## Verifying Billing Service

### 1. Check Service Health
```bash
# Windows PowerShell
Invoke-WebRequest http://localhost:4000/health | Select-Object -ExpandProperty Content

# Expected response:
# {"success":true,"message":"Billing API is running","timestamp":"..."}
```

### 2. Check Docker Container
```bash
docker ps | Select-String billing
# Should show: kayak-billing-service running on 4000->4000/tcp
```

### 3. Check Logs
```bash
docker logs kayak-billing-service
```

You should see:
- ✅ MySQL tables initialized successfully
- ✅ MongoDB Atlas connected successfully
- 🚀 Server is running on port 4000

## Testing the Billing Integration

### 1. Access Web Client
Open browser: http://localhost:5175

### 2. Navigate to Billing Section
- Click on user menu (top right)
- Click "Billing" option
- Should display billing records from database

### 3. Test API Endpoints Directly

**Get All Bills:**
```powershell
Invoke-RestMethod http://localhost:4000/api/billing
```

**Get Single Bill:**
```powershell
Invoke-RestMethod http://localhost:4000/api/billing/1
```

**Create New Bill:**
```powershell
$body = @{
    user_id = 1
    booking_type = "FLIGHT"
    booking_id = "BK12345"
    total_amount = 599.99
    payment_method = "CREDIT_CARD"
    transaction_status = "PENDING"
    invoice_details = @{
        items = @(@{ description = "Flight ticket"; amount = 599.99 })
    } | ConvertTo-Json
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/billing -Body $body -ContentType "application/json"
```

## Stopping Services

### Stop All Services
```bash
docker-compose down
```

### Stop and Remove Volumes (Clean State)
```bash
docker-compose down -v
```

## Troubleshooting

### Issue: Billing service won't start
**Solution:** Check if MySQL and MongoDB are running:
```bash
docker ps | Select-String "mysql|mongodb"
```

### Issue: Database connection errors
**Solution:** Verify environment variables in docker-compose.yml:
- MYSQL_HOST=mysql (not localhost)
- MYSQL_PASSWORD=Somalwar1!
- Ensure mysql service is healthy before billing starts

### Issue: Web client can't connect to billing
**Solution:** 
- Web client runs in Docker on port 5175 (mapped to 80 inside container)
- Billing service is accessible at http://localhost:4000 from host
- From inside Docker network, use http://billing-service:4000

### Issue: Port conflicts
**Solution:** Stop any services running on these ports:
- 4000 (billing backend)
- 5176 (web-client dev server)
```bash
# Stop standalone services first
Stop-Process -Name node -Force
```

## Architecture Differences

### Before (Standalone):
```
Web Client (localhost:5176) --> Billing Backend (localhost:4000)
                                      ↓
                         MySQL (localhost:3306)
                         MongoDB (Atlas)
```

### After (Docker):
```
Browser --> Web Client (localhost:5175) --> Billing Service (billing-service:4000)
                                                     ↓
                                    MySQL (mysql:3306 in Docker network)
                                    MongoDB (Atlas)
```

## Environment Variables

The billing service uses these environment variables in Docker:

```yaml
PORT=4000
MYSQL_HOST=mysql                    # Docker service name, not localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=Somalwar1!
MYSQL_DATABASE=kayak_billing
MONGODB_URI=mongodb+srv://...       # Atlas connection string
FRONTEND_URL=http://web-client
```

## Next Steps

1. **Test the Integration**
   - Start docker-compose
   - Access web client at http://localhost:5175
   - Navigate to Billing section
   - Verify existing records display
   - Try creating a new billing record

2. **Optional: Update Web Client API Configuration**
   - Currently web-client connects directly to port 4000
   - Could be routed through API Gateway (port 3000) for production
   - Update `frontend/web-client/src/services/api.js` if needed

3. **Commit Changes**
   - Dockerfile
   - .dockerignore
   - Updated docker-compose.yml
   - README.md
   - Push to feature/billingportalinadmin branch

## Files Modified

```
kayak-microservices/
├── services/billing-service/
│   ├── Dockerfile (NEW)
│   ├── .dockerignore (NEW)
│   ├── README.md (NEW)
│   └── (all backend files copied from /backend)
└── infrastructure/docker/
    └── docker-compose.yml (UPDATED - added billing-service)
```
