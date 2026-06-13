// FinOps Cost Calculation Tests
// These tests verify the financial impact calculation logic

import {
  EC2_PRICING,
  EBS_PRICE,
  ELASTIC_IP_PRICE,
  HOURS_PER_MONTH,
  calculateEC2Costs,
  calculateEBSCosts,
  calculateElasticIPCosts,
  calculateTotalCosts
} from './finops-calculator';

describe('FinOps Calculator - Cost Computations', () => {
  describe('EC2 Cost Calculation', () => {
    it('should calculate EC2 costs for running instances', () => {
      const instances = [
        { InstanceId: 'i-001', InstanceType: 't3.micro', State: { Name: 'running' } },
        { InstanceId: 'i-002', InstanceType: 't3.micro', State: { Name: 'running' } }
      ];
      
      const cost = calculateEC2Costs(instances);
      
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(100);
    });

    it('should not count stopped instances', () => {
      const instances = [
        { InstanceId: 'i-001', InstanceType: 't3.micro', State: { Name: 'stopped' } },
        { InstanceId: 'i-002', InstanceType: 't3.micro', State: { Name: 'stopped' } }
      ];
      
      const cost = calculateEC2Costs(instances);
      
      expect(cost).toBe(0);
    });

    it('should calculate correct rates for different instance types', () => {
      const microInstances = [
        { InstanceId: 'i-001', InstanceType: 't3.micro', State: { Name: 'running' } }
      ];
      const largeInstances = [
        { InstanceId: 'i-002', InstanceType: 't3.large', State: { Name: 'running' } }
      ];
      
      const microCost = calculateEC2Costs(microInstances);
      const largeCost = calculateEC2Costs(largeInstances);
      
      expect(largeCost).toBeGreaterThan(microCost);
    });
  });

  describe('EBS Cost Calculation', () => {
    it('should calculate EBS costs based on volume size', () => {
      const volumes = [
        { VolumeId: 'vol-001', Size: 100, State: 'available' },
        { VolumeId: 'vol-002', Size: 50, State: 'available' }
      ];
      
      const cost = calculateEBSCosts(volumes);
      
      expect(cost).toBeCloseTo(15, 1); // 150GB * $0.10 = $15
    });

    it('should handle large volume sizes', () => {
      const volumes = [
        { VolumeId: 'vol-001', Size: 1000, State: 'available' },
        { VolumeId: 'vol-002', Size: 500, State: 'available' }
      ];
      
      const cost = calculateEBSCosts(volumes);
      
      expect(cost).toBeCloseTo(150, 1); // 1500GB * $0.10 = $150
    });
  });

  describe('Elastic IP Cost Calculation', () => {
    it('should calculate costs for unassociated IPs', () => {
      const ips = [
        { PublicIp: '1.2.3.4', AssociationId: undefined },
        { PublicIp: '1.2.3.5', AssociationId: 'assoc-001' }
      ];
      
      const cost = calculateElasticIPCosts(ips);
      
      expect(cost).toBeGreaterThan(0);
    });

    it('should not charge for associated IPs', () => {
      const ips = [
        { PublicIp: '1.2.3.4', AssociationId: 'assoc-001' },
        { PublicIp: '1.2.3.5', AssociationId: 'assoc-002' }
      ];
      
      const cost = calculateElasticIPCosts(ips);
      
      expect(cost).toBe(0);
    });

    it('should calculate multiple unassociated IPs correctly', () => {
      const ips = [
        { PublicIp: '1.2.3.4', AssociationId: undefined },
        { PublicIp: '1.2.3.5', AssociationId: undefined },
        { PublicIp: '1.2.3.6', AssociationId: undefined }
      ];
      
      const cost = calculateElasticIPCosts(ips);
      
      expect(cost).toBeCloseTo(3 * (ELASTIC_IP_PRICE * HOURS_PER_MONTH), 1);
    });
  });

  describe('Total Cost Aggregation', () => {
    it('should sum all cost categories', () => {
      const instances = [
        { InstanceId: 'i-001', InstanceType: 't3.micro', State: { Name: 'running' } }
      ];
      const volumes = [
        { VolumeId: 'vol-001', Size: 100 },
        { VolumeId: 'vol-002', Size: 50 }
      ];
      const ips = [
        { PublicIp: '1.2.3.4', AssociationId: undefined }
      ];

      const result = calculateTotalCosts(instances, volumes, ips);

      expect(result.totalMonthly).toBe(result.ec2Cost + result.ebsCost + result.ipCost);
      expect(result.totalMonthly).toBeGreaterThan(0);
    });

    it('should handle realistic cost scenario', () => {
      const instances = [
        { InstanceId: 'i-001', InstanceType: 't3.micro', State: { Name: 'running' } },
        { InstanceId: 'i-002', InstanceType: 't3.large', State: { Name: 'running' } }
      ];
      
      const volumes = [
        { VolumeId: 'vol-001', Size: 250 },
        { VolumeId: 'vol-002', Size: 100 }
      ];
      
      const ips = [
        { PublicIp: '1.2.3.4', AssociationId: undefined }
      ];
      
      const result = calculateTotalCosts(instances, volumes, ips);
      
      expect(result.totalMonthly).toBeGreaterThan(0);
      expect(result.ebsCost).toBeCloseTo(35, 1); // 350GB * $0.10
    });
  });
});

