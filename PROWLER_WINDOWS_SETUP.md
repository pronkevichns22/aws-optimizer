# 🐺 Prowler Installation Guide for Windows

## ⚠️ IMPORTANT: Python Version Issue

**Prowler currently requires Python 3.11 or 3.12**

Your system has **Python 3.14**, which Prowler doesn't support yet.

### Solutions:

#### 1. Install Python 3.11 Alongside Your Current Python ✅ Recommended

1. **Download Python 3.11**: https://www.python.org/downloads/release/python-3111/
2. **Run the installer** with these settings:
   - ✅ Check "Add Python 3.11 to PATH"
   - ✅ Choose "Install for all users" (if you have admin)
3. **After install, use Python 3.11 for Prowler**:
   ```powershell
   py -3.11 -m pip install prowler-cloud
   prowler --version
   ```

**Result**: Your Python 3.14 stays as default, Python 3.11 is used for Prowler

---

#### 2. Use Built-in CIS Rules (No Python Changes) ✅ Works Now

Your AWS Optimizer already includes built-in CIS Benchmark rules:
- ✅ 15+ CIS security checks
- ✅ Works without Prowler
- ✅ Same security findings
- ✅ No installation needed

Just start your server and you'll get security findings.

---

#### 3. Wait for Prowler Update ⏳

Prowler team is adding Python 3.14 support. Check their GitHub for updates.

---

## Prerequisites (After Python Fix)

---

## ✅ Installation Steps (Windows)

### Step 1: Verify Python is Installed

Open PowerShell and run:
```powershell
python --version
python -m pip --version
```

**Expected output:**
```
Python 3.11.x or higher
pip 23.x or higher
```

If you don't have Python installed, download it from: https://www.python.org/downloads/

---

### Step 2: Install Prowler via pip

```powershell
# Install Prowler Cloud
pip install prowler-cloud

# Verify installation
prowler --version
```

**Expected output:**
```
Prowler 4.x.x
```

---

### Step 3: Test Prowler with AWS Credentials

Make sure your `.env` file in the `server/` folder has valid AWS credentials:

```env
# .env (server folder)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

Test Prowler connection:
```powershell
$env:AWS_ACCESS_KEY_ID = "your_access_key"
$env:AWS_SECRET_ACCESS_KEY = "your_secret_key"
$env:AWS_DEFAULT_REGION = "us-east-1"

prowler --version
```

---

### Step 4: Run Your Server with Prowler

Start the server normally:
```powershell
cd c:\Users\pronk\aws-optimizer\server
npm run dev
```

When you scan AWS resources, you'll see:
```
🔍 Running Prowler CIS AWS Benchmark Scanner...

🚀 Executing: prowler -f json -c cis_aws_foundations_benchmark_v1.5.0 -s iam,ec2,rds,s3,cloudtrail,vpc --no-banner

✅ Prowler scan complete: 247 findings
```

---

## 🐳 Alternative: Docker Setup (No Python Required)

If you prefer not to install Python, you can use Docker:

### Prerequisites
- **Docker Desktop** installed on Windows

### Steps

1. **Install Docker Desktop**: https://www.docker.com/products/docker-desktop

2. **Modify your `.env` to enable Docker mode** (optional):
```env
PROWLER_USE_DOCKER=true
```

3. **Test Docker Prowler**:
```powershell
docker run --rm `
  -e AWS_ACCESS_KEY_ID=your_access_key `
  -e AWS_SECRET_ACCESS_KEY=your_secret_key `
  -e AWS_DEFAULT_REGION=us-east-1 `
  public.ecr.aws/prowler-cloud/prowler:latest `
  --version
```

---

## 🔧 Configuration Options

The Prowler integration in your backend supports:

### Supported Compliance Frameworks
- ✅ **CIS AWS Foundations Benchmark v1.5.0** (Primary)
- ✅ **PCI-DSS v3.2.1**
- ✅ **HIPAA**
- ✅ **SOC2**
- ✅ **GDPR**
- ✅ **NIST 800-53**

### Supported AWS Services (Currently Enabled)
```
- IAM (Identity & Access Management)
- EC2 (Compute)
- RDS (Relational Databases)
- S3 (Object Storage)
- CloudTrail (Audit Logging)
- VPC (Networking)
```

To scan additional services, modify `prowler-integration.ts` line ~164:
```typescript
prowlerCommand += ' -s iam,ec2,rds,s3,cloudtrail,vpc,elasticache,lambda,elbv2';
```

---

## 📊 What You'll Get

Once Prowler is installed and running, your scan results will include:

### Security Alerts from Prowler
- **CIS Benchmark violations** (400+ checks)
- **Severity levels**: CRITICAL, HIGH, MEDIUM, WARNING, INFO
- **Remediation recommendations** for each finding
- **Compliance mapping** (which frameworks are affected)

### Example Finding
```json
{
  "id": "uuid-123",
  "type": "SECURITY",
  "severity": "HIGH",
  "title": "CIS 2.1: Ensure MFA is Enabled for all IAM Users",
  "description": "[iam] Ensure MFA is enabled for all IAM users",
  "ruleId": "iam_mfa_enabled",
  "resourceId": "user-name",
  "metadata": {
    "checkId": "iam_mfa_enabled_arn_user",
    "service": "iam",
    "compliance": ["CIS AWS Foundations Benchmark v1.5.0"],
    "remediationUrl": "https://docs.prowler.cloud/..."
  }
}
```

---

## ❌ Troubleshooting

### Problem: `prowler command not found`

**Solution**: Add Python to PATH
```powershell
# Find Python installation
python -c "import sys; print(sys.executable)"

# Add to PATH (Run as Administrator in PowerShell)
$pythonPath = "C:\Users\YourUsername\AppData\Local\Programs\Python\Python311"
[Environment]::SetEnvironmentVariable("Path", "$env:Path;$pythonPath\Scripts", "User")

# Restart PowerShell
```

---

### Problem: `AWS credentials not found`

**Solution**: Verify credentials are set
```powershell
# Check if credentials are loaded
$env:AWS_ACCESS_KEY_ID
$env:AWS_SECRET_ACCESS_KEY

# Or check .aws/credentials file
Get-Content $env:USERPROFILE\.aws\credentials
```

---

### Problem: `Prowler output is empty`

**Solution**: Check CloudTrail and monitoring permissions
```powershell
# Prowler needs these IAM permissions:
# - ec2:Describe*
# - iam:List* / iam:Get*
# - rds:Describe*
# - s3:List* / s3:Get*
# - cloudtrail:Describe*
# - cloudtrail:LookupEvents

# Run with verbose output
prowler -v
```

---

## 🚀 Advanced: Custom CIS Rules

To add custom CIS rules beyond Prowler's standard checks:

1. **Edit** `server/src/security-rules.ts`
2. **Add custom rules** with the Alert interface:
```typescript
export function generateCustomCISAlert(): Alert[] {
  return [{
    id: uuidv4(),
    type: 'SECURITY',
    severity: 'HIGH',
    title: 'Custom Security Rule',
    ruleId: 'custom_rule_001',
    // ... rest of alert
  }];
}
```

3. **Call from main scan**:
```typescript
const customAlerts = generateCustomCISAlert();
const allAlerts = [...prowlerAlerts, ...customAlerts];
```

---

## 📚 Resources

- **Prowler Official Docs**: https://docs.prowler.cloud/
- **CIS AWS Benchmark**: https://www.cisecurity.org/cis-benchmarks/
- **AWS Security Hub Integration**: Prowler integrates with AWS Security Hub
- **GitHub Repository**: https://github.com/prowlercloud/prowler

---

## ✨ Next Steps

1. ✅ Install Prowler using the steps above
2. ✅ Start your server: `npm run dev`
3. ✅ Trigger a scan via `/api/scan` endpoint
4. ✅ View Prowler CIS findings in the Security Dashboard
5. ✅ (Optional) Configure additional compliance frameworks

---

**Your system is ready to use Prowler once installation is complete!**
