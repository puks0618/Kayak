/**
 * Auth Service Server
 */

const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth.routes');
const Session = require('./models/session.model');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://kayak-mongodb:27017/kayak';

// Connect to MongoDB for session storage
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB for session storage');
  // Clean expired sessions on startup
  Session.cleanExpired().then(count => {
    if (count > 0) console.log(`🧹 Cleaned ${count} expired sessions`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  console.log('⚠️  Continuing without session persistence');
});

// Clean expired sessions every hour
setInterval(async () => {
  try {
    const count = await Session.cleanExpired();
    if (count > 0) console.log(`🧹 Cleaned ${count} expired sessions`);
  } catch (error) {
    console.error('Session cleanup error:', error);
  }
}, 3600000); // 1 hour

// CORS middleware to allow both frontend portals
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:5175', 'http://localhost:5174'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// JSON body parsing
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'auth-service' });
});

// Routes
app.use('/api/auth', authRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});

module.exports = app;

