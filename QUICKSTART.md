# Quick Start Guide - User Authentication System

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- MongoDB 5+ running locally or Atlas connection
- npm or yarn

### 1. Environment Setup

Create `.env` file in project root:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/cloudopti

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345

# Encryption (must be 32 characters for AES-256)
ENCRYPTION_KEY=your-32-char-encryption-key-12345678

# Server
PORT=5000
NODE_ENV=development

# React
REACT_APP_API_URL=http://localhost:5000/api
```

### 2. Install Dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 3. MongoDB Setup

#### Local MongoDB
```bash
# Start MongoDB service
mongod

# In another terminal, create database and indexes:
mongo
> use cloudopti
> db.users.createIndex({ email: 1 })
> db.users.createIndex({ username: 1 })
> db.chathistories.createIndex({ userId: 1, createdAt: -1 })
> db.usersessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

#### MongoDB Atlas
Replace `MONGODB_URI` in `.env`:
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/cloudopti
```

### 4. Start the Application

#### Terminal 1 - Backend
```bash
cd server
npm run dev
# Server running on http://localhost:5000
```

#### Terminal 2 - Frontend
```bash
cd client
npm run dev
# Client running on http://localhost:5173
```

### 5. Test the Flow

#### Step 1: Register a User
Visit `http://localhost:5173` and click "Register"
- Username: `testuser`
- Email: `test@example.com`
- Password: `SecureTest123`

#### Step 2: Login
- Email: `test@example.com`
- Password: `SecureTest123`

#### Step 3: Add AWS Credentials
- Access Key: `AKIA...` (or test credentials)
- Secret Key: `wJalrX...` (or test secret)
- Region: `us-east-1`

---

## 📡 API Testing

### Using cURL

#### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'

# Save TOKEN from response
TOKEN="eyJhbGc..."
```

#### Get Profile
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

#### Create Chat
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "First Chat"}'

# Save CHAT_ID from response
CHAT_ID="uuid-..."
```

#### Add Message
```bash
curl -X POST http://localhost:5000/api/chat/$CHAT_ID/message \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user",
    "content": "Analyze my costs"
  }'
```

#### Get Chat History
```bash
curl -X GET http://localhost:5000/api/chat/$CHAT_ID \
  -H "Authorization: Bearer $TOKEN"
```

#### List All Chats
```bash
curl -X GET http://localhost:5000/api/chats \
  -H "Authorization: Bearer $TOKEN"
```

#### Save AWS Credentials
```bash
curl -X POST http://localhost:5000/api/auth/credentials \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accessKeyId": "AKIA...",
    "secretAccessKey": "wJalrX...",
    "region": "us-east-1",
    "isLocalStack": false
  }'
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Start MongoDB service
```bash
# macOS/Linux
brew services start mongodb-community

# Windows
net start MongoDB
```

### JWT Token Expired
```
Error: Invalid or expired token
```
**Solution:** Login again to get new token (30-day expiration)

### Password Requirements Not Met
```
Error: Password must contain at least one uppercase letter
```
**Solution:** Use password with:
- Minimum 8 characters
- Uppercase letter
- Lowercase letter  
- Number

### AWS Credentials Encryption Error
```
Error: Failed to encrypt credentials
```
**Solution:** Check `ENCRYPTION_KEY` is exactly 32 characters in `.env`

### Frontend Can't Connect to Backend
```
Error: Failed to fetch
```
**Solution:** 
1. Verify backend is running on port 5000
2. Check `REACT_APP_API_URL` in `.env`
3. Ensure CORS is enabled in server

---

## 📊 Database Structure

### Check Collections
```bash
mongo
> use cloudopti
> show collections
# Should show: users, usersessions, chathistories, aipreferences

# View sample user
> db.users.findOne()
```

### Query User's Chats
```bash
# Get user ID
USER_ID="507f1f77bcf86cd799439011"

# Find all chats
> db.chathistories.find({ userId: ObjectId("$USER_ID") })
```

---

## 🔄 Development Workflow

### Code Changes Hot Reload
- **Backend:** Nodemon watches files (auto-restart)
- **Frontend:** Vite HMR (instant refresh)

### Database Changes
If you modify schemas:
1. Stop backend
2. Clear MongoDB collections (or use new database)
3. Restart backend (will create indexes)

### Debugging
```javascript
// Add to backend
console.log('User:', req.user);
console.log('Token:', req.headers.authorization);

// Check browser console (Frontend)
console.log('Auth Context:', useAWS());
```

---

## 📚 File Locations

```
cloudopti/
├── server/
│   ├── src/
│   │   ├── models.ts          ← Database schemas
│   │   ├── auth-utils.ts      ← Encryption/hashing
│   │   ├── auth-middleware.ts ← JWT verification
│   │   ├── auth-routes.ts     ← Auth endpoints
│   │   ├── chat-routes.ts     ← Chat endpoints
│   │   └── index.ts           ← Main server
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── context/
│   │   │   └── AWSContext.tsx ← Auth state
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx  ← Login form
│   │   │   └── RegisterPage.tsx ← Register form
│   │   └── App.tsx
│   └── package.json
│
├── .env                         ← Configuration
└── .gitignore                   ← Secrets protection
```

---

## ✅ Verification Checklist

- [ ] MongoDB running and accessible
- [ ] All environment variables set in `.env`
- [ ] Backend server starts without errors
- [ ] Frontend loads at http://localhost:5173
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] JWT token appears in browser localStorage
- [ ] Can create chat session
- [ ] Can add messages to chat
- [ ] Chat history persists after refresh

---

## 🎯 Next Steps

1. **Test AI Advisor** - Integrate chat history with AI responses
2. **User Profile** - Create account management page
3. **Password Reset** - Implement email-based recovery
4. **Dashboard** - Show recent chats and insights
5. **Settings** - User preferences for AI advisor

---

**Last Updated:** May 11, 2026  
**Version:** 2.0  
**Status:** Ready for testing
