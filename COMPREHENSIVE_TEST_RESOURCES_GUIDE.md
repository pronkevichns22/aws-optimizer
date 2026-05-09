# 🚀 Comprehensive Test Resources Guide

## Overview
The `create-comprehensive-test-resources.ts` script creates diverse AWS resources in LocalStack with various security vulnerabilities and cost issues to demonstrate all alert types in the system.

## What Gets Created

### 1️⃣ Security Groups with Vulnerabilities (7 total)

| Security Group | Risk Level | Alert Type | Details |
|---|---|---|---|
| `sg-ssh-world-open` | **CRITICAL** | SECURITY | SSH (port 22) open to 0.0.0.0/0 |
| `sg-rdp-world-open` | **CRITICAL** | SECURITY | RDP (port 3389) open to 0.0.0.0/0 |
| `sg-database-ports-exposed` | **HIGH** | SECURITY | MySQL, PostgreSQL, MongoDB ports exposed |
| `sg-redis-exposed` | **HIGH** | SECURITY | Redis (port 6379) open to world |
| `sg-large-port-range` | **MEDIUM** | SECURITY | Ports 1000-65535 open to 0.0.0.0/0 |
| `sg-http-no-https` | **MEDIUM** | SECURITY | HTTP (port 80) without HTTPS |
| `sg-any-traffic` | **CRITICAL** | SECURITY | ALL TCP+UDP ports open to 0.0.0.0/0 |

### 2️⃣ EBS Volumes (7 total)

- **3 Unencrypted Production Volumes** (60GB, 70GB, 80GB)
  - Risk: **HIGH** - Unencrypted sensitive data
  - Will trigger: `ebs-unencrypted` alert

- **4 Unused Volumes** (25GB, 30GB, 35GB, 40GB)
  - Risk: **WARNING** - Cost waste
  - Will trigger: `ebs-unattached` alert

### 3️⃣ Elastic IPs (3 unused)

- Unassociated IPs
- Risk: **WARNING** - Monthly cost waste ($3.60/month each)
- Will trigger: `elasticip-unassociated` alert

### 4️⃣ EC2 Instances (3 total)

| Instance | Security Group | Risk | Expected Alert |
|---|---|---|---|
| `web-server-prod` | `sg-ssh-world-open` | **CRITICAL** | Public instance with SSH exposed |
| `database-server` | `sg-database-ports-exposed` | **HIGH** | Database ports publicly accessible |
| `unrestricted-instance` | `sg-any-traffic` | **CRITICAL** | Any traffic allowed |

## Expected Alerts Summary

```
🔴 CRITICAL (7 alerts)
├─ SSH publicly accessible
├─ RDP publicly accessible
├─ Any traffic allowed (all ports)
└─ ... (additional based on assets)

🔴 HIGH (8+ alerts)
├─ Database ports exposed (MySQL, PostgreSQL, MongoDB)
├─ Redis port exposed
├─ Unencrypted EBS volumes (3)
└─ Multiple public instances

🟡 MEDIUM (5+ alerts)
├─ Large port ranges exposed
├─ HTTP without HTTPS
├─ Overly large port ranges
└─ ...

🟠 WARNING (7+ alerts)
├─ Unused EBS volumes
├─ Unassociated Elastic IPs
├─ Public instances with SSH
└─ ...

ℹ️ INFO (2+ alerts)
├─ Unused security groups
└─ Optimization recommendations
```

## How to Use

### Step 1: Run the Script

```bash
cd server
npm run create-test-resources
```

Or compile and run directly:

```bash
npx ts-node src/create-comprehensive-test-resources.ts
```

### Step 2: Verify Resources Created

The script will output:
```
🚀 Creating comprehensive test resources in LocalStack...

🔐 Creating Security Groups with vulnerabilities...
   ✅ Created: sg-xxx - SSH publicly accessible
   ✅ Created: sg-xxx - RDP publicly accessible
   ...

💾 Creating unencrypted EBS volumes (HIGH risk)...
   ✅ Created unencrypted volume: vol-xxx (60GB)
   ...

✨ Comprehensive test resources created!
```

### Step 3: Run Security Scan

1. Open the web application
2. Go to **Security Page**
3. Login with AWS credentials (LocalStack)
4. Click **Rescan** or wait for auto-fetch
5. View all generated alerts organized by severity

## How to Add More Rules

To add custom alert rules to detect additional risks:

### 1. Add a New Rule Function

Edit `server/src/index.ts` and add a new function:

```typescript
/**
 * Generates alerts for [your new risk]
 * Rule: [Brief description of what this detects]
 */
function generateMyCustomAlerts(assets: AWSAssets, costConfig: CostConfig): Alert[] {
  const alerts: Alert[] = [];

  // Your custom logic here
  for (const resource of assets.someResources) {
    if (/* your condition */) {
      alerts.push({
        id: uuidv4(),
        type: 'SECURITY', // or 'FINOPS'
        severity: 'CRITICAL', // or HIGH, MEDIUM, WARNING, INFO
        title: 'Your Alert Title',
        description: 'Detailed explanation of the issue',
        resourceId: resource.id,
        resourceName: resource.name,
        ruleId: 'my-custom-rule',
        timestamp: new Date(),
        metadata: {
          // Additional context
        },
      });
    }
  }

  return alerts;
}
```

### 2. Register the Rule in rulesEngine()

Find the `rulesEngine()` function and add:

```typescript
function rulesEngine(assets: AWSAssets, costConfig: CostConfig): Alert[] {
  const alerts: Alert[] = [];

  // ... existing rules ...

  // Add your new rule
  console.log('  🔍 Checking for [your condition]...');
  const myAlerts = generateMyCustomAlerts(assets, costConfig);
  alerts.push(...myAlerts);
  console.log(`    ✓ Found ${myAlerts.length} custom alerts`);

  // ... rest of function ...
}
```

### 3. Restart Server

```bash
npm run dev
```

## Example: Add IAM Access Key Age Detection

```typescript
/**
 * Detects AWS IAM access keys older than 90 days
 * Rule: AWS best practice is to rotate keys every 90 days
 */
function generateOldAccessKeyAlerts(): Alert[] {
  const alerts: Alert[] = [];
  
  // Note: Requires IAM permissions and credentials setup
  // This is a conceptual example
  
  const iamClient = new IAMClient({ region: 'us-east-1' });
  
  // Implementation would fetch access key metadata
  // and check CreateDate vs current date
  
  return alerts;
}
```

## Alert Severity Levels Explained

| Level | Color | Response Time | Examples |
|---|---|---|---|
| **CRITICAL** | 🔴 Red | Immediate (fix now) | SSH/RDP open to world, any traffic allowed |
| **HIGH** | 🔴 Red-Orange | 24-48 hours | DB ports exposed, unencrypted data |
| **MEDIUM** | 🟡 Yellow | 1-2 weeks | HTTP without encryption, large port ranges |
| **WARNING** | 🟠 Orange | 2-4 weeks | Unused resources, public instances with SSH |
| **INFO** | ℹ️ Blue | Review only | Optimization tips, unused security groups |

## Cost Impact Example

From the test resources:

```
EBS Unencrypted (production): 
  - 3 volumes × 70GB average × $0.08/GB/month = ~$16.80/month

EBS Unused (waste):
  - 4 volumes × 32.5GB average × $0.08/GB/month = ~$10.40/month

Elastic IPs (waste):
  - 3 IPs × $3.60/month = ~$10.80/month

TOTAL WASTE: ~$37.20/month (~$446/year)
```

## Cleaning Up

To delete the test resources:

```bash
# Delete via AWS CLI
aws ec2 delete-security-group --group-id sg-xxx --endpoint-url http://localhost:4566

# Or through the UI - it will eventually support delete operations
```

## Troubleshooting

### Resources not being created?
- ✅ Ensure LocalStack is running: `docker ps | grep localstack`
- ✅ Check credentials in `.env` file
- ✅ Verify endpoint: `http://127.0.0.1:4566` or `http://localhost:4566`

### No alerts showing up?
- ✅ Run the scan again (alerts are generated per-scan)
- ✅ Check browser console for errors
- ✅ Verify backend server is running: `npm run dev` in `/server`

### Want to modify alert severity?
- Edit the `severity` field in the alert object
- Restart the server
- Run a new scan

## Next Steps

1. ✅ Create diverse test resources
2. ✅ View all alert types in the UI
3. ✅ Add custom rules for your specific risks
4. ✅ Export reports with all findings
5. ✅ Set up automated scanning schedules (future feature)

---

**Need more risks to test?** Edit `create-comprehensive-test-resources.ts` and add more:
- Security group rules with specific port combinations
- More instance types with different configurations
- RDS database instances (if supported)
- S3 bucket permissions
- KMS key policies
- VPC Flow Logs configurations
- CloudTrail disabled scenarios
- ... and many more!
