// ============================================================================
// Security Rules Engine Unit Tests
// Tests for detecting and validating security misconfigurations
// ============================================================================

import {
  detectSSHExposure,
  findUnencryptedVolumes,
  findOrphanedVolumes,
  findUnusedSecurityGroups,
  findUnassociatedIPs,
  deduplicateAlerts,
  classifyAlertSeverity
} from './security-rules';

describe('Security Rules Engine - Detection Logic', () => {
  // Rule 1.1: SSH Exposure Detection
  describe('Rule 1.1: SSH Exposure (0.0.0.0/0)', () => {
    it('should detect SSH exposed to world', () => {
      const sgs = [{
        GroupId: 'sg-001',
        IpPermissions: [{
          FromPort: 22,
          ToPort: 22,
          IpRanges: [{ CidrIp: '0.0.0.0/0', Description: 'SSH' }]
        }]
      }];
      
      const exposed = detectSSHExposure(sgs as any);
      expect(exposed).toHaveLength(1);
      expect(exposed[0].GroupId).toBe('sg-001');
    });

    it('should not flag restricted SSH access', () => {
      const sgs = [{
        GroupId: 'sg-002',
        IpPermissions: [{
          FromPort: 22,
          ToPort: 22,
          IpRanges: [{ CidrIp: '10.0.0.0/8', Description: 'Internal' }]
        }]
      }];
      
      const exposed = detectSSHExposure(sgs as any);
      expect(exposed).toHaveLength(0);
    });
  });

  // Rule 2.1: EBS Encryption Detection
  describe('Rule 2.1: EBS Encryption Status', () => {
    it('should identify unencrypted volumes', () => {
      const volumes = [
        { VolumeId: 'vol-001', Encrypted: false, Size: 100 },
        { VolumeId: 'vol-002', Encrypted: true, Size: 50 },
        { VolumeId: 'vol-003', Encrypted: false, Size: 200 }
      ];
      
      const unencrypted = findUnencryptedVolumes(volumes as any);
      expect(unencrypted).toHaveLength(2);
      expect(unencrypted.map(v => v.VolumeId)).toEqual(['vol-001', 'vol-003']);
    });

    it('should return empty array when all volumes encrypted', () => {
      const volumes = [
        { VolumeId: 'vol-001', Encrypted: true },
        { VolumeId: 'vol-002', Encrypted: true }
      ];
      
      const unencrypted = findUnencryptedVolumes(volumes as any);
      expect(unencrypted).toHaveLength(0);
    });
  });

  // Rule 2.3: EBS Utilization (Orphaned Volumes)
  describe('Rule 2.3: EBS Utilization - Orphaned Volumes', () => {
    it('should identify orphaned EBS volumes', () => {
      const volumes = [
        { VolumeId: 'vol-001', Attachments: [], State: 'available', Size: 250 },
        { VolumeId: 'vol-002', Attachments: [{ InstanceId: 'i-123' }], State: 'in-use' },
        { VolumeId: 'vol-003', Attachments: [], State: 'available', Size: 100 }
      ];
      
      const orphaned = findOrphanedVolumes(volumes as any);
      expect(orphaned).toHaveLength(2);
      expect(orphaned[0].VolumeId).toBe('vol-001');
    });

    it('should calculate total wasted storage', () => {
      const volumes = [
        { VolumeId: 'vol-001', Attachments: [], State: 'available', Size: 250 },
        { VolumeId: 'vol-002', Attachments: [{ InstanceId: 'i-123' }], State: 'in-use', Size: 100 },
        { VolumeId: 'vol-003', Attachments: [], State: 'available', Size: 100 }
      ];
      
      const orphaned = findOrphanedVolumes(volumes as any);
      const totalWaste = orphaned.reduce((sum, v) => sum + (v.Size || 0), 0);
      
      expect(totalWaste).toBe(350); // 250 + 100
    });
  });

  // Rule 3.1: Security Group Usage
  describe('Rule 3.1: Security Group Usage', () => {
    it('should identify unused security groups', () => {
      const sgs = [
        { GroupId: 'sg-001', GroupName: 'web-sg', IpPermissions: [] },
        { GroupId: 'sg-002', GroupName: 'db-sg', IpPermissions: [{ FromPort: 3306 }] },
        { GroupId: 'sg-003', GroupName: 'unused-sg', IpPermissions: [] }
      ];
      
      const unused = findUnusedSecurityGroups(sgs as any);
      expect(unused.length).toBeGreaterThanOrEqual(2);
    });
  });

  // Rule 4.1: Elastic IP Usage
  describe('Rule 4.1: Elastic IP Utilization', () => {
    it('should identify unassociated Elastic IPs', () => {
      const ips = [
        { PublicIp: '1.2.3.4', AssociationId: undefined },
        { PublicIp: '1.2.3.5', AssociationId: 'eipassoc-123' },
        { PublicIp: '1.2.3.6', AssociationId: null }
      ];
      
      const unassociated = findUnassociatedIPs(ips as any);
      expect(unassociated).toHaveLength(2);
    });

    it('should not flag associated IPs', () => {
      const ips = [
        { PublicIp: '1.2.3.4', AssociationId: 'eipassoc-123' },
        { PublicIp: '1.2.3.5', AssociationId: 'eipassoc-456' }
      ];
      
      const unassociated = findUnassociatedIPs(ips as any);
      expect(unassociated).toHaveLength(0);
    });
  });

  // Alert Deduplication
  describe('Alert Deduplication Logic', () => {
    it('should remove duplicate alerts', () => {
      const alerts = [
        { RuleId: 'R1', ResourceId: 'vol-001', Severity: 'HIGH' },
        { RuleId: 'R1', ResourceId: 'vol-001', Severity: 'HIGH' },
        { RuleId: 'R1', ResourceId: 'vol-002', Severity: 'HIGH' },
        { RuleId: 'R2', ResourceId: 'sg-001', Severity: 'MEDIUM' }
      ];
      
      const deduplicated = deduplicateAlerts(alerts);
      expect(deduplicated).toHaveLength(3);
    });

    it('should preserve unique alerts', () => {
      const alerts = [
        { RuleId: 'R1', ResourceId: 'vol-001', Severity: 'CRITICAL' },
        { RuleId: 'R1', ResourceId: 'vol-002', Severity: 'HIGH' }
      ];
      
      const deduplicated = deduplicateAlerts(alerts);
      expect(deduplicated).toHaveLength(2);
    });
  });

  // Alert Severity Classification
  describe('Alert Severity Classification', () => {
    it('should classify SSH exposure as CRITICAL', () => {
      const severity = classifyAlertSeverity('SSH-exposure', 1);
      expect(severity).toBe('CRITICAL');
    });

    it('should classify encryption issues as HIGH', () => {
      const severity = classifyAlertSeverity('EBS-encryption', 50);
      expect(severity).toBe('HIGH');
    });

    it('should classify high count issues as HIGH', () => {
      const severity = classifyAlertSeverity('utilization', 250);
      expect(severity).toBe('HIGH');
    });
  });
});

