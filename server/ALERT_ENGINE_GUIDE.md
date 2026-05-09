# CloudOpti Alert Generation Engine - Developer Guide

## 🎯 Overview

The CloudOpti Alert Generation Engine is the core CSPM (Cloud Security Posture Management) and FinOps feature that replaces expensive native AWS services like Security Hub or advanced Trusted Advisor. It provides:

1. **Real-time security threat detection** through custom rule evaluation
2. **Cost optimization insights** by identifying wasted resources
3. **Structured alert output** for frontend display and reporting
4. **MongoDB persistence** for audit trails and historical analysis

---

## 🏗️ Architecture

### Data Flow

```
AWS Infrastructure
     ↓
┌─────────────────────────────────┐
│  AWS Data Fetching              │
│  - EC2 Instances                │
│  - EBS Volumes                  │
│  - Elastic IPs                  │
│  - Security Groups              │
└─────────────────────────────────┘
     ↓
┌─────────────────────────────────┐
│  Rules Engine                   │
│  1. Security Rules              │
│  2. FinOps Rules                │
└─────────────────────────────────┘
     ↓
┌─────────────────────────────────┐
│  Alert Generation               │
│  - Structured Alert Objects     │
│  - Severity Classification      │
│  - Metadata Enrichment          │
└─────────────────────────────────┘
     ↓
┌─────────────────────────────────┐
│  MongoDB Persistence            │
│  - Audit Document Storage       │
│  - Historical Tracking          │
└─────────────────────────────────┘
     ↓
React Frontend (Security Alerts Table, Event Logs, Dashboard)
```

---

## 📋 Alert Object Structure

Every alert generated follows this TypeScript interface:

```typescript
interface Alert {
  id: string;                           // UUID - unique identifier
  type: 'SECURITY' | 'FINOPS';         // Alert category
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO';  // Severity level
  title: string;                        // Short, actionable title
  description: string;                  // Detailed description with remediation context
  resourceId: string;                   // AWS resource ID affected
  resourceName?: string;                // Human-readable resource name
  ruleId: string;                       // Rule identifier for tracking
  timestamp: Date;                      // When alert was generated
  metadata?: Record<string, any>;       // Additional context (port, cost, etc.)
}
```

### Example Alert

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "SECURITY",
  "severity": "CRITICAL",
  "title": "Publicly Accessible SSH Port",
  "description": "Security Group \"web-sg\" (sg-0123456789abcdef0) allows unrestricted access to port 22 (SSH) from 0.0.0.0/0. This exposes the infrastructure to brute-force attacks and unauthorized access.",
  "resourceId": "sg-0123456789abcdef0",
  "resourceName": "web-sg",
  "ruleId": "sg-ssh-world",
  "timestamp": "2025-03-26T10:30:00.000Z",
  "metadata": {
    "port": 22,
    "protocol": "SSH",
    "groupId": "sg-0123456789abcdef0",
    "groupName": "web-sg",
    "fromPort": 0,
    "toPort": 65535
  }
}
```

---

## 🔐 Security Rules (CSPM)

### Rule 1: Publicly Accessible Admin Ports

**Rule ID:** `sg-ssh-world` / `sg-rdp-world`

**Function:** `generateSecurityGroupAlerts()`

**Severity:** CRITICAL

**Triggers When:**
- A Security Group inbound rule allows port 22 (SSH) OR port 3389 (RDP)
- AND the CIDR allows 0.0.0.0/0 or ::/0 (unrestricted access)

**Example Vulnerable Configuration:**
```
Security Group: "web-server-sg"
Inbound Rule:
  - Protocol: TCP
  - Port Range: 22 (SSH)
  - Source: 0.0.0.0/0 ❌ EXPOSED
```

**Alert Generated:**
```typescript
{
  type: 'SECURITY',
  severity: 'CRITICAL',
  title: 'Publicly Accessible SSH Port',
  description: 'Security Group "web-server-sg" (sg-xxx) allows unrestricted access to port 22 (SSH) from 0.0.0.0/0...',
  ruleId: 'sg-ssh-world'
}
```

**Remediation:**
1. Restrict SSH access to specific IPs (corporate VPN, bastion host)
2. Use Systems Manager Session Manager instead of direct SSH
3. Implement network ACLs as additional layers
4. Enable VPC Flow Logs for monitoring

---

## 💰 FinOps Rules (Cost Optimization)

### Rule 2: Unused EBS Volumes

**Rule ID:** `ebs-unattached`

**Function:** `generateEBSVolumeAlerts()`

**Severity:** WARNING

**Triggers When:**
- An EBS Volume state is "available" (unattached to any instance)

**Monthly Cost Impact:**
- $0.08 per GB (default; configurable in `costConfig`)
- A single 100GB unused volume costs $8/month × 12 = **$96/year**

**Example Vulnerable Configuration:**
```
Volume ID: vol-0a1b2c3d4e5f6
Size: 100 GB
State: available ❌ NOT ATTACHED
```

**Alert Generated:**
```typescript
{
  type: 'FINOPS',
  severity: 'WARNING',
  title: 'Unused EBS Volume',
  description: 'EBS Volume "vol-0a1b2c3d4e5f6" is unattached and not in use, wasting $8.00/month...',
  ruleId: 'ebs-unattached',
  metadata: {
    volumeId: 'vol-0a1b2c3d4e5f6',
    size: 100,
    monthlyCost: 8.00
  }
}
```

**Remediation:**
1. Check if volume is needed; if not, delete it
2. If needed, reattach to the correct instance
3. Create regular snapshots for backup before deletion
4. Use AWS Backup for compliance retention

---

### Rule 3: Unassociated Elastic IPs

**Rule ID:** `elasticip-unassociated`

**Function:** `generateElasticIPAlerts()`

**Severity:** WARNING

**Triggers When:**
- An Elastic IP has no `AssociationId` (not attached to any instance/ENI)

**Monthly Cost Impact:**
- $3.60 per unassociated IP (default; configurable)
- Adds up quickly: 10 unused IPs = $36/month = **$432/year**

**Example Vulnerable Configuration:**
```
Public IP: 203.0.113.42
State: NOT ASSOCIATED ❌
```

**Alert Generated:**
```typescript
{
  type: 'FINOPS',
  severity: 'WARNING',
  title: 'Unused Elastic IP',
  description: 'Elastic IP "203.0.113.42" is not associated with any resource, wasting $3.60/month...',
  ruleId: 'elasticip-unassociated',
  metadata: {
    publicIp: '203.0.113.42',
    monthlyCost: 3.60
  }
}
```

**Remediation:**
1. Associate with an instance/ENI if needed
2. If no longer needed, release the IP (AWS credits it immediately)
3. Implement automated cleanup policies

---

## 🔄 Rules Engine Execution Flow

### Step-by-Step Walkthrough

```typescript
function rulesEngine(assets: AWSAssets, costConfig: CostConfig): Alert[] {
  const alerts: Alert[] = [];

  // 1. Evaluate all Security Groups for public admin port access
  // Returns: Array of CRITICAL security alerts
  const sgAlerts = generateSecurityGroupAlerts(assets.securityGroups);
  alerts.push(...sgAlerts);

  // 2. Evaluate all EBS Volumes for unattached state
  // Returns: Array of WARNING cost alerts
  const ebsAlerts = generateEBSVolumeAlerts(assets.volumes, costConfig);
  alerts.push(...ebsAlerts);

  // 3. Evaluate all Elastic IPs for unassociated state
  // Returns: Array of WARNING cost alerts
  const ipAlerts = generateElasticIPAlerts(assets.elasticIPs, costConfig);
  alerts.push(...ipAlerts);

  // Returns consolidated, deduplicated alert list
  return alerts;
}
```

### Execution on `/api/scan`

1. **Authenticate** AWS credentials
2. **Fetch** 4 AWS resource types in parallel
3. **Run** Rules Engine (evaluates all rules)
4. **Calculate** financial metrics (spend vs waste)
5. **Compute** Health Score (CSPM scoring algorithm)
6. **Save** Complete Audit document with alerts to MongoDB
7. **Return** Comprehensive scan result including alerts

---

## 📊 MongoDB Schema

### Audit Document Structure

```typescript
{
  _id: ObjectId,
  
  // Metadata
  date: Date,                    // Scan timestamp
  timestamp: Date,               // Indexed for queries
  region: String,                // AWS region scanned
  healthScore: Number,           // 0-100 security score
  
  // Financial Data
  totalSpend: Number,            // Total monthly spend (all resources)
  totalWasted: Number,           // Total monthly waste (unused resources)
  
  // Resource Counts
  resourceCounts: {
    ec2Instances: Number,
    ebsVolumes: Number,
    elasticIPs: Number,
    securityGroups: Number
  },
  
  // Cost Breakdown
  costBreakdown: {
    ec2Cost: Number,             // EC2 running instances
    ebsCost: Number,             // All EBS volumes
    ipCost: Number               // Unassociated IPs
  },
  
  // Resources
  resourcesFound: Array,         // Only unused resources (for recommendations)
  allResources: Array,           // All resources (for inventory)
  
  // ALERTS (Core feature)
  alerts: [{
    id: String,                  // UUID
    type: 'SECURITY' | 'FINOPS',
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO',
    title: String,
    description: String,
    resourceId: String,
    resourceName: String,
    ruleId: String,
    timestamp: Date,
    metadata: Mixed
  }],
  
  // Audit Trail
  createdAt: Date,               // Auto-indexed
  updatedAt: Date                // Auto-indexed
}
```

### Query Examples

```javascript
// Get latest scan with all alerts
db.audits.findOne({}, { sort: { timestamp: -1 } })

// Get all CRITICAL security alerts
db.audits.findOne({}).alerts.filter(a => a.severity === 'CRITICAL' && a.type === 'SECURITY')

// Calculate total waste over time
db.audits.aggregate([
  { $group: { _id: null, avgWaste: { $avg: '$totalWasted' } } }
])

// Get top 10 most common rules triggered
db.audits.aggregate([
  { $unwind: '$alerts' },
  { $group: { _id: '$alerts.ruleId', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 }
])
```

---

## 🌐 API Endpoint: POST /api/scan

### Request

```bash
curl -X POST http://localhost:5000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
    "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "region": "us-east-1",
    "isLocalStack": false,
    "endpoint": null
  }'
```

### Response

```json
{
  "scanId": "507f1f77bcf86cd799439011",
  "timestamp": "2025-03-26T10:30:00.000Z",
  
  "summary": {
    "totalSpend": 1250.50,
    "totalWaste": 145.30,
    "healthScore": 72,
    "serverCount": 15,
    "diskCount": 42,
    "ipCount": 8,
    "sgCount": 12,
    "wasteCount": 8
  },
  
  "allResources": [
    {
      "id": "i-0123456789abcdef0",
      "type": "EC2",
      "cost": 15.00,
      "status": "running",
      "region": "us-east-1a"
    },
    // ... more resources
  ],
  
  "resources": [
    {
      "id": "vol-0a1b2c3d4e5f6",
      "type": "EBS",
      "size": 100,
      "cost": 8.00,
      "status": "available"
    }
    // ... only wasted resources
  ],
  
  "alerts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "SECURITY",
      "severity": "CRITICAL",
      "title": "Publicly Accessible SSH Port",
      "description": "...",
      "resourceId": "sg-0123456789abcdef0",
      "ruleId": "sg-ssh-world",
      "timestamp": "2025-03-26T10:30:00.000Z",
      "metadata": { ... }
    },
    {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "type": "FINOPS",
      "severity": "WARNING",
      "title": "Unused EBS Volume",
      "description": "...",
      "resourceId": "vol-0a1b2c3d4e5f6",
      "ruleId": "ebs-unattached",
      "timestamp": "2025-03-26T10:30:00.000Z",
      "metadata": { "size": 100, "monthlyCost": 8.00 }
    }
    // ... more alerts
  ],
  
  "alertSummary": {
    "securityAlerts": 2,
    "finopsAlerts": 6,
    "critical": 2,
    "high": 0,
    "warning": 6
  }
}
```

---

## 🚀 Extending the Rules Engine

### Adding a New Rule

Follow this pattern to add custom rules:

```typescript
// 1. Create a rule function
function generateNewRule(assets: any, costConfig: CostConfig): Alert[] {
  const alerts: Alert[] = [];
  
  // Your evaluation logic
  for (const resource of assets.someResource) {
    if (/* condition */) {
      alerts.push({
        id: uuidv4(),
        type: 'SECURITY' | 'FINOPS',
        severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO',
        title: 'Clear, actionable title',
        description: `Detailed description with context and remediation...`,
        resourceId: resource.id,
        resourceName: resource.name,
        ruleId: 'unique-rule-identifier',
        timestamp: new Date(),
        metadata: { /* relevant data */ }
      });
    }
  }
  
  return alerts;
}

// 2. Integrate into rulesEngine
function rulesEngine(assets: AWSAssets, costConfig: CostConfig): Alert[] {
  const alerts: Alert[] = [];
  
  // ... existing rules ...
  
  // Add your new rule
  const newAlerts = generateNewRule(assets, costConfig);
  alerts.push(...newAlerts);
  
  return alerts;
}
```

### Example: Add RDS Unencrypted Databases Rule

```typescript
function generateRDSEncryptionAlerts(rdsInstances: DBInstance[]): Alert[] {
  const alerts: Alert[] = [];
  
  for (const instance of rdsInstances) {
    if (!instance.StorageEncrypted) {
      alerts.push({
        id: uuidv4(),
        type: 'SECURITY',
        severity: 'HIGH',
        title: 'RDS Database Not Encrypted',
        description: `RDS database "${instance.DBInstanceIdentifier}" does not have encryption at rest enabled. Enable AWS KMS encryption to protect data.`,
        resourceId: instance.DBInstanceIdentifier || 'unknown',
        resourceName: instance.DBInstanceIdentifier,
        ruleId: 'rds-unencrypted',
        timestamp: new Date(),
        metadata: {
          dbInstance: instance.DBInstanceIdentifier,
          engine: instance.Engine,
          storageEncrypted: false
        }
      });
    }
  }
  
  return alerts;
}
```

---

## 🧮 Cost Configuration

Modify pricing in the `/api/scan` endpoint:

```typescript
const costConfig: CostConfig = {
  PRICE_PER_GB: 0.08,        // Default: EBS GP2 pricing
  PRICE_PER_SERVER: 15.00,   // Default: t2.micro on-demand
  PRICE_PER_IP: 3.60,        // Default: Elastic IP hourly × 730 hours/month
};
```

**To customize:**
1. Update these values based on your instance types
2. Store in environment variables or config file
3. Use regional pricing (varies by region)

---

## 📈 Health Score Algorithm

```typescript
healthScore = 100 - (criticalCount × 20 + highCount × 10 + warningCount × 5)

Example:
- 2 CRITICAL security alerts    = -40 points
- 1 HIGH security alert          = -10 points
- 3 WARNING finops alerts        = -15 points
- Final Score: 100 - 40 - 10 - 15 = 35/100 (Red 🔴)
```

**Score Interpretation:**
- 90-100: Excellent (Green ✅)
- 70-89:  Good (Yellow ⚠️)
- 50-69:  Fair (Orange ⚠️)
- Below 50: Poor (Red 🔴)

---

## 🔗 Integration with Frontend

### Security Alerts Table

Display alerts with type = 'SECURITY':

```typescript
const securityAlerts = scanResult.alerts.filter(a => a.type === 'SECURITY');
// Show in SecurityAlertsTable component with severity coloring
```

### Event Logs / FinOps Table

Display alerts with type = 'FINOPS':

```typescript
const finopsAlerts = scanResult.alerts.filter(a => a.type === 'FINOPS');
// Show in LiveThreatLog component with cost impact highlighted
```

### Dashboard Metrics

```typescript
// Health Score gauge
healthScore: scanResult.summary.healthScore

// Alert summary cards
criticalCount: scanResult.alertSummary.critical
highCount: scanResult.alertSummary.high
warningCount: scanResult.alertSummary.warning
```

---

## 🛡️ Best Practices

1. **Run scans regularly** (hourly/daily) for continuous monitoring
2. **Track alert history** to identify trends and patterns
3. **Set up remediation workflows** for CRITICAL alerts
4. **Implement cost budgets** based on totalWaste metrics
5. **Automate actions** (e.g., delete unused IPs after 30 days)
6. **Review rule coverage** quarterly and add new rules
7. **Test rules** in non-production before production rollout
8. **Monitor alert noise** - refine thresholds as needed

---

## 📝 Logging Output

The engine logs detailed information:

```
================================================================================
📨 /api/scan - CSPM & FinOps Scan Initiated
================================================================================
☁️  Target: AWS | Region: us-east-1

📡 Fetching AWS Infrastructure Data...

  🖥️  Fetching EC2 Instances...
      ✓ Found 15 instances
  📦 Fetching EBS Volumes...
      ✓ Found 42 volumes
  🌐 Fetching Elastic IPs...
      ✓ Found 8 elastic IPs
  🔐 Fetching Security Groups...
      ✓ Found 12 security groups

🔍 Running Rules Engine...
  📋 Evaluating Security Group rules...
    ✓ Found 2 security alerts
  💰 Evaluating EBS Volume utilization...
    ✓ Found 3 EBS wastage alerts
  💰 Evaluating Elastic IP utilization...
    ✓ Found 1 Elastic IP wastage alerts

✅ Rules Engine complete: 6 total alerts generated

💰 Calculating Financial Metrics...
  Total Spend (All Resources):   $1,250.50
  Total Waste (Unused Resources): $145.30

================================================================================
✨ Returning scan results to client
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| No alerts generated | Check AWS credentials, verify resources exist |
| MongoDB save fails | Ensure MongoDB is running, check connection string |
| Alert IDs duplicate | UUID library is properly installed (`npm install uuid`) |
| Rules not evaluated | Verify assets are fetched (check console logs) |
| Incorrect costs | Review `costConfig` values, ensure correct region pricing |

---

## 📚 Further Reading

- AWS Security Hub: https://docs.aws.amazon.com/securityhub/
- FinOps Foundation: https://www.finops.org/
- AWS Well-Architected Framework: https://aws.amazon.com/architecture/well-architected/

---

**Version:** 1.0.0  
**Last Updated:** March 26, 2025  
**Maintainer:** CloudOpti Team
