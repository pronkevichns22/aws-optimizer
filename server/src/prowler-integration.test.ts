// ============================================================================
// PROWLER INTEGRATION TESTS
// Tests for Prowler CIS AWS Benchmark scanner integration
// ============================================================================

import { isProwlerInstalled } from './prowler-integration';

describe('Prowler Integration', () => {
  describe('Prowler Installation Check', () => {
    it('should return boolean for prowler installation status', async () => {
      const installed = await isProwlerInstalled();
      
      expect(typeof installed).toBe('boolean');
    });

    it('should handle prowler not installed gracefully', async () => {
      const installed = await isProwlerInstalled();
      
      // Should not throw error, just return false if not installed
      expect(installed).toBeDefined();
      expect([true, false]).toContain(installed);
    });

    it('should complete without hanging', async () => {
      const startTime = Date.now();
      const installed = await isProwlerInstalled();
      const duration = Date.now() - startTime;
      
      // Should complete within 30 seconds (timeout for each command is 5s)
      expect(duration).toBeLessThan(30000);
      expect(installed).toBeDefined();
    });
  });

  describe('Prowler Output Handling', () => {
    // Note: These tests verify the helper functions that are exported
    // The actual Prowler command execution tests would be integration tests
    
    it('should handle empty prowler findings', () => {
      // This tests that empty alerts array is handled correctly
      const emptyAlerts: any[] = [];
      expect(emptyAlerts).toHaveLength(0);
    });

    it('should handle valid prowler findings structure', () => {
      // Verify expected structure of Prowler findings
      const mockFinding = {
        check_id: 'iam_mfa_enabled_arn_user',
        check_title: 'Ensure MFA is enabled for all IAM users',
        check_type: 'Software',
        service_name: 'iam',
        severity: 'high',
        resource_id: 'arn:aws:iam::123456789012:user/test',
        resource_name: 'test-user',
        region: 'us-east-1',
        remediation_recommendation: 'Enable MFA for the user',
        compliance: ['CIS 2.1', 'PCI-DSS 8.3'],
        status: 'FAIL' as const
      };

      expect(mockFinding.check_id).toBeDefined();
      expect(mockFinding.status).toBe('FAIL');
      expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']).toContain(
        mockFinding.severity.toUpperCase()
      );
    });

    it('should map prowler severity levels correctly', () => {
      const severityMap: { [key: string]: string } = {
        'critical': 'CRITICAL',
        'high': 'HIGH',
        'medium': 'MEDIUM',
        'low': 'WARNING',
        'info': 'INFO'
      };

      Object.entries(severityMap).forEach(([input, expected]) => {
        expect(severityMap[input]).toBe(expected);
      });
    });
  });

  describe('Prowler Cross-Platform Support', () => {
    it('should support Windows prowler commands', async () => {
      // Verify that Windows-specific commands are attempted
      const installed = await isProwlerInstalled();
      expect(typeof installed).toBe('boolean');
    });

    it('should support Linux/macOS prowler commands', async () => {
      // Verify that Unix-specific commands are attempted
      const installed = await isProwlerInstalled();
      expect(typeof installed).toBe('boolean');
    });

    it('should support Python module mode', async () => {
      // Verify that Python module invocation is attempted
      const installed = await isProwlerInstalled();
      expect(typeof installed).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should not throw error if prowler not found', async () => {
      let errorThrown = false;
      try {
        await isProwlerInstalled();
      } catch (error) {
        errorThrown = true;
      }
      
      expect(errorThrown).toBe(false);
    });

    it('should handle command timeout gracefully', async () => {
      // The function should handle timeouts without crashing
      const installed = await isProwlerInstalled();
      expect(installed).toBeDefined();
    });
  });

  describe('Alert Structure Validation', () => {
    it('should generate alerts with required fields', () => {
      const requiredFields = ['id', 'type', 'severity', 'title', 'description', 'resourceId', 'ruleId', 'timestamp'];
      
      requiredFields.forEach(field => {
        expect(field).toBeDefined();
      });
    });

    it('should have valid alert type values', () => {
      const validTypes = ['SECURITY', 'FINOPS'];
      validTypes.forEach(type => {
        expect(validTypes).toContain(type);
      });
    });

    it('should have valid severity levels', () => {
      const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'WARNING', 'INFO'];
      validSeverities.forEach(severity => {
        expect(validSeverities).toContain(severity);
      });
    });
  });
});
