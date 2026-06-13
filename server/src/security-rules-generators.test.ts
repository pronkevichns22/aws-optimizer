// ============================================================================
// SECURITY RULES GENERATOR FUNCTIONS TESTS
// Tests for alert generation and security rule functions
// ============================================================================

import {
  generateMFAEnforcementAlerts,
  generateRootAccountUsageAlerts,
  generateVPCFlowLogsAlerts,
  generateCloudTrailValidationAlerts,
  generateNACLRestrictiveAlerts,
  generateIAMKeyRotationAlerts,
  generatePublicRDSAlerts,
  generateS3PublicAccessBlockAlerts,
  generateEBSEncryptionDefaultAlerts,
  generateUnusedLoadBalancersAlerts,
  generateMissingTagsAlerts,
  generateDefaultVPCAlerts,
  generateIAMPolicyPermissiveAlerts,
  generateRootAccountAlarmAlerts,
} from './security-rules';
import { Instance, Volume, SecurityGroup } from '@aws-sdk/client-ec2';

describe('Security Rules - Alert Generators', () => {
  describe('MFA Enforcement Alerts', () => {
    it('should generate alert when instances exist', () => {
      const instances: Instance[] = [
        { InstanceId: 'i-123', State: { Name: 'running' } },
      ];
      
      const alerts = generateMFAEnforcementAlerts(instances);
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('HIGH');
      expect(alerts[0].type).toBe('SECURITY');
    });

    it('should not generate alert for empty instances', () => {
      const instances: Instance[] = [];
      
      const alerts = generateMFAEnforcementAlerts(instances);
      
      expect(alerts).toHaveLength(0);
    });

    it('should include proper alert structure', () => {
      const instances: Instance[] = [{ InstanceId: 'i-123' }];
      const alerts = generateMFAEnforcementAlerts(instances);
      
      if (alerts.length > 0) {
        expect(alerts[0]).toHaveProperty('id');
        expect(alerts[0]).toHaveProperty('type');
        expect(alerts[0]).toHaveProperty('severity');
        expect(alerts[0]).toHaveProperty('title');
        expect(alerts[0]).toHaveProperty('description');
      }
    });
  });

  describe('Root Account Usage Alerts', () => {
    it('should always generate root account alert', () => {
      const alerts = generateRootAccountUsageAlerts();
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('CRITICAL');
    });

    it('should include root account details', () => {
      const alerts = generateRootAccountUsageAlerts();
      
      expect(alerts[0].title).toContain('Root');
      expect(alerts[0].ruleId).toContain('root');
    });

    it('should flag as CRITICAL severity', () => {
      const alerts = generateRootAccountUsageAlerts();
      
      expect(alerts[0].severity).toBe('CRITICAL');
    });
  });

  describe('VPC Flow Logs Alerts', () => {
    it('should generate alert for instances', () => {
      const instances: Instance[] = [
        { InstanceId: 'i-123' },
        { InstanceId: 'i-456' },
      ];
      
      const alerts = generateVPCFlowLogsAlerts(instances);
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('HIGH');
    });

    it('should include instance count in metadata', () => {
      const instances: Instance[] = [
        { InstanceId: 'i-1' },
        { InstanceId: 'i-2' },
      ];
      
      const alerts = generateVPCFlowLogsAlerts(instances);
      
      if (alerts.length > 0) {
        expect(alerts[0].metadata?.instances).toBe(2);
      }
    });
  });

  describe('CloudTrail Validation Alerts', () => {
    it('should generate CloudTrail alert', () => {
      const alerts = generateCloudTrailValidationAlerts();
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('HIGH');
    });

    it('should include CloudTrail configuration details', () => {
      const alerts = generateCloudTrailValidationAlerts();
      
      expect(alerts[0].title).toContain('CloudTrail');
      expect(alerts[0].title).toContain('Log File Validation');
    });
  });

  describe('NACL Restrictive Alerts', () => {
    it('should detect permissive security groups', () => {
      const securityGroups: SecurityGroup[] = [
        {
          GroupId: 'sg-123',
          GroupName: 'web-sg',
          IpPermissions: [
            {
              FromPort: 22,
              ToPort: 22,
              IpRanges: [{ CidrIp: '0.0.0.0/0' }],
            },
          ],
        },
      ];
      
      const alerts = generateNACLRestrictiveAlerts(securityGroups);
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('CRITICAL');
    });

    it('should not flag restrictive security groups', () => {
      const securityGroups: SecurityGroup[] = [
        {
          GroupId: 'sg-123',
          GroupName: 'restricted-sg',
          IpPermissions: [
            {
              FromPort: 22,
              ToPort: 22,
              IpRanges: [{ CidrIp: '10.0.0.0/8' }],
            },
          ],
        },
      ];
      
      const alerts = generateNACLRestrictiveAlerts(securityGroups);
      
      expect(alerts).toHaveLength(0);
    });

    it('should flag RDP port exposure', () => {
      const securityGroups: SecurityGroup[] = [
        {
          GroupId: 'sg-123',
          IpPermissions: [
            {
              FromPort: 3389,
              ToPort: 3389,
              IpRanges: [{ CidrIp: '0.0.0.0/0' }],
            },
          ],
        },
      ];
      
      const alerts = generateNACLRestrictiveAlerts(securityGroups);
      
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  describe('IAM Key Rotation Alerts', () => {
    it('should generate IAM key rotation alert', () => {
      const alerts = generateIAMKeyRotationAlerts();
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('HIGH');
    });

    it('should include 90-day rotation recommendation', () => {
      const alerts = generateIAMKeyRotationAlerts();
      
      expect(alerts[0].title).toContain('90 days');
    });
  });

  describe('Public RDS Alerts', () => {
    it('should generate public RDS alert', () => {
      const alerts = generatePublicRDSAlerts();
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('CRITICAL');
    });

    it('should flag as CRITICAL risk', () => {
      const alerts = generatePublicRDSAlerts();
      
      expect(alerts[0].severity).toBe('CRITICAL');
      expect(alerts[0].metadata?.dataExposureRisk).toBe('HIGH');
    });
  });

  describe('S3 Public Access Block Alerts', () => {
    it('should generate S3 public access alert', () => {
      const alerts = generateS3PublicAccessBlockAlerts();
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('HIGH');
    });

    it('should include Block All Public Access recommendation', () => {
      const alerts = generateS3PublicAccessBlockAlerts();
      
      expect(alerts[0].title).toContain('S3 Public Access Block');
    });
  });

  describe('EBS Encryption Default Alerts', () => {
    it('should generate alert for unencrypted volumes', () => {
      const volumes: Volume[] = [
        { VolumeId: 'vol-123', Encrypted: false, Size: 100 },
        { VolumeId: 'vol-456', Encrypted: false, Size: 50 },
      ];
      
      const alerts = generateEBSEncryptionDefaultAlerts(volumes);
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('HIGH');
    });

    it('should not generate alert when all volumes encrypted', () => {
      const volumes: Volume[] = [
        { VolumeId: 'vol-123', Encrypted: true },
        { VolumeId: 'vol-456', Encrypted: true },
      ];
      
      const alerts = generateEBSEncryptionDefaultAlerts(volumes);
      
      expect(alerts).toHaveLength(0);
    });

    it('should include unencrypted volume count', () => {
      const volumes: Volume[] = [
        { VolumeId: 'vol-1', Encrypted: false },
        { VolumeId: 'vol-2', Encrypted: false },
        { VolumeId: 'vol-3', Encrypted: true },
      ];
      
      const alerts = generateEBSEncryptionDefaultAlerts(volumes);
      
      if (alerts.length > 0) {
        expect(alerts[0].metadata?.unencryptedVolumes).toBe(2);
      }
    });
  });

  describe('Unused Load Balancers Alerts', () => {
    it('should generate unused ELB alert', () => {
      const alerts = generateUnusedLoadBalancersAlerts();
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('FINOPS');
    });

    it('should flag as MEDIUM severity for FinOps', () => {
      const alerts = generateUnusedLoadBalancersAlerts();
      
      expect(alerts[0].severity).toBe('MEDIUM');
      expect(alerts[0].type).toBe('FINOPS');
    });
  });

  describe('Missing Tags Alerts', () => {
    it('should detect untagged instances', () => {
      const instances: Instance[] = [
        { InstanceId: 'i-1', Tags: [] },
        { InstanceId: 'i-2', Tags: [{ Key: 'Name', Value: 'tagged' }] },
      ];
      
      const alerts = generateMissingTagsAlerts(instances);
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].title).toContain('Missing');
    });

    it('should include untagged count in title', () => {
      const instances: Instance[] = [
        { InstanceId: 'i-1', Tags: [] },
        { InstanceId: 'i-2', Tags: [] },
      ];
      
      const alerts = generateMissingTagsAlerts(instances);
      
      if (alerts.length > 0) {
        expect(alerts[0].metadata?.count).toBe(2);
      }
    });
  });

  describe('Default VPC Alerts', () => {
    it('should generate default VPC alert', () => {
      const alerts = generateDefaultVPCAlerts();
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('MEDIUM');
    });

    it('should recommend custom VPC creation', () => {
      const alerts = generateDefaultVPCAlerts();
      
      expect(alerts[0].title).toContain('Default VPC');
      expect(alerts[0].description).toContain('custom');
    });
  });

  describe('IAM Inline Policies Alerts', () => {
    it('should generate inline policy alert', () => {
      const alerts = generateIAMPolicyPermissiveAlerts();
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('HIGH');
    });

    it('should recommend managed policies', () => {
      const alerts = generateIAMPolicyPermissiveAlerts();
      
      expect(alerts[0].title).toContain('Inline');
      expect(alerts[0].description).toContain('managed');
    });
  });

  describe('Root Account Alarm Alerts', () => {
    it('should generate CloudWatch alarm alert', () => {
      const alerts = generateRootAccountAlarmAlerts();
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('HIGH');
    });

    it('should include CloudTrail configuration', () => {
      const alerts = generateRootAccountAlarmAlerts();
      
      expect(alerts[0].title).toContain('CloudWatch');
      expect(alerts[0].description).toContain('CloudWatch');
    });
  });

  describe('Alert Structure Validation', () => {
    it('should have required fields in all alerts', () => {
      const alerts = generateRootAccountUsageAlerts();
      
      alerts.forEach(alert => {
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('title');
        expect(alert).toHaveProperty('description');
        expect(alert).toHaveProperty('resourceId');
        expect(alert).toHaveProperty('ruleId');
        expect(alert).toHaveProperty('timestamp');
      });
    });

    it('should have valid severity levels', () => {
      const alerts = generateRootAccountUsageAlerts();
      const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'WARNING', 'INFO'];
      
      alerts.forEach(alert => {
        expect(validSeverities).toContain(alert.severity);
      });
    });

    it('should have valid alert types', () => {
      const securityAlerts = generateRootAccountUsageAlerts();
      const finopsAlerts = generateUnusedLoadBalancersAlerts();
      const validTypes = ['SECURITY', 'FINOPS'];
      
      [...securityAlerts, ...finopsAlerts].forEach(alert => {
        expect(validTypes).toContain(alert.type);
      });
    });
  });
});
