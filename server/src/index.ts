// ============================================================================
// FILE: index.ts
// LOCATION: server/src/
// PURPOSE: Main backend server for AWS scanning, authentication, CSPM/FinOps engine
// FEATURES: AWS data fetching, custom rules engine, alert generation, MongoDB storage
// ============================================================================

// ========== Load environment variables from .env file FIRST ==========
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  EC2Client,
  DescribeVolumesCommand,
  DescribeAddressesCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  SecurityGroup,
  Volume,
  Address,
  Instance,
} from '@aws-sdk/client-ec2';
import { IAMClient, ListUsersCommand, GetLoginProfileCommand } from '@aws-sdk/client-iam';
import { getAIRecommendations, getSecurityRecommendations, getCostOptimizationRecommendations, getUserAIResponse } from './ai-advisor';

const app = express();
const PORT = process.env.PORT || 5000;

// ========== Middleware Setup ==========
app.use(cors()); // Allow requests from React frontend
app.use(express.json({ limit: '50mb' })); // Parse JSON request bodies with increased limit
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Handle URL-encoded data

// ============================================================================
// TYPE DEFINITIONS - Strongly typed alert and audit structures
// ============================================================================

/**
 * Alert object structure for CSPM and FinOps findings
 * Represents a security issue or cost/waste concern
 */
interface Alert {
  id: string; // Unique identifier (UUID)
  type: 'SECURITY' | 'FINOPS'; // Alert category
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO'; // Severity level
  title: string; // Short title for the alert
  description: string; // Detailed description of the issue
  resourceId: string; // ID of the affected AWS resource
  resourceName?: string; // Name/label of the affected resource
  ruleId: string; // Identifier of the rule that triggered this alert
  timestamp: Date; // When the alert was generated
  metadata?: Record<string, any>; // Additional context data
}

/**
 * Asset/Infrastructure data fetched from AWS
 */
interface AWSAssets {
  securityGroups: SecurityGroup[];
  volumes: Volume[];
  elasticIPs: Address[];
  instances: Instance[];
}

/**
 * Cached AWS data cost
 */
interface CostConfig {
  PRICE_PER_GB: number;
  PRICE_PER_SERVER: number;
  PRICE_PER_IP: number;
}

// ========== MongoDB Database Schemas ==========

/**
 * Audit Schema: Stores scan results, alerts, and cost analysis
 * Updated to include alerts array for historical tracking
 */
const AuditSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  timestamp: { type: Date, default: Date.now, index: true },
  
  // Cost Analysis
  totalSpend: { type: Number, default: 0 },
  totalWasted: { type: Number, default: 0 },
  
  // Resource Counts
  resourceCounts: {
    ec2Instances: Number,
    ebsVolumes: Number,
    elasticIPs: Number,
    securityGroups: Number,
  },
  
  // Cost Breakdown
  costBreakdown: {
    ec2Cost: Number,
    ebsCost: Number,
    ipCost: Number,
  },
  
  // Resources
  resourcesFound: Array,
  allResources: Array,
  
  // ALERTS - Core feature for CSPM and FinOps
  alerts: [
    {
      id: String,
      type: { type: String, enum: ['SECURITY', 'FINOPS'] },
      severity: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'WARNING', 'INFO'] },
      title: String,
      description: String,
      resourceId: String,
      resourceName: String,
      ruleId: String,
      timestamp: { type: Date, default: Date.now },
      metadata: mongoose.Schema.Types.Mixed,
    },
  ],
  
  // Metadata
  region: String,
  healthScore: Number,
}, { timestamps: true });

const Audit = mongoose.model('Audit', AuditSchema);

// Schema for storing user accounts and AWS credentials
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    awsAccessKeyId: String,
    awsSecretAccessKey: String,
    awsRegion: { type: String, default: 'us-east-1' },
    isLocalStack: { type: Boolean, default: false },
    localStackEndpoint: { type: String, default: 'http://localhost:4566' },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// ============================================================================
// RULES ENGINE - Core CSPM and FinOps alert generation system
// ============================================================================

/**
 * Generates CRITICAL security alerts for publicly accessible admin ports
 * Rule 1: Check Security Groups for unrestricted SSH (port 22) and RDP (port 3389)
 * 
 * @param securityGroups - Array of AWS Security Groups
 * @returns Array of Alert objects (CRITICAL severity)
 */
function generateSecurityGroupAlerts(securityGroups: SecurityGroup[]): Alert[] {
  const alerts: Alert[] = [];

  for (const sg of securityGroups) {
    const inboundRules = sg.IpPermissions || [];

    for (const rule of inboundRules) {
      const fromPort = rule.FromPort || 0;
      const toPort = rule.ToPort || 65535;

      // ========== Rule 1a: SSH (Port 22) exposed to world ==========
      const sshOpen = [fromPort, toPort].includes(22) || (fromPort <= 22 && toPort >= 22);
      const worldOpen =
        rule.IpRanges?.some((r) => r.CidrIp === '0.0.0.0/0') ||
        rule.Ipv6Ranges?.some((r) => r.CidrIpv6 === '::/0');

      if (sshOpen && worldOpen) {
        alerts.push({
          id: uuidv4(),
          type: 'SECURITY',
          severity: 'CRITICAL',
          title: 'Publicly Accessible SSH Port',
          description: `Security Group "${sg.GroupName}" (${sg.GroupId}) allows unrestricted access to port 22 (SSH) from 0.0.0.0/0. This exposes the infrastructure to brute-force attacks and unauthorized access.`,
          resourceId: sg.GroupId || 'unknown',
          resourceName: sg.GroupName || 'unknown',
          ruleId: 'sg-ssh-world',
          timestamp: new Date(),
          metadata: {
            port: 22,
            protocol: 'SSH',
            groupId: sg.GroupId,
            groupName: sg.GroupName,
            fromPort,
            toPort,
          },
        });
      }

      // ========== Rule 1b: RDP (Port 3389) exposed to world ==========
      const rdpOpen = [fromPort, toPort].includes(3389) || (fromPort <= 3389 && toPort >= 3389);

      if (rdpOpen && worldOpen) {
        alerts.push({
          id: uuidv4(),
          type: 'SECURITY',
          severity: 'CRITICAL',
          title: 'Publicly Accessible RDP Port',
          description: `Security Group "${sg.GroupName}" (${sg.GroupId}) allows unrestricted access to port 3389 (RDP) from 0.0.0.0/0. This exposes Windows instances to brute-force attacks.`,
          resourceId: sg.GroupId || 'unknown',
          resourceName: sg.GroupName || 'unknown',
          ruleId: 'sg-rdp-world',
          timestamp: new Date(),
          metadata: {
            port: 3389,
            protocol: 'RDP',
            groupId: sg.GroupId,
            groupName: sg.GroupName,
            fromPort,
            toPort,
          },
        });
      }
    }
  }

  return alerts;
}

/**
 * Generates WARNING alerts for unused EBS volumes
 * Rule 2: Detect unattached EBS volumes (state = "available")
 * 
 * @param volumes - Array of AWS EBS Volumes
 * @param costConfig - Pricing configuration
 * @returns Array of Alert objects (WARNING severity)
 */
function generateEBSVolumeAlerts(volumes: Volume[], costConfig: CostConfig): Alert[] {
  const alerts: Alert[] = [];

  for (const volume of volumes) {
    if (volume.State === 'available') {
      const monthlyCost = ((volume.Size || 0) * costConfig.PRICE_PER_GB).toFixed(2);

      alerts.push({
        id: uuidv4(),
        type: 'FINOPS',
        severity: 'WARNING',
        title: 'Unused EBS Volume',
        description: `EBS Volume "${volume.VolumeId}" is unattached and not in use, wasting $${monthlyCost}/month. Consider deleting or reattaching this volume.`,
        resourceId: volume.VolumeId || 'unknown',
        resourceName: volume.VolumeId || 'unknown',
        ruleId: 'ebs-unattached',
        timestamp: new Date(),
        metadata: {
          volumeId: volume.VolumeId,
          size: volume.Size,
          state: volume.State,
          monthlyCost: parseFloat(monthlyCost),
          zone: volume.AvailabilityZone,
        },
      });
    }
  }

  return alerts;
}

/**
 * Generates WARNING alerts for unassociated Elastic IPs
 * Rule 3: Detect Elastic IPs with no AssociationId (not attached to any resource)
 * 
 * @param elasticIPs - Array of AWS Elastic IP Addresses
 * @param costConfig - Pricing configuration
 * @returns Array of Alert objects (WARNING severity)
 */
function generateElasticIPAlerts(elasticIPs: Address[], costConfig: CostConfig): Alert[] {
  const alerts: Alert[] = [];

  for (const ip of elasticIPs) {
    // IPs without AssociationId are not attached to any instance
    if (!ip.AssociationId) {
      const monthlyCost = costConfig.PRICE_PER_IP.toFixed(2);

      alerts.push({
        id: uuidv4(),
        type: 'FINOPS',
        severity: 'WARNING',
        title: 'Unused Elastic IP',
        description: `Elastic IP "${ip.PublicIp}" is not associated with any resource, wasting $${monthlyCost}/month. Consider releasing this IP if no longer needed.`,
        resourceId: ip.PublicIp || 'unknown',
        resourceName: ip.PublicIp || 'unknown',
        ruleId: 'elasticip-unassociated',
        timestamp: new Date(),
        metadata: {
          publicIp: ip.PublicIp,
          allocationId: ip.AllocationId,
          associated: !!ip.AssociationId,
          monthlyCost: costConfig.PRICE_PER_IP,
          domain: ip.Domain,
        },
      });
    }
  }

  return alerts;
}

/**
 * Generates MEDIUM alerts for overly permissive inbound rules
 * Rule 4: Detects Security Groups with large port ranges or unrestricted access
 * 
 * @param securityGroups - Array of AWS Security Groups
 * @returns Array of Alert objects (MEDIUM severity)
 */
function generatePermissiveSecurityGroupAlerts(securityGroups: SecurityGroup[]): Alert[] {
  const alerts: Alert[] = [];
  const dangerousPorts = [
    { port: 3306, name: 'MySQL' },
    { port: 5432, name: 'PostgreSQL' },
    { port: 27017, name: 'MongoDB' },
    { port: 6379, name: 'Redis' },
    { port: 5984, name: 'CouchDB' },
  ];

  for (const sg of securityGroups) {
    const inboundRules = sg.IpPermissions || [];

    for (const rule of inboundRules) {
      const fromPort = rule.FromPort || 0;
      const toPort = rule.ToPort || 65535;

      // Check for database ports open to world
      for (const { port, name } of dangerousPorts) {
        const portOpen = [fromPort, toPort].includes(port) || (fromPort <= port && toPort >= port);
        const worldOpen =
          rule.IpRanges?.some((r) => r.CidrIp === '0.0.0.0/0') ||
          rule.Ipv6Ranges?.some((r) => r.CidrIpv6 === '::/0');

        if (portOpen && worldOpen) {
          alerts.push({
            id: uuidv4(),
            type: 'SECURITY',
            severity: 'HIGH',
            title: `Database Port ${port} (${name}) Exposed to World`,
            description: `Security Group "${sg.GroupName}" (${sg.GroupId}) allows unrestricted access to port ${port} (${name}) from 0.0.0.0/0. This exposes your database to unauthorized access.`,
            resourceId: sg.GroupId || 'unknown',
            resourceName: sg.GroupName || 'unknown',
            ruleId: `sg-db-${port}-world`,
            timestamp: new Date(),
            metadata: {
              port,
              protocol: name,
              groupId: sg.GroupId,
              groupName: sg.GroupName,
              fromPort,
              toPort,
            },
          });
        }
      }

      // Check for large port ranges (insecure pattern)
      const portRangeSize = toPort - fromPort + 1;
      if (portRangeSize > 100) {
        const worldOpen =
          rule.IpRanges?.some((r) => r.CidrIp === '0.0.0.0/0') ||
          rule.Ipv6Ranges?.some((r) => r.CidrIpv6 === '::/0');

        if (worldOpen) {
          alerts.push({
            id: uuidv4(),
            type: 'SECURITY',
            severity: 'MEDIUM',
            title: 'Overly Large Port Range Exposed',
            description: `Security Group "${sg.GroupName}" (${sg.GroupId}) allows access to a large port range (${fromPort}-${toPort}, ${portRangeSize} ports) from 0.0.0.0/0. Consider restricting to specific ports only.`,
            resourceId: sg.GroupId || 'unknown',
            resourceName: sg.GroupName || 'unknown',
            ruleId: 'sg-large-range',
            timestamp: new Date(),
            metadata: {
              fromPort,
              toPort,
              rangeSize: portRangeSize,
              groupId: sg.GroupId,
              groupName: sg.GroupName,
            },
          });
        }
      }
    }
  }

  return alerts;
}

/**
 * Generates HIGH alerts for unencrypted EBS volumes
 * Rule 5: Detect EBS volumes without encryption enabled
 * 
 * @param volumes - Array of AWS EBS Volumes
 * @returns Array of Alert objects (HIGH severity)
 */
function generateUnencryptedVolumeAlerts(volumes: Volume[]): Alert[] {
  const alerts: Alert[] = [];

  for (const volume of volumes) {
    if (!volume.Encrypted) {
      alerts.push({
        id: uuidv4(),
        type: 'SECURITY',
        severity: 'HIGH',
        title: 'Unencrypted EBS Volume',
        description: `EBS Volume "${volume.VolumeId}" is not encrypted. AWS recommends enabling encryption at rest to protect sensitive data from unauthorized access.`,
        resourceId: volume.VolumeId || 'unknown',
        resourceName: volume.VolumeId || 'unknown',
        ruleId: 'ebs-unencrypted',
        timestamp: new Date(),
        metadata: {
          volumeId: volume.VolumeId,
          size: volume.Size,
          encrypted: volume.Encrypted,
          zone: volume.AvailabilityZone,
        },
      });
    }
  }

  return alerts;
}

/**
 * Generates INFO alerts for unused security groups
 * Rule 6: Detect Security Groups that are not attached to any instances or network interfaces
 * 
 * @param securityGroups - Array of AWS Security Groups
 * @param instances - Array of AWS EC2 Instances
 * @returns Array of Alert objects (INFO severity)
 */
function generateUnusedSecurityGroupAlerts(securityGroups: SecurityGroup[], instances: Instance[]): Alert[] {
  const alerts: Alert[] = [];
  
  // Get all security groups in use
  const usedGroupIds = new Set<string>();
  for (const instance of instances) {
    instance.SecurityGroups?.forEach((sg) => {
      if (sg.GroupId) usedGroupIds.add(sg.GroupId);
    });
  }

  // Check for unused security groups (excluding default)
  for (const sg of securityGroups) {
    if (sg.GroupName === 'default') continue; // Skip default group
    if (!usedGroupIds.has(sg.GroupId || '')) {
      alerts.push({
        id: uuidv4(),
        type: 'FINOPS',
        severity: 'INFO',
        title: 'Unused Security Group',
        description: `Security Group "${sg.GroupName}" (${sg.GroupId}) is not attached to any EC2 instances. Consider removing if no longer needed.`,
        resourceId: sg.GroupId || 'unknown',
        resourceName: sg.GroupName || 'unknown',
        ruleId: 'sg-unused',
        timestamp: new Date(),
        metadata: {
          groupId: sg.GroupId,
          groupName: sg.GroupName,
          ruleCount: (sg.IpPermissions || []).length,
        },
      });
    }
  }

  return alerts;
}

/**
 * Generates WARNING alerts for public EC2 instances with SSH exposed
 * Rule 7: Detect public instances that have SSH accessible from world
 * 
 * @param instances - Array of AWS EC2 Instances
 * @param securityGroups - Array of AWS Security Groups for reference
 * @returns Array of Alert objects (WARNING severity)
 */
function generatePublicInstanceAlerts(instances: Instance[], securityGroups: SecurityGroup[]): Alert[] {
  const alerts: Alert[] = [];
  
  // Create a map of SG ID -> SG for quick lookup
  const sgMap = new Map(securityGroups.map(sg => [sg.GroupId, sg]));

  for (const instance of instances) {
    const publicIp = instance.PublicIpAddress;
    const instanceId = instance.InstanceId;

    // Check if instance has public IP (is public)
    if (publicIp && instance.SecurityGroups) {
      let sshExposed = false;

      // Check if any attached security group allows SSH from world
      for (const sgRef of instance.SecurityGroups) {
        const sg = sgMap.get(sgRef.GroupId);
        if (sg) {
          const hasWorldSSH = (sg.IpPermissions || []).some((rule) => {
            const fromPort = rule.FromPort || 0;
            const toPort = rule.ToPort || 65535;
            const sshOpen = [fromPort, toPort].includes(22) || (fromPort <= 22 && toPort >= 22);
            const worldOpen =
              rule.IpRanges?.some((r) => r.CidrIp === '0.0.0.0/0') ||
              rule.Ipv6Ranges?.some((r) => r.CidrIpv6 === '::/0');
            return sshOpen && worldOpen;
          });

          if (hasWorldSSH) {
            sshExposed = true;
            break;
          }
        }
      }

      if (sshExposed) {
        alerts.push({
          id: uuidv4(),
          type: 'SECURITY',
          severity: 'WARNING',
          title: 'Public Instance with SSH Exposed',
          description: `EC2 Instance "${instanceId}" has a public IP (${publicIp}) and allows SSH access from 0.0.0.0/0. Consider restricting SSH access to specific IP ranges (bastion host pattern).`,
          resourceId: instanceId || 'unknown',
          resourceName: `${instance.Tags?.find(t => t.Key === 'Name')?.Value || instanceId}` || 'unknown',
          ruleId: 'ec2-public-ssh',
          timestamp: new Date(),
          metadata: {
            instanceId,
            publicIp,
            instanceType: instance.InstanceType,
            state: instance.State?.Name,
          },
        });
      }
    }
  }

  return alerts;
}

/**
 * Generates MEDIUM severity alerts for security best practices
 * Checks for overly permissive HTTP/HTTPS access and other behavioral issues
 */
function generateMediumSecurityAlerts(securityGroups: SecurityGroup[]): Alert[] {
  const alerts: Alert[] = [];

  for (const sg of securityGroups) {
    const inboundRules = sg.IpPermissions || [];

    for (const rule of inboundRules) {
      const fromPort = rule.FromPort || 0;
      const toPort = rule.ToPort || 65535;

      // Rule: HTTP (80) open to world without HTTPS redirect
      const httpOpen = [fromPort, toPort].includes(80) || (fromPort <= 80 && toPort >= 80);
      const worldOpen =
        rule.IpRanges?.some((r) => r.CidrIp === '0.0.0.0/0') ||
        rule.Ipv6Ranges?.some((r) => r.CidrIpv6 === '::/0');

      if (httpOpen && worldOpen) {
        alerts.push({
          id: uuidv4(),
          type: 'SECURITY',
          severity: 'MEDIUM',
          title: 'Web Traffic Not Encrypted (HTTP)',
          description: `Security Group "${sg.GroupName}" allows unencrypted HTTP traffic from the internet. Consider using HTTPS instead or restricting to known IPs.`,
          resourceId: sg.GroupId || 'unknown',
          resourceName: sg.GroupName || 'unknown',
          ruleId: 'sg-http-world',
          timestamp: new Date(),
          metadata: {
            port: 80,
            protocol: 'HTTP',
            groupId: sg.GroupId,
            recommendation: 'Enable HTTPS and redirect HTTP to HTTPS'
          }
        });
      }

      // Rule: Too many ports open (potential over-provisioning)
      const portRangeSize = toPort - fromPort + 1;
      if (portRangeSize > 1000 && worldOpen) {
        alerts.push({
          id: uuidv4(),
          type: 'SECURITY',
          severity: 'MEDIUM',
          title: 'Excessive Port Range Exposed',
          description: `Security Group allows ${portRangeSize} ports to be open, which may lead to unexpected service exposure.`,
          resourceId: sg.GroupId || 'unknown',
          resourceName: sg.GroupName || 'unknown',
          ruleId: 'sg-excessive-ports',
          timestamp: new Date(),
          metadata: {
            portRange: `${fromPort}-${toPort}`,
            portsCount: portRangeSize,
            groupId: sg.GroupId
          }
        });
      }
    }
  }

  return alerts;
}

/**
 * Generates INFO severity alerts for optimization recommendations
 */
function generateInfoAlerts(instances: Instance[], volumes: Volume[]): Alert[] {
  const alerts: Alert[] = [];

  // Stopped instances (recommendation to terminate if unused)
  const stoppedInstances = instances.filter(i => i.State?.Name === 'stopped');
  if (stoppedInstances.length > 0) {
    alerts.push({
      id: uuidv4(),
      type: 'FINOPS',
      severity: 'INFO',
      title: `${stoppedInstances.length} Stopped EC2 Instances`,
      description: `You have ${stoppedInstances.length} stopped EC2 instances. Consider terminating them if no longer needed to reduce costs.`,
      resourceId: 'multiple',
      resourceName: 'EC2 Instances',
      ruleId: 'ec2-stopped-instances',
      timestamp: new Date(),
      metadata: {
        count: stoppedInstances.length,
        instances: stoppedInstances.map(i => i.InstanceId).slice(0, 5)
      }
    });
  }

  // Small volumes (< 10GB)
  const smallVolumes = volumes.filter(v => (v.Size || 0) < 10);
  if (smallVolumes.length > 3) {
    alerts.push({
      id: uuidv4(),
      type: 'FINOPS',
      severity: 'INFO',
      title: `${smallVolumes.length} Small EBS Volumes (<10GB)`,
      description: `Multiple small EBS volumes detected. Consider consolidating to reduce management overhead.`,
      resourceId: 'multiple',
      resourceName: 'EBS Volumes',
      ruleId: 'ebs-small-volumes',
      timestamp: new Date(),
      metadata: {
        count: smallVolumes.length,
        avgSize: (smallVolumes.reduce((s, v) => s + (v.Size || 0), 0) / smallVolumes.length).toFixed(1)
      }
    });
  }

  return alerts;
}

/**
 * Generates additional HIGH severity alerts
 */
function generateHighSecurityAlerts(instances: Instance[]): Alert[] {
  const alerts: Alert[] = [];

  // Check for instances with public IP in suspicious states
  const suspiciousInstances = instances.filter(i => 
    i.PublicIpAddress && i.State?.Name === 'running'
  );

  if (suspiciousInstances.length > 5) {
    alerts.push({
      id: uuidv4(),
      type: 'SECURITY',
      severity: 'HIGH',
      title: `${suspiciousInstances.length} Instances Exposed to Internet`,
      description: `Multiple running EC2 instances have public IP addresses. Ensure proper security groups and encryption are configured.`,
      resourceId: 'multiple',
      resourceName: 'EC2 Instances',
      ruleId: 'ec2-public-instances-high',
      timestamp: new Date(),
      metadata: {
        count: suspiciousInstances.length,
        publicIps: suspiciousInstances.map(i => i.PublicIpAddress).filter(Boolean).slice(0, 3)
      }
    });
  }

  return alerts;
}

/**
 * Master Rules Engine: Orchestrates all alert generation rules
 * Combines security and finops alerts from individual rule functions
 * 
 * @param assets - Fetched AWS infrastructure assets
 * @param costConfig - Pricing configuration
 * @returns Consolidated array of all generated alerts
 */
function rulesEngine(assets: AWSAssets, costConfig: CostConfig): Alert[] {
  const alerts: Alert[] = [];

  console.log('🔍 Running Rules Engine...');

  // Security Alerts - Rule 1: SSH/RDP exposed
  console.log('  📋 Evaluating Security Group rules (SSH/RDP)...');
  const sgAlerts = generateSecurityGroupAlerts(assets.securityGroups);
  alerts.push(...sgAlerts);
  console.log(`    ✓ Found ${sgAlerts.length} security alerts`);

  // Security Alerts - Rule 4: Database ports and permissive rules
  console.log('  📋 Evaluating permissive Security Group rules (DB, HTTP, etc)...');
  const permissiveAlerts = generatePermissiveSecurityGroupAlerts(assets.securityGroups);
  alerts.push(...permissiveAlerts);
  console.log(`    ✓ Found ${permissiveAlerts.length} permissive rule alerts`);

  // Security Alerts - Rule 5: Unencrypted volumes
  console.log('  🔐 Evaluating EBS Volume encryption...');
  const unencryptedAlerts = generateUnencryptedVolumeAlerts(assets.volumes);
  alerts.push(...unencryptedAlerts);
  console.log(`    ✓ Found ${unencryptedAlerts.length} unencrypted volume alerts`);

  // Security Alerts - Rule 7: Public instances with SSH
  console.log('  🌐 Evaluating public EC2 instances...');
  const publicInstanceAlerts = generatePublicInstanceAlerts(assets.instances, assets.securityGroups);
  alerts.push(...publicInstanceAlerts);
  console.log(`    ✓ Found ${publicInstanceAlerts.length} public instance alerts`);

  // FinOps Alerts - Rule 2: Unused EBS volumes
  console.log('  💰 Evaluating EBS Volume utilization...');
  const ebsAlerts = generateEBSVolumeAlerts(assets.volumes, costConfig);
  alerts.push(...ebsAlerts);
  console.log(`    ✓ Found ${ebsAlerts.length} EBS wastage alerts`);

  // FinOps Alerts - Rule 3: Unused Elastic IPs
  console.log('  💰 Evaluating Elastic IP utilization...');
  const ipAlerts = generateElasticIPAlerts(assets.elasticIPs, costConfig);
  alerts.push(...ipAlerts);
  console.log(`    ✓ Found ${ipAlerts.length} Elastic IP wastage alerts`);

  // FinOps Alerts - Rule 6: Unused security groups
  console.log('  📋 Evaluating Security Group usage...');
  const unusedSGAlerts = generateUnusedSecurityGroupAlerts(assets.securityGroups, assets.instances);
  alerts.push(...unusedSGAlerts);
  console.log(`    ✓ Found ${unusedSGAlerts.length} unused security group alerts`);

  // Additional Medium Severity Security Alerts
  console.log('  🟡 Evaluating security best practices (MEDIUM)...');
  const mediumSecurityAlerts = generateMediumSecurityAlerts(assets.securityGroups);
  alerts.push(...mediumSecurityAlerts);
  console.log(`    ✓ Found ${mediumSecurityAlerts.length} medium severity alerts`);

  // Additional High Severity Alerts
  console.log('  🔴 Evaluating public instance exposure (HIGH)...');
  const highAlerts = generateHighSecurityAlerts(assets.instances);
  alerts.push(...highAlerts);
  console.log(`    ✓ Found ${highAlerts.length} high severity alerts`);

  // Info/Recommendation Alerts
  console.log('  ℹ️  Generating optimization recommendations...');
  const infoAlerts = generateInfoAlerts(assets.instances, assets.volumes);
  alerts.push(...infoAlerts);
  console.log(`    ✓ Found ${infoAlerts.length} recommendation alerts`);

  console.log(`\n✅ Rules Engine complete: ${alerts.length} total alerts generated\n`);

  return alerts;
}

// ========== Helper function to create EC2 client with credentials ==========
const createEC2Client = (credentials: any) => {
    const config: any = {
        region: credentials.region || 'us-east-1',
        credentials: {
            accessKeyId: credentials.accessKeyId || 'test',
            secretAccessKey: credentials.secretAccessKey || 'test',
        },
    };

    // Add endpoint for LocalStack when using local AWS emulation
    if (credentials.isLocalStack) {
        config.endpoint = credentials.endpoint || 'http://localhost:4566';
        console.log(`\n🔧 LocalStack Config: endpoint=${config.endpoint}`);
    }

    console.log(`🔧 EC2 Client Config:`, {
        region: config.region,
        hasCredentials: !!config.credentials.accessKeyId,
        endpoint: config.endpoint || 'AWS default'
    });

    return new EC2Client(config);
};

// ============================================================================
// API ENDPOINTS
// ============================================================================

// ========== AUTHENTICATION ENDPOINTS ==========

// ========== POST /api/auth/register - Register new user with AWS credentials ==========
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, accessKeyId, secretAccessKey, region, isLocalStack, endpoint } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ username }, { email }] 
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User with this username or email already exists' });
        }

        // Create new user (TODO: Use bcrypt for password hashing in production!)
        const newUser = new User({
            username,
            email,
            password, // NOTE: Password should be hashed before storing!
            awsAccessKeyId: accessKeyId,
            awsSecretAccessKey: secretAccessKey,
            awsRegion: region || 'us-east-1',
            isLocalStack: isLocalStack || false,
            localStackEndpoint: endpoint || 'http://localhost:4566'
        });

        await newUser.save();

        res.status(201).json({ 
            message: 'Пользователь успешно создан',
            userId: newUser._id,
            username: newUser.username
        });
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        res.status(500).json({ error: 'Ошибка при регистрации', message: String(error) });
    }
});

// 2. Вход пользователя
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password, accessKeyId, secretAccessKey, region, isLocalStack, endpoint } = req.body;

        // Если передали credentials, используем их напрямую
        if (accessKeyId && secretAccessKey) {
            // Проверяем доступность AWS/LocalStack
            const testClient = createEC2Client({
                accessKeyId,
                secretAccessKey,
                region: region || 'us-east-1',
                isLocalStack,
                endpoint
            });

            try {
                // Пытаемся выполнить простой запрос для проверки credentials
                await testClient.send(new DescribeInstancesCommand({}));
                
                return res.status(200).json({
                    success: true,
                    message: 'Успешное подключение',
                    session: {
                        type: isLocalStack ? 'localstack' : 'aws',
                        accessKeyId: accessKeyId.substring(0, 4) + '****', // скрываем ключ
                        region: region || 'us-east-1'
                    }
                });
            } catch (awsError: any) {
                return res.status(401).json({ 
                    error: 'Неверная учетная запись или недоступна служба',
                    details: awsError.message 
                });
            }
        }

        // Если нет credentials, ищем пользователя по username
        if (username && password) {
            const user = await User.findOne({ username });

            if (!user || user.password !== password) { // TODO: используйте bcrypt.compare()!
                return res.status(401).json({ error: 'Неверный username или пароль' });
            }

            // Проверяем AWS/LocalStack credentials
            const testClient = createEC2Client({
                accessKeyId: user.awsAccessKeyId,
                secretAccessKey: user.awsSecretAccessKey,
                region: user.awsRegion,
                isLocalStack: user.isLocalStack,
                endpoint: user.localStackEndpoint
            });

            try {
                await testClient.send(new DescribeInstancesCommand({}));
                
                return res.status(200).json({
                    success: true,
                    message: 'Вход выполнен успешно',
                    userId: user._id,
                    username: user.username,
                    session: {
                        type: user.isLocalStack ? 'localstack' : 'aws',
                        region: user.awsRegion
                    }
                });
            } catch (awsError: any) {
                return res.status(401).json({ 
                    error: 'Ошибка подключения к AWS/LocalStack',
                    details: awsError.message 
                });
            }
        }

        res.status(400).json({ error: 'Требуются credentials или username/password' });
    } catch (error) {
        console.error('Ошибка при входе:', error);
        res.status(500).json({ error: 'Ошибка при входе', message: String(error) });
    }
});

// 3. Валидация текущей сессии
app.post('/api/auth/validate', async (req, res) => {
    try {
        const { accessKeyId, secretAccessKey, region, isLocalStack, endpoint } = req.body;

        const testClient = createEC2Client({
            accessKeyId,
            secretAccessKey,
            region,
            isLocalStack,
            endpoint
        });

        await testClient.send(new DescribeInstancesCommand({}));
        
        res.status(200).json({ valid: true });
    } catch (error: any) {
        res.status(401).json({ valid: false, error: error.message });
    }
});

// 4. Security Scanner Endpoint - Performs real security audit of AWS infrastructure
app.get('/api/security-scan', async (req, res) => {
    try {
        const { accessKeyId, secretAccessKey, region, isLocalStack, endpoint } = req.query;

        if (!accessKeyId || !secretAccessKey) {
            return res.status(400).json({ error: 'AWS credentials are required' });
        }

        // Create EC2 and IAM clients
        const ec2Config: any = {
            region: (region as string) || 'us-east-1',
            credentials: {
                accessKeyId: accessKeyId as string,
                secretAccessKey: secretAccessKey as string,
            },
        };

        const iamConfig: any = {
            region: (region as string) || 'us-east-1',
            credentials: {
                accessKeyId: accessKeyId as string,
                secretAccessKey: secretAccessKey as string,
            },
        };

        if (isLocalStack === 'true') {
            ec2Config.endpoint = (endpoint as string) || 'http://localhost:4566';
            iamConfig.endpoint = (endpoint as string) || 'http://localhost:4566';
        }

        const ec2Client = new EC2Client(ec2Config);
        const iamClient = new IAMClient(iamConfig);

        console.log('🔒 Security scan initiated...');

        const findings: any[] = [];
        let criticalCount = 0;
        let highCount = 0;
        let mediumCount = 0;

        // ============ CHECK 1: Security Groups ============
        console.log('📋 Checking Security Groups...');
        try {
            const sgData = await ec2Client.send(new DescribeSecurityGroupsCommand({}));
            const securityGroups = sgData.SecurityGroups || [];

            for (const sg of securityGroups) {
                // Check inbound rules for open SSH (22) and RDP (3389)
                const ingressRules = sg.IpPermissions || [];

                for (const rule of ingressRules) {
                    const ports = [rule.FromPort, rule.ToPort];

                    // Check for SSH (port 22)
                    if (
                        (rule.FromPort === 22 || rule.ToPort === 22 || (rule.FromPort! <= 22 && rule.ToPort! >= 22)) &&
                        (rule.IpRanges?.some((r) => r.CidrIp === '0.0.0.0/0') ||
                            rule.Ipv6Ranges?.some((r) => r.CidrIpv6 === '::/0'))
                    ) {
                        criticalCount++;
                        findings.push({
                            id: `${sg.GroupId}-ssh`,
                            type: 'SecurityGroup',
                            severity: 'CRITICAL',
                            title: 'SSH Open to World',
                            description: `Port 22 (SSH) is open to 0.0.0.0/0 on Security Group ${sg.GroupName} (${sg.GroupId}). This allows unrestricted SSH access.`,
                            resourceId: sg.GroupId,
                            resourceName: sg.GroupName,
                        });
                    }

                    // Check for RDP (port 3389)
                    if (
                        (rule.FromPort === 3389 || rule.ToPort === 3389 || (rule.FromPort! <= 3389 && rule.ToPort! >= 3389)) &&
                        (rule.IpRanges?.some((r) => r.CidrIp === '0.0.0.0/0') ||
                            rule.Ipv6Ranges?.some((r) => r.CidrIpv6 === '::/0'))
                    ) {
                        criticalCount++;
                        findings.push({
                            id: `${sg.GroupId}-rdp`,
                            type: 'SecurityGroup',
                            severity: 'CRITICAL',
                            title: 'RDP Open to World',
                            description: `Port 3389 (RDP) is open to 0.0.0.0/0 on Security Group ${sg.GroupName} (${sg.GroupId}). This allows unrestricted RDP access.`,
                            resourceId: sg.GroupId,
                            resourceName: sg.GroupName,
                        });
                    }
                }
            }

            console.log(`✅ Security Groups checked: ${securityGroups.length} groups inspected`);
        } catch (error: any) {
            console.error('⚠️ Error checking Security Groups:', error.message);
        }

        // ============ CHECK 2: IAM Users ============
        console.log('👤 Checking IAM Users...');
        try {
            const usersData = await iamClient.send(new ListUsersCommand({}));
            const users = usersData.Users || [];

            for (const user of users) {
                const createdDate = user.CreateDate;
                const now = new Date();
                const daysSinceCreation = Math.floor(
                    (now.getTime() - (createdDate ? createdDate.getTime() : now.getTime())) / (1000 * 60 * 60 * 24)
                );

                // Check if password is older than 90 days
                if (daysSinceCreation > 90) {
                    try {
                        const loginProfile = await iamClient.send(
                            new GetLoginProfileCommand({ UserName: user.UserName! })
                        );

                        if (loginProfile.LoginProfile) {
                            const passwordLastUsed = loginProfile.LoginProfile.CreateDate;
                            const daysSincePasswordCreation = Math.floor(
                                (now.getTime() - (passwordLastUsed ? passwordLastUsed.getTime() : now.getTime())) /
                                    (1000 * 60 * 60 * 24)
                            );

                            if (daysSincePasswordCreation > 90) {
                                highCount++;
                                findings.push({
                                    id: `iam-${user.UserName}`,
                                    type: 'IAM',
                                    severity: 'HIGH',
                                    title: 'IAM User with Old Password',
                                    description: `IAM user '${user.UserName}' has not updated their password in ${daysSincePasswordCreation} days (threshold: 90 days). Consider enforcing password rotation.`,
                                    resourceId: user.UserName,
                                    resourceName: user.UserName,
                                });
                            }
                        }
                    } catch (error: any) {
                        // User might not have a login profile (access key only user)
                        if (error.name !== 'NoSuchEntityException') {
                            console.warn(`⚠️  Error checking login profile for ${user.UserName}:`, error.message);
                        }
                    }
                }
            }

            console.log(`✅ IAM Users checked: ${users.length} users inspected`);
        } catch (error: any) {
            console.error('⚠️ Error checking IAM Users:', error.message);
        }

        // ============ Calculate Health Score ============
        const totalFindings = findings.length;
        const healthScore = Math.max(0, 100 - criticalCount * 15 - highCount * 8 - mediumCount * 3);

        console.log(`📊 Security Scan Complete - Health Score: ${healthScore}`);

        // ============ Response ============
        return res.status(200).json({
            healthScore: Math.round(healthScore),
            timestamp: new Date().toISOString(),
            summary: {
                critical: criticalCount,
                high: highCount,
                medium: mediumCount,
                total: totalFindings,
            },
            findings: findings.sort((a, b) => {
                const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
                return (severityOrder[a.severity as keyof typeof severityOrder] || 4) -
                    (severityOrder[b.severity as keyof typeof severityOrder] || 4);
            }),
        });
    } catch (error: any) {
        console.error('❌ Security scan failed:', error);
        return res.status(500).json({
            error: 'Security scan failed',
            message: error.message,
            healthScore: 0,
            summary: { critical: 0, high: 0, medium: 0, total: 0 },
            findings: [],
        });
    }
});

// ========== POST /api/scan - Advanced CSPM & FinOps Scanning with Alert Generation ==========
/**
 * Main scanning endpoint that:
 * 1. Fetches AWS infrastructure data (EC2, EBS, IPs, Security Groups)
 * 2. Runs custom rules engine to generate security and cost alerts
 * 3. Calculates total spend and waste metrics
 * 4. Saves complete audit (with alerts) to MongoDB
 * 5. Returns comprehensive scan result for frontend display
 * 
 * This is the core CloudOpti endpoint that replaces expensive native AWS services
 */
app.post('/api/scan', async (req, res) => {
    try {
        const { accessKeyId, secretAccessKey, region, isLocalStack, endpoint } = req.body;

        console.log('\n='.repeat(80));
        console.log('📨 /api/scan - CSPM & FinOps Scan Initiated');
        console.log('='.repeat(80));
        console.log('🔐 Credentials:', {
            accessKeyId: accessKeyId ? '✓ provided' : '✗ missing',
            secretAccessKey: secretAccessKey ? '✓ provided' : '✗ missing',
            region: region || 'us-east-1',
            isLocalStack,
            endpoint: endpoint || 'default'
        });

        if (!accessKeyId || !secretAccessKey) {
            console.error('❌ Missing AWS credentials');
            return res.status(400).json({ 
                error: 'Требуются AWS credentials',
                code: 'MISSING_CREDENTIALS'
            });
        }

        // ============================================================
        // STEP 1: Create AWS clients
        // ============================================================
        const ec2 = createEC2Client({
            accessKeyId,
            secretAccessKey,
            region: region || 'us-east-1',
            isLocalStack,
            endpoint
        });

        console.log(`\n☁️  Target: ${isLocalStack ? '🐳 LocalStack' : 'AWS'} | Region: ${region || 'us-east-1'}`);
        console.log('-'.repeat(80));

        // ============================================================
        // STEP 2: Fetch AWS Infrastructure Data (Assets)
        // ============================================================
        console.log('\n📡 Fetching AWS Infrastructure Data...\n');

        let instances: Instance[] = [];
        let volumes: Volume[] = [];
        let elasticIPs: Address[] = [];
        let securityGroups: SecurityGroup[] = [];

        // 2.1: Fetch EC2 Instances
        try {
            console.log('  🖥️  Fetching EC2 Instances...');
            const instData = await ec2.send(new DescribeInstancesCommand({}));
            instances = instData.Reservations?.flatMap(r => r.Instances || []) || [];
            console.log(`      ✓ Found ${instances.length} instances`);
        } catch (err: any) {
            console.error(`      ✗ Error fetching instances: ${err.message}`);
            console.error(`      Full error:`, err);
        }

        // 2.2: Fetch EBS Volumes
        try {
            console.log('  📦 Fetching EBS Volumes...');
            const volData = await ec2.send(new DescribeVolumesCommand({}));
            volumes = volData.Volumes || [];
            console.log(`      ✓ Found ${volumes.length} volumes`);
        } catch (err: any) {
            console.error(`      ✗ Error fetching volumes: ${err.message}`);
            console.error(`      Full error:`, err);
        }

        // 2.3: Fetch Elastic IP Addresses
        try {
            console.log('  🌐 Fetching Elastic IPs...');
            const ipData = await ec2.send(new DescribeAddressesCommand({}));
            elasticIPs = ipData.Addresses || [];
            console.log(`      ✓ Found ${elasticIPs.length} elastic IPs`);
        } catch (err: any) {
            console.error(`      ✗ Error fetching elastic IPs: ${err.message}`);
            console.error(`      Full error:`, err);
        }

        // 2.4: Fetch Security Groups (for security analysis)
        try {
            console.log('  🔐 Fetching Security Groups...');
            const sgData = await ec2.send(new DescribeSecurityGroupsCommand({}));
            securityGroups = sgData.SecurityGroups || [];
            console.log(`      ✓ Found ${securityGroups.length} security groups`);
        } catch (err: any) {
            console.error(`      ✗ Error fetching security groups: ${err.message}`);
            console.error(`      Full error:`, err);
        }

        // ============================================================
        // STEP 3: Define Cost Configuration
        // ============================================================
        const costConfig: CostConfig = {
            PRICE_PER_GB: 0.08,       // $ per GB for EBS volumes
            PRICE_PER_SERVER: 15.00,  // $ per month for t2.micro
            PRICE_PER_IP: 3.60,       // $ per month for unattached Elastic IP
        };

        const assets: AWSAssets = {
            securityGroups,
            volumes,
            elasticIPs,
            instances,
        };

        // ============================================================
        // STEP 4: Execute Custom Rules Engine (CORE FEATURE)
        // ============================================================
        console.log('\n' + '-'.repeat(80));
        const generatedAlerts = rulesEngine(assets, costConfig);

        // Separate alerts by type for summary
        const securityAlerts = generatedAlerts.filter(a => a.type === 'SECURITY');
        const finopsAlerts = generatedAlerts.filter(a => a.type === 'FINOPS');

        console.log('\n📊 Alert Summary:');
        console.log(`   🔒 Security Alerts: ${securityAlerts.length}`);
        console.log(`   💰 FinOps Alerts: ${finopsAlerts.length}`);
        console.log(`   📋 Total Alerts: ${generatedAlerts.length}`);

        // ============================================================
        // STEP 5: Calculate Financial Metrics
        // ============================================================
        console.log('\n' + '-'.repeat(80));
        console.log('\n💰 Calculating Financial Metrics...\n');

        // Total Spend (all running resources)
        const totalEBSCost = volumes.reduce((sum, v) => sum + ((v.Size || 0) * costConfig.PRICE_PER_GB), 0);
        const totalEC2Cost = instances.filter(i => i.State?.Name === 'running').length * costConfig.PRICE_PER_SERVER;
        const totalIPCost = elasticIPs.filter(ip => !ip.AssociationId).length * costConfig.PRICE_PER_IP;
        const totalSpend = totalEBSCost + totalEC2Cost;

        // Total Waste (unused resources)
        const wastedVolumes = volumes.filter(v => v.State === 'available');
        const wastedVolumeCost = wastedVolumes.reduce((sum, v) => sum + ((v.Size || 0) * costConfig.PRICE_PER_GB), 0);
        const wastedIPs = elasticIPs.filter(ip => !ip.AssociationId);
        const wastedIPCost = wastedIPs.length * costConfig.PRICE_PER_IP;
        const totalWaste = wastedVolumeCost + wastedIPCost;

        console.log(`  Total Spend (All Resources):   $${totalSpend.toFixed(2)}`);
        console.log(`  ├─ EC2 Cost:                   $${totalEC2Cost.toFixed(2)} (${instances.filter(i => i.State?.Name === 'running').length} instances)`);
        console.log(`  └─ EBS Cost:                   $${totalEBSCost.toFixed(2)} (${volumes.length} volumes)`);
        console.log(`\n  Total Waste (Unused Resources): $${totalWaste.toFixed(2)}`);
        console.log(`  ├─ Unattached Volumes:         $${wastedVolumeCost.toFixed(2)} (${wastedVolumes.length} volumes)`);
        console.log(`  └─ Unused Elastic IPs:         $${wastedIPCost.toFixed(2)} (${wastedIPs.length} IPs)`);

        // Health Score (CSPM-style scoring)
        const criticalCount = securityAlerts.filter(a => a.severity === 'CRITICAL').length;
        const highCount = securityAlerts.filter(a => a.severity === 'HIGH').length;
        const warningCount = finopsAlerts.filter(a => a.severity === 'WARNING').length;
        const healthScore = Math.max(0, 100 - (criticalCount * 20 + highCount * 10 + warningCount * 5));

        console.log(`\n  Security Health Score:         ${healthScore}/100`);

        // ============================================================
        // STEP 6: Build Resource Lists
        // ============================================================
        console.log('\n' + '-'.repeat(80));
        console.log('\n📋 Building Resource Manifests...\n');

        // All resources (for inventory)
        const allResources = [
            ...instances.map(inst => ({
                id: inst.InstanceId,
                type: 'EC2',
                size: 0,
                cost: inst.State?.Name === 'running' ? costConfig.PRICE_PER_SERVER : 0,
                region: inst.Placement?.AvailabilityZone || 'unknown',
                status: inst.State?.Name || 'unknown'
            })),
            ...volumes.map(vol => ({
                id: vol.VolumeId,
                type: 'EBS',
                size: vol.Size,
                cost: parseFloat(((vol.Size || 0) * costConfig.PRICE_PER_GB).toFixed(2)),
                region: vol.AvailabilityZone || 'unknown',
                status: vol.State || 'unknown'
            })),
            ...elasticIPs.map(ip => ({
                id: ip.PublicIp,
                type: 'IP',
                size: 0,
                cost: ip.AssociationId ? 0 : costConfig.PRICE_PER_IP,
                region: ip.Domain || 'vpc',
                status: ip.AssociationId ? 'attached' : 'unattached'
            }))
        ];

        // Only wasted resources (for optimization recommendations)
        const wastedResources = [
            ...wastedVolumes.map(v => ({
                id: v.VolumeId,
                type: 'EBS',
                size: v.Size,
                cost: parseFloat(((v.Size || 0) * costConfig.PRICE_PER_GB).toFixed(2)),
                region: v.AvailabilityZone || 'unknown',
                status: v.State || 'unknown'
            })),
            ...wastedIPs.map(ip => ({
                id: ip.PublicIp,
                type: 'IP',
                size: 0,
                cost: costConfig.PRICE_PER_IP,
                region: ip.Domain || 'vpc',
                status: 'unattached'
            }))
        ];

        console.log(`  ✓ All Resources:   ${allResources.length} total`);
        console.log(`  ✓ Wasted Resources: ${wastedResources.length} items`);

        // ============================================================
        // STEP 7: Save Audit Document to MongoDB
        // ============================================================
        console.log('\n' + '-'.repeat(80));
        console.log('\n💾 Saving Audit Document to MongoDB...\n');

        const auditDocument = await Audit.create({
            timestamp: new Date(),
            date: new Date(),
            
            // Financial Data
            totalSpend: parseFloat(totalSpend.toFixed(2)),
            totalWasted: parseFloat(totalWaste.toFixed(2)),
            
            // Resource Counts
            resourceCounts: {
                ec2Instances: instances.length,
                ebsVolumes: volumes.length,
                elasticIPs: elasticIPs.length,
                securityGroups: securityGroups.length,
            },
            
            // Cost Breakdown
            costBreakdown: {
                ec2Cost: parseFloat(totalEC2Cost.toFixed(2)),
                ebsCost: parseFloat(totalEBSCost.toFixed(2)),
                ipCost: parseFloat(totalIPCost.toFixed(2)),
            },
            
            // Resources
            resourcesFound: wastedResources,
            allResources: allResources,
            
            // Alerts (the core addition)
            alerts: generatedAlerts,
            
            // Metadata
            region: region || 'us-east-1',
            healthScore: healthScore,
        });

        console.log(`  ✓ Audit ID: ${auditDocument._id}`);
        console.log(`  ✓ Alerts saved: ${auditDocument.alerts?.length || 0}`);

        // ============================================================
        // STEP 7.5: Calculate trend metrics (compare with previous scan)
        // ============================================================
        console.log('\n' + '-'.repeat(80));
        console.log('\n📊 Calculating Trend Metrics...\n');

        const previousAudit = await Audit.findOne({
            _id: { $ne: auditDocument._id }
        }).sort({ timestamp: -1 });

        type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO';
        type AlertCounts = Record<AlertSeverity, number>;
        
        const calculateAlertCounts = (alerts: any[]): AlertCounts => ({
            CRITICAL: alerts.filter(a => a.severity === 'CRITICAL').length,
            HIGH: alerts.filter(a => a.severity === 'HIGH').length,
            MEDIUM: alerts.filter(a => a.severity === 'MEDIUM').length,
            WARNING: alerts.filter(a => a.severity === 'WARNING').length,
            INFO: alerts.filter(a => a.severity === 'INFO').length,
        });

        const currentCounts = calculateAlertCounts(generatedAlerts);
        const previousCounts: AlertCounts = previousAudit 
            ? calculateAlertCounts(previousAudit.alerts || [])
            : { CRITICAL: 0, HIGH: 0, MEDIUM: 0, WARNING: 0, INFO: 0 };

        const calculatePercentChange = (current: number, previous: number): string => {
            if (previous === 0) return current > 0 ? '+100%' : '0%';
            const change = ((current - previous) / previous) * 100;
            return change > 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`;
        };

        const trendMetrics = {
            critical: calculatePercentChange(currentCounts.CRITICAL, previousCounts.CRITICAL),
            high: calculatePercentChange(currentCounts.HIGH, previousCounts.HIGH),
            medium: calculatePercentChange(currentCounts.MEDIUM, previousCounts.MEDIUM),
            warning: calculatePercentChange(currentCounts.WARNING, previousCounts.WARNING),
        };

        console.log('  Alert Trends (vs last scan):');
        console.log(`    Critical: ${previousCounts.CRITICAL} → ${currentCounts.CRITICAL} (${trendMetrics.critical})`);
        console.log(`    High:     ${previousCounts.HIGH} → ${currentCounts.HIGH} (${trendMetrics.high})`);
        console.log(`    Medium:   ${previousCounts.MEDIUM} → ${currentCounts.MEDIUM} (${trendMetrics.medium})`);
        console.log(`    Warning:  ${previousCounts.WARNING} → ${currentCounts.WARNING} (${trendMetrics.warning})`);

        // ============================================================
        // STEP 8: Build Response
        // ============================================================
        console.log('\n' + '-'.repeat(80));
        console.log('\n✅ Scan Complete!\n');

        const scanResult = {
            // Scan Metadata
            scanId: auditDocument._id,
            timestamp: auditDocument.timestamp,
            
            // Financial Summary
            summary: {
                totalSpend: parseFloat(totalSpend.toFixed(2)),
                totalWaste: parseFloat(totalWaste.toFixed(2)),
                healthScore: healthScore,
                serverCount: instances.length,
                diskCount: volumes.length,
                ipCount: elasticIPs.length,
                sgCount: securityGroups.length,
                wasteCount: wastedVolumes.length + wastedIPs.length,
            },
            
            // Resource Data
            allResources: allResources,
            resources: wastedResources, // Only unused resources
            
            // Alerts (CORE FEATURE - for Security Alerts & Event Logs tables)
            alerts: generatedAlerts.sort((a, b) => {
                const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, WARNING: 3, INFO: 4 };
                return (severityOrder[a.severity as keyof typeof severityOrder] || 5) -
                       (severityOrder[b.severity as keyof typeof severityOrder] || 5);
            }),
            
            // Alert Breakdown
            alertSummary: {
                securityAlerts: securityAlerts.length,
                finopsAlerts: finopsAlerts.length,
                critical: securityAlerts.filter(a => a.severity === 'CRITICAL').length,
                high: securityAlerts.filter(a => a.severity === 'HIGH').length,
                warning: finopsAlerts.filter(a => a.severity === 'WARNING').length,
            },
            
            // Trend Metrics (vs last scan)
            trendMetrics: trendMetrics,
        };

        console.log('='.repeat(80));
        console.log('✨ Returning scan results to client\n');

        return res.json(scanResult);

    } catch (error: any) {
        console.error('\n❌ Scan failed:', error);
        return res.status(500).json({
            error: 'Scan failed',
            message: error.message,
            code: 'SCAN_ERROR',
            scanResult: {
                scanId: null,
                timestamp: new Date().toISOString(),
                summary: {
                    totalSpend: 0,
                    totalWaste: 0,
                    healthScore: 0,
                    serverCount: 0,
                    diskCount: 0,
                    ipCount: 0,
                    sgCount: 0,
                    wasteCount: 0,
                },
                allResources: [],
                resources: [],
                alerts: [],
                alertSummary: {
                    securityAlerts: 0,
                    finopsAlerts: 0,
                    critical: 0,
                    high: 0,
                    warning: 0,
                },
                trendMetrics: {
                    critical: '0%',
                    high: '0%',
                    medium: '0%',
                    warning: '0%',
                },
            }
        });
    }
});

// ============================================================================
// ENDPOINT 3: AI RECOMMENDATIONS - Get AI-powered insights based on alerts
// ============================================================================
app.post('/api/ai-recommendations', async (req, res) => {
    try {
        const { alerts, detailed = false } = req.body;
        
        if (!alerts || !Array.isArray(alerts)) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'alerts array is required'
            });
        }

        console.log(`\n📊 Getting AI recommendations for ${alerts.length} alerts (detailed: ${detailed})...`);
        console.log(`   Groq API Key: ${process.env.GROQ_API_KEY ? '✓ configured' : '✗ missing'}`);
        
        const recommendations = await getAIRecommendations(alerts, detailed);
        
        console.log('✅ AI recommendations generated successfully');
        
        return res.json({
            success: true,
            data: recommendations
        });
    } catch (error: any) {
        console.error('❌ AI recommendations failed:', {
            message: error.message,
            status: error.status,
            code: error.code,
            type: error.type,
            fullError: error
        });
        
        return res.status(500).json({
            error: 'Failed to generate recommendations',
            message: error.message || 'Unknown error',
            details: {
                groqConfigured: !!process.env.GROQ_API_KEY,
                errorType: error.type || error.name
            },
            data: {
                summary: 'Unable to process recommendations at this time',
                recommendations: [
                    'Review all CRITICAL security alerts',
                    'Identify and remove unused resources',
                    'Consider using Reserved Instances for stable workloads'
                ],
                priority: 'HIGH'
            }
        });
    }
});

// ============================================================================
// ENDPOINT 4: SECURITY RECOMMENDATIONS - Focused security analysis
// ============================================================================
app.post('/api/security-recommendations', async (req, res) => {
    try {
        const { alerts } = req.body;
        
        if (!alerts || !Array.isArray(alerts)) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'alerts array is required'
            });
        }

        const securityAlerts = alerts.filter(a => a.type === 'SECURITY');
        
        console.log(`\n🔐 Getting security recommendations for ${securityAlerts.length} alerts...`);
        
        const recommendations = await getSecurityRecommendations(securityAlerts);
        
        console.log('✅ Security recommendations generated successfully');
        
        return res.json({
            success: true,
            data: recommendations
        });
    } catch (error: any) {
        console.error('❌ Security recommendations failed:', error);
        return res.status(500).json({
            error: 'Failed to generate recommendations',
            message: error.message
        });
    }
});

// ============================================================================
// ENDPOINT 5: COST OPTIMIZATION RECOMMENDATIONS
// ============================================================================
app.post('/api/cost-recommendations', async (req, res) => {
    try {
        const { alerts } = req.body;
        
        if (!alerts || !Array.isArray(alerts)) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'alerts array is required'
            });
        }

        const costAlerts = alerts.filter(a => a.type === 'FINOPS');
        
        console.log(`\n💰 Getting cost recommendations for ${costAlerts.length} alerts...`);
        
        const recommendations = await getCostOptimizationRecommendations(costAlerts);
        
        console.log('✅ Cost recommendations generated successfully');
        
        return res.json({
            success: true,
            data: recommendations
        });
    } catch (error: any) {
        console.error('❌ Cost recommendations failed:', error);
        return res.status(500).json({
            error: 'Failed to generate recommendations',
            message: error.message
        });
    }
});

// ========== AI Message Handler - User Questions ==========
app.post('/api/ai-message', async (req, res) => {
    console.log('\n🔔 ENDPOINT HIT: /api/ai-message', { method: 'POST', messageLength: req.body.message?.length || 0 });
    try {
        const { message, alerts, resourceCount, totalCost, chatHistory = [] } = req.body;
        
        if (!message || typeof message !== 'string') {
            console.log('❌ Invalid message:', { message, type: typeof message });
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        console.log(`\n💬 Processing user AI message: "${message.slice(0, 50)}..." (history: ${chatHistory.length} messages)`);

        // Get AI response with optional context AND chat history
        const response = await getUserAIResponse(message, {
            alerts: alerts || [],
            resourceCount: resourceCount,
            totalCost: totalCost,
            chatHistory: chatHistory
        });

        console.log('✅ AI message processed successfully');

        // Log API call for tracking
        const apiCall = new Audit({
            apiCall: {
                endpoint: '/api/ai-message',
                method: 'POST',
                timestamp: new Date(),
                status: 'success'
            }
        });
        
        await apiCall.save();

        return res.json({
            success: true,
            data: {
                response,
                timestamp: new Date()
            }
        });
    } catch (error: any) {
        console.error('❌ AI message processing failed:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to process message',
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// 6. Подключение к MongoDB и запуск сервера
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aws_optimizer')
    .then(() => {
        console.log('✅ MongoDB подключена');
        app.listen(PORT, () => {
            console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Ошибка подключения к MongoDB:', err);
        process.exit(1);
    });