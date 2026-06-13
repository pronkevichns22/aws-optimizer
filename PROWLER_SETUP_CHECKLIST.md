# 📋 Prowler Setup Checklist for AWS Optimizer

Use this checklist to ensure Prowler is properly installed and integrated with your AWS Optimizer.

---

## ✅ Pre-Installation Check

- [ ] **Python 3.9+ installed**
  - Run: `python --version`
  - Expected: Python 3.9 or higher
  - If missing: Download from https://www.python.org/downloads/

- [ ] **pip available**
  - Run: `pip --version`
  - Expected: pip 23.x or higher
  - If missing: Python installation should include pip

- [ ] **AWS credentials configured**
  - File: `server/.env`
  - Required: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
  - Test: Can you access AWS resources?

- [ ] **Git Bash or PowerShell available**
  - Run: `pwsh --version` or `bash --version`
  - For commands: Use PowerShell with Administrator rights

---

## 🔧 Installation Steps

### Option A: Standard Installation (pip)

- [ ] **Open PowerShell as Administrator**
  - Right-click → "Run as Administrator"

- [ ] **Run installation command**
  ```powershell
  pip install prowler-cloud --upgrade
  ```
  - Expected time: 2-3 minutes
  - Wait for: "Successfully installed" message

- [ ] **Verify installation**
  ```powershell
  prowler --version
  ```
  - Expected: `Prowler 4.x.x`

- [ ] **Test Prowler command**
  ```powershell
  prowler --help
  ```
  - Expected: Displays help text

### Option B: Automatic Installation (Script)

- [ ] **Run installation script**
  ```powershell
  cd c:\Users\pronk\aws-optimizer
  .\install-prowler.ps1
  ```
  - Script will: Check Python, install Prowler, verify

- [ ] **Script completed successfully**
  - Expected: "Installation Complete!" message
  - If errors: Refer to Option A

### Option C: Docker (Alternative)

- [ ] **Docker Desktop installed**
  - Download: https://www.docker.com/products/docker-desktop
  - Status: Docker daemon running

- [ ] **Docker Prowler image available**
  ```powershell
  docker pull public.ecr.aws/prowler-cloud/prowler:latest
  ```

- [ ] **Set Docker mode in .env** (optional)
  ```env
  PROWLER_USE_DOCKER=true
  ```

---

## 🧪 Verification Steps

### Prowler Accessibility

- [ ] **Direct command works**
  ```powershell
  prowler --version
  ```
  - If error: Restart PowerShell

- [ ] **Python module works**
  ```powershell
  python -m prowler --version
  ```
  - If error: Check Python installation

- [ ] **Find Prowler location**
  ```powershell
  where prowler
  ```
  - Should display: C:\....\Python\...\prowler.exe

### AWS Credentials

- [ ] **Credentials are readable**
  ```powershell
  cat server/.env | grep AWS
  ```
  - Should display: AWS_ACCESS_KEY_ID, etc.

- [ ] **Credentials are valid**
  - Test: Run a scan (see below)
  - Expected: No "credentials not found" errors

- [ ] **AWS region is set**
  ```env
  AWS_REGION=us-east-1  # or your region
  ```

### Server Integration

- [ ] **Prowler imports are present**
  - File: `server/src/index.ts`
  - Check: Import statements include `getProwlerInfo`, `runProwlerCISBenchmark`

- [ ] **API endpoints exist**
  - GET `/api/prowler/status`
  - GET `/api/prowler/install-instructions`

- [ ] **Server starts without errors**
  ```powershell
  cd server
  npm run dev
  ```
  - Expected: No errors in console
  - Look for: "🚀 Сервер запущен"

---

## 🎯 First Scan Test

### Trigger a scan via API

- [ ] **Get your auth token** (if required)

- [ ] **Call scan endpoint**
  ```powershell
  $token = "your_token"
  $headers = @{ "Authorization" = "Bearer $token" }
  
  Invoke-WebRequest -Uri "http://localhost:5000/api/scan" `
    -Method Post `
    -ContentType "application/json" `
    -Headers $headers `
    -Body '{"accessKeyId":"xxx","secretAccessKey":"xxx","region":"us-east-1"}' `
    -UseBasicParsing
  ```

- [ ] **Check for Prowler output in console**
  ```
  🔍 Running Prowler CIS AWS Benchmark Scanner...
  🚀 Running Prowler scan...
  ✅ Prowler scan complete: XXX findings
  ```

- [ ] **Verify security findings in response**
  - Look for: Security alerts with CIS benchmark info
  - Should include: Title, description, severity, remediation

### Dashboard Integration

- [ ] **View findings on Security Dashboard**
  - URL: http://localhost:5173/security
  - Expected: New alerts from Prowler appear

- [ ] **Check alert details**
  - Click on CIS alerts
  - Expected: Shows full remediation info

---

## 🚨 Troubleshooting

### If "prowler command not found"

- [ ] Restart PowerShell completely (close and reopen)
- [ ] Check Python PATH: `python -m pip show prowler-cloud`
- [ ] Reinstall: `pip install --force-reinstall prowler-cloud`

### If AWS credentials error

- [ ] Verify credentials in `server/.env`
- [ ] Test credentials: `aws sts get-caller-identity`
- [ ] Check region is valid: `us-east-1`, `eu-west-1`, etc.

### If Prowler scan times out

- [ ] Reduce services scanned in `src/prowler-integration.ts`
- [ ] Increase timeout value in code
- [ ] Run smaller scan: single region only

### If no findings returned

- [ ] Check IAM permissions in AWS
- [ ] Verify AWS credentials have access to: EC2, IAM, S3, RDS, etc.
- [ ] Run with verbose: `prowler -v`

---

## ✅ Final Checklist

- [ ] Prowler installed and accessible
- [ ] AWS credentials configured in `.env`
- [ ] Server starts without errors
- [ ] API endpoints respond (test `/api/health`)
- [ ] First scan completes successfully
- [ ] Prowler findings appear in results
- [ ] Dashboard displays security alerts
- [ ] At least one CIS recommendation is visible

---

## 🎉 Success Criteria

You're done when:

✅ Running `prowler --version` shows version number
✅ Server logs show "Prowler scan complete" with findings
✅ Dashboard displays security alerts from Prowler
✅ Alerts include CIS benchmark references and remediation steps
✅ No errors in server console during scan

---

## 📚 Additional Resources

- **Full Setup Guide**: `PROWLER_WINDOWS_SETUP.md`
- **Quick Start**: `PROWLER_QUICK_START.md`
- **Installation Script**: `install-prowler.ps1`
- **Prowler Docs**: https://docs.prowler.cloud/
- **CIS Benchmarks**: https://www.cisecurity.org/cis-benchmarks/

---

## 💡 Tips

1. **First installation might take 5-10 minutes** - be patient, pip downloads ~150MB
2. **Always run PowerShell as Administrator** for pip commands
3. **If stuck, restart PowerShell** - PATH changes sometimes need a restart
4. **Test credentials before scanning** - saves debugging time
5. **Check the guide documents** - they have detailed troubleshooting

---

**Your AWS Optimizer now has enterprise-grade security scanning! 🚀**
