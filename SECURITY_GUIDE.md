# SECURITY_GUIDE.md - Authentication, Data Protection & Security Best Practices

## Security Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              AWS Optimizer Security                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ Application Layer (React)                    │ │
│  │ - HTTPS only (production)                    │ │
│  │ - JWT token in localStorage (secure)         │ │
│  │ - CORS validation                            │ │
│  └───────────────────────────────────────────────┘ │
│                    ↓ JWT Bearer                    │
│  ┌───────────────────────────────────────────────┐ │
│  │ API Layer (Express)                          │ │
│  │ - JWT verification middleware                │ │
│  │ - Input validation & sanitization            │ │
│  │ - Rate limiting                              │ │
│  │ - Error handling (no stack traces)           │ │
│  └───────────────────────────────────────────────┘ │
│                    ↓ Encrypted AWS Creds           │
│  ┌───────────────────────────────────────────────┐ │
│  │ Data Layer (MongoDB)                         │ │
│  │ - Connection validation                      │ │
│  │ - Password hashing (bcryptjs)                │ │
│  │ - Encrypted sensitive fields                 │ │
│  │ - User data isolation                        │ │
│  └───────────────────────────────────────────────┘ │
│                    ↓                               │
│  ┌───────────────────────────────────────────────┐ │
│  │ AWS SDK Layer                                │ │
│  │ - Read-only operations preferred             │ │
│  │ - IAM role restrictions                      │ │
│  │ - Audit logging                              │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 1. Authentication System

### How Authentication Works

**Step 1: User Registration**
```
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Process:**
1. Validate email format (RFC 5322)
2. Validate password strength (min 8 chars, uppercase, number, special char)
3. Check if email already exists
4. Hash password with bcryptjs (10 salt rounds)
5. Create user document in MongoDB
6. Return success message

**Step 2: User Login**
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Process:**
1. Find user by email
2. Compare password with stored hash using bcryptjs.compare()
3. If match:
   - Generate JWT token
   - Store session in usersessions collection
   - Return token and user info
4. If no match:
   - Return 401 Unauthorized
   - Don't reveal if email exists (security)

**Step 3: Authenticated Requests**
```
GET /api/user/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Process:**
1. Extract token from Authorization header
2. Verify JWT signature using JWT_SECRET
3. Decode JWT payload
4. Validate token hasn't expired
5. Load user from database
6. Attach user to request object
7. Continue to route handler

### Password Security

**Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*)

**Invalid Passwords:**
- ❌ password123 (no uppercase, no special)
- ❌ Password (no number, no special)
- ❌ Pass1 (too short)
- ✅ SecurePass123! (meets all requirements)

**Hashing Algorithm:**
```typescript
// Password Hashing
const saltRounds = 10;
const passwordHash = await bcryptjs.hash(password, saltRounds);

// Password Verification
const isMatch = await bcryptjs.compare(plainPassword, passwordHash);
```

**Why bcryptjs:**
- Automatically salts passwords
- Computationally expensive (brute-force resistant)
- Adaptive cost factor (can increase with hardware improvements)
- Industry standard for password hashing

### JWT Token Structure

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "firstName": "John",
  "role": "user",
  "iat": 1620000000,
  "exp": 1620604800
}
```

**Signature:**
```
HMACSHA256(base64(header) + "." + base64(payload), JWT_SECRET)
```

**Example Token:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE2MjAwMDAwMDAsImV4cCI6MTYyMDYwNDgwMH0.xF3z8kJ9mL2qO7pR5sT1vX6yZ2aB4cD7eF9gH1iJ3kL
```

**Token Lifespan:**
- Duration: 7 days
- Expiry time stored as `exp` claim
- Automatically validated on each request
- Expired tokens return 401 Unauthorized

### Session Management

**Session Creation:**
```typescript
// When user logs in
const token = jwt.sign(
  { userId, email, role },
  JWT_SECRET,
  { expiresIn: '7d' }
);

// Store session
const session = new UserSession({
  userId,
  token,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  deviceInfo: {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
    platform: detectPlatform(req)
  },
  isActive: true
});
```

**Session Validation (on every request):**
```typescript
// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};
```

**Session Logout:**
```typescript
// When user logs out
POST /api/auth/logout
Authorization: Bearer <token>

// Backend action:
1. Find session with this token
2. Set isActive = false
3. Token becomes invalid
4. Subsequent requests rejected
```

---

## 2. Data Protection

### AWS Credentials Security

**Never Store Plaintext Credentials:**
```typescript
// ❌ NEVER DO THIS
const credentials = {
  accessKeyId: "AKIA1234567890ABCDEF",
  secretAccessKey: "wJal/XUUpFMRK/K7MDENG/J7JSTL3D4c7CW4JJ3"
};
```

**Safe Storage Approach:**
```typescript
// ✅ Store in environment variables
process.env.AWS_ACCESS_KEY_ID
process.env.AWS_SECRET_ACCESS_KEY

// ✅ Or use AWS IAM Roles (production)
const credentials = fromIni({ profile: 'aws-optimizer' });

// ✅ Or use AWS STS AssumeRole
const roleCredentials = await sts.assumeRole({
  RoleArn: 'arn:aws:iam::123456789:role/OptimizeRole'
});
```

**Best Practice for Production:**
```
┌─────────────┐
│ Application │
│  (no keys)  │
└──────┬──────┘
       │
       ↓
   AWS IAM Role
   (attached to EC2/Lambda)
       │
       ↓
   AWS STS (temporary credentials)
   (15 min - 1 hour expiry)
```

### Password Hashing Details

**Before Storage:**
```
User Input: "SecurePass123!"
↓
Input Validation (checked)
↓
bcryptjs.hash(password, 10)
↓
"$2b$10$N8pP7LtOPHa5yPD9qZ2X.OZrZqfqR3KfM2k8L9nX5pY2bQ1cD5n9K"
↓
Stored in MongoDB
```

**Never Accessible:**
- Database dump of passwordHash cannot be reversed
- Original password cannot be recovered
- Only verification by comparing new input to hash

### Sensitive Field Encryption

**Fields that should be encrypted:**
- AWS credentials (if stored)
- API keys
- Personal information (optional)

**Encryption method (AES-256):**
```typescript
const crypto = require('crypto');

function encryptField(plaintext, secret) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(secret), iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decryptField(ciphertext, secret) {
  const parts = ciphertext.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(secret), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(parts[2], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### Data Isolation

**User Can Only Access Own Data:**
```typescript
// ❌ WRONG - Returns any user's chats
app.get('/api/chat/history/:chatId', (req, res) => {
  const chat = ChatHistory.findById(req.params.chatId);
  res.json(chat);
});

// ✅ CORRECT - Verifies ownership
app.get('/api/chat/history/:chatId', auth, (req, res) => {
  const chat = ChatHistory.findById(req.params.chatId);
  
  // Verify user owns this chat
  if (chat.userId.toString() !== req.user.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.json(chat);
});
```

---

## 3. Security Best Practices

### Input Validation

**Always validate user input:**

```typescript
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validatePassword = (password) => {
  return password.length >= 8 &&
         /[A-Z]/.test(password) &&  // uppercase
         /[a-z]/.test(password) &&  // lowercase
         /[0-9]/.test(password) &&  // number
         /[!@#$%^&*]/.test(password); // special
};

const validateResourceId = (id) => {
  return /^i-[0-9a-f]{17}$/.test(id); // EC2 instance format
};
```

### SQL/NoSQL Injection Prevention

**Mongoose automatically prevents injection:**
```typescript
// ✅ SAFE - Mongoose uses parameterized queries
const user = await User.findOne({ email: userInput });

// ❌ UNSAFE - String concatenation
const user = await User.findOne({ 
  email: userInput 
}); // Actually safe with Mongoose, but DON'T CONCATENATE
```

### CORS Configuration

**Allow only trusted origins:**
```typescript
const corsOptions = {
  origin: ['http://localhost:5173', 'https://app.example.com'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### Rate Limiting

**Prevent brute-force attacks:**
```typescript
const rateLimit = require('express-rate-limit');

// Login rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, try again later',
  standardHeaders: true,
  legacyHeaders: false
});

app.post('/api/auth/login', loginLimiter, loginHandler);

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100 // 100 requests per minute
});

app.use('/api/', apiLimiter);
```

### Error Handling (No Stack Traces)

**Production error responses:**
```typescript
// ❌ NEVER expose stack traces in production
app.use((err, req, res, next) => {
  console.error(err.stack); // Log internally
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    stack: err.stack // ❌ EXPOSED!
  });
});

// ✅ CORRECT - Safe error response
app.use((err, req, res, next) => {
  console.error(err.stack); // Log internally
  
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(statusCode).json({
    error: isProduction ? 'Internal server error' : err.message,
    // Stack trace only in development
    ...(isProduction ? {} : { stack: err.stack })
  });
});
```

### HTTPS Configuration

**Development:**
```
http://localhost:5173
http://localhost:5000
(Self-signed certificates not required)
```

**Production:**
```typescript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/etc/ssl/private/server.key'),
  cert: fs.readFileSync('/etc/ssl/certs/server.crt'),
  ca: fs.readFileSync('/etc/ssl/certs/ca.crt')
};

https.createServer(options, app).listen(443);

// Redirect HTTP to HTTPS
const http = require('http');
http.createServer((req, res) => {
  res.writeHead(301, { 'Location': 'https://' + req.headers.host + req.url });
  res.end();
}).listen(80);
```

### Environment Variables Security

**Never commit `.env` file:**
```
.env file contents:
JWT_SECRET=very-secret-key-do-not-commit
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**Add to `.gitignore`:**
```
.env
.env.local
.env.*.local
.vscode/settings.json
node_modules/
dist/
```

**Use `.env.example` for documentation:**
```env
# Copy this file to .env and fill in your values
JWT_SECRET=your-secret-key-here
AWS_ACCESS_KEY_ID=your-aws-key-here
AWS_SECRET_ACCESS_KEY=your-aws-secret-here
GROQ_API_KEY=your-groq-key-here
```

---

## 4. Audit Logging

### What Gets Logged

**Authentication Events:**
- Login attempts (success & failure)
- Logout events
- Token expiry

**Data Access:**
- User profile viewed
- Chat history accessed
- Resources scanned
- Alerts viewed

**Data Modifications:**
- Settings changed
- Preferences updated
- Chat archived

**Security Events:**
- Failed authentication
- Invalid tokens
- Access denied
- Rate limit exceeded

### Audit Log Example

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439014"),
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "action": "login",
  "actionDetails": {
    "status": "success"
  },
  "severity": "info",
  "clientInfo": {
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "platform": "windows",
    "geoLocation": "New York, USA"
  },
  "timestamp": ISODate("2026-05-12T10:30:00.000Z")
}
```

### Audit Log Query

```javascript
// View login history
db.audits.find({
  userId: ObjectId("507f1f77bcf86cd799439011"),
  action: "login"
}).sort({ timestamp: -1 }).limit(10)

// View all security events
db.audits.find({
  severity: { $in: ['warning', 'critical'] }
}).sort({ timestamp: -1 }).limit(50)
```

---

## 5. AWS Credentials Best Practices

### Minimal Permissions Principle

**Restrict IAM user to read-only:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "iam:Get*",
        "iam:List*",
        "s3:List*",
        "s3:GetBucketLocation",
        "rds:Describe*"
      ],
      "Resource": "*"
    }
  ]
}
```

### Avoid Root Account

**❌ NEVER use root AWS credentials**
```
Don't use:
- Root access key ID
- Root secret access key
- Root account for applications
```

**✅ Create dedicated IAM user:**
```
1. Go to AWS Console > IAM
2. Create user: aws-optimizer
3. Attach policy: ReadOnlyAccess (or custom policy)
4. Generate access key
5. Use access key in application
```

### Rotate Credentials Regularly

**Every 90 days:**
1. Generate new access key
2. Update application `.env`
3. Deactivate old access key (7-day delay)
4. Delete old access key after verification

---

## 6. Compliance Considerations

### Data Retention

- User data: Indefinite (until account deletion)
- Chat history: 2 years (auto-archive after 1 year)
- Audit logs: 1 year (minimum for compliance)
- Session tokens: 7 days (auto-expire)

### Account Deletion

When user deletes account:
1. Mark account as deleted (soft delete)
2. Archive all user data
3. Delete session tokens
4. Keep audit logs (compliance)
5. Anonymous audit trail (user ID hashed)

### GDPR Compliance

**User Rights:**
- Right to access: Export all personal data
- Right to be forgotten: Account + data deletion
- Right to portability: Download data as JSON
- Right to rectification: Update personal info

---

## 7. Security Checklist

- [ ] `.env` file created and in `.gitignore`
- [ ] JWT_SECRET is 32+ characters
- [ ] AWS credentials are read-only IAM user
- [ ] HTTPS enabled (production)
- [ ] CORS restricted to trusted origins
- [ ] Rate limiting enabled on auth endpoints
- [ ] Password validation enforced
- [ ] No stack traces in error responses (production)
- [ ] Audit logging configured
- [ ] Database credentials not in code
- [ ] Groq API key in `.env`, not hardcoded
- [ ] Session timeout configured (7 days)
- [ ] Regular credential rotation scheduled

---

**Last Updated:** May 12, 2026  
**Security Level:** Production-Ready
