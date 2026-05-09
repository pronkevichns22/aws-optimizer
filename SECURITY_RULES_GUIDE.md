# Security Rules Guide
## FREE AWS Security & Cost Optimization Rules

This document outlines all 7 security and cost optimization rules implemented in the system. All rules use **free AWS data** (no paid services like GuardDuty, SecurityHub, or Config required).

---

## 🔴 CRITICAL RULES

### Rule 1: SSH/RDP Exposed to World
**Function:** `generateSecurityGroupAlerts()`
**Severity:** CRITICAL
**Type:** SECURITY

Detects Security Groups allowing unrestricted SSH (port 22) or RDP (port 3389) access from 0.0.0.0/0.

**What it checks:**
- Port 22 (SSH) open to world
- Port 3389 (RDP) open to world
- Any inbound rule with full CIDR (0.0.0.0/0 or ::/0)

**Why it matters:** Exposed admin ports are the #1 vector for brute-force attacks.

**Remediation:**
1. Modify Security Group inbound rules
2. Restrict to specific IP ranges
3. Use bastion host pattern (jump box)
4. Enable VPC Flow Logs to monitor access

---

## 🟠 HIGH SEVERITY RULES

### Rule 4: Permissive Database & App Ports Exposed
**Function:** `generatePermissiveSecurityGroupAlerts()`
**Severity:** HIGH / MEDIUM
**Type:** SECURITY

Detects databases and application servers exposed to the internet.

**What it checks:**
- Port 3306 (MySQL) to 0.0.0.0/0
- Port 5432 (PostgreSQL) to 0.0.0.0/0
- Port 27017 (MongoDB) to 0.0.0.0/0
- Port 6379 (Redis) to 0.0.0.0/0
- Port 5984 (CouchDB) to 0.0.0.0/0
- Large port ranges (100+) to 0.0.0.0/0

**Why it matters:** Exposed databases are high-value targets for data theft and ransomware.

**Remediation:**
1. Restrict DB access to application security groups only
2. Use RDS security groups for managed databases
3. Implement network segmentation
4. Enable encryption in transit (SSL/TLS)

---

### Rule 5: Unencrypted EBS Volumes
**Function:** `generateUnencryptedVolumeAlerts()`
**Severity:** HIGH
**Type:** SECURITY

Detects EBS volumes without encryption enabled.

**What it checks:**
- Volume.Encrypted == false
- All volume types (gp2, io1, st1, sc1, standard)

**Why it matters:** Unencrypted data at rest violates compliance standards and exposes sensitive data if storage is compromised.

**Remediation:**
1. Create encrypted snapshot from volume
2. Create new volume from snapshot (encrypted)
3. Attach new volume to instance
4. Update application config
5. Delete old volume

**Cost Impact:** No additional cost for encryption at rest

---

### Rule 7: Public Instances with SSH Exposed
**Function:** `generatePublicInstanceAlerts()`
**Severity:** WARNING
**Type:** SECURITY

Detects EC2 instances with public IPs that allow SSH from anywhere.

**What it checks:**
- Instance.State == 'running' AND PublicIpAddress exists
- Attached Security Groups allow port 22 from 0.0.0.0/0

**Why it matters:** Direct internet exposure of compute resources enables direct compromise.

**Remediation:**
1. Move to private subnet if not needed public
2. Use Bastion Host (Jump Box) pattern
3. Implement AWS Systems Manager Session Manager
4. Use AWS Client VPN or Tailscale

---

## 🟡 MEDIUM/WARNING RULES

### Rule 2: Unattached EBS Volumes (FinOps)
**Function:** `generateEBSVolumeAlerts()`
**Severity:** WARNING
**Type:** FINOPS

Detects unused EBS volumes not attached to any instance.

**What it checks:**
- Volume.State == 'available' (not attached)
- Any volume type

**Monthly Cost Savings:** $0.08 per GB per month
**Example:** 100GB unused volume = $8/month = $96/year

**Remediation:**
1. Verify volume is not needed
2. Create snapshot for backup (optional)
3. Delete unused volume
4. Monitor with CloudWatch

---

### Rule 3: Unused Elastic IPs (FinOps)
**Function:** `generateElasticIPAlerts()`
**Severity:** WARNING
**Type:** FINOPS

Detects Elastic IPs not associated with any resource.

**What it checks:**
- Address.AssociationId == null/undefined
- Unattached to EC2 instance or NAT Gateway

**Monthly Cost Savings:** $3.60 per IP per month
**Example:** 5 unused IPs = $18/month = $216/year

**Remediation:**
1. Verify IP is not reserved for future use
2. Release the Elastic IP
3. Monitor with CloudWatch if needed

---

### Rule 6: Unused Security Groups (FinOps)
**Function:** `generateUnusedSecurityGroupAlerts()`
**Severity:** INFO
**Type:** FINOPS

Detects Security Groups not attached to any EC2 instance.

**What it checks:**
- Security Groups (excluding default)
- No running EC2 instances use it
- No ENI attachments

**Why it matters:** Reduces configuration clutter and potential for misconfiguration.

**Remediation:**
1. Verify it's not used by other resources (RDS, ECS, Lambda, ALB)
2. Review inbound/outbound rules
3. Delete if confirmed unused
4. Document for audit purposes if needed

---

## 📊 Alert Types Summary

| Rule | Severity | Type | Impact | Cost Saving |
|------|----------|------|--------|-------------|
| SSH/RDP Exposed | CRITICAL | SECURITY | High | N/A |
| DB Ports Exposed | HIGH | SECURITY | High | N/A |
| Unencrypted EBS | HIGH | SECURITY | High | No cost impact |
| Public Instance SSH | WARNING | SECURITY | Medium | N/A |
| Unused Volumes | WARNING | FINOPS | Low | $0.08/GB/month |
| Unused IPs | WARNING | FINOPS | Low | $3.60/IP/month |
| Unused SGs | INFO | FINOPS | Minimal | No saving |

---

## 🔧 Implementation Details

All rules are implemented as functions in `/server/src/index.ts`:

```typescript
// Core rule functions
function generateSecurityGroupAlerts(securityGroups: SecurityGroup[]): Alert[]
function generatePermissiveSecurityGroupAlerts(securityGroups: SecurityGroup[]): Alert[]
function generateUnencryptedVolumeAlerts(volumes: Volume[]): Alert[]
function generatePublicInstanceAlerts(instances: Instance[], securityGroups: SecurityGroup[]): Alert[]
function generateEBSVolumeAlerts(volumes: Volume[], costConfig: CostConfig): Alert[]
function generateElasticIPAlerts(elasticIPs: Address[], costConfig: CostConfig): Alert[]
function generateUnusedSecurityGroupAlerts(securityGroups: SecurityGroup[], instances: Instance[]): Alert[]

// Master orchestrator
function rulesEngine(assets: AWSAssets, costConfig: CostConfig): Alert[]
```

---

## 📈 Future Rule Candidates (Free AWS Data)

These could be added in future versions:

```
- Instance Metadata Service v1 (IMDSv1) detection
- VPC Flow Logs disabled detection  
- EBS Default Encryption not enabled
- CloudTrail disabled/not logging
- S3 Bucket Public Access Block disabled
- KMS Key Rotation disabled
- IAM Security Group changes not monitored
- Root account usage detection
- MFA not enabled for console users
```

---

## 🚀 How to Use

1. **Run Security Scan:** POST `/api/scan` with AWS credentials
2. **View Results:** Frontend displays alerts, event logs, and cost savings
3. **Filter Results:** By severity (CRITICAL, HIGH, MEDIUM, WARNING, INFO)
4. **Export Report:** Download PDF with findings and remediation steps

---

## 📝 Notes

- All rules execute in real-time using standard AWS SDK calls
- No additional AWS services required
- No GuardDuty, SecurityHub, or Config subscription needed
- Cost savings calculations use current AWS pricing (US East 1)
- Rules are stateless - can run multiple times, same results
