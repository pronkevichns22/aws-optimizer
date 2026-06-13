// ============================================================================
// FILE: models.ts
// LOCATION: server/src/
// PURPOSE: MongoDB schemas for user authentication, sessions, and chat history
// ============================================================================

import mongoose from 'mongoose';

// ============================================================================
// USER SCHEMA - Stores user account information and encrypted AWS credentials
// ============================================================================
export const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    minlength: 3,
    maxlength: 50
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: /.+\@.+\..+/
  },
  password: { 
    type: String, 
    required: true 
  }, // Hashed password (bcryptjs)
  
  // AWS Credentials (encrypted)
  awsAccessKeyId: { type: String, default: null },
  awsSecretAccessKey: { type: String, default: null },
  awsRegion: { type: String, default: 'us-east-1' },
  isLocalStack: { type: Boolean, default: false },
  // For VirtualBox VM with port forwarding: Use localhost:4566 (127.0.0.1:4566 → VM:4566)
  localStackEndpoint: { type: String, default: 'http://localhost:4566' },
  
  // Encryption IV (used for credential encryption)
  credentialsIV: { type: String, default: null },
  
  // User preferences
  preferences: {
    theme: { type: String, default: 'dark' },
    notifications: { type: Boolean, default: true },
    autoRefresh: { type: Boolean, default: true },
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null },
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);

// ============================================================================
// USER SESSION SCHEMA - JWT session tracking
// ============================================================================
export const UserSessionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  token: { 
    type: String, 
    required: true,
    unique: true
  },
  ipAddress: String,
  userAgent: String,
  expiresAt: { 
    type: Date, 
    required: true,
    index: true // Auto-delete expired sessions
  },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// TTL index to auto-delete expired sessions
UserSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const UserSession = mongoose.model('UserSession', UserSessionSchema);

// ============================================================================
// CHAT HISTORY SCHEMA - Stores AI Advisor chat conversations per user
// ============================================================================
export const ChatHistorySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  chatSessionId: { 
    type: String, 
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  messages: [
    {
      role: { type: String, enum: ['user', 'assistant'], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    }
  ],
  
  // Metadata for chat
  context: {
    resourceCount: Number,
    totalCost: Number,
    alertCount: Number,
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastAccessedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Index for fast retrieval of user chats
ChatHistorySchema.index({ userId: 1, createdAt: -1 });

export const ChatHistory = mongoose.model('ChatHistory', ChatHistorySchema);

// ============================================================================
// AI PREFERENCES SCHEMA - User-specific AI advisor preferences
// ============================================================================
export const AIPreferencesSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // AI Model preferences
  focusAreas: {
    security: { type: Boolean, default: true },
    costOptimization: { type: Boolean, default: true },
    performance: { type: Boolean, default: false },
  },
  
  // Alert preferences
  alertSeverityThreshold: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'HIGH' },
  maxRecommendations: { type: Number, default: 5 },
  
  // Communication style
  responseLength: { type: String, enum: ['brief', 'detailed', 'comprehensive'], default: 'detailed' },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const AIPreferences = mongoose.model('AIPreferences', AIPreferencesSchema);

// ============================================================================
// SECURITY METRICS SCHEMA - Stores historical security metrics for trends
// ============================================================================
export const SecurityMetricsSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true
  },
  
  // Timestamp for when metrics were recorded
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  
  // Alert counts by severity
  alertCounts: {
    critical: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    warning: { type: Number, default: 0 },
    info: { type: Number, default: 0 },
  },
  
  // Security scores
  healthScore: { type: Number, default: 0 },
  configurationIssues: { type: Number, default: 0 },
  
  // Resource summary
  totalResources: { type: Number, default: 0 },
  resourceCounts: {
    ec2: { type: Number, default: 0 },
    ebs: { type: Number, default: 0 },
    elasticIPs: { type: Number, default: 0 },
    securityGroups: { type: Number, default: 0 },
  },
  
  // Cost metrics
  totalSpend: { type: Number, default: 0 },
  totalWaste: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

// Index for efficient historical queries
SecurityMetricsSchema.index({ userId: 1, timestamp: -1 });

export const SecurityMetrics = mongoose.model('SecurityMetrics', SecurityMetricsSchema);
