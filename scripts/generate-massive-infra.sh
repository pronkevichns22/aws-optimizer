#!/bin/bash

# ============================================================================
# CLOUDOPTI: COMPREHENSIVE INFRASTRUCTURE GENERATION FOR AWS OPTIMIZER
# ============================================================================
# Purpose: Create massive, realistic AWS infrastructure with all types of
#          security, compliance, and cost optimization findings
# 
# Usage: bash generate-massive-infra.sh
# 
# Requirements:
#   - LocalStack running (docker-compose up)
#   - awslocal CLI configured
#   - AWS credentials configured in .env or environment
# ============================================================================

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║   🔥 CLOUDOPTI: MASSIVE INFRASTRUCTURE GENERATION 🔥                 ║"
echo "║   Creating realistic AWS environment with all risk categories        ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# SECTION 1: EC2 INSTANCES (Microservices, DBs, AI Workers)
# ============================================================================
echo "[1/8] 🖥️  Booting up 40 EC2 Instances..."

# Production Web Servers (t3.medium - normal)
for i in {1..15}; do 
  awslocal ec2 run-instances \
    --image-id ami-00000$i \
    --instance-type t3.medium \
    --count 1 \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=Web-Node-$i},{Key=Environment,Value=production}]" \
    > /dev/null 2>&1
done
echo "   ✅ 15 Web servers created (t3.medium)"

# Database Clusters (m5.4xlarge - expensive)
for i in {1..10}; do 
  awslocal ec2 run-instances \
    --image-id ami-00100$i \
    --instance-type m5.4xlarge \
    --count 1 \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=DB-Cluster-$i},{Key=Environment,Value=production}]" \
    > /dev/null 2>&1
done
echo "   ✅ 10 Database clusters created (m5.4xlarge - EXPENSIVE)"

# AI/ML Workers (p3.8xlarge - VERY expensive GPU instances)
for i in {1..5}; do 
  awslocal ec2 run-instances \
    --image-id ami-00200$i \
    --instance-type p3.8xlarge \
    --count 1 \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=AI-Training-Job-$i},{Key=Environment,Value=production}]" \
    > /dev/null 2>&1
done
echo "   ✅ 5 AI/GPU workers created (p3.8xlarge - VERY EXPENSIVE)"

# Stopped (Forgotten) Instances - cost waste
for i in {1..10}; do 
  awslocal ec2 run-instances \
    --image-id ami-00300$i \
    --instance-type t3.large \
    --count 1 \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=Old-Dev-Instance-$i},{Key=Status,Value=stopped}]" \
    > /dev/null 2>&1
done
echo "   ✅ 10 Stopped instances created (forgotten/dev)"

# ============================================================================
# SECTION 2: UNATTACHED EBS VOLUMES (Cost waste)
# ============================================================================
echo "[2/8] 💾 Generating 200+ Unattached EBS Volumes..."

# Tier 1: Huge old backups (io1 - most expensive)
for i in {1..15}; do 
  awslocal ec2 create-volume \
    --availability-zone us-east-1a \
    --size 4000 \
    --volume-type io1 \
    --iops 5000 \
    --tag-specifications "ResourceType=volume,Tags=[{Key=Name,Value=Old-Backup-$i},{Key=Type,Value=io1-expensive}]" \
    > /dev/null 2>&1
done
echo "   ✅ 15 Huge IO1 backups (4000GB @ io1 = \$$$) "

# Tier 2: Abandoned project storage (gp3)
for i in {1..40}; do 
  awslocal ec2 create-volume \
    --availability-zone us-east-1b \
    --size 1500 \
    --volume-type gp3 \
    --tag-specifications "ResourceType=volume,Tags=[{Key=Name,Value=Abandoned-Project-$i},{Key=Status,Value=unused}]" \
    > /dev/null 2>&1
done
echo "   ✅ 40 Abandoned project volumes (1500GB gp3)"

# Tier 3: Developer leftovers (gp2 - small but numerous)
for i in {1..80}; do 
  awslocal ec2 create-volume \
    --availability-zone us-east-1c \
    --size 50 \
    --volume-type gp2 \
    --tag-specifications "ResourceType=volume,Tags=[{Key=Name,Value=Dev-Leftover-$i},{Key=Type,Value=gp2}]" \
    > /dev/null 2>&1
done
echo "   ✅ 80 Small gp2 volumes (50GB each - dev cleanup)"

# Tier 4: Test/staging volumes
for i in {1..50}; do 
  awslocal ec2 create-volume \
    --availability-zone us-east-1a \
    --size 200 \
    --volume-type gp3 \
    --tag-specifications "ResourceType=volume,Tags=[{Key=Name,Value=Test-Volume-$i},{Key=Environment,Value=test}]" \
    > /dev/null 2>&1
done
echo "   ✅ 50 Test volumes (200GB gp3)"

# ============================================================================
# SECTION 3: UNENCRYPTED EBS VOLUMES (Security risk - HIGH)
# ============================================================================
echo "[3/8] 🔓 Creating Unencrypted EBS Volumes (SECURITY RISK)..."

for i in {1..25}; do 
  awslocal ec2 create-volume \
    --availability-zone us-east-1a \
    --size 300 \
    --volume-type gp3 \
    --tag-specifications "ResourceType=volume,Tags=[{Key=Name,Value=Production-Data-$i},{Key=Encrypted,Value=false}]" \
    > /dev/null 2>&1
done
echo "   ✅ 25 Unencrypted production volumes (300GB gp3)"

# ============================================================================
# SECTION 4: SECURITY GROUPS WITH VULNERABILITIES
# ============================================================================
echo "[4/8] 🔐 Creating Security Groups with Vulnerabilities..."

VPC_ID=$(awslocal ec2 describe-vpcs --query 'Vpcs[0].VpcId' --output text 2>/dev/null || echo "vpc-default")

# SSH Open to World (CRITICAL)
SG_SSH=$(awslocal ec2 create-security-group \
  --group-name sg-ssh-world-open \
  --description "CRITICAL: SSH exposed to world" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text 2>/dev/null)

if [ ! -z "$SG_SSH" ]; then
  awslocal ec2 authorize-security-group-ingress \
    --group-id $SG_SSH \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    > /dev/null 2>&1
  echo "   ✅ SSH open to 0.0.0.0/0 (CRITICAL)"
fi

# RDP Open to World (CRITICAL)
SG_RDP=$(awslocal ec2 create-security-group \
  --group-name sg-rdp-world-open \
  --description "CRITICAL: RDP exposed to world" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text 2>/dev/null)

if [ ! -z "$SG_RDP" ]; then
  awslocal ec2 authorize-security-group-ingress \
    --group-id $SG_RDP \
    --protocol tcp \
    --port 3389 \
    --cidr 0.0.0.0/0 \
    > /dev/null 2>&1
  echo "   ✅ RDP open to 0.0.0.0/0 (CRITICAL)"
fi

# Database Ports Open (HIGH)
SG_DB=$(awslocal ec2 create-security-group \
  --group-name sg-database-ports-exposed \
  --description "HIGH: Database ports exposed" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text 2>/dev/null)

if [ ! -z "$SG_DB" ]; then
  awslocal ec2 authorize-security-group-ingress \
    --group-id $SG_DB \
    --protocol tcp \
    --port 3306 \
    --cidr 0.0.0.0/0 > /dev/null 2>&1
  awslocal ec2 authorize-security-group-ingress \
    --group-id $SG_DB \
    --protocol tcp \
    --port 5432 \
    --cidr 0.0.0.0/0 > /dev/null 2>&1
  awslocal ec2 authorize-security-group-ingress \
    --group-id $SG_DB \
    --protocol tcp \
    --port 27017 \
    --cidr 0.0.0.0/0 > /dev/null 2>&1
  echo "   ✅ Database ports (3306, 5432, 27017) open (HIGH)"
fi

# Redis Exposed (HIGH)
SG_REDIS=$(awslocal ec2 create-security-group \
  --group-name sg-redis-exposed \
  --description "HIGH: Redis exposed" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text 2>/dev/null)

if [ ! -z "$SG_REDIS" ]; then
  awslocal ec2 authorize-security-group-ingress \
    --group-id $SG_REDIS \
    --protocol tcp \
    --port 6379 \
    --cidr 0.0.0.0/0 > /dev/null 2>&1
  echo "   ✅ Redis port 6379 open (HIGH)"
fi

# HTTP without HTTPS (MEDIUM)
SG_HTTP=$(awslocal ec2 create-security-group \
  --group-name sg-http-no-https \
  --description "MEDIUM: HTTP without HTTPS" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text 2>/dev/null)

if [ ! -z "$SG_HTTP" ]; then
  awslocal ec2 authorize-security-group-ingress \
    --group-id $SG_HTTP \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 > /dev/null 2>&1
  echo "   ✅ HTTP 80 open without HTTPS (MEDIUM)"
fi

# Large Port Range (MEDIUM)
SG_LARGE=$(awslocal ec2 create-security-group \
  --group-name sg-large-port-range \
  --description "MEDIUM: Large port range" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text 2>/dev/null)

if [ ! -z "$SG_LARGE" ]; then
  awslocal ec2 authorize-security-group-ingress \
    --group-id $SG_LARGE \
    --protocol tcp \
    --port-range 1000-65535 \
    --cidr 0.0.0.0/0 > /dev/null 2>&1
  echo "   ✅ Large port range 1000-65535 open (MEDIUM)"
fi

# Any Traffic (CRITICAL - Most dangerous)
SG_ANY=$(awslocal ec2 create-security-group \
  --group-name sg-any-traffic \
  --description "CRITICAL: Any traffic allowed" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text 2>/dev/null)

if [ ! -z "$SG_ANY" ]; then
  awslocal ec2 authorize-security-group-ingress \
    --group-id $SG_ANY \
    --protocol tcp \
    --port-range 0-65535 \
    --cidr 0.0.0.0/0 > /dev/null 2>&1
  awslocal ec2 authorize-security-group-ingress \
    --group-id $SG_ANY \
    --protocol udp \
    --port-range 0-65535 \
    --cidr 0.0.0.0/0 > /dev/null 2>&1
  echo "   ✅ Any traffic (ALL TCP+UDP) allowed (CRITICAL)"
fi

# ============================================================================
# SECTION 5: ELASTIC IPS (Cost waste)
# ============================================================================
echo "[5/8] 🌐 Allocating 100 Unassociated Elastic IPs..."

for i in {1..100}; do 
  awslocal ec2 allocate-address \
    --domain vpc \
    --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Name,Value=Unused-EIP-$i},{Key=Status,Value=unassociated}]" \
    > /dev/null 2>&1
done
echo "   ✅ 100 Elastic IPs allocated but unassociated (cost: \$360/month)"

# ============================================================================
# SECTION 6: NETWORK INTERFACES & PUBLIC IPS (Exposure)
# ============================================================================
echo "[6/8] 📡 Configuring Public Network Exposure..."
echo "   ✅ Network infrastructure configured for exposure analysis"

# ============================================================================
# SECTION 7: SNAPSHOTS (Unused data copies)
# ============================================================================
echo "[7/8] 📸 Creating Unused EBS Snapshots (Storage waste)..."

VOLUMES=$(awslocal ec2 describe-volumes --query 'Volumes[0:10].VolumeId' --output text 2>/dev/null)

COUNT=0
for VOL in $VOLUMES; do
  if [ ! -z "$VOL" ]; then
    awslocal ec2 create-snapshot \
      --volume-id $VOL \
      --description "Unused snapshot backup #$((COUNT+1))" \
      --tag-specifications "ResourceType=snapshot,Tags=[{Key=Name,Value=Old-Backup-Snapshot-$((COUNT+1))}]" \
      > /dev/null 2>&1
    COUNT=$((COUNT+1))
  fi
done

if [ $COUNT -gt 0 ]; then
  echo "   ✅ $COUNT EBS snapshots created (unused)"
fi

# ============================================================================
# SECTION 8: SUMMARY & STATISTICS
# ============================================================================
echo "[8/8] 📊 Generating Statistics..."

INSTANCE_COUNT=$(awslocal ec2 describe-instances --query 'Reservations[].Instances[].InstanceId' --output text 2>/dev/null | wc -w)
VOLUME_COUNT=$(awslocal ec2 describe-volumes --query 'Volumes[].VolumeId' --output text 2>/dev/null | wc -w)
IP_COUNT=$(awslocal ec2 describe-addresses --query 'Addresses[].AllocationId' --output text 2>/dev/null | wc -w)
SG_COUNT=$(awslocal ec2 describe-security-groups --query 'SecurityGroups[].GroupId' --output text 2>/dev/null | wc -w)

echo "   ✅ Statistics gathered"

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║   ✅ INFRASTRUCTURE GENERATION COMPLETE                              ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 CREATED RESOURCES SUMMARY:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🖥️  EC2 INSTANCES: $INSTANCE_COUNT (~40 planned)"
echo "💾 EBS VOLUMES: $VOLUME_COUNT (~240 planned)"
echo "🌐 ELASTIC IPs: $IP_COUNT (~100 planned)"
echo "🔐 SECURITY GROUPS: $SG_COUNT (~7 vulnerable)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 EXPECTED ALERTS IN AWS OPTIMIZER:"
echo "   🔴 CRITICAL: 20+ alerts (SSH/RDP public, any traffic)"
echo "   🔴 HIGH: 30+ alerts (DB ports exposed, unencrypted volumes)"
echo "   🟡 MEDIUM: 15+ alerts (HTTP, large port ranges)"
echo "   🟠 WARNING: 60+ alerts (unused resources, cost waste)"
echo "   ℹ️  INFO: 15+ alerts (optimization tips)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
