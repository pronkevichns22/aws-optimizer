# TROUBLESHOOTING.md - Common Issues & Solutions

## Quick Reference

| Issue | Symptom | Solution |
|-------|---------|----------|
| MongoDB not running | `ECONNREFUSED 127.0.0.1:27017` | See [MongoDB Connection Issues](#mongodb-connection-issues) |
| Port in use | `Error: listen EADDRINUSE :::5000` | See [Port Already in Use](#port-already-in-use) |
| API endpoint 404 | `Cannot POST /api/scan` | See [Backend Routes Not Found](#backend-routes-not-found) |
| Proxy not working | API calls fail from frontend | See [API Proxy Configuration](#api-proxy-configuration) |
| AWS credentials error | `InvalidSignatureException` | See [AWS Authentication Issues](#aws-authentication-issues) |
| Groq API 403 | `Unauthorized API key` | See [Groq API Issues](#groq-api-issues) |
| Token expired | `401 Unauthorized` on every request | See [JWT Authentication Issues](#jwt-authentication-issues) |
| Login fails | `401 Unauthorized` on login | See [Authentication Failures](#authentication-failures) |

---

## Database Issues

### MongoDB Connection Issues

**Error Message:**
```
MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017
```

**Cause:** MongoDB service is not running

**Solution:**

**Windows:**
```bash
# Check if service exists
net query MongoDB

# Start service
net start MongoDB

# Stop service
net stop MongoDB

# Restart service
net stop MongoDB && net start MongoDB
```

**macOS:**
```bash
# If installed via Homebrew
brew services start mongodb-community
brew services stop mongodb-community
brew services restart mongodb-community

# Check status
brew services list
```

**Linux (systemd):**
```bash
# Start MongoDB
sudo systemctl start mongod

# Stop MongoDB
sudo systemctl stop mongod

# Check status
sudo systemctl status mongod

# View logs
sudo journalctl -u mongod -n 100
```

**Verify Connection:**
```bash
# Connect to MongoDB
mongosh  # newer versions
# or
mongo    # older versions

# In MongoDB shell
> use aws_optimizer
> db.users.countDocuments()
# Should return a number (0 if no users yet)
```

---

### MongoDB Authentication Failed

**Error Message:**
```
MongoAuthenticationError: Authentication failed
```

**Cause:** Incorrect MongoDB credentials in `.env`

**Solution:**

1. Check MongoDB is running without authentication:
```bash
# MongoDB by default runs without auth
mongosh  # Should connect without password
```

2. Verify connection string in `.env`:
```env
MONGO_URI=mongodb://localhost:27017/aws_optimizer
```

3. If MongoDB has auth enabled, update `.env`:
```env
MONGO_URI=mongodb://username:password@localhost:27017/aws_optimizer
```

4. Restart server:
```bash
npm run dev  # in server folder
```

---

### MongoDB Connection Timeout

**Error Message:**
```
MongoServerError: connect ETIMEDOUT
```

**Cause:** MongoDB not responding to requests

**Solution:**

1. Check MongoDB is running:
```bash
mongosh --eval "db.adminCommand('ping')"
# Should return { ok: 1 }
```

2. Check resource usage:
```bash
# Windows Task Manager
# macOS Activity Monitor
# Linux:
top -p $(pgrep mongod)
```

3. If MongoDB uses too much memory, restart:
```bash
# Kill MongoDB
pkill mongod  # Linux/macOS
taskkill /IM mongod.exe  # Windows

# Start fresh
mongod
```

---

## Server Issues

### Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE :::5000
```

**Cause:** Port 5000 is already in use by another process

**Solution:**

**Windows:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID 12345 /F
```

**macOS/Linux:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 12345

# Or let OS kill it
sudo lsof -t -i :5000 | xargs kill -9
```

**Or change the port:**

In `server/.env`:
```env
PORT=5001  # Use different port
```

Then update `client/vite.config.ts`:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5001',  // Updated port
      changeOrigin: true
    }
  }
}
```

---

### Backend Not Starting

**Error Message:**
```
Error: Cannot find module 'express'
```

**Cause:** Dependencies not installed

**Solution:**

```bash
cd server
npm install  # Install all dependencies
npm run dev  # Start server
```

**If `npm install` fails:**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules  # Linux/macOS
rmdir /s /q node_modules  # Windows

# Delete package-lock.json
rm package-lock.json

# Reinstall
npm install
```

---

### TypeScript Compilation Error

**Error Message:**
```
error TS2307: Cannot find module '@types/express'
```

**Cause:** Type definitions not installed

**Solution:**

```bash
npm install --save-dev @types/express @types/node
npm run dev
```

---

## Frontend Issues

### Vite Dev Server Not Starting

**Error Message:**
```
Error: ENOSPC: no space left on device
```

**Cause:** No disk space available

**Solution:**

```bash
# Check disk space
df -h  # Linux/macOS
dir C:\  # Windows

# Clean up old files/caches
npm cache clean --force
rm -rf .vite
rm -rf node_modules/.cache

# If low on space, free up disk
# Delete old logs, temporary files, etc.
```

**Other common errors:**

```bash
# Clear Vite cache
rm -rf .vite

# Clear Node modules
rm -rf node_modules
npm install

# Restart dev server
npm run dev
```

---

### API Proxy Configuration

**Error Message:**
```
GET http://localhost:5173/api/scan 404 (Not Found)
```

**Cause:** Vite proxy not configured correctly

**Solution:**

Check `client/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
```

**Verify:**

1. Frontend running on http://localhost:5173
2. Backend running on http://localhost:5000
3. API calls use `/api` prefix (not full URL)

**Example (Correct):**
```typescript
// ✅ Correct - relative path
fetch('/api/scan', { method: 'POST' })

// ❌ Wrong - full URL
fetch('http://localhost:5000/api/scan', { method: 'POST' })
```

---

### Blank Screen or Not Loading

**Symptoms:** White/black screen, nothing loads

**Solution:**

1. Check browser console (F12 → Console tab):
   - Look for red error messages
   - Check if API calls are failing

2. Check network tab (F12 → Network):
   - Verify HTML, CSS, JS files load (200 status)
   - Verify API calls reach backend (check Response)

3. Check if backend is running:
   ```bash
   curl http://localhost:5000
   # Should return some response
   ```

4. Clear browser cache:
   ```bash
   # Chrome/Edge: Ctrl+Shift+Delete
   # Safari: Cmd+Shift+Delete
   # Firefox: Ctrl+Shift+Delete
   ```

5. Rebuild frontend:
   ```bash
   cd client
   npm run build
   npm run dev
   ```

---

### Component Not Rendering

**Symptoms:** Page loads but component is missing

**Error in Console:**
```
React Router component not found
Cannot find component: AIAdvisorModal
```

**Solution:**

1. Check import path:
```typescript
// ❌ Wrong path
import AIAdvisorModal from './components/AIAdvisor'

// ✅ Correct path
import AIAdvisorModal from './components/AIAdvisorModal'
```

2. Verify component exists:
```bash
ls client/src/components/AIAdvisorModal.tsx
# Should show the file
```

3. Check if component is exported:
```typescript
// At bottom of AIAdvisorModal.tsx
export default AIAdvisorModal;
```

4. Restart dev server:
```bash
# Kill: Ctrl+C
npm run dev
```

---

## Authentication & Security Issues

### JWT Authentication Issues

**Error Message:**
```
401 Unauthorized: Invalid token
```

**Causes & Solutions:**

**Token Missing:**
```typescript
// ❌ Token not in request
fetch('/api/user/profile')

// ✅ Include token in header
const token = localStorage.getItem('jwt_token');
fetch('/api/user/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

**Token Expired:**
```
401 Unauthorized: Token expired
```

**Solution:** User must login again
```typescript
// Clear old token
localStorage.removeItem('jwt_token');

// Redirect to login
window.location.href = '/login';
```

**Invalid Token Signature:**
```
401 Unauthorized: Invalid token signature
```

**Cause:** `JWT_SECRET` changed

**Solution:**

1. Verify `.env` has correct JWT_SECRET:
```bash
# Check value matches everywhere it's used
grep -r "JWT_SECRET" server/
```

2. If changed, users must login again (old tokens invalid)

---

### Authentication Failures

**Error Message:**
```
401 Unauthorized on /api/auth/login
```

**Possible Causes:**

**Wrong Email:**
```
User not found
```
✓ Email doesn't exist or is misspelled

**Wrong Password:**
```
Invalid email or password
```
✓ Password is incorrect

**Solution:**

1. Check email is correct:
```bash
# Verify in MongoDB
mongosh
> use aws_optimizer
> db.users.find({}, {email: 1})
```

2. Reset password (manually via MongoDB):
```bash
# Use bcryptjs to hash new password
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('NewPassword123!', 10);
console.log(hash);

# Then update in MongoDB
db.users.updateOne(
  { email: 'user@example.com' },
  { $set: { passwordHash: '<hash_above>' } }
)
```

---

### Password Reset Not Working

**Error Message:**
```
No reset endpoint found
```

**Current Limitation:** Password reset not implemented

**Workaround:**

**Option 1: Admin Reset (MongoDB)**
```bash
mongosh
> use aws_optimizer
> const bcrypt = require('bcryptjs');
> const newHash = await bcrypt.hash('TempPassword123!', 10);
> db.users.updateOne(
  { email: 'user@example.com' },
  { $set: { passwordHash: newHash } }
)
```

**Option 2: Email Reset (TODO - implement)**

---

## AWS Issues

### AWS Authentication Issues

**Error Message:**
```
InvalidSignatureException: The request signature we calculated does not match the signature you provided
```

**Cause:** AWS credentials are invalid or malformed

**Solution:**

1. Verify AWS credentials in `.env`:
```env
AWS_ACCESS_KEY_ID=AKIA1234567890ABCDEF
AWS_SECRET_ACCESS_KEY=wJal/XUUpFMRK/K7MDENG+/J7JSTL3D4c7CW4JJ3
AWS_REGION=us-east-1
```

2. Test credentials with AWS CLI:
```bash
aws sts get-caller-identity --region us-east-1

# Should return:
# {
#   "Account": "123456789012",
#   "UserId": "AIDACKCEVSQ6C2EXAMPLE",
#   "Arn": "arn:aws:iam::123456789012:user/aws-optimizer"
# }
```

3. If test fails, regenerate credentials:
   - Go to AWS Console → IAM → Users
   - Select user → Security Credentials
   - Create new Access Key
   - Update `.env`

---

### AWS Scan Returns No Resources

**Error Message:**
```
Scan completed: 0 resources found
```

**Cause:** AWS permissions insufficient

**Solution:**

1. Check IAM permissions:
```bash
aws iam list-attached-user-policies --user-name aws-optimizer
```

2. Ensure policy includes:
```json
{
  "Effect": "Allow",
  "Action": [
    "ec2:Describe*",
    "iam:Get*",
    "iam:List*",
    "s3:List*"
  ],
  "Resource": "*"
}
```

3. Test specific AWS services:
```bash
# Test EC2
aws ec2 describe-instances --region us-east-1

# Test IAM
aws iam list-users

# Test S3
aws s3 ls
```

---

### AWS Rate Limiting

**Error Message:**
```
ThrottlingException: Rate exceeded
```

**Cause:** Too many AWS API requests

**Solution:**

Add exponential backoff in server code:
```typescript
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

async function withRetry(fn, retries = 0) {
  try {
    return await fn();
  } catch (error) {
    if (error.code === 'Throttling' && retries < MAX_RETRIES) {
      const delay = INITIAL_DELAY * Math.pow(2, retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries + 1);
    }
    throw error;
  }
}
```

---

## AI Issues

### Groq API Issues

**Error Message:**
```
Unauthorized: Invalid API key
```

**Cause:** Invalid or missing Groq API key

**Solution:**

1. Verify API key in `.env`:
```env
GROQ_API_KEY=gsk_your-actual-key-here
```

2. Get correct API key:
   - Visit https://console.groq.com
   - Login to account
   - Go to API Keys
   - Copy correct key
   - Update `.env`

3. Restart server:
```bash
npm run dev
```

**Error Message:**
```
Rate limit exceeded: 30 requests per minute
```

**Cause:** Free tier rate limit hit

**Solution:**

- Free tier: 30 requests/minute
- Wait 1 minute before next request
- Upgrade to paid plan for higher limits

---

### AI Advisor Not Responding

**Symptoms:** Chat message sent but no response

**Possible Causes:**

**1. Groq API timeout**
```
Solution: Check API key, try simpler question
```

**2. Network connectivity**
```bash
# Test connection
curl https://api.groq.com/v1/health
```

**3. Server error**
```bash
# Check server logs in terminal
# Look for error messages
```

**Solution:**

1. Check server logs
2. Verify Groq API key
3. Try shorter message
4. Restart server

---

### Chat History Not Saving

**Symptoms:** Chat works but messages disappear after page reload

**Cause:** Messages not persisted to MongoDB

**Solution:**

1. Check MongoDB is running:
```bash
mongosh
> use aws_optimizer
> db.chathistories.find()
```

2. Check for server errors in logs

3. Verify collection was created:
```bash
mongosh
> use aws_optimizer
> db.getCollectionNames()
# Should include 'chathistories'
```

---

## Performance Issues

### Slow Scan Performance

**Symptoms:** AWS scan takes >30 seconds

**Causes & Solutions:**

**Too many resources:**
- Scanning 1000+ resources is slow
- Solution: Filter by region in settings

**Poor network connection:**
- Check internet speed
- Solution: Ensure stable connection

**AWS API throttling:**
- AWS limits request rate
- Solution: Implement backoff (see AWS Rate Limiting)

**Database performance:**
- MongoDB queries slow
- Solution: Check indexes created

```bash
mongosh
> use aws_optimizer
> db.chathistories.getIndexes()
# Should show indexes on userId, createdAt, etc.
```

---

### High Memory Usage

**Symptoms:** Application using >1GB RAM

**Cause:** Memory leak or too much data in memory

**Solution:**

1. Restart services:
```bash
# Kill and restart server
npm run dev

# Kill and restart frontend
npm run dev
```

2. Check for memory leaks:
```bash
# Add to server/src/index.ts
setInterval(() => {
  console.log('Memory usage:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB');
}, 5000);
```

3. Limit chat history size:
```typescript
// Don't load all messages at once
const messages = await ChatHistory
  .findById(chatId)
  .slice('messages', -50)  // Last 50 messages
```

---

## Logging & Debugging

### Check Server Logs

**During development:**
```bash
cd server
npm run dev

# Logs appear in terminal
```

**Common log messages:**
```
[Server] listening on http://localhost:5000  ✓ Server started
[MongoDB] Connected to: mongodb://... ✓ DB connected
[Auth] User logged in: user@example.com ✓ Login success
[AWS] Scan started: full ✓ Scan started
[Error] AWS API failed... ❌ Error occurred
```

---

### Enable Debug Logging

**In `.env`:**
```env
LOG_LEVEL=debug
```

**Or in code:**
```typescript
console.debug('Debug message:', variable);
console.log('Info message:', data);
console.warn('Warning:', issue);
console.error('Error:', error);
```

---

### Browser DevTools Debugging

**F12 to open DevTools**

**Console Tab:**
- Shows JavaScript errors
- Print debug info: `console.log(data)`
- Test code: `fetch('/api/scan')`

**Network Tab:**
- Shows HTTP requests
- Check status codes (200 = success, 401 = auth error)
- View response data

**Application Tab:**
- Check localStorage (JWT tokens)
- View cookies
- Check IndexedDB

**Example debugging:**
```javascript
// In browser console
const token = localStorage.getItem('jwt_token');
fetch('/api/user/profile', {
  headers: { Authorization: `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log(data));
```

---

## Recovery Procedures

### Full System Reset

**⚠️ WARNING: This will delete all data**

```bash
# 1. Stop all services
# Kill terminals (Ctrl+C)

# 2. Delete MongoDB data
mongosh
> use aws_optimizer
> db.dropDatabase()
> exit

# 3. Delete node_modules
cd client && rm -rf node_modules
cd ../server && rm -rf node_modules

# 4. Reinstall dependencies
cd client && npm install
cd ../server && npm install

# 5. Delete environment file
rm server/.env

# 6. Create fresh .env
# Use SETUP_GUIDE.md Step 2

# 7. Restart services
# Terminal 1: cd server && npm run dev
# Terminal 2: cd client && npm run dev
```

### Backup User Data

Before major changes:

```bash
# Backup MongoDB
mongodump --db aws_optimizer --out ./backup_$(date +%Y%m%d_%H%M%S)

# Restore MongoDB
mongorestore --db aws_optimizer ./backup_20260512_101030/aws_optimizer/
```

---

## Still Stuck?

### How to Report Issues

1. **Describe the problem:**
   - What were you trying to do?
   - What happened instead?
   - Error message (if any)?

2. **Provide context:**
   - Operating system (Windows/macOS/Linux)
   - Node.js version (`node --version`)
   - MongoDB version (`mongod --version`)

3. **Collect logs:**
   ```bash
   # Server logs
   npm run dev > server.log 2>&1

   # Browser console (F12 → Console)
   # Screenshot of error message
   ```

4. **Check existing docs:**
   - SETUP_GUIDE.md - Installation steps
   - ARCHITECTURE.md - System design
   - API_ENDPOINTS.md - Endpoint reference

---

**Last Updated:** May 12, 2026  
**Total Troubleshooting Solutions:** 50+
