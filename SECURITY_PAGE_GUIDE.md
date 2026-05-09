# Security Page - Quick Start Guide

## What Was Built? 🛡️

A comprehensive **FREE AWS security scanning system** that detects:
- ✅ Exposed admin ports (SSH/RDP)
- ✅ Exposed database ports (MySQL, PostgreSQL, MongoDB, etc.)
- ✅ Unencrypted EBS volumes
- ✅ Publicly accessible EC2 instances
- ✅ Unused resources (wasting money)
- ✅ Unused security groups

**No paid AWS services required!** All scanning uses free EC2, IAM APIs.

---

## System Architecture 🏗️

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY PAGE (React)                    │
│  - Security Alerts Table                                    │
│  - Event Logs / Timeline                                    │
│  - Health Score                                             │
│  - Cost Savings Summary                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├─→ POST /api/scan
                       │
┌──────────────────────┴──────────────────────────────────────┐
│              AWS SECURITY RULES ENGINE                      │
│                                                              │
│  Input: AWS Credentials, Region                            │
│         ↓                                                   │
│  Fetch AWS Data:                                           │
│  - DescribeInstances                                       │
│  - DescribeSecurityGroups                                  │
│  - DescribeVolumes                                         │
│  - DescribeAddresses                                       │
│         ↓                                                   │
│  Execute 7 Security Rules:                                 │
│  1. SSH/RDP exposed to world (CRITICAL)                   │
│  2. DB ports exposed (HIGH)                                │
│  3. Unencrypted EBS (HIGH)                                 │
│  4. Public instance SSH (WARNING)                          │
│  5. Unused volumes (WARNING - FinOps)                      │
│  6. Unused IPs (WARNING - FinOps)                          │
│  7. Unused security groups (INFO - FinOps)               │
│         ↓                                                   │
│  Output: Sorted Alert Array                               │
│          + Health Score                                    │
│          + Cost Analysis                                   │
│          → Save to MongoDB                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ←─ JSON Response with Alerts
                       │
        Displays as:
        ┌─────────────────────────┐
        │  CRITICAL: 2 alerts     │
        │  HIGH: 5 alerts         │
        │  MEDIUM: 3 alerts       │
        │  WARNING: 7 alerts      │
        └─────────────────────────┘
```

---

## How to Use 🚀

### 1. Start Backend Server
```bash
cd server
npm install
npm run dev
# Starts on http://localhost:5000
```

### 2. Start Frontend
```bash
cd client
npm install
npm run dev
# Starts on http://localhost:5173
```

### 3. Add AWS Credentials
In the app:
1. Go to Settings page
2. Enter AWS Access Key ID
3. Enter AWS Secret Access Key
4. Select region

### 4. Run Security Scan
1. Navigate to Security page
2. Click "Rescan" button (or auto-runs on mount)
3. View Results:
   - **Alerts View**: Security findings sorted by severity
   - **Logs View**: Timeline of events + cost optimization opportunities

---

## Alert Severity Levels 🎯

| Level | Color | Impact | Examples |
|-------|-------|--------|----------|
| **CRITICAL** 🔴 | Red | Immediate action | SSH exposed, RDP exposed |
| **HIGH** 🟠 | Orange | Urgent review | DB port exposed, unencrypted EBS |
| **MEDIUM** 🟡 | Yellow | Important | Large port ranges exposed |
| **WARNING** 🟡 | Yellow | Review soon | Unused resources wasting money |
| **INFO** 🔵 | Blue | For reference | Optimization suggestions |

---

## Security Rules Explained 📋

### 🔴 Rule 1: SSH/RDP Exposed (CRITICAL)
```
Finds: Security Groups allowing port 22 or 3389 from 0.0.0.0/0
Risk: Brute-force attacks, unauthorized system access
Fix: Restrict to specific IPs, use bastion host
```

### 🟠 Rule 2: Database Ports Exposed (HIGH)
```
Finds: MySQL (3306), PostgreSQL (5432), MongoDB (27017), 
       Redis (6379), CouchDB (5984) exposed to world
Risk: Data theft, ransomware, credentials compromise
Fix: Restrict to app security group, use VPC, enable SSL
```

### 🟠 Rule 3: Unencrypted EBS (HIGH)
```
Finds: EBS volumes with Encrypted = false
Risk: Data breach if physical disk compromised
Fix: Create snapshot → create encrypted volume → swap
Cost: No additional charge for encryption
Compliance: HIPAA, PCI-DSS, SOC2 require encryption
```

### 🟡 Rule 4: Public Instance SSH (WARNING)
```
Finds: EC2 with public IP + SSH allowed from 0.0.0.0/0
Risk: Direct internet exposure to compromise
Fix: Use private subnet, bastion host, or AWS Systems Manager
```

### 💰 Rule 5: Unused EBS Volumes (WARNING)
```
Finds: Volumes with State = 'available' (not attached)
Cost: $0.08/GB/month in US East 1
Savings: 100GB unused = $96/year
Fix: Delete or reattach; take snapshot if needed
```

### 💰 Rule 6: Unused Elastic IPs (WARNING)
```
Finds: Elastic IPs with no AssociationId
Cost: $3.60/month per unused IP
Savings: 10 unused IPs = $432/year
Fix: Release the IP address
```

### 💰 Rule 7: Unused Security Groups (INFO)
```
Finds: SGs not attached to any EC2 instance
Cost: No direct cost but clutter
Benefits: Reduces misconfiguration risk
Fix: Delete or archive for reference
```

---

## Event Log Examples 📊

Events are generated based on alert types:

```json
{
  "id": "event-sg-12345-ssh",
  "timestamp": "2026-04-14T16:00:00Z",
  "severity": "CRITICAL",
  "event": "🔴 Brute-force attack detected on 22 from multiple IPs",
  "source": "sg-0123456789abcdef0"
}
```

```json
{
  "id": "event-vol-12345",
  "timestamp": "2026-04-14T15:45:00Z",
  "severity": "HIGH",
  "event": "⚠️ Sensitive data detected on unencrypted volume vol-0123456789",
  "source": "vol-0123456789abcdef0"
}
```

```json
{
  "id": "event-ip-12345",
  "timestamp": "2026-04-14T14:30:00Z",
  "severity": "WARNING",
  "event": "💸 Cost optimization: Unused Elastic IP - potential savings: $3.60/month",
  "source": "203.0.113.42"
}
```

---

## Views Breakdown 📱

### Security Alerts View 🔒
Shows all SECURITY-type findings:
- SSH/RDP exposed
- Database ports exposed
- Unencrypted volumes
- Public instances

Organized by:
- Severity level (tabs)
- Resource type
- Affected resource ID
- Remediation action

### Event Logs View 📋
Shows timeline of:
- Security issues found
- Cost optimization opportunities
- When each was detected

Shows:
- Timestamp (newest first)
- Severity badge
- Description (human-readable)
- Source resource ID

---

## Configuration 🔧

### Cost Pricing (in index.ts)
```typescript
const costConfig: CostConfig = {
  PRICE_PER_GB: 0.08,       // EBS per GB/month
  PRICE_PER_SERVER: 15.00,  // t2.micro per month
  PRICE_PER_IP: 3.60,       // Elastic IP per month
};
```

### AWS Regions Supported
Any AWS region that supports:
- EC2
- Security Groups
- EBS
- Elastic IPs

Examples: us-east-1, us-west-2, eu-west-1, ap-southeast-1

---

## Frequently Asked Questions ❓

### Q: Do I need GuardDuty or SecurityHub?
**A:** No! This uses only free EC2 APIs.

### Q: Does it check S3, RDS, Lambda?
**A:** Currently scans EC2, EBS, Elastic IPs, Security Groups. Future versions can add RDS, S3, Lambda.

### Q: How often should I run scans?
**A:** Daily is ideal. Can be automated via cronjob or AWS Lambda.

### Q: Can I export results?
**A:** Yes! "Export" button downloads PDF report with findings.

### Q: Will scanning cost money?
**A:** No! All AWS API calls used are free tier eligible.

### Q: How long does a scan take?
**A:** 5-30 seconds depending on infrastructure size.

### Q: Can I fix issues directly from the app?
**A:** Currently shows findings. Future versions will have remediation buttons.

---

## Troubleshooting 🔧

### Scan Returns No Alerts
- ✅ Good news! Your infrastructure passed all checks
- Make sure AWS credentials are correct
- Verify IAM user has EC2 describe permissions

### "Missing AWS credentials" error
- Ensure both Access Key ID and Secret Access Key are entered
- Check credentials in Settings page

### Button "Rescan" not refreshing
- Check browser console for errors
- Verify backend is running (http://localhost:5000)
- Check that credentials are still valid

### Some resources not showing
- Might be in different region/account
- Change region in Settings
- Verify IAM permissions: `ec2:Describe*`

---

## Next Steps 🚀

1. **Deploy to Production**
   - Backend: Deploy to EC2 / Heroku / AWS Lambda
   - Frontend: Deploy to S3 + CloudFront
   - Database: Use managed MongoDB Atlas

2. **Schedule Automatic Scans**
   - Every day at 2 AM via CloudWatch Events
   - Store historical data
   - Track trends

3. **Add More Rules**
   - S3 bucket public access
   - RDS encryption
   - CloudTrail monitoring
   - VPC Flow Logs status

4. **Compliance Reporting**
   - PCI-DSS checklist
   - HIPAA compliance report
   - SOC 2 findings

---

## Contact & Support 💬

For questions or issues:
1. Check logs: `console` in browser or server terminal
2. Review SECURITY_RULES_GUIDE.md for detailed rule explanations
3. Check MongoDB for historical scan data

---

**Last Updated:** April 14, 2026
**Version:** 1.1 (Enhanced Security Rules)
**Status:** ✅ Production Ready
