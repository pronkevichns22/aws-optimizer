# SETUP_GUIDE.md - Complete Installation & Configuration Guide

## Quick Summary

AWS Optimizer requires:
- Node.js 16+
- MongoDB locally running
- AWS credentials
- Groq API key

Setup time: ~15 minutes

---

## Prerequisites

### 1. System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4 GB
- Disk: 20 GB free space
- OS: Windows, macOS, or Linux

**For Development:**
- Node.js 16 or higher
- npm 8 or higher
- MongoDB 5.0 or higher

### 2. Install Node.js

**Windows/macOS:**
- Download from https://nodejs.org/
- Install LTS version (recommended)
- Verify: `node --version` and `npm --version`

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Install MongoDB

**Windows:**
1. Download MongoDB Community from https://www.mongodb.com/try/download/community
2. Run installer
3. Choose "Install MongoDB as a Service"
4. Verify: `mongod --version`

**macOS (with Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**Verify MongoDB is running:**
```bash
mongo --version
# or for newer versions
mongosh --version
```

---

## Step 1: Clone & Setup Project

### 1.1 Clone Repository
```bash
cd c:\Users\pronk\aws-optimizer
# OR your preferred location
```

### 1.2 Install Dependencies

**Client (React):**
```bash
cd client
npm install
```

**Server (Express):**
```bash
cd ../server
npm install
```

---

## Step 2: Environment Configuration

### 2.1 Create `.env` file in `server/` directory

**Location:** `c:\Users\pronk\aws-optimizer\server\.env`

**Content:**
```env
# ============================================
# MongoDB Connection
# ============================================
MONGO_URI=mongodb://localhost:27017/aws_optimizer

# ============================================
# Authentication & Security
# ============================================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-please
JWT_EXPIRY=7d

# ============================================
# AWS Configuration
# ============================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# ============================================
# Groq AI API Configuration
# ============================================
GROQ_API_KEY=gsk_your-groq-api-key-here
GROQ_MODEL=mixtral-8x7b-32768

# ============================================
# Server Configuration
# ============================================
PORT=5000
NODE_ENV=development

# ============================================
# CORS Configuration
# ============================================
CORS_ORIGIN=http://localhost:5173

# ============================================
# Logging
# ============================================
LOG_LEVEL=debug
```

### 2.2 Get AWS Credentials

**Option A: Use existing AWS credentials**
```bash
# Get from AWS Console > IAM > Users > Security credentials
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJal...
```

**Option B: Create new IAM user with read-only permissions**
1. Go to AWS Console > IAM > Users > Add users
2. Set username: `aws-optimizer`
3. Enable "Access key - Programmatic access"
4. Attach policy: `ReadOnlyAccess`
5. Copy access key & secret

**Permissions required:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "iam:Get*",
        "iam:List*"
      ],
      "Resource": "*"
    }
  ]
}
```

### 2.3 Get Groq API Key

1. Visit https://console.groq.com
2. Sign up for free account
3. Go to API Keys > Create New Key
4. Copy API key to `.env`

### 2.4 Generate JWT Secret

Generate a secure random string (min 32 characters):
```bash
# On Windows PowerShell:
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))

# On macOS/Linux:
openssl rand -base64 32
```

---

## Step 3: Start Services

### 3.1 Verify MongoDB Connection

```bash
# On Windows:
net start MongoDB

# On macOS:
brew services start mongodb-community

# On Linux:
sudo systemctl start mongod

# Verify:
mongo  # or mongosh
> use aws_optimizer
> db.users.find()
```

### 3.2 Start Express Server

**Terminal 1:**
```bash
cd server
npm run dev
```

**Expected output:**
```
[Server] listening on http://localhost:5000
[MongoDB] Connected to: mongodb://localhost:27017/aws_optimizer
```

### 3.3 Start React Frontend

**Terminal 2:**
```bash
cd client
npm run dev
```

**Expected output:**
```
  VITE v4.3.9  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 3.4 Verify All Services

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:5173 | Should load React app |
| Backend | http://localhost:5000 | Should return JSON |
| MongoDB | localhost:27017 | Should connect silently |

---

## Step 4: Initial Database Setup

### 4.1 Create Test User

```bash
# Using the login API
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 4.2 Login with Test User

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

**Response should include JWT token:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### 4.3 Test Frontend

1. Navigate to http://localhost:5173
2. Login with test credentials
3. Dashboard should load
4. Try AWS scan button

---

## Step 5: Configure AWS Data Source

### 5.1 Add AWS Credentials to App

1. Open http://localhost:5173/settings
2. Go to "Connected Services"
3. Enter AWS credentials:
   - Access Key ID
   - Secret Access Key
   - Region (default: us-east-1)
4. Click "Test Connection"
5. Should show "✓ Connected"

### 5.2 Test Infrastructure Scan

1. Go to Dashboard
2. Click "Rescan" button
3. Wait for scan to complete
4. Check if resources appear in "All Resources" table

---

## Step 6: Enable AI Features

### 6.1 Verify Groq API Configuration

1. Ensure `GROQ_API_KEY` is set in `.env`
2. Restart server: `npm run dev` (in server terminal)

### 6.2 Test AI Advisor

1. Open http://localhost:5173/dashboard
2. Click "Open fullscreen" on AI Advisor card
3. Type message: "What are my top security issues?"
4. Should receive AI response

---

## Troubleshooting

### Problem: MongoDB connection fails

**Error:** `MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017`

**Solution:**
```bash
# Check if MongoDB is running
net start MongoDB  # Windows
brew services list  # macOS
sudo systemctl status mongod  # Linux

# Restart if needed
net stop MongoDB && net start MongoDB  # Windows
```

### Problem: Port 5000 or 5173 already in use

**Solution:**
```bash
# Find process using port
netstat -ano | findstr :5000  # Windows
lsof -i :5000  # macOS/Linux

# Kill process
taskkill /PID <PID> /F  # Windows
kill -9 <PID>  # macOS/Linux

# Or change port in .env
PORT=5001
```

### Problem: AWS scan returns error

**Possible causes:**
- AWS credentials invalid
- AWS permissions insufficient
- Network connectivity issue

**Solution:**
```bash
# Test AWS credentials
AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... aws sts get-caller-identity

# Check AWS SDK logs (add to .env)
LOG_LEVEL=debug
```

### Problem: Groq API returns 403 error

**Possible causes:**
- Invalid API key
- Rate limit exceeded
- VPN/Network blocking

**Solution:**
1. Verify API key in console.groq.com
2. Check rate limits (free tier: 30/min)
3. Try without VPN

### Problem: Frontend shows "Cannot GET /"

**Error:** Vite dev server not properly routing API calls

**Solution:**
- Verify `vite.config.ts` has proxy configuration
- Ensure `/api` calls are proxied to `http://localhost:5000`

---

## Development Workflow

### Running in Development Mode

**Terminal 1 - Backend (auto-reload on changes):**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend (auto-reload on changes):**
```bash
cd client
npm run dev
```

**Terminal 3 - MongoDB (optional - only if not running as service):**
```bash
mongod
```

### Hot Reload Setup

- **Frontend:** Vite automatically reloads on TypeScript/TSX changes
- **Backend:** Nodemon automatically restarts on changes
- **Database:** No reload needed (queries execute immediately)

### Building for Production

**Frontend Build:**
```bash
cd client
npm run build
# Creates optimized build in client/dist/
```

**Backend Build:**
```bash
cd server
npm run build
# Creates compiled JS in server/dist/
```

---

## Environment Checklist

- [ ] Node.js 16+ installed
- [ ] MongoDB 5.0+ installed and running
- [ ] AWS credentials configured
- [ ] Groq API key obtained
- [ ] `.env` file created in `server/` directory
- [ ] All environment variables filled in
- [ ] Dependencies installed (npm install)
- [ ] Backend server running on :5000
- [ ] Frontend server running on :5173
- [ ] MongoDB connected and accessible
- [ ] Test user created
- [ ] Login successful
- [ ] AWS scan works
- [ ] AI advisor responds

---

## Default Credentials

For testing purposes:

| Field | Value |
|-------|-------|
| Email | test@example.com |
| Password | TestPassword123! |
| Role | user |

---

## Next Steps

1. **Configure AWS scanning** - Set up S3, Lambda, RDS scanning
2. **Customize alert rules** - Edit CSPM/FinOps rules in `TYPES_AND_RULES.ts`
3. **Set up notifications** - Configure email/Slack alerts
4. **Deploy to production** - Use Docker/Kubernetes
5. **Enable 2FA** - Add TOTP authentication

---

## Support

For issues:
1. Check TROUBLESHOOTING.md
2. Review API_ENDPOINTS.md for endpoint details
3. Check server logs: `server/console output`
4. Check browser console: DevTools > Console tab

---

**Last Updated:** May 12, 2026  
**Estimated Setup Time:** 15-20 minutes
