// ============================================================================
// Alert Generation Engine - TypeScript Type Definitions Reference
// ============================================================================
// This file documents all TypeScript interfaces used in the alert system
// Copy-paste for your own extensions and integrations
// ============================================================================

/**
 * Alert object - represents a single CSPM or FinOps finding
 * Structured for consistency, queryability, and frontend rendering
 */
interface Alert {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Classification: Security (CSPM) or Cost (FinOps) */
  type: 'SECURITY' | 'FINOPS';

  /** Severity level - used for sorting, filtering, and health score calculation */
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO';

  /** Short, actionable title (for tables and summaries) */
  title: string;

  /** Detailed description with context and remediation guidance */
  description: string;

  /** AWS resource ID that triggered this alert (sg-xxx, vol-xxx, etc.) */
  resourceId: string;

  /** Human-readable resource name (my-security-group, production-disk, etc.) */
  resourceName?: string;

  /** Rule identifier for tracking which rule generated this alert */
  ruleId: string;

  /** When the alert was generated (ISO 8601) */
  timestamp: Date;

  /** Additional context-specific data (port, cost, size, etc.) */
  metadata?: Record<string, any>;
}

/**
 * AWS Infrastructure Assets fetched for evaluation
 * Normalized structure passed to rules engine
 */
interface AWSAssets {
  /** Security Groups with inbound/outbound rules */
  securityGroups: SecurityGroup[];

  /** EBS Volumes with attachment and state information */
  volumes: Volume[];

  /** Elastic IP Addresses with association data */
  elasticIPs: Address[];

  /** EC2 Instances with running state and region info */
  instances: Instance[];
}

/**
 * Cost Configuration - pricing per resource type
 * Customi for your account's instance types and pricing tier
 */
interface CostConfig {
  /** USD per GB per month for EBS volumes (default: 0.08 for GP2) */
  PRICE_PER_GB: number;

  /** USD per month for EC2 instance (default: 15 for t2.micro) */
  PRICE_PER_SERVER: number;

  /** USD per month for unassociated Elastic IP (default: 3.60/month) */
  PRICE_PER_IP: number;
}

/**
 * Audit Document saved to MongoDB
 * Complete record of a scan with alerts and financial metrics
 */
interface AuditDocument {
  _id?: string; // MongoDB ObjectId

  // Metadata
  date: Date;
  timestamp: Date;
  region: string;
  healthScore: number;

  // Financial Metrics
  totalSpend: number;
  totalWasted: number;

  // Resource Counts
  resourceCounts: {
    ec2Instances: number;
    ebsVolumes: number;
    elasticIPs: number;
    securityGroups: number;
  };

  // Cost Breakdown
  costBreakdown: {
    ec2Cost: number;
    ebsCost: number;
    ipCost: number;
  };

  // Resources
  resourcesFound: ResourceRecord[];
  allResources: ResourceRecord[];

  // Alerts (core feature)
  alerts: Alert[];

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Resource Record for inventory
 * Represents a single AWS resource (instance, volume, IP)
 */
interface ResourceRecord {
  id: string;
  type: 'EC2' | 'EBS' | 'IP';
  size?: number;
  cost: number;
  region: string;
  status: string;
}

/**
 * API /api/scan Response
 * Comprehensive scan result returned to frontend
 */
interface ScanResult {
  // Metadata
  scanId: string;
  timestamp: string;

  // Summary Metrics
  summary: {
    totalSpend: number;
    totalWaste: number;
    healthScore: number;
    serverCount: number;
    diskCount: number;
    ipCount: number;
    sgCount: number;
    wasteCount: number;
  };

  // Resource Data
  allResources: ResourceRecord[];
  resources: ResourceRecord[]; // Only wasted

  // Alerts (core feature)
  alerts: Alert[];

  // Alert Breakdown
  alertSummary: {
    securityAlerts: number;
    finopsAlerts: number;
    critical: number;
    high: number;
    warning: number;
  };
}

/**
 * Rule Function Signature
 * All rule functions follow this pattern for consistency
 */
type RuleFunction = (
  assets: AWSAssets,
  costConfig?: CostConfig
) => Alert[];

// ============================================================================
// RULE IMPLEMENTATIONS - Quick Reference
// ============================================================================

/**
 * Rule 1: Publicly Accessible Admin Ports (SSH/RDP)
 * Severity: CRITICAL
 * Type: SECURITY
 * 
 * Detects Security Groups allowing unrestricted access to:
 * - Port 22 (SSH)
 * - Port 3389 (RDP)
 * 
 * From CIDR ranges 0.0.0.0/0 or ::/0
 */
const RULE_1_DETAILS = {
  id: 'sg-ssh-world',
  alternativeId: 'sg-rdp-world',
  description: 'Publicly accessible SSH/RDP ports',
  examples: {
    vulnerable: {
      protocol: 'tcp',
      fromPort: 22,
      toPort: 22,
      cidr: '0.0.0.0/0' // ❌ CRITICAL
    },
    secure: {
      protocol: 'tcp',
      fromPort: 22,
      toPort: 22,
      cidr: '10.0.0.0/8' // ✅ Safe
    }
  }
};

/**
 * Rule 2: Unattached EBS Volumes
 * Severity: WARNING
 * Type: FINOPS
 * 
 * Detects EBS Volumes with state = "available"
 * (Not attached to any EC2 instance)
 * 
 * Cost: $0.08/GB/month
 * Impact: 100GB × $0.08 = $8/month = $96/year
 */
const RULE_2_DETAILS = {
  id: 'ebs-unattached',
  description: 'Unused EBS volumes',
  costPerGB: 0.08,
  examples: {
    vulnerable: {
      state: 'available', // ❌ No instance attached
      size: 100,
      expectedCost: 8.0
    },
    healthy: {
      state: 'in-use', // ✅ Attached to instance
      size: 100,
      expectedCost: 0.0
    }
  }
};

/**
 * Rule 3: Unassociated Elastic IPs
 * Severity: WARNING
 * Type: FINOPS
 * 
 * Detects Elastic IPs without AssociationId
 * (Not attached to any network interface)
 * 
 * Cost: $3.60/month per unassociated IP
 * Impact: 10 unused IPs × $3.60 = $36/month = $432/year
 */
const RULE_3_DETAILS = {
  id: 'elasticip-unassociated',
  description: 'Unused Elastic IPs',
  costPerIP: 3.60,
  examples: {
    vulnerable: {
      associationId: undefined, // ❌ Not associated
      publicIp: '203.0.113.42',
      expectedCost: 3.60
    },
    healthy: {
      associationId: 'eipassoc-12345678', // ✅ Associated to ENI
      publicIp: '203.0.113.43',
      expectedCost: 0.0
    }
  }
};

// ============================================================================
// SEVERITY SCORING
// ============================================================================

const SEVERITY_WEIGHTS = {
  'CRITICAL': 20,
  'HIGH': 10,
  'MEDIUM': 5,
  'WARNING': 2,
  'INFO': 1
};

/**
 * Calculate health score from alert counts
 * Base: 100 = Healthy
 * Deductions per alert type
 */
function calculateHealthScore(alerts: Alert[]): number {
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter(a => a.severity === 'HIGH').length;
  const mediumCount = alerts.filter(a => a.severity === 'MEDIUM').length;
  const warningCount = alerts.filter(a => a.severity === 'WARNING').length;

  const deductions =
    criticalCount * SEVERITY_WEIGHTS.CRITICAL +
    highCount * SEVERITY_WEIGHTS.HIGH +
    mediumCount * SEVERITY_WEIGHTS.MEDIUM +
    warningCount * SEVERITY_WEIGHTS.WARNING;

  return Math.max(0, 100 - deductions);
}

// ============================================================================
// ALERT GENERATION HELPERS
// ============================================================================

/**
 * Create a standard security alert
 * Reduces boilerplate for rule implementations
 */
function createSecurityAlert(data: {
  title: string;
  description: string;
  resourceId: string;
  resourceName?: string;
  ruleId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING';
  metadata?: Record<string, any>;
}): Alert {
  return {
    id: generateUUID(),
    type: 'SECURITY',
    severity: data.severity,
    title: data.title,
    description: data.description,
    resourceId: data.resourceId,
    resourceName: data.resourceName,
    ruleId: data.ruleId,
    timestamp: new Date(),
    metadata: data.metadata
  };
}

/**
 * Create a standard FinOps (cost/waste) alert
 */
function createFinopsAlert(data: {
  title: string;
  description: string;
  resourceId: string;
  resourceName?: string;
  ruleId: string;
  severity: 'WARNING' | 'INFO';
  monthlyCost: number;
  metadata?: Record<string, any>;
}): Alert {
  return {
    id: generateUUID(),
    type: 'FINOPS',
    severity: data.severity,
    title: data.title,
    description: data.description,
    resourceId: data.resourceId,
    resourceName: data.resourceName,
    ruleId: data.ruleId,
    timestamp: new Date(),
    metadata: {
      monthlyCost: data.monthlyCost,
      yearlyImpact: data.monthlyCost * 12,
      ...data.metadata
    }
  };
}

// ============================================================================
// EXAMPLE: Extending with Custom Rule
// ============================================================================

/**
 * Example: Detect RDS instances not backed up
 * Pattern for adding new rules to the engine
 */
function generateRDSBackupAlerts(rdsInstances: any[]): Alert[] {
  const alerts: Alert[] = [];

  for (const instance of rdsInstances) {
    // Check if backup retention is configured
    if (instance.BackupRetentionPeriod === 0) {
      alerts.push(
        createSecurityAlert({
          title: 'RDS Database Not Backed Up',
          description: `RDS database "${instance.DBInstanceIdentifier}" has backup retention set to 0. Enable point-in-time recovery.`,
          resourceId: instance.DBInstanceIdentifier,
          resourceName: instance.DBInstanceIdentifier,
          ruleId: 'rds-no-backup',
          severity: 'HIGH',
          metadata: {
            dbInstance: instance.DBInstanceIdentifier,
            engine: instance.Engine,
            backupRetention: instance.BackupRetentionPeriod
          }
        })
      );
    }
  }

  return alerts;
}

// ============================================================================
// EXPORT FOR USE IN OTHER MODULES
// ============================================================================

export type {
  Alert,
  AWSAssets,
  CostConfig,
  AuditDocument,
  ResourceRecord,
  ScanResult,
  RuleFunction
};

export {
  RULE_1_DETAILS,
  RULE_2_DETAILS,
  RULE_3_DETAILS,
  SEVERITY_WEIGHTS,
  calculateHealthScore,
  createSecurityAlert,
  createFinopsAlert,
  generateRDSBackupAlerts
};
