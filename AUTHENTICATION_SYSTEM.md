# User Authentication System - Implementation Guide

## 📋 Overview

The CloudOpti application now includes a comprehensive user authentication system with:

- ✅ **User Accounts** - Email/password registration and login
- ✅ **JWT Tokens** - Secure session management  
- ✅ **Encrypted AWS Credentials** - Client credentials are encrypted and stored on server
- ✅ **Chat History** - Per-user persistent chat sessions
- ✅ **User Preferences** - Customizable AI advisor settings

---

## 🗄️ Database Schema

### Users Collection
- `username` - Unique username (3-50 chars)
- `email` - Unique email
- `password` - Bcrypt hashed (never plain text)
- `awsAccessKeyId` - AES-256 encrypted AWS key
- `awsSecretAccessKey` - IV for decryption
- `credentialsIV` - Initialization vector
- `preferences` - User settings object
- `lastLogin` - Timestamp of last authentication
- `createdAt`, `updatedAt` - Timestamps

### User Sessions Collection
- `userId` - Reference to User
- `token` - JWT token
- `ipAddress` - Login IP
- `userAgent` - Browser info
- `expiresAt` - Auto-delete via TTL index

### Chat History Collection
- `userId` - Reference to User
- `chatSessionId` - UUID for chat session
- `title` - User-defined chat name
- `messages` - Array of {role, content, timestamp}
- `context` - {resourceCount, totalCost, alertCount}
- `lastAccessedAt` - Timestamp

### AI Preferences Collection
- `userId` - Reference to User (unique)
- `focusAreas` - {security, costOptimization, performance}
- `alertSeverityThreshold` - CRITICAL|HIGH|MEDIUM|LOW
- `maxRecommendations` - Max results per query
- `responseLength` - brief|detailed|comprehensive

---

## 🔐 Authentication Flow

### 1. Registration
```
POST /api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}

Response:
{
  "success": true,
  "data": {
    "userId": "...",
    "username": "john_doe",
    "email": "john@example.com",
    "token": "eyJhbGc..."
  }
}
```

### 2. Login
```
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response:
{
  "success": true,
  "data": {
    "userId": "...",
    "email": "john@example.com",
    "token": "eyJhbGc...",
    "awsCredentialsSet": false
  }
}
```

### 3. Save AWS Credentials
```
POST /api/auth/credentials
Authorization: Bearer {token}
{
  "accessKeyId": "AKIA...",
  "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "region": "us-east-1",
  "isLocalStack": false
}

Response:
{
  "success": true,
  "message": "AWS credentials saved successfully"
}
```

### 4. Logout
```
POST /api/auth/logout
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 💬 Chat Management APIs

### Create Chat Session
```
POST /api/chat
Authorization: Bearer {token}
{
  "title": "Cost Analysis Session"
}

Response:
{
  "success": true,
  "data": {
    "chatSessionId": "uuid-123",
    "title": "Cost Analysis Session",
    "createdAt": "2026-05-11T..."
  }
}
```

### Get User's Chats
```
GET /api/chats?limit=50&skip=0
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "chats": [...],
    "total": 25,
    "limit": 50,
    "skip": 0
  }
}
```

### Get Specific Chat
```
GET /api/chat/{chatSessionId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "chatSessionId": "uuid-123",
    "messages": [
      {
        "role": "user",
        "content": "Analyze my costs",
        "timestamp": "2026-05-11T..."
      },
      {
        "role": "assistant",
        "content": "Based on analysis...",
        "timestamp": "2026-05-11T..."
      }
    ]
  }
}
```

### Add Message to Chat
```
POST /api/chat/{chatSessionId}/message
Authorization: Bearer {token}
{
  "role": "user",  // or "assistant"
  "content": "What are my biggest cost drivers?"
}

Response:
{
  "success": true,
  "data": {
    "chatSessionId": "uuid-123",
    "messageCount": 5
  }
}
```

### Delete Chat
```
DELETE /api/chat/{chatSessionId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Chat deleted"
}
```

---

## 🔑 Frontend Integration

### Updated AWSContext Hook

The `useAWS()` hook now provides:

```typescript
interface AWSContextType {
  // Authentication
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  
  // User management
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  
  // AWS Credentials
  credentials: AWSCredentials | null;
  setCredentials: (creds: AWSCredentials) => void;
  clearCredentials: () => void;
}
```

### Usage in Components

```typescript
import { useAWS } from '../context/AWSContext';

export function MyComponent() {
  const { user, isAuthenticated, logout } = useAWS();
  
  if (!isAuthenticated) {
    return <LoginPage />;
  }
  
  return (
    <div>
      <h1>Welcome, {user?.username}!</h1>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}
```

---

## 🔐 Security Features

### Password Security
- ✅ Minimum 8 characters
- ✅ Requires uppercase letter
- ✅ Requires lowercase letter
- ✅ Requires number
- ✅ Bcryptjs hashing (10 rounds)

### Credential Encryption
- ✅ AES-256-CBC encryption
- ✅ Random IV per credential pair
- ✅ Encrypted data + IV stored separately
- ✅ Never transmitted to frontend

### JWT Tokens
- ✅ 30-day expiration
- ✅ Per-session tracking
- ✅ IP address logging
- ✅ Auto-cleanup of expired sessions

### Data Privacy
- ✅ No plain text passwords
- ✅ No AWS credentials in local storage
- ✅ Encrypted credentials on server
- ✅ User can revoke sessions anytime

---

## 🧪 Testing

### Test User Creation
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123",
    "confirmPassword": "TestPass123"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

---

## 📝 Migration Notes

### Old System → New System

| Feature | Old | New |
|---------|-----|-----|
| Auth | Direct AWS credentials | Email/password + encrypted AWS creds |
| Sessions | sessionStorage (transient) | JWT tokens + DB persistence |
| History | In-memory | Database per user |
| Preferences | N/A | User preferences saved |
| Multi-device | No | Yes (via JWT) |

### Backward Compatibility

The system maintains legacy support:
- Old "direct AWS connection" mode still works for testing
- `POST /api/auth/validate` endpoint exists for validation
- Can migrate users gradually

---

## 🔄 Next Steps

1. **Update AI Advisor** to use user context and chat history
2. **Add user profile page** for account management
3. **Implement password reset** functionality
4. **Add 2FA** for enhanced security
5. **Create admin dashboard** for user management

---

## 🆘 Troubleshooting

### Token Not Persisting
- Check localStorage is enabled
- Verify `REACT_APP_API_URL` environment variable

### AWS Credentials Validation Fails
- Ensure credentials are encrypted before sending to server
- Check IAM permissions include ReadOnlyAccess

### Chat History Not Saving
- Verify MongoDB connection is active
- Check user ID is correctly passed in requests
- Ensure `Authorization` header includes `Bearer {token}`

---

**System implemented on:** May 11, 2026  
**Version:** 2.0 (User Authentication)
