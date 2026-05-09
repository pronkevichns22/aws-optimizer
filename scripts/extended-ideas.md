# 🔥 LocalStack Infrastructure Generation - Extended Ideas

Этот документ содержит идеи для расширения `generate-massive-infra.sh` с дополнительными типами рисков.

## ✅ Что уже реализовано

Основной скрипт `generate-massive-infra.sh` создает:

| Категория | Количество | Типы рисков |
|---|---|---|
| **EC2 Instances** | 40 | Дорогие инстансы, stopped instances |
| **EBS Volumes** | 240+ | Unutilized, unencrypted, old backups |
| **Elastic IPs** | 100 | Unassociated (cost waste) |
| **Security Groups** | 7 | SSH/RDP/DB ports public, any traffic |
| **EBS Snapshots** | 10+ | Unused backups |

**Всего альертов:** 140+

---

## 🚀 Идеи для расширения

### **ВАРИАНТ 1: IAM & Access Control Risks**

Добавить в скрипт:

```bash
# ============================================================================
# SECTION 9: IAM - Excessive Permissions
# ============================================================================
echo "[9/8] 👤 Creating IAM Users with excessive permissions..."

# Create admin users
for i in {1..3}; do
  awslocal iam create-user --user-name admin-user-$i
  awslocal iam attach-user-policy \
    --user-name admin-user-$i \
    --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
done
echo "   ✅ 3 IAM users with AdministratorAccess (CRITICAL)"

# Create access keys (some very old)
for i in {1..5}; do
  awslocal iam create-access-key --user-name admin-user-1
done
echo "   ✅ Multiple access keys created (rotation risk)"
```

**Ожидаемые алерты:**
- ✓ Users with AdministratorAccess (не best practice)
- ✓ Excessive access keys per user
- ✓ Access keys without rotation (>90 days)
- ✓ Root account usage alerts

---

### **ВАРИАНТ 2: S3 Buckets - Public & Misconfigured**

```bash
# ============================================================================
# SECTION 10: S3 Buckets - Public Access & Misconfigurations
# ============================================================================
echo "[10/8] 🪣 Creating public S3 buckets with risks..."

# Create completely public buckets
for i in {1..5}; do
  BUCKET_NAME="public-bucket-$(date +%s)-$i"
  
  # Create bucket
  awslocal s3 mb s3://$BUCKET_NAME
  
  # Make completely public
  awslocal s3api put-bucket-acl \
    --bucket $BUCKET_NAME \
    --acl public-read
  
  # Disable versioning
  awslocal s3api put-bucket-versioning \
    --bucket $BUCKET_NAME \
    --versioning-configuration Status=Suspended
  
  # Upload some objects
  echo "sensitive data" > /tmp/data.txt
  awslocal s3 cp /tmp/data.txt s3://$BUCKET_NAME/
done
echo "   ✅ 5 Public S3 buckets created (CRITICAL)"

# Create buckets without encryption
for i in {1..3}; do
  BUCKET_NAME="unencrypted-bucket-$(date +%s)-$i"
  awslocal s3 mb s3://$BUCKET_NAME
  # No encryption enabled - SECURITY RISK
done
echo "   ✅ 3 Unencrypted buckets (HIGH)"

# Create buckets without logging
for i in {1..3}; do
  BUCKET_NAME="no-logging-bucket-$(date +%s)-$i"
  awslocal s3 mb s3://$BUCKET_NAME
  # No logging configured - COMPLIANCE RISK
done
echo "   ✅ 3 Buckets without access logging (MEDIUM)"
```

**Ожидаемые алерты:**
- ✓ Public S3 buckets (CRITICAL)
- ✓ Buckets without encryption (HIGH)
- ✓ Buckets without versioning (MEDIUM)
- ✓ Buckets without access logging (MEDIUM)
- ✓ Public objects in buckets (CRITICAL)

---

### **ВАРИАНТ 3: RDS Databases - Misconfigurations**

```bash
# ============================================================================
# SECTION 11: RDS - Misconfigured Databases
# ============================================================================
echo "[11/8] 🗄️  Creating misconfigured RDS instances..."

# Publicly accessible RDS without backups
awslocal rds create-db-instance \
  --db-instance-identifier public-db-prod \
  --db-instance-class db.r5.4xlarge \
  --engine postgres \
  --master-username admin \
  --master-user-password VeryWeakPassword123 \
  --allocated-storage 1000 \
  --storage-type io1 \
  --iops 5000 \
  --publicly-accessible \
  --no-multi-az \
  --backup-retention-period 0 \
  --no-enable-cloudwatch-logs-exports

echo "   ✅ Public RDS without backups (CRITICAL)"

# Oversized RDS in dev environment
awslocal rds create-db-instance \
  --db-instance-identifier dev-db-oversized \
  --db-instance-class db.r5.4xlarge \
  --engine mysql \
  --master-username admin \
  --master-user-password password123 \
  --allocated-storage 500 \
  --storage-type gp2 \
  --tags "Key=Environment,Value=development"

echo "   ✅ Oversized RDS for dev (FINOPS)"

# RDS with default parameters
awslocal rds create-db-instance \
  --db-instance-identifier default-params-db \
  --db-instance-class db.t3.large \
  --engine postgres \
  --master-username postgres \
  --master-user-password postgres \
  --allocated-storage 100

echo "   ✅ RDS with default parameters (MEDIUM)"
```

**Ожидаемые алерты:**
- ✓ Public RDS instances (CRITICAL)
- ✓ RDS without backups (HIGH)
- ✓ RDS without Multi-AZ (HIGH)
- ✓ Weak password patterns (HIGH)
- ✓ Oversized RDS for dev (FINOPS)
- ✓ RDS with default parameters (MEDIUM)

---

### **ВАРИАНТ 4: VPC & Network Configuration**

```bash
# ============================================================================
# SECTION 12: VPC - Poor Network Configuration
# ============================================================================
echo "[12/8] 🌐 Creating poorly configured VPCs..."

# Create VPC with public subnet but no proper controls
VPC=$(awslocal ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text)
SUBNET=$(awslocal ec2 create-subnet \
  --vpc-id $VPC \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --query 'Subnet.SubnetId' \
  --output text)

# Create and attach IGW
IGW=$(awslocal ec2 create-internet-gateway --query 'InternetGateway.InternetGatewayId' --output text)
awslocal ec2 attach-internet-gateway --internet-gateway-id $IGW --vpc-id $VPC

# Create public route table (bad practice: no VPC Flow Logs)
RTB=$(awslocal ec2 create-route-table --vpc-id $VPC --query 'RouteTable.RouteTableId' --output text)
awslocal ec2 create-route \
  --route-table-id $RTB \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id $IGW

# Associate subnet
awslocal ec2 associate-route-table --subnet-id $SUBNET --route-table-id $RTB

echo "   ✅ VPC without VPC Flow Logs (MEDIUM)"
echo "   ✅ Subnet with public route (CHECK)"

# Create multiple VPCs (management overhead)
for i in {1..5}; do
  awslocal ec2 create-vpc --cidr-block "10.$i.0.0/16"
done
echo "   ✅ 5 additional VPCs (potential waste)"

# Create NAT Gateway without proper monitoring
awslocal ec2 create-nat-gateway \
  --subnet-id $SUBNET \
  --tag-specifications "ResourceType=nat-gateway,Tags=[{Key=Name,Value=unmonitored-nat}]"
echo "   ✅ NAT Gateway without proper routing (CHECK)"
```

**Ожидаемые алерты:**
- ✓ VPC Flow Logs not enabled (MEDIUM)
- ✓ Multiple unused VPCs (FINOPS)
- ✓ Public subnets without proper NACL (CHECK)
- ✓ NAT Gateways with no monitoring (MEDIUM)

---

### **ВАРИАНТ 5: CloudTrail & Logging Disabled**

```bash
# ============================================================================
# SECTION 13: CloudTrail - Logging Disabled
# ============================================================================
echo "[13/8] 🚫 Creating disabled CloudTrail logging..."

# Create S3 bucket for CloudTrail but don't enable logging
TRAIL_BUCKET="cloudtrail-logs-$(date +%s)"
awslocal s3 mb s3://$TRAIL_BUCKET

# Create trail but with issues
awslocal cloudtrail create-trail \
  --name insecure-trail \
  --s3-bucket-name $TRAIL_BUCKET \
  --no-is-multi-region-trail \
  --no-enable-log-file-validation

# DO NOT START LOGGING - simulation of disabled logging
echo "   ✅ CloudTrail created but not enabled (CRITICAL)"

# Create trail without multi-region
awslocal cloudtrail create-trail \
  --name single-region-trail \
  --s3-bucket-name $TRAIL_BUCKET \
  --no-is-multi-region-trail

echo "   ✅ CloudTrail without multi-region coverage (HIGH)"
```

**Ожидаемые алерты:**
- ✓ CloudTrail disabled (CRITICAL)
- ✓ CloudTrail without log file validation (HIGH)
- ✓ CloudTrail without multi-region (HIGH)
- ✓ No API logging for compliance (MEDIUM)

---

### **ВАРИАНТ 6: Compliance & Tagging Issues**

```bash
# ============================================================================
# SECTION 14: Compliance - Missing Tags & Policies
# ============================================================================
echo "[14/8] 🏷️  Creating untagged resources (compliance risk)..."

# Create resources without proper tags
for i in {1..20}; do
  awslocal ec2 create-volume \
    --availability-zone us-east-1a \
    --size 100
    # NO TAGS - COMPLIANCE ISSUE
done
echo "   ✅ 20 untagged volumes (COMPLIANCE)"

# Create resources with inconsistent tags
for i in {1..10}; do
  awslocal ec2 run-instances \
    --image-id ami-xxx \
    --instance-type t3.micro \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Owner,Value=NoTeam}]"
    # Missing: Environment, CostCenter, Project, etc.
done
echo "   ✅ 10 instances with incomplete tags (COMPLIANCE)"

# Create resources without cost allocation tags
for i in {1..15}; do
  awslocal ec2 create-volume \
    --availability-zone us-east-1b \
    --size 200 \
    --tag-specifications "ResourceType=volume,Tags=[{Key=Name,Value=vol-$i}]"
    # Missing: CostCenter, Owner, Project
done
echo "   ✅ 15 volumes without cost tags (FINOPS)"
```

**Ожидаемые алерты:**
- ✓ Untagged resources (COMPLIANCE)
- ✓ Inconsistent tagging (GOVERNANCE)
- ✓ Missing cost allocation tags (FINOPS)
- ✓ Missing environment tags (COMPLIANCE)

---

### **ВАРИАНТ 7: Reserved Instances Waste**

```bash
# ============================================================================
# SECTION 15: Reserved Instances - Unused Commitments
# ============================================================================
echo "[15/8] 💳 Simulating unused Reserved Instances..."

# Create many on-demand instances (should be reserved)
for i in {1..20}; do
  awslocal ec2 run-instances \
    --image-id ami-xxx \
    --instance-type m5.large \
    --count 1 \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=on-demand-$i}]"
done
echo "   ✅ 20 on-demand instances (should use reserved)"

# Note: LocalStack doesn't support purchase-reserved-instances,
# but the on-demand instances would trigger recommendations
```

**Ожидаемые алерты:**
- ✓ On-demand instances that should be reserved (FINOPS)
- ✓ Reserved Instance underutilization (FINOPS)
- ✓ Savings Plans coverage opportunities (FINOPS)

---

### **ВАРИАНТ 8: Lambda - Misconfigured Functions**

```bash
# ============================================================================
# SECTION 16: Lambda - Misconfigured Functions
# ============================================================================
echo "[16/8] ⚡ Creating misconfigured Lambda functions..."

# Create oversized Lambda with excessive timeout
awslocal lambda create-function \
  --function-name oversized-lambda \
  --runtime python3.9 \
  --role arn:aws:iam::123456789012:role/service-role/MyRole \
  --handler index.handler \
  --memory-size 3008 \
  --timeout 900 \
  --zip-file fileb:///tmp/function.zip

echo "   ✅ Oversized Lambda (3GB memory, 15min timeout)"

# Create Lambda with no error handling
awslocal lambda create-function \
  --function-name unused-lambda \
  --runtime nodejs14.x \
  --role arn:aws:iam::123456789012:role/service-role/MyRole \
  --handler index.handler \
  --zip-file fileb:///tmp/function.zip

echo "   ✅ Lambda without reserved concurrency"

# Create Lambda versions that accumulate
# (simulating poor version management)
```

**Ожидаемые алерты:**
- ✓ Oversized Lambda functions (FINOPS)
- ✓ Unused Lambda functions (FINOPS)
- ✓ Lambda with excessive timeout (OPTIMIZATION)

---

## 📊 Рекомендуемый порядок добавления

### Phase 1 (Базовое покрытие) - Уже реализовано
- ✅ EC2 instances
- ✅ EBS volumes (unused + unencrypted)
- ✅ Elastic IPs
- ✅ Security Groups

### Phase 2 (Критичные) - Рекомендуется добавить первым
- 🔴 IAM (ВАРИАНТ 1) - критично для безопасности
- 🔴 S3 Buckets (ВАРИАНТ 2) - очень видимо
- 🔴 CloudTrail (ВАРИАНТ 5) - compliance критичный

### Phase 3 (Дополнительный контекст)
- 🟡 RDS (ВАРИАНТ 3)
- 🟡 VPC (ВАРИАНТ 4)
- 🟡 Tags (ВАРИАНТ 6)

### Phase 4 (Расширение)
- 🟢 Reserved Instances (ВАРИАНТ 7)
- 🟢 Lambda (ВАРИАНТ 8)

---

## 🎯 Общая статистика после добавления всех вариантов

```
Если добавить все варианты:

CRITICAL:    60+ алертов
HIGH:        80+ алертов
MEDIUM:      50+ алертов
WARNING:    100+ алертов
INFO:        40+ алертов

ВСЕГО:      330+ алертов
```

---

## 💡 Советы по внедрению

1. **Начните с основного скрипта** - уже достаточно для демонстрации
2. **Добавьте IAM + S3** - максимальный эффект
3. **Тестируйте постепенно** - проверяйте после каждого добавления
4. **Очищайте перед новым сканом** - чтобы не было дубликатов

---

## 🔗 Ссылки

- [AWS Best Practices](https://aws.amazon.com/architecture/well-architected/)
- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [Cost Optimization Pillar](https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html)

---

**Готово к расширению!** 🚀
