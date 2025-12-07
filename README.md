# Kayak Project - Quick Start

## ⚠️ Important: MySQL Port Configuration

**This project uses MySQL on PORT 3307 (not the default 3306).**

This is intentional to avoid conflicts with any existing MySQL installations on your computer. All services are already configured to use port 3307.

**If you see any errors about "connection refused" or "cannot connect to MySQL":**
1. Make sure Docker is running: `docker ps | grep mysql`
2. Check the port is correct: Should be **3307** not 3306
3. Verify in MySQL Workbench: Use port **3307** when connecting

---

## Setup (5 minutes)

### 1. Install Dependencies
```bash
# Install Node.js from https://nodejs.org (v18+)
# Install Docker Desktop from https://www.docker.com/products/docker-desktop
```

### 2. Start MySQL Database
```bash
cd kayak-microservices/infrastructure/docker
docker-compose up -d mysql redis
```

This runs MySQL on **port 3307** (not the default 3306, to avoid conflicts).

### 3. Start Backend Services

**Terminal 1 - Auth Service:**
```bash
cd kayak-microservices/services/auth-service
npm install
npm start
```

**Terminal 2 - Listing Service:**
```bash
cd kayak-microservices/services/listing-service
npm install
npm start
```

### 4. Start Frontend
**Terminal 3:**
```bash
cd kayak-microservices/frontend/web-client
npm install
npm run dev
```

### 5. Open Browser
Go to: **http://localhost:5175**

## That's It! 🎉

## Database Info (if needed for MySQL Workbench)
- Host: `localhost`
- Port: `3307` ⚠️ **USE 3307, NOT 3306!**
- User: `root`
- Password: `Somalwar1!`
- Databases: `kayak_auth`, `kayak_listings`

## Common Issues

**❌ "Can't connect to MySQL server on localhost:3306"**
- **Fix:** You're using the wrong port! Use **3307** not 3306.
- Update your connection string to use port 3307.

**❌ "Connection refused"**
- **Fix:** Make sure Docker MySQL is running:
  ```bash
  docker ps | grep mysql
  # Should show: kayak-mysql ... Up ... 0.0.0.0:3307->3306/tcp
  ```

**❌ "Auth service won't start"**
- **Fix:** Install dependencies first:
  ```bash
  cd kayak-microservices/services/auth-service
  npm install
  ```

## Troubleshooting

**Port already in use?**
```bash
# Check what's running
lsof -i :3307
# Kill it if needed
kill -9 [PID]
```

**"Cannot connect to database"?**
Make sure Docker is running and MySQL container is up:
```bash
docker ps | grep mysql
```
