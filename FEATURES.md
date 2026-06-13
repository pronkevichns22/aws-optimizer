# FEATURES.md - Comprehensive Feature Guide

## Overview

AWS Optimizer provides three core features to help organizations manage their AWS infrastructure efficiently:

1. **AWS Infrastructure Scanning (CSPM)** - Security and compliance monitoring
2. **Cost Optimization (FinOps)** - Cost analysis and recommendations
3. **AI Advisor** - Intelligent recommendations using Groq Mixtral

---

## 1. AWS Infrastructure Scanning (CSPM)

### Purpose

Cloud Security Posture Management (CSPM) continuously scans AWS resources for security misconfigurations, policy violations, and compliance issues.

### What It Scans

**EC2 Instances:**
- Security group rules (port exposure)
- Public IP assignment
- IMDSv2 enablement
- Encryption status
- Termination protection
- Monitoring (CloudWatch agents)
- IAM instance profiles

**IAM Users & Roles:**
- Inactive access keys (>90 days)
- Users without MFA
- Overly permissive policies
- Root account usage
- Service role configuration

**EBS Volumes:**
- Encryption status
- Unattached volumes (orphaned)
- Snapshot backup presence
- Volume size efficiency
- I/O performance optimization

**Security Groups:**
- Wide-open rules (0.0.0.0/0)
- Unused groups
- Overly permissive protocols
- Missing logging

**Elastic IPs:**
- Unassociated IPs (wasted)
- Disassociation history
- Allocation efficiency

### How It Works

**Scan Flow:**
```
1. User clicks "Rescan" button
   ↓
2. Backend calls AWS EC2Client, IAMClient, etc.
   ↓
3. Collects all resources across regions
   ↓
4. Analyzes each resource against built-in rules
   ↓
5. Generates findings and alerts
   ↓
6. Stores in MongoDB
   ↓
7. Returns to frontend for display
```

### Security Rules

Rules are defined in `server/src/TYPES_AND_RULES.ts` with format:

```typescript
{
  ruleId: "SEC-001",
  name: "Public EC2 Security Group",
  category: "Security",
  severity: "CRITICAL",
  description: "Security group allows unrestricted access",
  remediation: "Restrict 0.0.0.0/0 to specific IPs",
  check: (resource) => {
    // JavaScript function that returns true if violated
  }
}
```

### Alert Severity Levels

| Severity | Color | Response Time |
|----------|-------|----------------|
| CRITICAL | Red | Immediate (24 hours) |
| HIGH | Orange | Urgent (48 hours) |
| MEDIUM | Yellow | Standard (1 week) |
| LOW | Blue | Planning (2 weeks) |
| INFO | Green | FYI | 

### Example Scan Results

**Dashboard shows:**
- Total resources: 15
- Resources analyzed: 15
- Alerts generated: 8
  - Critical: 2
  - High: 3
  - Medium: 2
  - Low: 1

**Alert Details:**
```
CRITICAL - Public EC2 Instance (i-0123456789abcdef0)
Location: us-east-1
Issue: Security group sg-12345 allows SSH from 0.0.0.0/0
Remediation: Restrict SSH access to corporate IP ranges
```

---

## 2. Cost Optimization (FinOps)

### Purpose

Financial Operations (FinOps) analyzes your AWS spending patterns and recommends cost-saving opportunities.

### Cost Categories Analyzed

**1. Underutilized Resources**
- EC2 instances with <10% CPU usage for 30 days
- RDS instances below 20% utilization
- EBS volumes with minimal I/O activity
- NAT Gateway usage patterns

**Savings Potential:** 30-50% of compute costs

**Example:**
```
t3.large instance (unused)
Current cost: $50/month
Recommended action: Downsize to t3.micro
Potential savings: $45/month
Annual savings: $540
```

**2. Reserved Instances (RI) Optimization**
- Analyze on-demand vs RI pricing
- Recommend RI purchases for steady-state workloads
- Identify RIs with low utilization

**Savings Potential:** 30-72% discount vs on-demand

**Example:**
```
10 x t3.medium on-demand instances
On-demand cost: $1,460/year per instance = $14,600 total
1-year RI cost: $730/instance = $7,300 total
Savings: $7,300/year (50%)
```

**3. Unattached Resources**
- EBS volumes not connected to instances
- Elastic IPs not assigned
- Network interfaces without instances

**Savings Potential:** 100% (complete elimination)

**Example:**
```
15 unattached EBS volumes
Total cost: $180/month
Action: Delete orphaned volumes
Savings: $180/month ($2,160/year)
```

**4. Data Transfer Costs**
- NAT Gateway usage (expensive for egress)
- CloudFront cache optimization
- VPC Endpoint efficiency
- Multi-region data transfer

**Savings Potential:** 50-80% of data transfer costs

**Example:**
```
NAT Gateway: 500 GB/month egress
Cost: $45/month ($540/year)
Alternative: Use VPC Endpoint for S3
Savings: $45/month ($540/year)
```

**5. Storage Optimization**
- S3 lifecycle policies (move to Glacier)
- RDS backup retention (excessive)
- EBS snapshot cleanup
- CloudWatch Logs retention

**Savings Potential:** 40-60% of storage costs

### Cost Trend Analysis

**Charts show:**
- Last 30 days spending trend
- Projected monthly cost
- Trend direction (up/down)
- Month-over-month comparison

**Example Trend:**
```
May 1:   $2,100
May 7:   $2,150 (+2.4%)
May 14:  $2,300 (+6.9%)  [Spike detected]
May 21:  $2,250 (-2.2%)
May 28:  $2,400 (+6.7%)
Projected: $2,450/month
```

### How Recommendations Are Generated

**Algorithm:**
```
1. Fetch CloudWatch metrics for all resources
2. Calculate average CPU, memory, network usage
3. Compare against thresholds
4. Get current pricing for resource type
5. Calculate savings if optimized
6. Generate recommendation card
```

**Example Recommendation:**
```
Title: Downsize Database Instance
Current: db.r5.2xlarge (16 vCPU, 64 GB RAM)
Usage: Peak 8 vCPU, 16 GB RAM
Recommended: db.r5.large (2 vCPU, 16 GB RAM)
Current cost: $3,700/month
New cost: $925/month
Savings: $2,775/month ($33,300/year)
Risk: Low (comfortable headroom)
```

---

## 3. AI Advisor

### Purpose

Intelligent chatbot powered by Groq Mixtral LLM that provides context-aware recommendations based on your AWS infrastructure.

### Capabilities

**1. Cost Analysis**
- "What are my top 5 cost drivers?"
- "How can I save on compute costs?"
- "Should I use reserved instances?"
- "What resources are wasting money?"

**2. Security Recommendations**
- "What are my critical security issues?"
- "How do I harden my security groups?"
- "What IAM policies are too permissive?"
- "Which instances need security updates?"

**3. Architecture Advice**
- "How should I redesign for high availability?"
- "What auto-scaling policies do I need?"
- "How do I optimize for performance?"
- "Should I use S3 or EBS for this data?"

**4. Compliance Guidance**
- "What do I need for PCI-DSS compliance?"
- "Am I meeting HIPAA requirements?"
- "How do I prepare for SOC 2 audit?"

**5. Operational Support**
- "How do I troubleshoot this error?"
- "What monitoring should I set up?"
- "How do I automate this task?"

### How It Works

**AI Processing Flow:**
```
1. User asks question in chat
   ↓
2. Frontend sends message via /api/chat/ai-advisor
   ↓
3. Backend retrieves user's AWS scanning data
   ↓
4. Prepares context with:
   - Current resources
   - Recent alerts
   - Cost trends
   - Security findings
   ↓
5. Builds system prompt with context
   ↓
6. Calls Groq Mixtral API with:
   - User message
   - System prompt
   - Chat history (for context)
   ↓
7. Receives AI response
   ↓
8. Stores in chathistories collection
   ↓
9. Streams response to frontend
   ↓
10. User sees assistant's answer
```

### System Prompt

The AI is instructed as:
```
You are an expert AWS cloud architect and cost optimization specialist.
You have access to the user's current AWS infrastructure details including:
- All EC2, RDS, S3 resources
- Security group configurations
- IAM policies and roles
- Cost data and trends
- Recent security findings

Your role is to:
1. Analyze their infrastructure
2. Identify inefficiencies
3. Provide actionable recommendations
4. Explain security implications
5. Estimate cost savings potential

Always be specific with numbers and timelines.
Focus on practical, implementable solutions.
Consider compliance and security alongside cost.
```

### Configuration Options

Users can customize AI behavior in Settings:

**Model Selection:**
- Groq Mixtral 8x7b (faster, efficient)
- Groq Llama 2 70b (more accurate)

**Temperature (Creativity):**
- 0.0 = Deterministic (consistent answers)
- 0.7 = Balanced (default)
- 1.0 = Creative (varied responses)

**Response Style:**
- Brief (500 chars max)
- Detailed (2000 chars default)
- Technical (with code examples)

**Focus Areas:**
- Cost optimization
- Security hardening
- Performance tuning
- Compliance

### Chat History Management

**Features:**
- Each conversation stored separately
- Search previous chats
- Export recommendations as PDF
- Archive old conversations
- Export chat as JSON

**Limits:**
- Max 1000 messages per chat
- Max 10,000 characters per message
- Retention: 2 years (auto-archive after 1 year)

### Example Conversation

**User:** "How can I reduce my AWS bill by 50%?"

**Assistant:**
```
Based on your infrastructure analysis, here are the top 5 ways to save:

1. RIGHT-SIZE EC2 INSTANCES ($1,200/month = $14,400/year)
   - 8x t3.large running at <10% CPU
   - Downsize to t3.micro
   - Savings: $1,200/month

2. PURCHASE RESERVED INSTANCES ($890/month = $10,680/year)
   - 12 t3.medium on-demand instances
   - 1-year RIs: 52% discount
   - Savings: $890/month

3. DELETE ORPHANED RESOURCES ($350/month = $4,200/year)
   - 15 unattached EBS volumes
   - 23 unused Elastic IPs
   - Savings: $350/month

4. OPTIMIZE DATA TRANSFER ($280/month = $3,360/year)
   - Switch NAT Gateway to VPC Endpoints
   - Reduce cross-region transfers
   - Savings: $280/month

5. IMPLEMENT S3 LIFECYCLE ($190/month = $2,280/year)
   - Move old logs to Glacier
   - Delete snapshots >30 days old
   - Savings: $190/month

TOTAL MONTHLY SAVINGS: $2,910
TOTAL ANNUAL SAVINGS: $34,920
REDUCTION: 52% of your current bill

Implementation timeline: 4-6 weeks
Risk level: Low
Effort: Medium
```

---

## 4. Dashboard Metrics

### Key Performance Indicators (KPIs)

**Health Score (0-100):**
- Measures overall AWS security posture
- Calculation: (100 - critical_count*10 - high_count*5 - medium_count*2 - low_count*1)
- Target: >85

**Cost Trend:**
- Shows last 30 days spending
- Calculates month-over-month change
- Predicts next month's cost

**Active Resources:**
- Total instances, databases, storage
- Grouped by type
- Shows allocation per service

**Recent Alerts:**
- Last 5 critical/high severity alerts
- Remediation status
- Time since discovery

### Example Dashboard

```
┌─────────────────────────────────────────────────────┐
│                    AWS OPTIMIZER                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Health Score: 78/100 ⚠️                           │
│  Cost Trend:  $2,450/month (+6.2% vs last month)  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Resources                                    │  │
│  │ EC2: 12 instances                            │  │
│  │ RDS: 3 databases                             │  │
│  │ S3:  47 buckets                              │  │
│  │ Total: 62 resources                          │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Recent Alerts                                │  │
│  │ 🔴 Public S3 bucket (prod-backup)            │  │
│  │ 🔴 Root account key found                    │  │
│  │ 🟠 Database without backup                   │  │
│  │ 🟠 Unused NAT Gateway                        │  │
│  │ 🟡 CloudWatch disabled                       │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Cost Savings Available: $2,910/month         │  │
│  │ Ask AI Advisor for recommendations →         │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 5. Reporting & Export

### PDF Report Generation

**Includes:**
- Executive summary
- Health score and trend
- Top security findings
- Cost analysis
- Recommendations
- Resource inventory

**Generation time:** ~5 seconds
**File size:** 2-5 MB

### Data Export Formats

**CSV Export:**
- All resources with details
- Security findings
- Cost breakdowns
- Alert history

**JSON Export:**
- Full data structure
- Metadata and timestamps
- Relationships preserved

---

## 6. User Management

### Role-Based Access Control

**User Role:**
- View own resources
- Run scans
- View alerts
- Use AI advisor
- Can't modify other users' data

**Admin Role (Future):**
- View all users' resources
- Manage users
- Configure global settings
- Access audit logs
- Modify alert rules

### Preferences

**Storage:**
- Theme (dark/light)
- Notification preferences
- Auto-scan frequency
- Email alerts enabled/disabled

---

## 7. Security & Compliance

### Built-in Security Features

**1. Authentication**
- Email/password login
- JWT token-based sessions
- Password hashing (bcryptjs)
- Session timeout (7 days)

**2. Authorization**
- JWT validation on every request
- User data isolation
- Role-based access (user/admin)

**3. Data Protection**
- MongoDB connection (local network)
- HTTPS ready (for production)
- No plaintext password storage
- API rate limiting

**4. Audit Logging**
- Track all user actions
- Log security events
- Store client IP and user agent
- Retention: 1 year minimum

---

## Feature Comparison Table

| Feature | Community | Pro | Enterprise |
|---------|-----------|-----|------------|
| Infrastructure Scanning | ✅ | ✅ | ✅ |
| Cost Analysis | ✅ | ✅ | ✅ |
| AI Advisor | ✅ | ✅ | ✅ |
| Alerts | ✅ | ✅ | ✅ |
| PDF Reports | ❌ | ✅ | ✅ |
| API Access | ❌ | ✅ | ✅ |
| Custom Rules | ❌ | ✅ | ✅ |
| Multi-Account | ❌ | ❌ | ✅ |
| Premium Support | ❌ | ❌ | ✅ |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Focus search |
| `Ctrl+/` | Show help |
| `Cmd+K` (Mac) | Focus search |
| `Shift+?` | Keyboard help |

---

**Last Updated:** May 12, 2026  
**Version:** 1.0.0
