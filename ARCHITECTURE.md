# ARCHITECTURE.md - Detailed System Architecture

## System Architecture Overview

AWS Optimizer is a **three-tier web application** with the following layers:

```
┌─────────────────────────────────┐
│       PRESENTATION LAYER        │
│    React Frontend (Port 5173)    │ ← User Interface
└──────────────┬──────────────────┘
               │ HTTP/REST API
┌──────────────▼──────────────────┐
│     APPLICATION LAYER           │
│   Express Server (Port 5000)     │ ← Business Logic
└──────────────┬──────────────────┘
               │ Database Queries
┌──────────────▼──────────────────┐
│      DATA PERSISTENCE LAYER     │
│    MongoDB (Port 27017)         │ ← Data Storage
└─────────────────────────────────┘
```

---

## Layer 1: Presentation Layer (Frontend)

### Technology Stack
- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite (fast development server)
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Charting:** Recharts
- **State Management:** React Context API

### Component Architecture

#### Page Structure
```
App.tsx (Main Router)
├── LoginPage (Authentication)
├── RegisterPage (User Registration)
├── DashboardLayout (Main Layout)
│   ├── Header (Top Navigation)
│   ├── DashboardSidebar (Action Buttons + AI Card)
│   └── Pages
│       ├── NewDashboard (Cost metrics, trends)
│       ├── NewResourcesPage (EC2, EBS, IPs list)
│       ├── SecurityPage (Alerts, vulnerabilities)
│       └── SettingsPage (User preferences)
```

#### Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **Header** | Navigation bar, user menu, logout | components/Layout/ |
| **Sidebar** | Navigation links, page routing | components/Layout/ |
| **DashboardSidebar** | Quick actions, AI advisor card | components/Layout/ |
| **StatCard** | Metric display (cost, resources) | components/ui/ |
| **DashboardMetrics** | Grid of metric cards | components/ui/ |
| **CostTrend** | Cost line chart (24h, 7d, 30d) | components/ui/ |
| **ResourcesTable** | EC2, EBS, IP resources table | components/ui/ |
| **SecurityAlertsTable** | Security findings table | components/ui/ |
| **Chart** | Generic chart wrapper | components/ui/ |
| **AIAdvisor** | Embedded AI chat widget | components/ |
| **AIAdvisorModal** | Fullscreen AI chat modal | components/ |

#### State Management Flow
```
App Context (Global State)
├── User authentication state
├── Dashboard data (resources, alerts)
├── Chat history
├── UI state (modals, notifications)
└── Preferences

Components (Local State)
└── Form inputs, temporary UI state
```

#### API Communication
```
React Component
    ↓ (axios.get/post)
Vite Proxy (localhost:5173 → localhost:5000)
    ↓ HTTP Request
Express Server
    ↓ (Process request)
MongoDB Query
    ↓ (Response)
Express Response (JSON)
    ↓ HTTP Response
React Component
    ↓ (Update state)
UI Re-render
```

---

## Layer 2: Application Layer (Backend)

### Technology Stack
- **Framework:** Express.js 5.2.1
- **Language:** TypeScript
- **ORM:** Mongoose
- **External APIs:** AWS SDK v3, Groq SDK
- **Authentication:** JWT (jsonwebtoken)
- **Password Security:** bcryptjs

### Folder Structure

```
server/src/
├── index.ts                  # Main server entry point
├── models.ts                 # Mongoose schemas
├── auth-routes.ts            # Authentication endpoints
├── auth-middleware.ts        # JWT verification
├── auth-utils.ts             # Cryptography utilities
├── chat-routes.ts            # Chat endpoints
├── ai-advisor.ts             # Groq LLM integration
├── TYPES_AND_RULES.ts        # Alert rules definitions
├── create-test-resources.ts  # Test data generation
└── test-groq.ts              # API testing
```

### Request Processing Pipeline

```
HTTP Request
    ↓
Express Middleware
├── CORS middleware
├── JSON parser
├── Optional Auth Middleware
└── Request validation
    ↓
Router Handler
├── Authentication check (if required)
├── Request validation
├── Business logic execution
│   ├── AWS SDK calls
│   ├── Database queries
│   ├── Rules engine processing
│   └── AI model inference
└── Response formatting
    ↓
HTTP Response (JSON)
```

### Module Breakdown

#### 1. **Authentication Module** (`auth-routes.ts`, `auth-utils.ts`)

**Endpoints:**
```
POST /api/auth/register
  └── Create new user account
  
POST /api/auth/login
  └── Authenticate user, return JWT
  
GET /api/auth/logout
  └── Invalidate user session
```

**Process:**
```
User Input (email, password)
    ↓
Validation (email format, password strength)
    ↓
Database check (email exists?)
    ↓
bcryptjs hash (if register)
    ↓
Create User Document
    ↓
Generate JWT Token
    ↓
Return token to client
    ↓
Client stores token in localStorage
    ↓
Subsequent requests include Authorization header
```

#### 2. **AWS Scanning Module** (`index.ts`)

**Functionality:**
```
POST /api/scan/full
  └── Execute complete infrastructure scan
```

**Scanning Process:**
```
User Request
    ↓
Authenticate user (JWT check)
    ↓
Initialize AWS SDK with user credentials
    ↓
Parallel API Calls:
  ├── EC2: DescribeInstances
  ├── EBS: DescribeVolumes
  ├── EIP: DescribeAddresses
  ├── SecurityGroups: DescribeSecurityGroups
  └── IAM: ListUsers, GetLoginProfile
    ↓
Parse AWS Responses
    ↓
Rules Engine Evaluation
  ├── Security checks (CSPM rules)
  ├── Cost optimization checks (FinOps rules)
  └── Compliance rules
    ↓
Generate Alerts & Findings
    ↓
Store in MongoDB
    ↓
Return results to frontend
```

#### 3. **Alert Rules Engine** (`TYPES_AND_RULES.ts`)

**Alert Types:**

| Alert Type | Category | Examples |
|-----------|----------|----------|
| **CSPM** (Cloud Security Posture Management) | Security | Public SG, Unencrypted EBS, Unused IAM users |
| **FinOps** (Financial Operations) | Cost | Unattached volumes, Floating IPs, Idle instances |
| **Compliance** | Compliance | VPC usage, Tag compliance |

**Rule Structure:**
```typescript
{
  id: "rule-001",
  name: "Unattached EBS Volume",
  category: "FinOps",
  severity: "medium",
  impact: "Unnecessary charges",
  recommendation: "Delete unattached volumes",
  check: (volume) => volume.State === 'available'
}
```

#### 4. **AI Advisor Module** (`ai-advisor.ts`)

**Endpoints:**
```
POST /api/ai-advisor
  ├── Input: message, context, chatHistory
  ├── Processing: Groq LLM API call
  └── Output: AI recommendation
```

**AI Processing Flow:**
```
User Query + Infrastructure Context
    ↓
Build Prompt with:
  ├── User message
  ├── Resource summary
  ├── Alert context
  ├── Cost analysis
  └── Security findings
    ↓
Call Groq API (with prompt)
    ↓
Groq LLM Processing
    ↓
Stream response back to client
    ↓
Parse and format response
    ↓
Save to ChatHistory in MongoDB
```

#### 5. **Chat Routes** (`chat-routes.ts`)

**Endpoints:**
```
GET /api/chat/history
  └── Retrieve user's chat history
  
POST /api/chat/message
  └── Create new message
  
DELETE /api/chat/:id
  └── Delete chat conversation
```

---

## Layer 3: Data Persistence Layer

### MongoDB Collections

#### 1. **users** Collection
```typescript
{
  _id: ObjectId,
  email: string,           // Unique identifier
  passwordHash: string,    // bcryptjs hashed
  firstName: string,
  lastName: string,
  createdAt: Date,
  updatedAt: Date,
  role: "user" | "admin",
  preferences: {
    theme: "dark" | "light",
    notifications: boolean,
    autoScan: boolean
  }
}
```

#### 2. **usersessions** Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId,              // Reference to users
  token: string,                 // JWT token
  expiresAt: Date,
  createdAt: Date,
  deviceInfo: string
}
```

#### 3. **chathistories** Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId,              // Reference to users
  title: string,                 // Chat title
  messages: [
    {
      role: "user" | "assistant",
      content: string,
      timestamp: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date,
  archived: boolean
}
```

#### 4. **audits** Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  action: string,                // "scan", "alert", "login"
  resourceType: string,          // "EC2", "EBS", "Security"
  severity: "info" | "warning" | "critical",
  findings: Object,              // Alert details
  timestamp: Date,
  status: "resolved" | "open"
}
```

#### 5. **aipreferences** Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  model: string,                 // "groq-mixtral" etc
  temperature: number,           // 0.0 - 1.0
  maxTokens: number,
  systemPrompt: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Database Connection Flow

```
Application Start
    ↓
Load MONGO_URI from .env
    ↓
mongoose.connect(MONGO_URI)
    ↓
Connection established (or error)
    ↓
Collections auto-created from Mongoose schemas
    ↓
Application ready for queries
```

---

## External Service Integration

### AWS SDK Integration

```
AWS Credentials (from .env or IAM role)
    ↓
Initialize EC2Client, IAMClient
    ↓
Execute API Commands:
  ├── DescribeInstances (EC2)
  ├── DescribeVolumes (EBS)
  ├── DescribeAddresses (Elastic IPs)
  ├── DescribeSecurityGroups (Security)
  └── ListUsers, GetLoginProfile (IAM)
    ↓
Parse responses
    ↓
Extract relevant fields
    ↓
Apply business logic/rules
```

### Groq LLM Integration

```
User Message + Context
    ↓
Format prompt with:
  ├── System instructions
  ├── Infrastructure context
  ├── Recent alerts
  ├── Cost data
  └── User question
    ↓
Call Groq API (groq-sdk)
    ├── Endpoint: api.groq.com/openai/v1/chat/completions
    ├── Model: mixtral-8x7b
    ├── Temperature: 0.7 (balanced responses)
    └── Max tokens: 2000
    ↓
Groq LLM Inference
    ↓
Stream response back
    ↓
Parse JSON response
    ↓
Save to ChatHistory
```

---

## Error Handling Strategy

### Global Error Categories

| Category | HTTP Status | Example |
|----------|------------|---------|
| **Validation Errors** | 400 | Missing required fields |
| **Authentication Errors** | 401 | Invalid JWT token |
| **Authorization Errors** | 403 | User lacks permissions |
| **Not Found** | 404 | Resource doesn't exist |
| **Server Errors** | 500 | Database connection failed |
| **External API Errors** | 503 | AWS/Groq API unavailable |

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_TOKEN",
    "message": "JWT token is invalid or expired",
    "timestamp": "2026-05-12T13:50:00Z"
  }
}
```

---

## Performance Optimization

### Caching Strategies
- **JWT Token Validation:** Cached for request duration
- **AWS Scan Results:** Stored in MongoDB for quick retrieval
- **Chat History:** Retrieved with pagination (50 messages per page)

### Database Indexing
```
users
  ├── email (unique, for login)
  └── createdAt (for sorting)

chathistories
  ├── userId (for user queries)
  └── createdAt (for sorting)

audits
  ├── userId (for audit logs)
  ├── severity (for filtering)
  └── timestamp (for range queries)
```

### Parallel Processing
- AWS API calls executed in parallel (Promise.all)
- Rules engine processes all resources concurrently
- Groq API calls handled asynchronously

---

## Security Architecture

### Authentication Flow
```
Login Credentials
    ↓
Bcryptjs verification
    ↓
JWT Generation
  ├── Payload: { userId, email, iat, exp }
  ├── Secret: JWT_SECRET from .env
  └── Expiry: 7 days
    ↓
Token stored in browser localStorage
    ↓
Subsequent requests include Authorization header
    ↓
Middleware verifies JWT
    ↓
Request processed or rejected
```

### Data Protection
- **Passwords:** Bcryptjs hashing (salt rounds: 10)
- **Tokens:** JWT with expiration
- **CORS:** Restricted to frontend origin
- **AWS Credentials:** Stored in environment variables
- **API Keys:** Groq API key in .env only

---

## Deployment Architecture (Future)

```
┌─────────────────────────────────┐
│   Cloudflare/CDN               │ ← Static assets
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│   Load Balancer                 │
└──────────────┬──────────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
    ┌────────┐   ┌────────┐
    │Server 1│   │Server 2│   ← Express instances
    └────┬───┘   └───┬────┘
         │           │
         └─────┬─────┘
               ▼
        ┌──────────────┐
        │  MongoDB     │   ← Primary database
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │  MongoDB     │   ← Replica (backup)
        └──────────────┘
```

---

**Last Updated:** May 12, 2026  
**Document Version:** 1.0.0
