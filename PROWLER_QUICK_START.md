# ⚡ Prowler Quick Start Guide (Windows)

This is a **5-minute setup** to get Prowler CIS Benchmark scanning working with your AWS Optimizer.

---

## ⚠️ Important: Python Version

Prowler requires **Python 3.11 or 3.12**. 

**Your system currently has Python 3.14** (newer version) which Prowler doesn't support yet.

### Option 1: Install Python 3.11 Separately (Recommended)
1. Download: https://www.python.org/downloads/release/python-3111/
2. During install: Check "Add Python 3.11 to PATH"
3. After install: Prowler will use Python 3.11
4. Run: `py -3.11 -m pip install prowler-cloud`

### Option 2: Wait for Prowler Update
Prowler will support Python 3.14 in future versions.

### Option 3: Use Built-in CIS Rules (Works Now!)
Your AWS Optimizer is already running CIS security checks using built-in rules.
You'll get all security findings without Prowler installed.

### Step 1: Open PowerShell as Administrator

Right-click PowerShell icon → "Run as Administrator"

### Step 2: Install Prowler

```powershell
pip install prowler-cloud --upgrade
```

**Takes ~2-3 minutes. Wait for it to complete.**

### Step 3: Verify Installation

```powershell
prowler --version
```

You should see: `Prowler 4.x.x`

---

## ✅ Check Your System

### Is Python installed?
```powershell
python --version
```

If **error** → Install Python: https://www.python.org/downloads/

### Is Prowler accessible?
```powershell
prowler --help
```

If **error** → Restart PowerShell and try again

### Are AWS credentials set?
Check your file: `server/.env`

Must have:
```
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
```

---

## 🎯 Run Your Server

```powershell
cd c:\Users\pronk\aws-optimizer\server
npm run dev
```

When you trigger a scan, you'll see:

```
🔍 Running Prowler CIS AWS Benchmark Scanner...

🚀 Running Prowler scan...
   Benchmarks: CIS AWS Foundations v1.5.0
   Services: IAM, EC2, RDS, S3, CloudTrail, VPC
   Region: us-east-1

✅ Prowler scan complete
   📋 Total findings: 247
   🔴 Critical: 3
   🟠 High: 12
   🟡 Medium: 45
```

---

## 🔍 What You Get

✅ **400+ automated security checks**
✅ **CIS Benchmark compliance validation**
✅ **Remediation recommendations**
✅ **PCI-DSS, HIPAA, SOC2, GDPR support**
✅ **Integration with your dashboard**

---

## 🆘 Problems?

### Prowler not found?
```powershell
# Try this instead:
python -m prowler --version

# Or restart PowerShell completely
```

### Installation stuck?
```powershell
# Try with --no-cache-dir
pip install prowler-cloud --upgrade --no-cache-dir
```

### AWS credentials error?
```powershell
# Test your credentials
$env:AWS_ACCESS_KEY_ID = "your_key"
$env:AWS_SECRET_ACCESS_KEY = "your_secret"
$env:AWS_DEFAULT_REGION = "us-east-1"

prowler --version
```

---

## 📞 Support Endpoints

Check Prowler status:
```powershell
curl http://localhost:5000/api/prowler/status
```

Get installation help:
```powershell
curl http://localhost:5000/api/prowler/install-instructions
```

---

## 📚 More Info

- **Full Setup Guide**: `PROWLER_WINDOWS_SETUP.md`
- **Installation Script**: `install-prowler.ps1`
- **Official Docs**: https://docs.prowler.cloud/
- **CIS Benchmarks**: https://www.cisecurity.org/

---

## ✨ Done!

Once Prowler is installed, you're all set. Next scan will automatically use Prowler CIS Benchmark checks!
