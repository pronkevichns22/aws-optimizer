# 🔥 LocalStack Infrastructure Generation - Extended Ideas

Вот расширенный bash скрипт для `generate-massive-infra.sh` который уже создает:

## ✅ Что уже реализовано в скрипте:

### 1️⃣ **EC2 Instances** (40 штук)
- 15 Web servers (t3.medium)
- 10 Database clusters (m5.4xlarge - дорого)
- 5 AI/GPU workers (p3.8xlarge - очень дорого!)
- 10 Stopped instances (забытые разработчиком)

### 2️⃣ **EBS Volumes** (200+ штук)
- 15 огромных io1 бэкапов (4000GB @ io1 = $$$)
- 40 заброшенных проектов (1500GB)
- 80 мелких разработчика (50GB)
- 50 тестовых томов (200GB)
- 25 **незашифрованных** production (300GB) - HIGH RISK

### 3️⃣ **Security Groups** (7 уязвимых)
- SSH → 0.0.0.0/0 (CRITICAL)
- RDP → 0.0.0.0/0 (CRITICAL)
- MySQL, PostgreSQL, MongoDB → 0.0.0.0/0 (HIGH)
- Redis → 0.0.0.0/0 (HIGH)
- HTTP без HTTPS (MEDIUM)
- Большие port ranges 1000-65535 (MEDIUM)
- ANY traffic all TCP+UDP (CRITICAL)

### 4️⃣ **Elastic IPs** (100 неиспользуемых)
- Все не привязаны: $360/месяц потерь

### 5️⃣ **EBS Snapshots** (10+ неиспользуемых)
- Старые бэкапы которые никому не нужны

---

## 🚀 Что можно добавить дальше:

### **ВАРИАНТ 1: IAM & Access Control Risks**

```bash
# IAM Users with excessive permissions
awslocal iam create-user --user-name admin-user
awslocal iam attach-user-policy --user-name admin-user --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# IAM Access Keys without rotation
awslocal iam create-access-key --user-name admin-user

# Root account usage (not best practice)
```

**Expected Alerts:**
- ✓ Users with AdministratorAccess
- ✓ Unused access keys
- ✓ Access keys older than 90 days

---

### **ВАРИАНТ 2: S3 Buckets - Public & Misconfigured**

```bash
# Create public S3 buckets
for i in {1..5}; do
  awslocal s3 mb s3://public-bucket-$i
  
  # Make completely public
  awslocal s3api put-bucket-acl --bucket public-bucket-$i --acl public-read
  
  # Disable versioning (risky)
  # Disable encryption
  # No logging
  # No MFA delete
done
```

**Expected Alerts:**
- ✓ Public S3 buckets
- ✓ Buckets without encryption
- ✓ Buckets without versioning
- ✓ Buckets without logging
- ✓ Cross-region replication waste

---

### **ВАРИАНТ 3: RDS Databases - Misconfigurations**

```bash
# Create RDS instances (if LocalStack supports)
awslocal rds create-db-instance \
  --db-instance-identifier prod-db-1 \
  --db-instance-class db.m5.2xlarge \
  --storage-type io1 \
  --allocated-storage 1000 \
  --publicly-accessible \
  --no-multi-az \
  --no-backup-retention-period

# Create DB in dev environment but with high compute
awslocal rds create-db-instance \
  --db-instance-identifier dev-db \
  --db-instance-class db.r5.4xlarge \
  --allocated-storage 500
```

**Expected Alerts:**
- ✓ Public RDS instances
- ✓ RDS without backups
- ✓ RDS without Multi-AZ
- ✓ Oversized RDS for dev environment
- ✓ Old RDS engine versions

---

### **ВАРИАНТ 4: VPC & Network - Poor Configuration**

```bash
# Create public subnets without proper controls
awslocal ec2 create-vpc --cidr-block 10.0.0.0/16
awslocal ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a

# Create Internet Gateway and attach
awslocal ec2 create-internet-gateway
awslocal ec2 attach-internet-gateway --internet-gateway-id igw-xxx --vpc-id vpc-xxx

# Route everything through IGW (public)
awslocal ec2 create-route-table --vpc-id vpc-xxx
awslocal ec2 create-route --route-table-id rtb-xxx --destination-cidr-block 0.0.0.0/0 --gateway-id igw-xxx

# Create NAT Gateway but without Elastic IP (common mistake)
awslocal ec2 create-nat-gateway --subnet-id subnet-xxx

# Create VPC with no VPC Flow Logs (no monitoring)
# Create multiple VPCs for different environments (management overhead)
```

**Expected Alerts:**
- ✓ Subnets without proper NACL
- ✓ VPC Flow Logs not enabled
- ✓ Multiple unused VPCs
- ✓ NAT Gateways without proper routing
- ✓ Overly permissive route tables

---

### **ВАРИАНТ 5: CloudTrail & Logging - Disabled**

```bash
# Disable CloudTrail
awslocal cloudtrail stop-logging --name trail-name

# Create S3 bucket for CloudTrail but don't enable logging
awslocal s3 mb s3://cloudtrail-logs-disabled

# Create trail but don't enable log file validation
awslocal cloudtrail create-trail \
  --name insecure-trail \
  --s3-bucket-name cloudtrail-logs-disabled \
  --no-enable-log-file-validation \
  --no-is-multi-region-trail
```

**Expected Alerts:**
- ✓ CloudTrail disabled
- ✓ CloudTrail without log file validation
- ✓ Log files not encrypted
- ✓ No API logging for compliance

---

### **ВАРИАНТ 6: Compliance & Tagging Issues**

```bash
# Create resources without proper tags
for i in {1..20}; do
  awslocal ec2 create-volume \
    --availability-zone us-east-1a \
    --size 100 \
    # NO TAGS - COMPLIANCE ISSUE!
done

# Create resources with inconsistent tagging
awslocal ec2 run-instances \
  --image-id ami-xxx \
  --instance-type t3.micro \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Owner,Value=NoTeam}]"
  # Missing: Environment, CostCenter, Project, etc.
```

**Expected Alerts:**
- ✓ Untagged resources
- ✓ Inconsistent tagging
- ✓ Missing compliance tags
- ✓ Cost allocation tags missing

---

### **ВАРИАНТ 7: Reserved Instances & Savings Plans**

```bash
# Create on-demand instances but not reserve them
for i in {1..50}; do
  awslocal ec2 run-instances \
    --image-id ami-xxx \
    --instance-type m5.large \
    # Should be reserved for better price!
done

# Create reserved instances that aren't being used
awslocal ec2 purchase-reserved-instances-offering \
  --reserved-instances-offering-id xxxxxxx \
  --instance-count 100  # Way too many, not in use
```

**Expected Alerts:**
- ✓ On-demand instances that should be reserved
- ✓ Unused reserved instances
- ✓ Wasted Reserved Instance commitments
- ✓ Savings Plans coverage opportunities

---

### **ВАРИАНТ 8: Data Transfer & Cross-Region Costs**

```bash
# Create volumes in multiple regions (expensive)
for region in us-east-1 us-west-2 eu-west-1; do
  for i in {1..10}; do
    awslocal ec2 create-volume \
      --availability-zone ${region}a \
      --size 500 \
      # Multiple regions = data transfer costs!
  done
done

# Create AMI copies across regions (storage waste)
# Create cross-region snapshot copies
```

**Expected Alerts:**
- ✓ Unnecessary multi-region duplication
- ✓ Cross-region data transfer costs
- ✓ Unused regional resources
- ✓ Snapshot copies in multiple regions

---

### **ВАРИАНТ 9: Load Balancers & Unused Network Resources**

```bash
# Create Load Balancers but don't attach instances
awslocal elbv2 create-load-balancer \
  --name unused-alb-1 \
  --subnets subnet-xxx subnet-yyy \
  # No targets! - Wasted money

# Create Network Interfaces but don't use them
awslocal ec2 create-network-interface \
  --subnet-id subnet-xxx \
  # Unattached - $0.005 per hour per ENI

# Create VPN connections but unused
awslocal ec2 create-vpn-connection \
  --type ipsec.1 \
  --customer-gateway-id cgw-xxx \
  --vpn-gateway-id vgw-xxx \
  # Costs $0.05/hour if not used!
```

**Expected Alerts:**
- ✓ Unused/idle load balancers
- ✓ Unattached network interfaces
- ✓ Unused VPN connections
- ✓ NAT Gateways with no traffic

---

### **ВАРИАНТ 10: Lambda & Compute Waste**

```bash
# Create Lambda functions with excessive memory/timeout
awslocal lambda create-function \
  --function-name unused-lambda-1 \
  --memory-size 3008 \
  --timeout 900 \
  --role arn:aws:iam::123456789012:role/service-role/MyRole \
  # Oversized for what it does

# Create Lambda with no reserved concurrency alerts
# Create Lambda versions accumulating
# Create Lambda layers that aren't used
```

**Expected Alerts:**
- ✓ Oversized Lambda functions
- ✓ Unused Lambda functions (no invocations)
- ✓ Lambda with excessive timeout
- ✓ Lambda function versions not cleaned up

---

## 🎯 Какой добавить в первую очередь?

### **РЕКОМЕНДАЦИЯ:**

```bash
# Минимальный набор для полного демо:
# 1. S3 Buckets (ВАРИАНТ 2) - очень видимо, понятно
# 2. IAM (ВАРИАНТ 1) - критичные security alerts
# 3. VPC/Network (ВАРИАНТ 4) - infrastructure risks
# 4. Compliance/Tags (ВАРИАНТ 6) - governance
```

---

## 📋 Как использовать обновленный скрипт:

```bash
# Скопировать скрипт в LocalStack контейнер
docker cp generate-massive-infra.sh localstack-container:/tmp/

# Запустить внутри контейнера
docker exec -it localstack-container bash /tmp/generate-massive-infra.sh

# Или используя AWS CLI с LocalStack endpoint
export AWS_ENDPOINT_URL=http://localhost:4566
bash generate-massive-infra.sh
```

---

## 🔍 Проверить что создалось:

```bash
# Все инстансы
awslocal ec2 describe-instances --query 'Reservations[].Instances[].InstanceId'

# Все диски
awslocal ec2 describe-volumes --query 'Volumes[].VolumeId'

# Все Security Groups
awslocal ec2 describe-security-groups --query 'SecurityGroups[].GroupId'

# Все Elastic IPs
awslocal ec2 describe-addresses --query 'Addresses[].PublicIp'
```

---

## 📊 Ожидаемый результат в AWS Optimizer:

После запуска скрипта и сканирования должно быть:

```
🔴 CRITICAL: 25+ алертов
🔴 HIGH: 40+ алертов
🟡 MEDIUM: 20+ алертов
🟠 WARNING: 60+ алертов
ℹ️  INFO: 15+ алертов

ВСЕГО: 160+ алертов
```

---

## 💡 Советы:

1. **Начните с текущего скрипта** - уже очень много рисков
2. **Добавьте S3 buckets** - очень видимо и понятно
3. **Добавьте IAM issues** - критичные для безопасности
4. **Добавьте таги** - важно для compliance
5. **Не переусложняйте** - LocalStack имеет ограничения, не все сервисы поддерживает

---

**Нужны еще какие-то специфические типы рисков?** Дайте знать! 🚀
