# ⚡ Analytics Quick Start

## 🎯 Start Testing in 3 Steps

### Step 1: Check What's Running
```bash
curl http://localhost:3007/health
curl http://localhost:5173
```

### Step 2: Open Analytics Dashboard
```
http://localhost:5173/analytics
```

### Step 3: If No Data, Add Test Data
```bash
mysql -u root -pSomalwar1! < kayak-microservices/scripts/create-analytics-test-data.sql
```

---

## 🚀 If Services Not Running

### Option A: Local Development
```bash
# Terminal 1
cd kayak-microservices/services/admin-service
npm start

# Terminal 2
cd kayak-microservices/frontend/admin-portal
npm run dev

# Browser: http://localhost:5173/analytics
```

### Option B: Docker (One Command)
```bash
cd kayak-microservices
./start-analytics-test.sh
```

---

## ✅ What to Test

1. **Overview Tab** - See summary cards, pie chart, line chart
2. **Top Properties** - View bar chart and table
3. **City Revenue** - Check city breakdown charts
4. **Top Providers** - Test period filter

---

## 🎉 That's It!

**Built Images:**
- ✅ kayak-microservices-admin-service
- ✅ kayak-microservices-admin-portal

**Documentation:**
- `ANALYTICS_COMPLETE_SUMMARY.md` - Full overview
- `DOCKER_BUILD_COMPLETE.md` - Docker details
- `ANALYTICS_IMPLEMENTATION.md` - Technical guide

**Ready to demo! 🚀📊✨**

