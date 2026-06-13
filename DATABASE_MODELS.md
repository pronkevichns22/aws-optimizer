# DATABASE_MODELS.md - MongoDB Data Models & Schemas

## MongoDB Connection

**Connection String:** `mongodb://localhost:27017/aws_optimizer`

**Driver:** Mongoose 9.2.1

All models are defined in `server/src/models.ts` using Mongoose schemas.

---

## Collections & Schemas

### 1. **users** Collection

Stores user account information and authentication credentials.

**Mongoose Schema:**
```typescript
{
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  passwordHash: {
    type: String,
    required: true,
    minlength: 60  // bcryptjs hash length
  },
  firstName: {
    type: String,
    required: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    maxlength: 50
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  preferences: {
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    notifications: { type: Boolean, default: true },
    autoScan: { type: Boolean, default: false },
    scanInterval: { type: Number, default: 3600 }  // seconds
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

**Indexes:**
- `email` (UNIQUE) - For login lookups
- `createdAt` - For sorting users

**Sample Document:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "john.doe@example.com",
  "passwordHash": "$2b$10$N8pP...",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "preferences": {
    "theme": "dark",
    "notifications": true,
    "autoScan": false,
    "scanInterval": 3600
  },
  "createdAt": ISODate("2026-03-15T10:30:00.000Z"),
  "updatedAt": ISODate("2026-05-12T14:20:00.000Z")
}
```

**Relationships:**
- Referenced by: `usersessions`, `chathistories`, `audits`, `aipreferences`

---

### 2. **usersessions** Collection

Tracks active user sessions for multi-device support and logout management.

**Mongoose Schema:**
```typescript
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }  // Auto-delete expired sessions
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    platform: String  // 'windows', 'mac', 'ios', 'android'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}
```

**Indexes:**
- `userId` - For finding user's sessions
- `token` (UNIQUE) - For token validation
- `expiresAt` (TTL) - Auto-delete expired sessions after 7 days

**Sample Document:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": ISODate("2026-05-19T14:20:00.000Z"),
  "createdAt": ISODate("2026-05-12T14:20:00.000Z"),
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.100",
    "platform": "windows"
  },
  "isActive": true
}
```

---

### 3. **chathistories** Collection

Stores AI advisor chat conversations and message history.

**Mongoose Schema:**
```typescript
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      tokenCount: Number,
      executionTime: Number  // milliseconds
    }
  }],
  context: {
    resourceCount: Number,
    totalCost: Number,
    criticalAlerts: Number,
    lastScanId: String
  },
  archived: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes:**
- `userId` - For fetching user's chats
- `createdAt` - For sorting by date
- `archived` - For filtering active chats

**Sample Document:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439013"),
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "title": "Cost Optimization Discussion",
  "messages": [
    {
      "role": "user",
      "content": "How can I reduce my AWS costs?",
      "timestamp": ISODate("2026-05-10T14:20:00.000Z"),
      "metadata": {
        "tokenCount": 8,
        "executionTime": 245
      }
    },
    {
      "role": "assistant",
      "content": "Based on your infrastructure, here are the top recommendations...",
      "timestamp": ISODate("2026-05-10T14:21:15.000Z"),
      "metadata": {
        "tokenCount": 256,
        "executionTime": 1200
      }
    }
  ],
  "context": {
    "resourceCount": 15,
    "totalCost": 2450.75,
    "criticalAlerts": 2,
    "lastScanId": "scan_001"
  },
  "archived": false,
  "createdAt": ISODate("2026-05-10T14:20:00.000Z"),
  "updatedAt": ISODate("2026-05-12T10:35:00.000Z")
}
```

**Message Limits:**
- Max messages per chat: 1000
- Max message length: 10,000 characters
- Auto-archive after 90 days of inactivity

---

### 4. **audits** Collection

Security and activity audit logs for compliance tracking.

**Mongoose Schema:**
```typescript
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    enum: ['login', 'logout', 'scan', 'alert', 'export', 'settings', 'delete'],
    required: true
  },
  actionDetails: {
    resourceType: String,      // 'EC2', 'EBS', 'full'
    resourceId: String,        // AWS resource ID
    status: { type: String, enum: ['success', 'failure'] },
    resultCount: Number        // Items affected
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info'
  },
  clientInfo: {
    ipAddress: String,
    userAgent: String,
    platform: String,
    geoLocation: String       // City, Country
  },
  findings: {
    resourcesScanned: Number,
    alertsGenerated: Number,
    criticalsFound: Number
  },
  errorInfo: {
    errorCode: String,
    errorMessage: String,
    stackTrace: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}
```

**Indexes:**
- `userId` - For user audit logs
- `action` - For filtering by action type
- `timestamp` - For time-based queries
- `severity` - For critical event filtering

**Sample Document:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439014"),
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "action": "scan",
  "actionDetails": {
    "resourceType": "full",
    "status": "success",
    "resultCount": 15
  },
  "severity": "info",
  "clientInfo": {
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "platform": "windows",
    "geoLocation": "New York, USA"
  },
  "findings": {
    "resourcesScanned": 15,
    "alertsGenerated": 8,
    "criticalsFound": 2
  },
  "timestamp": ISODate("2026-05-12T10:30:00.000Z")
}
```

**Retention Policy:**
- Keep audit logs for 1 year minimum
- Archive logs older than 90 days
- Delete logs older than 3 years

---

### 5. **aipreferences** Collection

Stores user-specific AI advisor configuration.

**Mongoose Schema:**
```typescript
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  model: {
    type: String,
    enum: ['groq-mixtral', 'groq-llama2'],
    default: 'groq-mixtral'
  },
  temperature: {
    type: Number,
    min: 0.0,
    max: 1.0,
    default: 0.7
  },
  maxTokens: {
    type: Number,
    min: 100,
    max: 4000,
    default: 2000
  },
  systemPrompt: {
    type: String,
    maxlength: 5000,
    default: "You are a helpful AWS optimization expert..."
  },
  responseStyle: {
    type: String,
    enum: ['brief', 'detailed', 'technical'],
    default: 'detailed'
  },
  focusAreas: [{
    type: String,
    enum: ['cost', 'security', 'performance', 'compliance']
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Sample Document:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439015"),
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "model": "groq-mixtral",
  "temperature": 0.7,
  "maxTokens": 2000,
  "systemPrompt": "You are a helpful AWS optimization expert...",
  "responseStyle": "detailed",
  "focusAreas": ["cost", "security"],
  "createdAt": ISODate("2026-03-15T10:30:00.000Z"),
  "updatedAt": ISODate("2026-05-12T14:20:00.000Z")
}
```

---

## Data Relationships

### User-Centric Data Model

```
User
├── (1:N) UserSessions
│   └── Multiple active sessions per user
├── (1:N) ChatHistories
│   └── Multiple chat conversations
├── (1:N) Audits
│   └── Multiple audit log entries
└── (1:1) AIPreferences
    └── One set of AI settings per user
```

### Query Patterns

**Get all user's chats:**
```javascript
db.chathistories.find({ userId: ObjectId("..."), archived: false })
```

**Get user with recent chats:**
```javascript
db.chathistories.find({ userId: ObjectId("...") })
  .sort({ updatedAt: -1 })
  .limit(10)
```

**Get audit logs for security review:**
```javascript
db.audits.find({ 
  userId: ObjectId("..."),
  severity: { $in: ['warning', 'critical'] }
})
.sort({ timestamp: -1 })
.limit(100)
```

---

## Aggregation Pipeline Examples

### 1. Get user statistics
```javascript
db.audits.aggregate([
  { $match: { userId: ObjectId("...") } },
  { $group: {
    _id: null,
    totalScans: { $sum: { $cond: [{ $eq: ["$action", "scan"] }, 1, 0] } },
    totalAlerts: { $sum: "$findings.alertsGenerated" },
    criticalEvents: { $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] } }
  }}
])
```

### 2. Get chat message count per user
```javascript
db.chathistories.aggregate([
  { $group: {
    _id: "$userId",
    messageCount: { $sum: { $size: "$messages" } },
    chatCount: { $sum: 1 }
  }},
  { $lookup: {
    from: "users",
    localField: "_id",
    foreignField: "_id",
    as: "userInfo"
  }}
])
```

---

## Index Strategy

### Required Indexes
```javascript
// users collection
db.users.createIndex({ email: 1 }, { unique: true })

// usersessions collection
db.usersessions.createIndex({ userId: 1 })
db.usersessions.createIndex({ token: 1 }, { unique: true })
db.usersessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// chathistories collection
db.chathistories.createIndex({ userId: 1 })
db.chathistories.createIndex({ createdAt: -1 })
db.chathistories.createIndex({ archived: 1 })

// audits collection
db.audits.createIndex({ userId: 1 })
db.audits.createIndex({ action: 1 })
db.audits.createIndex({ timestamp: -1 })
db.audits.createIndex({ severity: 1 })

// aipreferences collection
db.aipreferences.createIndex({ userId: 1 }, { unique: true })
```

---

## Data Validation Rules

| Field | Validation | Error Message |
|-------|-----------|---------------|
| email | RFC 5322 format | Invalid email format |
| password | Min 8 chars, complexity | Password too weak |
| firstName | 1-50 chars, no special chars | Invalid first name |
| temperature | 0.0 - 1.0 float | Must be between 0 and 1 |
| maxTokens | 100 - 4000 integer | Must be between 100 and 4000 |

---

## Storage Capacity

| Collection | Avg Doc Size | Est. Docs (1M users) | Storage |
|-----------|-------------|-------------------|---------|
| users | 1 KB | 1M | ~1 GB |
| usersessions | 0.5 KB | 2M | ~1 GB |
| chathistories | 25 KB | 5M | ~125 GB |
| audits | 2 KB | 50M | ~100 GB |
| aipreferences | 1 KB | 1M | ~1 GB |
| **Total** | | **~59M docs** | **~228 GB** |

---

**Last Updated:** May 12, 2026  
**MongoDB Version:** 5.0+  
**Mongoose Version:** 9.2.1
