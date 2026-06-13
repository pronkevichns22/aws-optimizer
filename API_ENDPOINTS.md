# API_ENDPOINTS.md - Complete REST API Documentation

## API Overview

**Base URL:** `http://localhost:5000/api`

All endpoints return JSON responses. Authentication uses JWT tokens in the Authorization header.

---

## Authentication Endpoints

### 1. Register New User
```
POST /api/auth/register
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 - Created):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "message": "User registered successfully"
}
```

**Error (400 - Bad Request):**
```json
{
  "success": false,
  "error": "Email already exists"
}
```

---

### 2. User Login
```
POST /api/auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "role": "user"
  },
  "message": "Login successful"
}
```

**Error (401 - Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

### 3. User Logout
```
GET /api/auth/logout
Headers: Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## AWS Scanning Endpoints

### 4. Execute Full Infrastructure Scan
```
POST /api/scan/full
Headers: Authorization: Bearer {token}
```

**Request (optional body):**
```json
{
  "regions": ["us-east-1", "us-west-2"],
  "includeIAM": true,
  "includeSecurityGroups": true
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "scanId": "scan_123abc",
  "resources": {
    "ec2Instances": [
      {
        "instanceId": "i-0123456789abcdef0",
        "state": "running",
        "type": "t2.micro",
        "launchTime": "2026-03-15T10:30:00Z",
        "tags": {
          "Name": "Production Server",
          "Environment": "prod"
        },
        "publicIpAddress": "18.216.127.45",
        "privateIpAddress": "10.0.1.100"
      }
    ],
    "ebsVolumes": [
      {
        "volumeId": "vol-0123456789abcdef0",
        "size": 100,
        "state": "available",
        "type": "gp2",
        "iops": 300,
        "throughput": 125,
        "encrypted": false,
        "createTime": "2026-02-10T08:15:00Z",
        "attachments": []
      }
    ],
    "elasticIps": [
      {
        "publicIp": "203.0.113.45",
        "allocationId": "eipalloc-0123456789abcdef0",
        "associationId": null,
        "domain": "vpc",
        "networkInterfaceId": null,
        "networkInterfaceOwnerId": null
      }
    ],
    "securityGroups": [
      {
        "groupId": "sg-0123456789abcdef0",
        "groupName": "default",
        "description": "default VPC security group",
        "vpcId": "vpc-12345678",
        "ingressRules": [
          {
            "protocol": "-1",
            "fromPort": -1,
            "toPort": -1,
            "cidrIp": "0.0.0.0/0",
            "description": "Allow all"
          }
        ]
      }
    ],
    "iamUsers": [
      {
        "userName": "admin-user",
        "userId": "AIDACKCEVSQ6C2EXAMPLE",
        "arn": "arn:aws:iam::123456789012:user/admin-user",
        "createDate": "2025-01-15T10:00:00Z",
        "hasLoginProfile": true,
        "hasAccessKeys": true
      }
    ]
  },
  "alerts": [
    {
      "id": "alert_001",
      "resourceId": "vol-0123456789abcdef0",
      "resourceType": "EBS",
      "severity": "medium",
      "category": "FinOps",
      "title": "Unattached EBS Volume",
      "description": "Volume is not attached to any EC2 instance",
      "recommendation": "Delete the volume to reduce costs",
      "estimatedMonthlyCost": 12.50,
      "timestamp": "2026-05-12T10:30:00Z"
    }
  ],
  "summary": {
    "totalResources": 15,
    "alertCount": 8,
    "criticalAlerts": 2,
    "warningAlerts": 5,
    "estimatedMonthlySavings": 450.75,
    "scanDuration": "3.25s"
  }
}
```

**Error (500 - Server Error):**
```json
{
  "success": false,
  "error": "AWS API Error: Access denied",
  "code": "AWS_ACCESS_DENIED"
}
```

---

### 5. Get Scan Results History
```
GET /api/scan/history?limit=10&offset=0
Headers: Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "scans": [
    {
      "scanId": "scan_001",
      "timestamp": "2026-05-12T10:30:00Z",
      "duration": 3.25,
      "resourceCount": 15,
      "alertCount": 8,
      "status": "completed"
    }
  ],
  "total": 42,
  "limit": 10,
  "offset": 0
}
```

---

## Chat History Endpoints

### 6. Get Chat History
```
GET /api/chat/history?limit=50&offset=0
Headers: Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "chats": [
    {
      "id": "chat_001",
      "title": "Cost Optimization Discussion",
      "messageCount": 12,
      "createdAt": "2026-05-10T14:20:00Z",
      "updatedAt": "2026-05-12T09:15:00Z",
      "preview": "How can I reduce my AWS costs..."
    }
  ],
  "total": 5,
  "limit": 50,
  "offset": 0
}
```

---

### 7. Get Chat Messages
```
GET /api/chat/:chatId/messages?limit=50
Headers: Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "chatId": "chat_001",
  "messages": [
    {
      "id": "msg_001",
      "role": "user",
      "content": "How can I reduce my AWS costs?",
      "timestamp": "2026-05-10T14:20:00Z"
    },
    {
      "id": "msg_002",
      "role": "assistant",
      "content": "Based on your infrastructure analysis, here are the top cost-saving opportunities:\n1. Delete unattached EBS volumes\n2. Remove unused Elastic IPs\n3. Right-size EC2 instances",
      "timestamp": "2026-05-10T14:21:15Z"
    }
  ],
  "total": 24,
  "limit": 50
}
```

---

### 8. Send Message to AI Advisor
```
POST /api/ai-advisor
Headers: Authorization: Bearer {token}
```

**Request:**
```json
{
  "message": "What security issues do I have?",
  "chatId": "chat_001",
  "context": {
    "resourceCount": 15,
    "totalCost": 2450.75,
    "criticalAlerts": 2,
    "recentAlerts": [
      {
        "type": "Public Security Group",
        "severity": "critical",
        "count": 1
      }
    ]
  }
}
```

**Response (200 - OK - Streaming):**
```json
{
  "success": true,
  "messageId": "msg_003",
  "response": "Your infrastructure has several security concerns:\n\n1. **PUBLIC SECURITY GROUP** (CRITICAL)\n   - Found 1 security group allowing unrestricted access (0.0.0.0/0)\n   - Recommendation: Restrict access to specific IPs or security groups\n\n2. **UNENCRYPTED VOLUMES** (HIGH)\n   - 3 EBS volumes are not encrypted\n   - Recommendation: Enable encryption for data protection\n\n3. **IAM USERS WITHOUT MFA** (MEDIUM)\n   - 2 users have login access but no MFA enabled\n   - Recommendation: Enable MFA for all interactive users",
  "timestamp": "2026-05-12T10:35:00Z",
  "savedToHistory": true
}
```

---

### 9. Delete Chat
```
DELETE /api/chat/:chatId
Headers: Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "message": "Chat deleted successfully"
}
```

---

## Alerts & Findings Endpoints

### 10. Get All Alerts
```
GET /api/alerts?severity=critical&category=security&limit=20
Headers: Authorization: Bearer {token}
```

**Query Parameters:**
- `severity`: critical | high | medium | low
- `category`: security | cost | compliance | all
- `resolved`: true | false
- `limit`: number (default: 20)
- `offset`: number (default: 0)

**Response (200 - OK):**
```json
{
  "success": true,
  "alerts": [
    {
      "id": "alert_001",
      "resourceId": "sg-0123456789abcdef0",
      "resourceType": "SecurityGroup",
      "severity": "critical",
      "category": "security",
      "title": "Public Security Group",
      "description": "Security group allows inbound traffic from 0.0.0.0/0 on port 3306",
      "recommendation": "Restrict database access to specific IPs or security groups",
      "affectedResources": ["sg-0123456789abcdef0"],
      "estimatedImpact": "Unauthorized database access",
      "complianceFramework": ["CIS AWS", "SOC2"],
      "createdAt": "2026-05-12T08:00:00Z",
      "resolvedAt": null,
      "status": "open"
    }
  ],
  "total": 8,
  "critical": 2,
  "high": 3,
  "medium": 2,
  "low": 1
}
```

---

### 11. Mark Alert as Resolved
```
PUT /api/alerts/:alertId/resolve
Headers: Authorization: Bearer {token}
```

**Request:**
```json
{
  "resolution": "Updated security group rules",
  "notes": "Restricted access to internal IPs only"
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "alert": {
    "id": "alert_001",
    "status": "resolved",
    "resolvedAt": "2026-05-12T10:45:00Z"
  }
}
```

> **⚠️ [INCOMPLETE] Endpoints для snooze (/api/alerts/:id/snooze), acknowledge (/api/alerts/:id/acknowledge), и истории алертов (/api/alerts/history) НЕ документированы и НЕ реализованы.**

---

## User Settings Endpoints

### 12. Get User Profile
```
GET /api/user/profile
Headers: Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "createdAt": "2026-03-15T10:30:00Z",
    "preferences": {
      "theme": "dark",
      "notifications": true,
      "autoScan": true,
      "scanInterval": 3600
    }
  }
}
```

---

### 13. Update User Preferences
```
PUT /api/user/preferences
Headers: Authorization: Bearer {token}
```

**Request:**
```json
{
  "theme": "light",
  "notifications": true,
  "autoScan": false,
  "scanInterval": 7200
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "preferences": {
    "theme": "light",
    "notifications": true,
    "autoScan": false,
    "scanInterval": 7200
  }
}
```

---

### 14. Update AI Advisor Settings
```
PUT /api/user/ai-settings
Headers: Authorization: Bearer {token}
```

**Request:**
```json
{
  "model": "groq-mixtral",
  "temperature": 0.7,
  "maxTokens": 2000,
  "systemPrompt": "You are a helpful AWS optimization expert..."
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "aiSettings": {
    "model": "groq-mixtral",
    "temperature": 0.7,
    "maxTokens": 2000
  }
}
```

---

## Audit & Logging Endpoints

### 15. Get Audit Logs
```
GET /api/audit/logs?action=scan&limit=50
Headers: Authorization: Bearer {token}
```

**Query Parameters:**
- `action`: scan | login | logout | alert | settings
- `severity`: info | warning | critical
- `startDate`: ISO 8601 timestamp
- `endDate`: ISO 8601 timestamp

**Response (200 - OK):**
```json
{
  "success": true,
  "logs": [
    {
      "id": "audit_001",
      "userId": "507f1f77bcf86cd799439011",
      "action": "scan",
      "resourceType": "full",
      "severity": "info",
      "details": {
        "resourcesScanned": 15,
        "alertsGenerated": 8
      },
      "timestamp": "2026-05-12T10:30:00Z",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0..."
    }
  ],
  "total": 156
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "timestamp": "2026-05-12T10:45:00Z"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Meaning |
|------|------------|---------|
| `MISSING_REQUIRED_FIELD` | 400 | Required field missing |
| `INVALID_EMAIL_FORMAT` | 400 | Email format invalid |
| `WEAK_PASSWORD` | 400 | Password doesn't meet requirements |
| `EMAIL_EXISTS` | 400 | Email already registered |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `INVALID_TOKEN` | 401 | JWT token invalid/expired |
| `RESOURCE_NOT_FOUND` | 404 | Resource doesn't exist |
| `UNAUTHORIZED` | 403 | User lacks permissions |
| `INTERNAL_SERVER_ERROR` | 500 | Server-side error |
| `AWS_API_ERROR` | 502 | AWS API failed |
| `GROQ_API_ERROR` | 502 | Groq API failed |

---

## Authentication

### JWT Token Format
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### Token Payload
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "iat": 1612345678,
  "exp": 1612948478
}
```

---

## Rate Limiting

- **Login attempts:** 5 per 15 minutes
- **API calls:** 100 per minute (for authenticated users)
- **AI Advisor:** 10 requests per minute
- **Scanning:** 1 full scan per 5 minutes

---

**Last Updated:** May 12, 2026  
**API Version:** 1.0.0
