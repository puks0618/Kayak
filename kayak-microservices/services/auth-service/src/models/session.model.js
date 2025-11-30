/**
 * Session Model (MongoDB)
 * Stores active user sessions
 */

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userAgent: String,
  ipAddress: String,
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    enum: ['traveller', 'owner', 'admin'],
    required: true
  }
}, {
  timestamps: true
});

// Auto-delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Update last activity on access
sessionSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Check if session is valid
sessionSchema.methods.isValid = function() {
  return this.expiresAt > new Date();
};

// Static method to clean expired sessions
sessionSchema.statics.cleanExpired = async function() {
  const now = new Date();
  const result = await this.deleteMany({ expiresAt: { $lt: now } });
  return result.deletedCount;
};

// Static method to get active sessions for a user
sessionSchema.statics.getActiveSessions = async function(userId) {
  const now = new Date();
  return this.find({ 
    userId, 
    expiresAt: { $gt: now } 
  }).sort({ lastActivity: -1 });
};

// Static method to revoke all sessions for a user
sessionSchema.statics.revokeUserSessions = async function(userId) {
  const result = await this.deleteMany({ userId });
  return result.deletedCount;
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
