// ============================================================================
// FILE: finops-calculator.ts
// PURPOSE: FinOps cost calculation and analysis for AWS resources
// INCLUDES: EC2, EBS, Elastic IP cost calculations and aggregation
// ============================================================================

// Pricing configuration
export const EC2_PRICING: Record<string, number> = {
  't3.micro': 0.0104,
  't3.small': 0.0208,
  't3.medium': 0.0416,
  't3.large': 0.0832,
  't3.xlarge': 0.1664,
  't3.2xlarge': 0.3328,
};

export const EBS_PRICE = 0.10; // per GB per month
export const ELASTIC_IP_PRICE = 0.005; // per hour
export const HOURS_PER_MONTH = 730;

/**
 * Calculate monthly costs for running EC2 instances
 * @param instances Array of EC2 instances
 * @returns Monthly cost in USD
 */
export function calculateEC2Costs(instances: any[]): number {
  return instances
    .filter(inst => inst.State?.Name === 'running')
    .reduce((sum, inst) => {
      const hourlyRate = EC2_PRICING[inst.InstanceType] || 0.05;
      return sum + (hourlyRate * HOURS_PER_MONTH);
    }, 0);
}

/**
 * Calculate monthly costs for EBS volumes
 * @param volumes Array of EBS volumes
 * @returns Monthly cost in USD
 */
export function calculateEBSCosts(volumes: any[]): number {
  return volumes
    .reduce((sum, vol) => sum + (vol.Size * EBS_PRICE), 0);
}

/**
 * Calculate monthly costs for unassociated Elastic IPs
 * @param ips Array of Elastic IP addresses
 * @returns Monthly cost in USD
 */
export function calculateElasticIPCosts(ips: any[]): number {
  return ips
    .filter(ip => !ip.AssociationId)
    .length * (ELASTIC_IP_PRICE * HOURS_PER_MONTH);
}

/**
 * Calculate total monthly AWS costs across all resource types
 * @param instances EC2 instances
 * @param volumes EBS volumes
 * @param ips Elastic IP addresses
 * @returns Object with cost breakdown and total
 */
export function calculateTotalCosts(instances: any[], volumes: any[], ips: any[]) {
  const ec2Cost = calculateEC2Costs(instances);
  const ebsCost = calculateEBSCosts(volumes);
  const ipCost = calculateElasticIPCosts(ips);

  return {
    ec2Cost,
    ebsCost,
    ipCost,
    totalMonthly: ec2Cost + ebsCost + ipCost
  };
}
