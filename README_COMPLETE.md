# AWS Optimizer - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Core Features](#core-features)
5. [Technology Stack](#technology-stack)
6. [Getting Started](#getting-started)
7. [Documentation Files](#documentation-files)

---

## Project Overview

**AWS Optimizer** is a comprehensive cloud management platform that provides:
- **Real-time AWS Infrastructure Scanning** - Monitors EC2, EBS, Elastic IPs, IAM users
- **Cost Optimization** - Identifies wasted resources and optimization opportunities
- **Security & Compliance** - Scans for security vulnerabilities and compliance issues
- **AI-Powered Recommendations** - Uses Groq LLM API for intelligent infrastructure advice
- **User Management** - Authentication, role-based access, session management
- **Chat History** - Persistent conversation tracking with AI advisor

**Purpose:** Help AWS users reduce cloud costs, improve security posture, and optimize their infrastructure efficiently.

---

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                  │
│  React + TypeScript + Tailwind CSS (Port 5173 - Vite Dev Server)        │
│  ├── Pages (Dashboard, Resources, Security, Settings, Auth)             │
│  ├── Components (Charts, Modals, Sidebars, Tables)                      │
│  └── Services (API calls, AI service integration)                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓ HTTP/REST API ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                            SERVER LAYER                                  │
│  Express.js + TypeScript (Port 5000)                                     │
│                                                                           │
│  ├─ ROUTES                                                              │
│  │  ├── /api/auth/* (Login, Register, Logout)                          │
│  │  ├── /api/chat/* (Chat history, messages)                           │
│  │  ├── /api/scan/* (AWS scanning, resource data)                      │
│  │  └── /api/ai-advisor (AI recommendations)                           │
│  │                                                                       │
│  ├─ MIDDLEWARE                                                          │
│  │  ├── authMiddleware (JWT verification)                              │
│  │  └── optionalAuthMiddleware (Optional auth)                         │
│  │                                                                       │
│  ├─ BUSINESS LOGIC                                                      │
│  │  ├── AWS SDK Integration (EC2, EBS, IAM scanning)                   │
│  │  ├── Alert Engine (CSPM & FinOps rules)                             │
│  │  ├── AI Advisor Module (Groq LLM integration)                       │
│  │  └── Rules Engine (Security & compliance checks)                    │
│  │                                                                       │
│  └─ DATABASE OPERATIONS (Models)                                       │
│     ├── User (Authentication, profiles)                                │
│     ├── ChatHistory (Conversation logs)                                │
│     ├── Audit (Security events)                                        │
│     └── AIPreferences (User AI settings)                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓ MongoDB Queries ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATA PERSISTENCE LAYER                            │
│  MongoDB (localhost:27017/aws_optimizer)                                 │
│  ├── users (Authentication data)                                         │
│  ├── usersessions (Active sessions)                                      │
│  ├── chathistories (Chat conversations)                                  │
│  ├── audits (Security logs)                                              │
│  └── aipreferences (AI settings)                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓ AWS API ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                                 │
│  ├── AWS SDK (EC2, EBS, IAM APIs)                                       │
│  ├── Groq API (AI model inference)                                      │
│  └── JWT (Authentication tokens)                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

#### 1. **Authentication Flow**
```
User Credentials → Login Route → Hash Verification → JWT Token → Browser Storage
                                    ↓
                              User Session Created in MongoDB
```

#### 2. **AWS Scanning Flow**
```
User Request → Scan Route → AWS SDK Initialization → Fetch Resources (EC2, EBS, IAM)
    ↓
Rules Engine Evaluation → Alert Generation → Store in MongoDB → Send to Frontend
```

#### 3. **AI Advisor Flow**
```
User Message + Context → /api/ai-advisor → Groq API Call
    ↓
LLM Processing → Response Generation → Store in ChatHistory → Stream to Client
```

---

## Project Structure

### Complete Directory Tree

```
aws-optimizer/
│
├── 📁 client/                          # React Frontend (Port 5173)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx          # User login interface
│   │   │   ├── RegisterPage.tsx       # User registration interface
│   │   │   ├── NewDashboard.tsx       # Main dashboard (resources overview)
│   │   │   ├── NewResourcesPage.tsx   # Detailed resources view
│   │   │   ├── SecurityPage.tsx       # Security alerts & compliance
│   │   │   ├── SettingsPage.tsx       # User settings & preferences
│   │   │   └── SettingsPageDebug.tsx  # Debug/testing interface
│   │   │
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── Header.tsx         # Top navigation bar
│   │   │   │   ├── Sidebar.tsx        # Left navigation sidebar
│   │   │   │   ├── DashboardSidebar.tsx # Action buttons & AI card
│   │   │   │   └── ActionSidebar.tsx  # Additional actions panel
│   │   │   │
│   │   │   ├── ui/
│   │   │   │   ├── StatCard.tsx       # Metric display component
│   │   │   │   ├── DashboardMetrics.tsx # Metrics grid layout
│   │   │   │   ├── Chart.tsx          # Generic chart wrapper
│   │   │   │   ├── CostTrend.tsx      # Cost trend visualization
│   │   │   │   ├── ResourcesTable.tsx # Resources data table
│   │   │   │   ├── SecurityAlertsTable.tsx # Security alerts table
│   │   │   │   ├── HealthScore.tsx    # Infrastructure health score
│   │   │   │   ├── SecurityMetrics.tsx # Security metrics display
│   │   │   │   ├── LiveThreatLog.tsx  # Real-time threat log
│   │   │   │   ├── PDFReport.tsx      # Report generation
│   │   │   │   └── SummaryCard.tsx    # Summary information card
│   │   │   │
│   │   │   ├── AIAdvisor.tsx          # AI advisor chat interface (embedded)
│   │   │   └── AIAdvisorModal.tsx     # Fullscreen AI advisor modal
│   │   │
│   │   ├── context/
│   │   │   └── AWSContext.tsx         # Global state management
│   │   │
│   │   ├── services/
│   │   │   └── ai-service.ts          # AI API integration
│   │   │
│   │   ├── utils/
│   │   │   └── exportReport.ts        # PDF/CSV export utilities
│   │   │
│   │   ├── App.tsx                    # Main app component & routing
│   │   ├── main.tsx                   # React entry point
│   │   └── index.css, App.css         # Global styles
│   │
│   ├── vite.config.ts                 # Vite configuration with API proxy
│   ├── tailwind.config.js             # Tailwind CSS configuration
│   ├── package.json                   # Dependencies & scripts
│   └── index.html                     # HTML template
│
├── 📁 server/                         # Express Backend (Port 5000)
│   ├── src/
│   │   ├── index.ts                   # Main server entry point
│   │   │                               # - Middleware setup
│   │   │                               # - AWS SDK initialization
│   │   │                               # - Routes mounting
│   │   │                               # - Database connection
│   │   │
│   │   ├── models.ts                  # Database models (Mongoose schemas)
│   │   │                               # - User (authentication)
│   │   │                               # - UserSession (active sessions)
│   │   │                               # - ChatHistory (AI conversations)
│   │   │                               # - Audit (security logs)
│   │   │                               # - AIPreferences (user settings)
│   │   │
│   │   ├── auth-routes.ts             # Authentication endpoints
│   │   │                               # - POST /api/auth/register
│   │   │                               # - POST /api/auth/login
│   │   │                               # - GET /api/auth/logout
│   │   │
│   │   ├── auth-middleware.ts         # JWT & session verification
│   │   │                               # - authMiddleware (required auth)
│   │   │                               # - optionalAuthMiddleware
│   │   │
│   │   ├── auth-utils.ts              # Authentication helpers
│   │   │                               # - Password hashing/verification
│   │   │                               # - JWT generation/verification
│   │   │
│   │   ├── chat-routes.ts             # Chat & messaging endpoints
│   │   │                               # - GET /api/chat/history
│   │   │                               # - POST /api/chat/message
│   │   │                               # - DELETE /api/chat/:id
│   │   │
│   │   ├── ai-advisor.ts              # AI recommendation engine
│   │   │                               # - Integration with Groq LLM
│   │   │                               # - Prompt engineering
│   │   │                               # - Response processing
│   │   │
│   │   ├── TYPES_AND_RULES.ts         # Alert rules & type definitions
│   │   │                               # - Security rules (CSPM)
│   │   │                               # - Cost optimization rules (FinOps)
│   │   │                               # - Alert thresholds
│   │   │
│   │   ├── create-test-resources.ts   # Test data generation
│   │   │
│   │   └── test-groq.ts               # Groq API testing utility
│   │
│   ├── package.json                   # Server dependencies
│   ├── tsconfig.json                  # TypeScript configuration
│   └── QUICK_START.md                 # Server setup instructions
│
├── 📁 scripts/                        # Automation & utility scripts
│   ├── generate-massive-infra.sh      # Create test infrastructure
│   └── README.md                      # Scripts documentation
│
├── 📁 public/                         # Static assets
│
├── .env.example                       # Environment variables template
├── .gitignore                         # Git ignore rules
│
└── 📁 Documentation Files (THIS LAYER)
    ├── README_COMPLETE.md             # This file - Project overview
    ├── ARCHITECTURE.md                # Detailed system architecture
    ├── API_ENDPOINTS.md               # Complete API documentation
    ├── COMPONENTS.md                  # Frontend components guide
    ├── DATABASE_MODELS.md             # MongoDB schemas & models
    ├── SETUP_GUIDE.md                 # Installation & setup
    ├── FEATURES.md                    # Detailed feature list
    ├── SECURITY_GUIDE.md              # Security implementation
    └── TROUBLESHOOTING.md             # Common issues & solutions
```

---

## Core Features

### 1. **AWS Infrastructure Scanning**
- Monitors EC2 instances, EBS volumes, Elastic IPs, Security Groups
- IAM user tracking and login profile management
- Real-time resource discovery and updates
- Resource tagging and metadata collection

### 2. **Cost Optimization (FinOps)**
- Identifies unattached EBS volumes (wasted resources)
- Detects unused Elastic IPs (floating charges)
- Finds orphaned security groups
- Provides cost saving recommendations

### 3. **Security & Compliance (CSPM)**
- Detects publicly exposed security groups
- Checks for default VPC usage
- Identifies unencrypted resources
- Tracks IAM user activity and permissions
- Alerts on security group misconfigurations

### 4. **AI Advisor**
- Chat interface with Groq LLM AI model
- Context-aware recommendations based on infrastructure state
- Cost optimization suggestions
- Security hardening recommendations
- Infrastructure improvement advice
- Persistent chat history

### 5. **User Management**
- Secure registration with bcryptjs hashing
- JWT-based authentication
- Session tracking
- User preferences storage
- Role-based access control

### 6. **Dashboard & Reporting**
- Real-time metrics (Total Spend, Waste, Resource Count)
- Cost trend visualization (24h, 7d, 30d views)
- Service breakdown charts
- Resource inventory tables with filtering
- Security alerts timeline
- PDF report generation

---

## Technology Stack

### Frontend
| Technology | Purpose | Version |
|-----------|---------|---------|
| React | UI framework | Latest |
| TypeScript | Type-safe JavaScript | Latest |
| Vite | Build tool & dev server | Latest |
| Tailwind CSS | Styling & design system | Latest |
| Axios | HTTP client | Latest |
| Recharts | Data visualization | Latest |
| Lucide React | Icon library | Latest |

### Backend
| Technology | Purpose | Version |
|-----------|---------|---------|
| Express.js | Web framework | 5.2.1 |
| TypeScript | Type safety | Latest |
| MongoDB | Database | Latest |
| Mongoose | MongoDB ODM | 9.2.1 |
| AWS SDK | AWS integration | v3 |
| Groq SDK | AI model API | 1.1.2 |
| JWT | Authentication | 9.0.2 |
| bcryptjs | Password hashing | 2.4.3 |

### DevOps
| Tool | Purpose |
|------|---------|
| Node.js | Runtime environment |
| npm | Package management |
| Nodemon | Auto-restart on changes |
| ts-node | TypeScript execution |

---

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- MongoDB running locally (or via connection string)
- AWS credentials configured (IAM user with read-only permissions)
- Groq API key (for AI features)

### Quick Start

**1. Clone & Install**
```bash
# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

**2. Environment Setup**
```bash
# Create .env in server/ directory
cp .env.example .env
# Fill in:
# - MONGO_URI (MongoDB connection)
# - GROQ_API_KEY (for AI features)
# - JWT_SECRET (random string for tokens)
# - AWS credentials
```

**3. Start Services**
```bash
# Terminal 1: Client (Port 5173)
cd client && npm run dev

# Terminal 2: Server (Port 5000)
cd server && npm run dev

# MongoDB should be running on localhost:27017
```

**4. Access Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

### Default Credentials
- Email: `newuser@test.com`
- Password: `SecurePass123`

---

## Documentation Files

| File | Purpose | Details |
|------|---------|---------|
| **ARCHITECTURE.md** | System design & data flow | Detailed technical architecture |
| **API_ENDPOINTS.md** | All API routes & responses | Complete REST API documentation |
| **COMPONENTS.md** | Frontend components | React components breakdown |
| **DATABASE_MODELS.md** | MongoDB schemas | Data models & relationships |
| **SETUP_GUIDE.md** | Installation instructions | Step-by-step setup |
| **FEATURES.md** | Feature descriptions | Detailed feature explanations |
| **SECURITY_GUIDE.md** | Security implementation | Authentication & data protection |
| **TROUBLESHOOTING.md** | Common issues | Problems & solutions |

---

## Key Contacts & Resources

- **AWS SDK Documentation:** https://docs.aws.amazon.com/sdk-for-javascript/
- **Groq API:** https://console.groq.com
- **MongoDB Docs:** https://docs.mongodb.com
- **Express.js:** https://expressjs.com
- **React:** https://react.dev
- **Vite:** https://vitejs.dev

---

## Support & Development

For questions or issues:
1. Check TROUBLESHOOTING.md
2. Review API_ENDPOINTS.md for endpoint details
3. Check server logs on Port 5000
4. Check browser console for frontend errors

---

**Last Updated:** May 12, 2026  
**Project Version:** 1.0.0
