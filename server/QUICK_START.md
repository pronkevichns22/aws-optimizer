# CloudOpti Alert Generation Engine - Quick Start Guide

## 🚀 Getting Started

### Prerequisites

```bash
# Node.js 16+ and npm
node --version  # v16.0.0 or later
npm --version   # v8.0.0 or later

# MongoDB running locally or remote
mongod --version

# AWS credentials (IAM user or role with EC2 describe permissions)
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### Installation

```bash
cd server

# Install dependencies
npm install

# Add uuid types (if not already installed)
npm install uuid @types/uuid

# Verify TypeScript compilation
npx tsc --noEmit

# Start development server
npm run dev
```

**Expected Output:**
```
✅ MongoDB подключена
🚀 Сервер запущен на http://localhost:5000
```

---

## 📡 Quick API Test

### 1. Test with Direct AWS Credentials (Recommended for Testing)

```bash
curl -X POST http://localhost:5000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
    "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "region": "us-east-1",
    "isLocalStack": false
  }'
```

### 2. Test with LocalStack (Local AWS Emulation)

```bash
# Start LocalStack
docker run -d \
  -p 4566:4566 \
  -e SERVICES=ec2,iam \
  localstack/localstack:latest

# Run scan against LocalStack
curl -X POST http://localhost:5000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "accessKeyId": "test",
    "secretAccessKey": "test",
    "region": "us-east-1",
    "isLocalStack": true,
    "endpoint": "http://localhost:4566"
  }'
```

### 3. Response Example

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
  "alerts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "SECURITY",
      "severity": "CRITICAL",
      "title": "Publicly Accessible SSH Port",
      "description": "Security Group \"web-sg\" (sg-xxx) allows unrestricted access to port 22 (SSH)...",
      "resourceId": "sg-xxx",
      "ruleId": "sg-ssh-world",
      "timestamp": "2025-03-26T10:30:00.000Z",
      "metadata": { "port": 22, "protocol": "SSH" }
    }
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

## 🔍 Alert Types & Severity Levels

### Security Alerts (type: "SECURITY")

These are CSPM findings - infrastructure security issues:

| Rule ID | Severity | Description |
|---------|----------|-------------|
| `sg-ssh-world` | CRITICAL | SSH port (22) open to 0.0.0.0/0 |
| `sg-rdp-world` | CRITICAL | RDP port (3389) open to 0.0.0.0/0 |

### FinOps Alerts (type: "FINOPS")

These are cost optimization opportunities:

| Rule ID | Severity | Description | Cost Impact |
|---------|----------|-------------|-------------|
| `ebs-unattached` | WARNING | Unattached EBS volume | $0.08/GB/month |
| `elasticip-unassociated` | WARNING | Unused Elastic IP | $3.60/month |

---

## 💻 Frontend Integration Examples

### React Component: Display Security Alerts

```typescript
import React, { useEffect, useState } from 'react';

interface Alert {
  id: string;
  type: 'SECURITY' | 'FINOPS';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  resourceId: string;
  metadata?: any;
}

function SecurityAlertsDisplay() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  const runScan = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY,
          secretAccessKey: process.env.REACT_APP_AWS_SECRET_KEY,
          region: 'us-east-1'
        })
      });

      const scanResult = await response.json();
      
      // Extract security alerts
      const securityAlerts = scanResult.alerts.filter(
        (a: Alert) => a.type === 'SECURITY'
      );
      setAlerts(securityAlerts);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={runScan} disabled={loading}>
        {loading ? 'Scanning...' : 'Run Security Scan'}
      </button>

      <div className="alerts-list">
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert alert-${alert.severity}`}>
            <h3>{alert.title}</h3>
            <p>{alert.description}</p>
            <small>Resource: {alert.resourceId}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SecurityAlertsDisplay;
```

### React Component: Display Cost Alerts

```typescript
function FinOpsAlertsDisplay() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  const runScan = async () => {
    const response = await fetch('http://localhost:5000/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({/* credentials */})
    });

    const scanResult = await response.json();
    
    // Extract FinOps alerts with cost impact
    const finopsAlerts = scanResult.alerts.filter(
      (a: Alert) => a.type === 'FINOPS'
    );
    
    // Calculate total waste
    const totalWaste = finopsAlerts.reduce(
      (sum, a) => sum + (a.metadata?.monthlyCost || 0),
      0
    );
    
    console.log(`Total monthly waste: $${totalWaste.toFixed(2)}`);
    setAlerts(finopsAlerts);
  };

  return (
    <div>
      <div className="cost-summary">
        <h2>Cost Optimization Opportunities</h2>
        <p className="total-waste">
          Monthly Waste: ${alerts.reduce(
            (sum, a) => sum + (a.metadata?.monthlyCost || 0),
            0
          ).toFixed(2)}
        </p>
      </div>

      {alerts.map((alert) => (
        <div key={alert.id} className="cost-alert">
          <h4>{alert.title}</h4>
          <p>{alert.description}</p>
          <span className="cost">
            ${alert.metadata?.monthlyCost.toFixed(2)}/month
            ({/* yearly cost */})
          </span>
        </div>
      ))}
    </div>
  );
}
```

### Vue 3 Integration Example

```vue
<template>
  <div class="alerts">
    <button @click="runScan" :disabled="loading">
      {{ loading ? 'Scanning...' : 'Scan Infrastructure' }}
    </button>

    <div class="alert-list">
      <div
        v-for="alert in alerts"
        :key="alert.id"
        :class="`alert alert-${alert.type} severity-${alert.severity}`"
      >
        <h3>{{ alert.title }}</h3>
        <p>{{ alert.description }}</p>
        <small v-if="alert.metadata?.monthlyCost">
          Monthly Impact: ${{ alert.metadata.monthlyCost.toFixed(2) }}
        </small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const alerts = ref([]);
const loading = ref(false);

const runScan = async () => {
  loading.value = true;
  try {
    const response = await fetch('http://localhost:5000/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY,
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_KEY,
        region: 'us-east-1'
      })
    });

    const result = await response.json();
    alerts.value = result.alerts;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.alert-CRITICAL {
  background-color: #ffebee;
  border-left: 4px solid #ff4444;
}

.alert-HIGH {
  background-color: #fff3e0;
  border-left: 4px solid #ff9f43;
}

.alert-WARNING {
  background-color: #fffde7;
  border-left: 4px solid #ffd700;
}
</style>
```

---

## 📊 Monitoring & Trending

### Query Alert History from MongoDB

```javascript
// Get alerts from last 7 days
db.audits.find({
  timestamp: {
    $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }
}).sort({ timestamp: -1 });

// Count alerts by type
db.audits.aggregate([
  { $unwind: '$alerts' },
  { $group: { _id: '$alerts.type', count: { $sum: 1 } } }
]);

// Find most common security issues
db.audits.aggregate([
  { $unwind: '$alerts' },
  { $match: { 'alerts.type': 'SECURITY' } },
  { $group: { _id: '$alerts.ruleId', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 }
]);

// Calculate total waste over time
db.audits.aggregate([
  {
    $group: {
      _id: {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' }
      },
      totalWaste: { $sum: '$totalWasted' },
      avgHealthScore: { $avg: '$healthScore' }
    }
  },
  { $sort: { '_id.year': 1, '_id.month': 1 } }
]);
```

---

## 🔧 Configuration & Customization

### Adjust Cost Pricing

Edit `src/index.ts`, find `/api/scan` endpoint:

```typescript
const costConfig: CostConfig = {
  PRICE_PER_GB: 0.13,        // Change from $0.08 to $0.13 for GP3
  PRICE_PER_SERVER: 20.00,   // Change from $15 to $20 for t3.small
  PRICE_PER_IP: 3.60,        // Keep same
};
```

### Adjust Health Score Weights

In `SEVERITY_WEIGHTS`:

```typescript
const SEVERITY_WEIGHTS = {
  'CRITICAL': 25,    // Was 20, now more aggressive
  'HIGH': 15,        // Was 10
  'MEDIUM': 8,       // Was 5
  'WARNING': 3,      // Was 2
  'INFO': 1          // Keep same
};
```

### Add New Rule

```typescript
// In rulesEngine() function:

console.log('  🔐 Evaluating RDS encryption...');
const rdsAlerts = generateRDSEncryptionAlerts(assets.rdsInstances);
alerts.push(...rdsAlerts);
console.log(`    ✓ Found ${rdsAlerts.length} RDS alerts`);
```

---

## 🐛 Debugging Tips

### Enable Verbose Logging

```bash
# Run with debug output
DEBUG=* npm run dev

# Show all HTTP requests
curl -v -X POST http://localhost:5000/api/scan ...
```

### Test AWS Connectivity

```bash
# Verify AWS credentials before running scan
node -e "
const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const client = new EC2Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
client.send(new DescribeInstancesCommand({}))
  .then(() => console.log('✅ AWS connection OK'))
  .catch(err => console.error('❌ Error:', err.message));
"
```

### View MongoDB Data

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/aws_optimizer

# View latest scan
db.audits.findOne({}, { sort: { timestamp: -1 } })

# View all alerts from latest scan
db.audits.findOne({}, { sort: { timestamp: -1 } }).alerts

# Count total alerts
db.audits.aggregate([
  { $unwind: '$alerts' },
  { $count: 'total' }
])
```

---

## 📚 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Missing AWS credentials" | Credentials not provided in request body | Include `accessKeyId` and `secretAccessKey` in POST body |
| "MongoDB connection failed" | MongoDB not running | Start MongoDB: `mongod` or Docker: `docker run mongo` |
| "No alerts generated" | Valid AWS account with no findings | Create test resources that violate rules |
| "Incorrect costs" | Pricing doesn't match your region | Update `costConfig` prices for your region |
| "Alerts not saved" | MongoDB permission issue | Check MongoDB user permissions and connection string |

---

## 🎯 Next Steps

1. **Integrate with Frontend** - Use example React components above
2. **Schedule Scans** - Run `/api/scan` on a schedule (hourly/daily)
3. **Set Up Alerts** - Email/Slack notifications for CRITICAL issues
4. **Automate Actions** - Auto-delete unused IPs after 30 days
5. **Track Trends** - Build charts from MongoDB historical data
6. **Add More Rules** - Extend with RDS, Lambda, S3 checks
7. **Test in Prod** - Deploy to EC2/ECS with proper IAM role

---

## 📖 Documentation Files

- **ALERT_ENGINE_GUIDE.md** - Comprehensive architecture and rule documentation
- **TYPES_AND_RULES.ts** - TypeScript definitions and helper functions
- **README.md** - Original project overview (this file)

---

## 🤝 Contributing Guidelines

To add a new rule:

1. Create rule function: `generate[RuleName]Alerts()`
2. Add to `rulesEngine()` function
3. Write integration test
4. Update documentation
5. Ensure no breaking changes to Alert interface

Example:

```typescript
function generateNewRuleAlerts(data: any): Alert[] {
  const alerts: Alert[] = [];
  
  for (const item of data) {
    if (/* condition */) {
      alerts.push({
        id: uuidv4(),
        type: 'SECURITY', // or 'FINOPS'
        severity: 'CRITICAL', // or HIGH, MEDIUM, WARNING, INFO
        title: 'Clear title',
        description: 'Detailed description with context',
        resourceId: item.id,
        resourceName: item.name,
        ruleId: 'unique-rule-id',
        timestamp: new Date(),
        metadata: {/* specific data */}
      });
    }
  }
  
  return alerts;
}
```

---

**Version:** 1.0.0  
**Last Updated:** March 26, 2025  
**Status:** Production Ready ✅
