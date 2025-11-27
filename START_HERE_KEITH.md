# 🚀 START HERE - Keith's Onboarding Guide

**Welcome to the Kayak Microservices Project!**

You're working on the **Flights Module** in the **Listing Service**. This document will get you started quickly.

---

## ✅ Quick Status Check

### What's Already Done:
- ✅ You cloned the repository from GitHub
- ✅ You're on the `feature/sqlset` branch (base branch with database setup)
- ✅ You created a new branch: `feature/flights-enhancement` (your working branch)
- ✅ Basic flights CRUD operations are implemented
- ✅ MySQL database is set up on AWS RDS
- ✅ Database tables are created

### What You Need to Do:
1. **Integrate MongoDB** for flight reviews
2. **Implement Kafka** event publishing
3. **Add Redis caching** for performance
4. **Enhance filtering** and validation

---

## 📚 Documentation Guide

I've created 4 comprehensive guides for you. **Read them in this order:**

### 1. **START_HERE_KEITH.md** (This file)
   - Quick overview and getting started
   - Read this first!

### 2. **KEITH_FLIGHTS_GUIDE.md** ⭐ **MOST IMPORTANT**
   - Detailed guide for your flights work
   - Step-by-step implementation instructions
   - Code examples and testing commands
   - **Read this next!**

### 3. **GIT_QUICK_REFERENCE.md**
   - Git commands explained simply
   - Common scenarios and solutions
   - Daily workflow guide
   - **Reference when using Git**

### 4. **ARCHITECTURE_VISUAL.md**
   - Visual diagrams of the system
   - How services connect
   - Data flow illustrations
   - **Reference to understand the big picture**

---

## 🎯 Your Current Branch Status

```bash
# You are currently on:
Branch: feature/flights-enhancement

# This branch was created from:
Base: feature/sqlset

# Your work will eventually merge back to:
Target: feature/sqlset
```

**Important:** All your work should be done on `feature/flights-enhancement` branch!

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Verify You're on the Right Branch

```bash
cd /Users/keith/Documents/MS\ DA\ Study/DATA\ 236-Distributed\ Systems/Kayak
git branch
# Should show: * feature/flights-enhancement
```

### Step 2: Look at the Files You'll Be Working On

```bash
cd kayak-microservices/services/listing-service/src/modules/flights

# List the files
ls -la

# You'll see:
# - model.js       (Database operations - mostly done)
# - controller.js  (Business logic - needs work)
# - route.js       (API endpoints - done)
```

### Step 3: Open Your Editor

```bash
# Open VS Code (or your preferred editor)
code .
```

### Step 4: Find the TODOs

Open these files and search for "TODO":
- `kayak-microservices/services/listing-service/src/modules/flights/controller.js`
  - Line 37: TODO: Fetch reviews from MongoDB
  - Line 57: TODO: Publish listing.created event

---

## 📋 Your Implementation Checklist

Copy this to a text file and check off as you complete:

```
Phase 1: Core Features (Start Here!)
[ ] Read KEITH_FLIGHTS_GUIDE.md completely
[ ] Understand the current code structure
[ ] Add MongoDB reviews to getById() method
[ ] Test MongoDB integration
[ ] Implement Kafka event publishing in create()
[ ] Implement Kafka event publishing in update()
[ ] Implement Kafka event publishing in delete()
[ ] Test Kafka events
[ ] Add Redis caching to getById()
[ ] Add Redis cache invalidation to update()
[ ] Add Redis cache invalidation to delete()
[ ] Test caching behavior

Phase 2: Enhanced Features
[ ] Create validator.js file
[ ] Add input validation
[ ] Add price range filtering
[ ] Add time range filtering
[ ] Add sorting functionality
[ ] Test all filters

Phase 3: Testing & Documentation
[ ] Test all endpoints with curl/Postman
[ ] Add code comments
[ ] Update documentation
[ ] Commit all changes
[ ] Push to GitHub
```

---

## 🛠️ Essential Commands

### Git Commands (Daily Use)

```bash
# Check your status
git status

# Save your work
git add .
git commit -m "feat(flights): describe what you did"

# Upload to GitHub
git push origin feature/flights-enhancement

# Get latest updates
git pull origin feature/sqlset
```

### Development Commands

```bash
# Start the listing service
cd kayak-microservices/services/listing-service
npm install  # First time only
npm start

# Test the API
curl http://localhost:3003/health
curl http://localhost:3003/api/listings/flights
```

### Docker Commands (For Infrastructure)

```bash
# Start databases
cd kayak-microservices/infrastructure/docker
docker-compose up -d mysql mongodb redis kafka

# Check if running
docker ps

# View logs
docker-compose logs -f listing-service

# Stop everything
docker-compose down
```

---

## 🎓 Learning Path

### Day 1: Understanding (Today!)
- ✅ Read all documentation guides
- ✅ Understand the project structure
- ✅ Set up your development environment
- ✅ Run the listing service locally
- ✅ Test existing endpoints

### Day 2: MongoDB Integration
- [ ] Read about MongoDB connections in the codebase
- [ ] Implement reviews fetching in getById()
- [ ] Test with sample data
- [ ] Commit your changes

### Day 3: Kafka Events
- [ ] Understand Kafka producer code
- [ ] Implement event publishing
- [ ] Test events are being sent
- [ ] Commit your changes

### Day 4: Redis Caching
- [ ] Understand Redis operations
- [ ] Implement caching logic
- [ ] Test cache hits/misses
- [ ] Commit your changes

### Day 5: Enhancements
- [ ] Add validation
- [ ] Add advanced filters
- [ ] Test everything
- [ ] Final commit and push

---

## 📞 When You Need Help

### Before Asking:
1. Read the error message carefully
2. Check the relevant guide document
3. Google the specific error
4. Try to debug with console.log()

### Ask Your Team When:
- You're stuck for more than 30 minutes
- You need clarification on requirements
- You're not sure which approach to take
- You encounter merge conflicts

### Good Questions:
- "I'm getting error X when doing Y, I tried Z but it didn't work"
- "Should I implement feature A or feature B first?"
- "Can you review my code for the MongoDB integration?"

### Bad Questions:
- "It doesn't work" (be specific!)
- "What should I do?" (refer to the guides first)
- "Can you do it for me?" (you got this!)

---

## 🎯 Success Criteria

You'll know you're done when:

✅ All TODOs in controller.js are implemented
✅ Flights can be created and retrieved with reviews
✅ Events are published to Kafka
✅ Caching works (check Redis)
✅ All tests pass
✅ Code is committed and pushed to GitHub
✅ Documentation is updated

---

## 🔥 Pro Tips

1. **Commit Often** - Every small working change should be committed
2. **Test Immediately** - Don't write lots of code before testing
3. **Read Error Messages** - They usually tell you exactly what's wrong
4. **Use Console.log** - Print variables to understand what's happening
5. **Take Breaks** - Step away when frustrated, come back fresh
6. **Ask Questions** - Your team is there to help!

---

## 📂 File Locations Quick Reference

```
Your main work area:
📁 services/listing-service/src/modules/flights/
   ├── controller.js  ← Your main work here
   ├── model.js       ← Database queries (mostly done)
   └── route.js       ← API endpoints (done)

Supporting files you'll use:
📁 services/listing-service/src/
   ├── cache/redis.js           ← Redis operations
   ├── config/mongo.js          ← MongoDB config
   ├── events/producers/        ← Kafka producers
   └── server.js                ← Service entry point

Shared utilities:
📁 shared/
   ├── database/
   │   ├── mysql.js             ← MySQL connection
   │   └── mongodb.js           ← MongoDB connection
   ├── constants/topics.js      ← Kafka topic names
   └── utils/                   ← Helper functions

Database initialization:
📁 infrastructure/databases/
   ├── mysql/init/03-listings.sql  ← Flights table schema
   └── mongodb/init/reviews.js     ← Reviews collection
```

---

## 🎬 Next Steps

1. **Read KEITH_FLIGHTS_GUIDE.md** (30 minutes)
   - This is your detailed implementation guide
   - Contains code examples and step-by-step instructions

2. **Read GIT_QUICK_REFERENCE.md** (15 minutes)
   - Learn the Git commands you'll use daily
   - Understand the workflow

3. **Skim ARCHITECTURE_VISUAL.md** (10 minutes)
   - Understand how everything connects
   - Reference when confused about the big picture

4. **Start Coding!** (Rest of your time)
   - Follow the checklist in KEITH_FLIGHTS_GUIDE.md
   - Start with MongoDB integration (easiest)
   - Test each change before moving on

---

## 🌟 You're Ready!

You have everything you need to succeed:
- ✅ Clear documentation
- ✅ Working base code
- ✅ Step-by-step guides
- ✅ Your own development branch
- ✅ A supportive team

**Take it one step at a time, and you'll do great!**

---

## 📞 Quick Contact

**Your Team:**
- Aishwarya Iyer
- Andreah Cruz
- Keith Gonsalves (You!)
- Prajwal Dambalkar
- Pukhraj Rathkanthiwar

**Project Repository:**
- https://github.com/puks0618/Kayak/tree/feature/sqlset

**Your Branch:**
- feature/flights-enhancement

---

**Now go read KEITH_FLIGHTS_GUIDE.md and start building! 🚀**

Good luck, Keith! You've got this! 💪

