// ============================================================================
// FILE: knowledge-base.ts
// LOCATION: server/src/
// PURPOSE: AWS Knowledge Base for RAG (Retrieval Augmented Generation)
// Contains AWS best practices, security recommendations, and optimization tips
// ============================================================================

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: 'SECURITY' | 'FINOPS' | 'OPTIMIZATION' | 'BEST_PRACTICE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  content: string;
  tags: string[];
  source: string; // CIS, AWS Well-Architected, AWS Best Practices, etc.
  relatedServices: string[]; // EC2, S3, IAM, RDS, etc.
}

export const KNOWLEDGE_BASE: KnowledgeDocument[] = [
  // ======================== SECURITY - MFA ========================
  {
    id: 'sec-mfa-001',
    title: 'Enable MFA on AWS Account',
    category: 'SECURITY',
    severity: 'CRITICAL',
    content: `Multi-Factor Authentication (MFA) should be enabled on all AWS accounts.
    
Best Practice:
- Enable virtual MFA device (Google Authenticator, Authy, Microsoft Authenticator)
- Enable hardware MFA key for root account
- Enforce MFA for all IAM users with console access
- Enforce MFA for programmatic access via AWS SDK

Steps to Enable MFA:
1. Navigate to AWS IAM console
2. Go to Users → Select user
3. Click "Security credentials" tab
4. In "Assigned MFA device" section, click "Manage"
5. Choose device type (Virtual or Hardware)
6. Complete setup process

AWS CLI Command:
aws iam enable-mfa-device --user-name <username> --serial-number <mfa-serial> --authentication-code1 <code1> --authentication-code2 <code2>

Impact: Prevents unauthorized access even if password is compromised
Compliance: CIS 2.1, AWS Well-Architected Security Pillar`,
    tags: ['mfa', 'authentication', 'access-control', 'security-best-practice'],
    source: 'CIS AWS Foundations Benchmark 2.x',
    relatedServices: ['IAM'],
  },

  // ======================== SECURITY - Root Account ========================
  {
    id: 'sec-root-001',
    title: 'Avoid Using Root Account for Daily Operations',
    category: 'SECURITY',
    severity: 'CRITICAL',
    content: `The AWS root account has unrestricted access to all resources. Using it for daily tasks is a security risk.

Best Practice:
- Create separate IAM admin user instead of using root
- Never share root account credentials
- Lock root account when not in use
- Use root account ONLY for account recovery and root-level operations
- Enforce MFA on root account

Why Root Account is Dangerous:
- If credentials are compromised, attacker has full control
- No audit trail of root account actions
- Cannot revoke or restrict root account permissions
- AWS cannot help if root account is hijacked

Safe Alternative - Create IAM Admin User:
1. Create new IAM user with AdministratorAccess policy
2. Enable MFA on this user
3. Use this user for daily AWS operations

AWS CLI - Create Admin User:
aws iam create-user --user-name aws-admin
aws iam attach-user-policy --user-name aws-admin --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
aws iam create-access-key --user-name aws-admin

CloudTrail Monitoring:
Enable CloudTrail to log all root account API calls and alert if used.

Impact: Significantly reduces security risk and improves auditability
Compliance: CIS 2.2, AWS Well-Architected Security Pillar`,
    tags: ['root-account', 'access-control', 'security', 'best-practice'],
    source: 'CIS AWS Foundations Benchmark 2.x',
    relatedServices: ['IAM', 'CloudTrail'],
  },

  // ======================== SECURITY - SSH Keys ========================
  {
    id: 'sec-keys-001',
    title: 'Rotate IAM Access Keys Regularly',
    category: 'SECURITY',
    severity: 'HIGH',
    content: `AWS IAM access keys should be rotated at least every 90 days to minimize risk if compromised.

Best Practice:
- Rotate access keys every 90 days or less
- Remove unused access keys immediately
- Monitor access key usage with CloudTrail
- Never commit access keys to version control
- Use temporary security credentials when possible (STS tokens)

AWS CLI - Rotate Access Keys:
# 1. Create new access key
aws iam create-access-key --user-name <username>

# 2. Update applications with new key
# 3. Monitor old key usage
aws iam get-access-key-last-used --access-key-id <old-key-id>

# 4. After confirmed no usage, delete old key
aws iam delete-access-key --access-key-id <old-key-id> --user-name <username>

CloudTrail Monitoring:
Set up alerts for:
- Access keys older than 90 days
- Unused access keys
- Suspicious API calls from old keys

Alternative - Use AWS Temporary Credentials:
Instead of long-lived access keys, use AWS STS (Security Token Service) for temporary credentials:
aws sts assume-role --role-arn arn:aws:iam::ACCOUNT_ID:role/RoleName --role-session-name session-name

Impact: Reduces window of exposure if keys are compromised
Compliance: CIS 1.20, AWS Well-Architected Security Pillar`,
    tags: ['access-keys', 'rotation', 'security', 'iam'],
    source: 'CIS AWS Foundations Benchmark 1.x',
    relatedServices: ['IAM', 'CloudTrail'],
  },

  // ======================== SECURITY - VPC Flow Logs ========================
  {
    id: 'sec-vpc-001',
    title: 'Enable VPC Flow Logs for Network Monitoring',
    category: 'SECURITY',
    severity: 'HIGH',
    content: `VPC Flow Logs capture information about the IP traffic going to and from network interfaces in your VPC.

Best Practice:
- Enable VPC Flow Logs for all VPCs
- Send logs to CloudWatch Logs or S3
- Analyze logs for unauthorized access attempts
- Set up alerts for suspicious traffic patterns

AWS CLI - Enable VPC Flow Logs:
# Get VPC ID
aws ec2 describe-vpcs --query 'Vpcs[0].VpcId' --output text

# Create IAM role for VPC Flow Logs
aws iam create-role --role-name vpc-flow-logs-role \\
  --assume-role-policy-document file://trust-policy.json

# Attach permissions
aws iam put-role-policy --role-name vpc-flow-logs-role \\
  --policy-name vpc-flow-logs-policy \\
  --policy-document file://policy.json

# Create CloudWatch log group
aws logs create-log-group --log-group-name /aws/vpc/flowlogs

# Enable VPC Flow Logs
aws ec2 create-flow-logs \\
  --resource-type VPC \\
  --resource-ids <vpc-id> \\
  --traffic-type ALL \\
  --log-destination-type cloud-watch-logs \\
  --log-group-name /aws/vpc/flowlogs \\
  --deliver-logs-permission-iam-role-arn arn:aws:iam::ACCOUNT_ID:role/vpc-flow-logs-role

Analyzing VPC Flow Logs:
# Query CloudWatch Logs Insights
fields @timestamp, srcAddr, dstAddr, action \\
| filter action = "REJECT" \\
| stats count() as reject_count by srcAddr

Impact: Enables network forensics and anomaly detection
Compliance: CIS 4.1, AWS Well-Architected Security Pillar`,
    tags: ['vpc', 'flow-logs', 'network', 'monitoring'],
    source: 'CIS AWS Foundations Benchmark 4.x',
    relatedServices: ['VPC', 'CloudWatch'],
  },

  // ======================== SECURITY - CloudTrail ========================
  {
    id: 'sec-cloudtrail-001',
    title: 'Enable CloudTrail for API Auditing',
    category: 'SECURITY',
    severity: 'CRITICAL',
    content: `CloudTrail logs all API calls made within your AWS account, providing accountability and forensic capabilities.

Best Practice:
- Enable CloudTrail for all regions
- Enable log file validation
- Send logs to S3 with encryption
- Set up log aggregation in CloudWatch
- Enable MFA delete protection on S3 bucket

AWS CLI - Enable CloudTrail:
# Create S3 bucket for CloudTrail logs
aws s3 mb s3://my-cloudtrail-logs-<account-id>

# Create bucket policy
aws s3api put-bucket-policy --bucket my-cloudtrail-logs-<account-id> \\
  --policy file://cloudtrail-bucket-policy.json

# Enable CloudTrail
aws cloudtrail create-trail \\
  --name my-trail \\
  --s3-bucket-name my-cloudtrail-logs-<account-id> \\
  --is-multi-region-trail \\
  --include-global-service-events \\
  --enable-log-file-validation

# Start logging
aws cloudtrail start-logging --trail-name my-trail

# Enable CloudTrail for all management events
aws cloudtrail put-event-selectors \\
  --trail-name my-trail \\
  --event-selectors ReadWriteType=All,IncludeManagementEvents=true

Querying CloudTrail Logs:
# Use AWS Athena to query CloudTrail logs in S3
SELECT userIdentity.principalId, eventName, sourceIPAddress, eventTime
FROM cloudtrail_logs
WHERE eventName = 'RunInstances'
ORDER BY eventTime DESC

Alert on Suspicious Activity:
- Unauthorized API calls
- Root account usage
- Policy changes
- Resource deletions

Impact: Provides comprehensive audit trail of all AWS API activity
Compliance: CIS 2.2, CIS 4.2, AWS Well-Architected Security Pillar`,
    tags: ['cloudtrail', 'auditing', 'logging', 'compliance'],
    source: 'CIS AWS Foundations Benchmark 2.x, 4.x',
    relatedServices: ['CloudTrail', 'S3', 'Athena'],
  },

  // ======================== SECURITY - Security Groups ========================
  {
    id: 'sec-sg-001',
    title: 'Restrict Security Group Inbound Rules',
    category: 'SECURITY',
    severity: 'CRITICAL',
    content: `Security groups act as virtual firewalls. Unrestricted inbound rules (0.0.0.0/0) expose resources to internet attacks.

Best Practice:
- Restrict SSH (port 22) to specific IP ranges
- Restrict RDP (port 3389) to specific IP ranges
- Restrict database ports to internal security groups only
- Use 0.0.0.0/0 ONLY for HTTP/HTTPS (ports 80, 443) if needed
- Use security groups instead of NACL for stateful filtering

Dangerous Rules - AVOID:
- 0.0.0.0/0 on port 22 (SSH) - allows world SSH access
- 0.0.0.0/0 on port 3389 (RDP) - allows world RDP access
- 0.0.0.0/0 on port 1433 (SQL Server) - exposes database
- 0.0.0.0/0 on port 5432 (PostgreSQL) - exposes database

AWS CLI - Fix Security Group:
# 1. ADD restricted SSH rule (from specific IP)
aws ec2 authorize-security-group-ingress \\
  --group-id sg-12345678 \\
  --protocol tcp \\
  --port 22 \\
  --cidr 203.0.113.0/24  # Your office IP range

# 2. REVOKE unrestricted rule
aws ec2 revoke-security-group-ingress \\
  --group-id sg-12345678 \\
  --protocol tcp \\
  --port 22 \\
  --cidr 0.0.0.0/0

# 3. VERIFY new rules
aws ec2 describe-security-groups --group-ids sg-12345678

Safe SSH Access Pattern:
1. Use Bastion host (jump server) in public subnet
2. Add SSH access from specific corporate IPs only
3. Use AWS Systems Manager Session Manager instead of SSH
4. Use AWS Auto Scaling Group to manage instances without SSH

Bastion Host Setup:
# Create security group for bastion
aws ec2 create-security-group --group-name bastion-sg \\
  --description "Bastion host security group"

# Allow SSH from your IP to bastion
aws ec2 authorize-security-group-ingress \\
  --group-id sg-bastion \\
  --protocol tcp --port 22 --cidr YOUR_IP/32

# Allow SSH from bastion to app servers
aws ec2 authorize-security-group-ingress \\
  --group-id sg-app-servers \\
  --protocol tcp --port 22 --source-group sg-bastion

Impact: Dramatically reduces attack surface
Compliance: CIS 5.1, AWS Well-Architected Security Pillar`,
    tags: ['security-groups', 'network', 'access-control', '0.0.0.0/0'],
    source: 'CIS AWS Foundations Benchmark 5.x',
    relatedServices: ['EC2', 'VPC'],
  },

  // ======================== SECURITY - RDS Encryption ========================
  {
    id: 'sec-rds-001',
    title: 'Enable RDS Encryption and Restrict Public Access',
    category: 'SECURITY',
    severity: 'HIGH',
    content: `RDS databases should be encrypted at rest and not publicly accessible.

Best Practice:
- Enable encryption at rest for all RDS instances
- Use AWS KMS key for encryption (not default RDS key)
- Disable "Publicly Accessible" setting
- Use security groups to restrict database access
- Enable RDS Enhanced Monitoring
- Use RDS Proxy for connection pooling

AWS CLI - Check RDS Security:
# List RDS instances
aws rds describe-db-instances \\
  --query 'DBInstances[*].[DBInstanceIdentifier,StorageEncrypted,PubliclyAccessible]'

# Check encryption status
aws rds describe-db-instances \\
  --db-instance-identifier mydb \\
  --query 'DBInstances[0].{Encrypted: StorageEncrypted, KmsKey: KmsKeyId}'

Secure RDS Setup:
1. Enable encryption at rest with KMS key
2. Enable automated backups with encryption
3. Enable encryption in transit (SSL/TLS)
4. Disable public access
5. Use DB security group or VPC security group for access control

AWS CLI - Fix Insecure RDS:
# Modify RDS to use KMS encryption
aws rds modify-db-instance \\
  --db-instance-identifier mydb \\
  --storage-encrypted \\
  --kms-key-id arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012

# Disable public access
aws rds modify-db-instance \\
  --db-instance-identifier mydb \\
  --no-publicly-accessible \\
  --apply-immediately

# Apply new security group
aws rds modify-db-instance \\
  --db-instance-identifier mydb \\
  --vpc-security-group-ids sg-db-only \\
  --apply-immediately

RDS Proxy Setup (for connection pooling):
aws rds create-db-proxy \\
  --db-proxy-name myproxy \\
  --role-arn arn:aws:iam::ACCOUNT_ID:role/rds-proxy-role \\
  --engine-family MYSQL \\
  --auth IamAuth \\
  --require-tls

Impact: Prevents data exposure and unauthorized database access
Compliance: CIS 2.3.1, AWS Well-Architected Security Pillar`,
    tags: ['rds', 'database', 'encryption', 'access-control'],
    source: 'CIS AWS Foundations Benchmark 2.3.x',
    relatedServices: ['RDS', 'KMS', 'VPC'],
  },

  // ======================== SECURITY - S3 Public Access ========================
  {
    id: 'sec-s3-001',
    title: 'Block S3 Public Access and Enable Versioning',
    category: 'SECURITY',
    severity: 'CRITICAL',
    content: `S3 buckets should not be publicly accessible and should have versioning enabled for recovery.

Best Practice:
- Enable "Block all public access" on all S3 buckets
- Use S3 Block Public Access at account level
- Enable versioning for data recovery
- Enable MFA Delete protection
- Use S3 Object Lock for compliance requirements
- Enable S3 access logging

AWS CLI - Secure S3 Bucket:
# Block all public access
aws s3api put-public-access-block \\
  --bucket my-bucket \\
  --public-access-block-configuration \\
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable versioning
aws s3api put-bucket-versioning \\
  --bucket my-bucket \\
  --versioning-configuration Status=Enabled

# Enable server-side encryption
aws s3api put-bucket-encryption \\
  --bucket my-bucket \\
  --server-side-encryption-configuration file://encryption.json

# Enable access logging
aws s3api put-bucket-logging \\
  --bucket my-bucket \\
  --bucket-logging-status file://logging.json

# Audit current S3 ACL
aws s3api get-bucket-acl --bucket my-bucket

# Audit current bucket policy
aws s3api get-bucket-policy --bucket my-bucket

Check for Public ACLs:
aws s3api get-object-acl --bucket my-bucket --key my-object

Never Use:
- Bucket Policy with Principal: "*"
- Object ACL with "PublicRead" or "PublicReadWrite"
- Bucket ACL with "PublicRead" or "PublicReadWrite"

Block Public Access at Account Level:
aws s3api put-account-public-access-block \\
  --public-access-block-configuration \\
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

Impact: Prevents accidental or malicious data exposure
Compliance: CIS 2.1.5, AWS Well-Architected Security Pillar`,
    tags: ['s3', 'bucket', 'public-access', 'data-protection'],
    source: 'CIS AWS Foundations Benchmark 2.1.5',
    relatedServices: ['S3'],
  },

  // ======================== SECURITY - EBS Encryption ========================
  {
    id: 'sec-ebs-001',
    title: 'Enable EBS Encryption by Default',
    category: 'SECURITY',
    severity: 'HIGH',
    content: `EBS volumes should be encrypted to protect data at rest.

Best Practice:
- Enable EBS encryption by default for the region
- Use AWS KMS key for encryption (not default EBS key)
- Enable encryption for all new volumes
- Encrypt existing unencrypted volumes (via snapshots)
- Enable EBS-optimized instances for better performance

AWS CLI - Enable EBS Encryption by Default:
# Check current encryption setting
aws ec2 get-ebs-encryption-by-default --region us-east-1

# Enable EBS encryption by default
aws ec2 enable-ebs-encryption-by-default --region us-east-1

# Verify
aws ec2 get-ebs-encryption-by-default

Encrypt Existing Unencrypted Volumes:
1. Create snapshot of unencrypted volume
2. Copy snapshot with encryption enabled
3. Create new encrypted volume from encrypted snapshot
4. Attach new volume to instance
5. Update application to use new volume
6. Delete old unencrypted volume

AWS CLI - Encrypt Volume:
# Create snapshot of unencrypted volume
SNAPSHOT_ID=$(aws ec2 create-snapshot \\
  --volume-id vol-12345678 \\
  --query 'SnapshotId' --output text)

# Wait for snapshot
aws ec2 wait snapshot-completed --snapshot-ids $SNAPSHOT_ID

# Copy snapshot with encryption
ENCRYPTED_SNAPSHOT=$(aws ec2 copy-snapshot \\
  --source-region us-east-1 \\
  --source-snapshot-id $SNAPSHOT_ID \\
  --encrypted \\
  --query 'SnapshotId' --output text)

# Create encrypted volume from snapshot
aws ec2 create-volume \\
  --snapshot-id $ENCRYPTED_SNAPSHOT \\
  --availability-zone us-east-1a \\
  --encrypted

Impact: Protects data from unauthorized access if volume is stolen
Compliance: CIS 2.3.1, AWS Well-Architected Security Pillar`,
    tags: ['ebs', 'encryption', 'storage', 'data-protection'],
    source: 'CIS AWS Foundations Benchmark 2.3.1',
    relatedServices: ['EC2', 'KMS'],
  },

  // ======================== FINOPS - Unused Resources ========================
  {
    id: 'finops-unused-001',
    title: 'Identify and Remove Unused EC2 Instances',
    category: 'FINOPS',
    severity: 'HIGH',
    content: `Unused EC2 instances waste money. Regular auditing helps identify instances that can be terminated.

Metrics to Check:
- CPU utilization (< 5% for 7 days)
- Network I/O (< 100 bytes for 7 days)
- Disk I/O (< 100 bytes for 7 days)
- Instance state (stopped, but not terminated)
- Instance launch time (long-running, potentially forgotten)

AWS CLI - Find Unused Instances:
# Get instances with low CPU (requires CloudWatch monitoring)
aws cloudwatch get-metric-statistics \\
  --namespace AWS/EC2 \\
  --metric-name CPUUtilization \\
  --dimensions Name=InstanceId,Value=i-1234567890abcdef0 \\
  --start-time 2024-06-01T00:00:00Z \\
  --end-time 2024-06-08T00:00:00Z \\
  --period 3600 \\
  --statistics Average

# List all stopped instances (good candidates for termination)
aws ec2 describe-instances \\
  --filters "Name=instance-state-name,Values=stopped" \\
  --query 'Reservations[*].Instances[*].[InstanceId,LaunchTime,InstanceType]'

# List instances with specific tags (e.g., development)
aws ec2 describe-instances \\
  --filters "Name=tag:Environment,Values=development" \\
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name]'

Cost Impact - Example:
- t3.medium: ~$0.0416/hour × 730 hours/month = $30.37/month
- 50 unused instances × $30/month = $1,500/month wasted
- 1 year = $18,000 waste

Action Plan:
1. Enable detailed CloudWatch monitoring
2. Tag instances with owner and business unit
3. Set up CloudWatch alarms for low utilization
4. Review monthly for unused instances
5. Create decommission schedule
6. Archive backups of terminated instances

Terminating Instance:
aws ec2 terminate-instances --instance-ids i-1234567890abcdef0

Enable Termination Protection:
aws ec2 modify-instance-attribute \\
  --instance-id i-1234567890abcdef0 \\
  --no-disable-api-termination

Impact: Can save thousands per month
Estimate: $500-$2,000/month for typical AWS account`,
    tags: ['unused-resources', 'cost-optimization', 'ec2', 'waste'],
    source: 'AWS FinOps Best Practices',
    relatedServices: ['EC2', 'CloudWatch'],
  },

  // ======================== FINOPS - Reserved Instances ========================
  {
    id: 'finops-ri-001',
    title: 'Use Reserved Instances for Cost Savings',
    category: 'FINOPS',
    severity: 'MEDIUM',
    content: `Reserved Instances can provide up to 72% discount compared to On-Demand pricing.

Best Practice:
- Use RI for stable workloads (> 80% commitment)
- Use Savings Plans for flexible workloads
- Use Spot Instances for fault-tolerant, interruptible workloads
- Mix different instance types in a family for flexibility

Pricing Comparison (Example - t3.medium in us-east-1):
- On-Demand: $0.0416/hour × 730 = $30.37/month
- 1-Year RI: $0.0267/hour × 730 = $19.49/month (36% discount)
- 3-Year RI: $0.0167/hour × 730 = $12.19/month (60% discount)

AWS CLI - Purchase Reserved Instance:
# List current running instances to match
aws ec2 describe-instances \\
  --query 'Reservations[*].Instances[*].[InstanceType,Tenancy,AvailabilityZone]'

# Get pricing for RI
aws ec2 describe-reserved-instances-offerings \\
  --filters "Name=instance-type,Values=t3.medium" \\
  --query 'ReservedInstancesOfferings[*].[FixedPrice,RecurringCharges,Duration]'

# Purchase 1-year RI (all upfront)
aws ec2 purchase-reserved-instances-offering \\
  --reserved-instances-offering-id 1ba8e2e3-b1c2-4a3c-a4d5-00000example \\
  --instance-count 5

Monthly Savings Calculation:
5 × t3.medium instances:
- On-Demand: $30.37 × 5 = $151.85/month
- 1-Year RI: $19.49 × 5 = $97.45/month
- Savings: $54.40/month or $652/year

Annual Savings Calculation (for larger deployments):
- 100 instances × 1-Year RI: ~$13,000/year in savings
- 100 instances × 3-Year RI: ~$24,000/year in savings

RI Management Tips:
1. Use AWS Compute Optimizer to right-size
2. Match RI to baseline workload
3. Use Savings Plans for variable workloads
4. Sell unused RI on RI Marketplace

Impact: Immediate and significant cost savings
Typical ROI: 3-6 months for 1-year RI commitment`,
    tags: ['reserved-instances', 'cost-optimization', 'pricing', 'finops'],
    source: 'AWS FinOps Best Practices',
    relatedServices: ['EC2', 'Cost Explorer'],
  },

  // ======================== OPTIMIZATION - Instance Right-Sizing ========================
  {
    id: 'opt-sizing-001',
    title: 'Right-Size EC2 Instances for Workload',
    category: 'OPTIMIZATION',
    severity: 'MEDIUM',
    content: `Oversized instances waste money. Right-sizing matches instance type to actual workload needs.

Common Oversizing Issues:
- Web servers running on m5.2xlarge (needs t3.medium)
- Development/test on production-grade instances
- Running old generation instances (m4 vs m6i)

AWS CLI - Analyze Instance Performance:
# Get average CPU over 7 days
aws cloudwatch get-metric-statistics \\
  --namespace AWS/EC2 \\
  --metric-name CPUUtilization \\
  --dimensions Name=InstanceId,Value=i-1234567890abcdef0 \\
  --start-time $(date -d '7 days ago' --iso-8601) \\
  --end-time $(date --iso-8601) \\
  --period 3600 \\
  --statistics Average,Maximum

# Get memory usage (requires CloudWatch agent)
aws cloudwatch get-metric-statistics \\
  --namespace CWAgent \\
  --metric-name mem_percent \\
  --dimensions Name=InstanceId,Value=i-1234567890abcdef0

AWS Compute Optimizer Recommendation:
aws compute-optimizer get-ec2-instance-recommendations \\
  --query 'instanceRecommendations[*].[instanceId,finding,recommendationOptions]'

Migration Steps:
1. Create AMI from current instance
2. Launch new instance with smaller type
3. Run performance tests
4. Switch production traffic (if web)
5. Keep old instance for 2 weeks as backup
6. Terminate old instance

Cost Savings Example:
- Current: m5.2xlarge ($0.384/hour) → right-sized to t3.medium ($0.0416/hour)
- Monthly savings: ($0.384 - $0.0416) × 730 = $257/month = $3,084/year

Newer Generation Benefits:
- m4.large ($0.096/hour) → m6i.large ($0.096/hour)
  - Same price, better performance (50% more CPU/memory)
- m4.xlarge ($0.192/hour) → t3.2xlarge ($0.0832/hour)
  - 50% cheaper, better burstable performance

Impact: 20-40% cost reduction typical
AWS Compute Optimizer can identify: ${COST_SAVINGS}/year opportunities`,
    tags: ['right-sizing', 'cost-optimization', 'ec2', 'performance'],
    source: 'AWS FinOps Best Practices',
    relatedServices: ['EC2', 'Compute Optimizer', 'CloudWatch'],
  },

  // ======================== OPTIMIZATION - Storage Optimization ========================
  {
    id: 'opt-storage-001',
    title: 'Optimize EBS Storage and Use Appropriate Types',
    category: 'OPTIMIZATION',
    severity: 'MEDIUM',
    content: `EBS storage costs add up. Using appropriate volume types and cleaning unused volumes reduces costs.

EBS Volume Types:
- gp3 (General Purpose): $0.10/month per GB (latest, recommended)
- gp2 (General Purpose - old): $0.10/month per GB (phase out)
- io2 (High I/O): $0.125/month per GB
- st1 (Throughput): $0.045/month per GB (sequential I/O)
- sc1 (Cold Storage): $0.015/month per GB (infrequent access)

Optimization Opportunities:
1. Use gp3 instead of gp2 (better price-performance)
2. Use st1/sc1 for large sequential workloads
3. Remove unused snapshots
4. Reduce EBS volume sizes that are oversized
5. Use EBS optimization for I/O intensive workloads

AWS CLI - Find Unused Volumes:
# List all unattached volumes
aws ec2 describe-volumes \\
  --filters "Name=status,Values=available" \\
  --query 'Volumes[*].[VolumeId,Size,CreateTime]'

# Delete unused volume
aws ec2 delete-volume --volume-id vol-12345678

# Find old snapshots
aws ec2 describe-snapshots \\
  --owner-ids self \\
  --query 'Snapshots[*].[SnapshotId,StartTime,VolumeSize]' \\
  --output table | sort -k2

Migration to gp3:
# Create snapshot of gp2 volume
SNAPSHOT=$(aws ec2 create-snapshot \\
  --volume-id vol-gp2-12345 \\
  --query 'SnapshotId' --output text)

# Create new gp3 volume from snapshot
aws ec2 create-volume \\
  --snapshot-id $SNAPSHOT \\
  --availability-zone us-east-1a \\
  --volume-type gp3 \\
  --iops 3000 \\
  --throughput 125

Cost Example:
- 500 GB of snapshots × $0.05/month = $25/month = $300/year waste
- 10 unused 100GB gp2 volumes × $10/month = $100/month = $1,200/year

Impact: 10-25% storage cost reduction
Typical savings: $200-$1,000/month`,
    tags: ['ebs', 'storage', 'cost-optimization', 'gp3'],
    source: 'AWS FinOps Best Practices',
    relatedServices: ['EC2', 'EBS'],
  },

  // ======================== BEST PRACTICE - Tagging ========================
  {
    id: 'best-tagging-001',
    title: 'Implement Consistent Resource Tagging Strategy',
    category: 'BEST_PRACTICE',
    severity: 'MEDIUM',
    content: `Resource tags are critical for cost allocation, access control, and automation.

Essential Tags:
- Environment: development, staging, production
- Owner: team name or email
- CostCenter: billing department
- Application: application name
- BusinessUnit: organization unit
- ManagedBy: automated or manual
- CreatedDate: creation timestamp
- BackupPolicy: daily, weekly, none

AWS CLI - Tag Resources:
# Tag EC2 instance
aws ec2 create-tags \\
  --resources i-1234567890abcdef0 \\
  --tags Key=Environment,Value=production Key=Owner,Value=platform-team

# Tag RDS instance
aws rds add-tags-to-resource \\
  --resource-name arn:aws:rds:us-east-1:123456789012:db:mydb \\
  --tags Key=Environment,Value=production Key=Owner,Value=data-team

# Tag S3 bucket
aws s3api put-bucket-tagging \\
  --bucket my-bucket \\
  --tagging 'TagSet=[{Key=Environment,Value=production},{Key=Owner,Value=storage-team}]'

Query by Tags:
# Find all production EC2 instances
aws ec2 describe-instances \\
  --filters "Name=tag:Environment,Values=production" \\
  --query 'Reservations[*].Instances[*].[InstanceId,InstanceType]'

# Find all resources by cost center
aws resourcegroupstaggingapi get-resources \\
  --tag-filters "Key=CostCenter,Values=engineering"

Cost Allocation:
# Use AWS Cost Explorer to track spending by tag
# Enable in AWS Billing console → Cost allocation tags

Automation with Tags:
1. Auto-shutdown development instances based on tag
2. Auto-apply security patches based on tag
3. Auto-create backups based on backup policy tag

Impact: 20-30% faster incident response, accurate cost tracking`,
    tags: ['tagging', 'best-practice', 'cost-allocation', 'automation'],
    source: 'AWS Best Practices',
    relatedServices: ['All Services'],
  },

  // ======================== BEST PRACTICE - Monitoring and Alerts ========================
  {
    id: 'best-monitor-001',
    title: 'Set Up Comprehensive CloudWatch Monitoring and Alerts',
    category: 'BEST_PRACTICE',
    severity: 'HIGH',
    content: `CloudWatch monitoring is essential for detecting issues before they impact users.

Key Metrics to Monitor:
- EC2: CPU, Network, Disk I/O
- RDS: Database Connections, Queries, Replication Lag
- Application: Response Time, Error Rate, Request Count
- Billing: Daily AWS charges vs budget
- Security: Failed login attempts, API errors

AWS CLI - Create CloudWatch Alarm:
# Alarm for high CPU
aws cloudwatch put-metric-alarm \\
  --alarm-name high-cpu \\
  --alarm-description "Alert when EC2 CPU > 80%" \\
  --metric-name CPUUtilization \\
  --namespace AWS/EC2 \\
  --statistic Average \\
  --period 300 \\
  --threshold 80 \\
  --comparison-operator GreaterThanThreshold \\
  --evaluation-periods 2 \\
  --alarm-actions arn:aws:sns:us-east-1:123456789012:ops-team

# Alarm for billing
aws cloudwatch put-metric-alarm \\
  --alarm-name monthly-billing-alert \\
  --metric-name EstimatedCharges \\
  --namespace AWS/Billing \\
  --statistic Maximum \\
  --period 86400 \\
  --threshold 1000 \\
  --comparison-operator GreaterThanThreshold \\
  --alarm-actions arn:aws:sns:us-east-1:123456789012:finance-team

SNS Topic Setup:
# Create SNS topic
aws sns create-topic --name ops-alerts

# Subscribe email
aws sns subscribe \\
  --topic-arn arn:aws:sns:us-east-1:123456789012:ops-alerts \\
  --protocol email \\
  --notification-endpoint ops@company.com

Log Aggregation:
# Send application logs to CloudWatch
# Configure CloudWatch Logs agent on EC2 instances

Recommended Alarms:
1. CPU utilization > 80% for 10 minutes
2. Network traffic spikes (sudden increase)
3. Failed login attempts > 5 in 5 minutes
4. API error rate > 5%
5. RDS connections > 80% of max
6. Database replication lag > 30 seconds
7. Monthly bill > threshold

Dashboard Creation:
aws cloudwatch put-dashboard \\
  --dashboard-name production-overview \\
  --dashboard-body file://dashboard-config.json

Impact: 50% faster incident detection and resolution`,
    tags: ['monitoring', 'cloudwatch', 'alerts', 'best-practice'],
    source: 'AWS Well-Architected Framework',
    relatedServices: ['CloudWatch', 'SNS', 'CloudWatch Logs'],
  },

  // ======================== BEST PRACTICE - Backup Strategy ========================
  {
    id: 'best-backup-001',
    title: 'Implement Automated Backup and Disaster Recovery Strategy',
    category: 'BEST_PRACTICE',
    severity: 'CRITICAL',
    content: `Regular backups and disaster recovery testing are essential for business continuity.

Backup Strategy Components:
1. Frequency: Daily for critical data, weekly for non-critical
2. Retention: 30 days minimum for daily, 1 year for monthly
3. Testing: Monthly restore tests to ensure recoverability
4. Documentation: Keep runbook for recovery procedures
5. Geographic redundancy: Backup to different region

AWS CLI - RDS Automated Backups:
# Enable automated backups
aws rds modify-db-instance \\
  --db-instance-identifier mydb \\
  --backup-retention-period 30 \\
  --preferred-backup-window "03:00-04:00" \\
  --apply-immediately

# Create manual backup
aws rds create-db-snapshot \\
  --db-instance-identifier mydb \\
  --db-snapshot-identifier mydb-backup-2024-06-11

# List backups
aws rds describe-db-snapshots \\
  --db-instance-identifier mydb \\
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime]'

# Restore from backup
aws rds restore-db-instance-from-db-snapshot \\
  --db-instance-identifier mydb-restored \\
  --db-snapshot-identifier mydb-backup-2024-06-11

EBS Snapshot Automation:
# Create lifecycle policy for automatic snapshots
aws dlm create-lifecycle-policy \\
  --execution-role-arn arn:aws:iam::123456789012:role/ebs-snapshot-role \\
  --description "Daily EBS snapshots" \\
  --state ENABLED \\
  --policy-details file://snapshot-policy.json

S3 Backup Strategy:
# Enable versioning
aws s3api put-bucket-versioning \\
  --bucket my-backup-bucket \\
  --versioning-configuration Status=Enabled

# Cross-region replication
aws s3api put-bucket-replication \\
  --bucket my-backup-bucket \\
  --replication-configuration file://replication.json

Recovery Time Objective (RTO):
- Critical systems: < 1 hour
- Important systems: < 4 hours
- Non-critical: < 1 day

Recovery Point Objective (RPO):
- Critical systems: hourly backups
- Important systems: daily backups
- Non-critical: weekly backups

Disaster Recovery Testing:
1. Monthly: Restore to test environment
2. Quarterly: Full failover to backup infrastructure
3. Annual: Test cross-region failover

Impact: Prevents data loss and minimizes downtime
Typical cost: 10-15% of infrastructure cost`,
    tags: ['backup', 'disaster-recovery', 'rds', 'ebs', 'best-practice'],
    source: 'AWS Well-Architected Framework',
    relatedServices: ['RDS', 'EBS', 'S3', 'DLM'],
  },
];

/**
 * Search knowledge base for relevant documents
 * @param query - Search query string
 * @param category - Optional category filter
 * @returns Array of matching documents
 */
export function searchKnowledgeBase(
  query: string,
  category?: KnowledgeDocument['category']
): KnowledgeDocument[] {
  const lowerQuery = query.toLowerCase();
  
  return KNOWLEDGE_BASE.filter((doc) => {
    // Filter by category if provided
    if (category && doc.category !== category) {
      return false;
    }
    
    // Search in title, content, tags, and services
    return (
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.content.toLowerCase().includes(lowerQuery) ||
      doc.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      doc.relatedServices.some((service) =>
        service.toLowerCase().includes(lowerQuery)
      )
    );
  });
}

/**
 * Get documents by category
 */
export function getDocumentsByCategory(
  category: KnowledgeDocument['category']
): KnowledgeDocument[] {
  return KNOWLEDGE_BASE.filter((doc) => doc.category === category);
}

/**
 * Get documents by severity
 */
export function getDocumentsBySeverity(
  severity: KnowledgeDocument['severity']
): KnowledgeDocument[] {
  return KNOWLEDGE_BASE.filter((doc) => doc.severity === severity);
}

/**
 * Get documents by related service
 */
export function getDocumentsByService(service: string): KnowledgeDocument[] {
  return KNOWLEDGE_BASE.filter((doc) =>
    doc.relatedServices.some(
      (s) => s.toLowerCase() === service.toLowerCase()
    )
  );
}

export const KNOWLEDGE_BASE_STATS = {
  totalDocuments: KNOWLEDGE_BASE.length,
  byCategoryCount: KNOWLEDGE_BASE.reduce(
    (acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ),
  bySeverityCount: KNOWLEDGE_BASE.reduce(
    (acc, doc) => {
      acc[doc.severity] = (acc[doc.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ),
};
