# PowerShell script to install and verify Prowler on Windows
# Run this as Administrator

param(
    [switch]$SkipDockerCheck = $false,
    [switch]$UseDocker = $false
)

Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                 Prowler Installation Assistant for Windows                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host ""

# Check Python version
Write-Host "🔍 Checking Python version..." -ForegroundColor Yellow

$pythonVersion = python --version 2>&1 | Select-String "Python (\d+\.\d+)" | ForEach-Object { $_.Matches.Groups[1].Value }

if ($pythonVersion) {
    Write-Host "✅ Found Python $pythonVersion" -ForegroundColor Green
    
    # Check if version is 3.11 or 3.12
    if ($pythonVersion -match "^3\.(11|12)") {
        Write-Host "   Version is compatible with Prowler ✅" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  WARNING: Prowler requires Python 3.11 or 3.12" -ForegroundColor Yellow
        Write-Host "   Your version: $pythonVersion" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   SOLUTION:" -ForegroundColor Cyan
        Write-Host "   1. Install Python 3.11 from https://www.python.org/downloads/release/python-3111/" -ForegroundColor Cyan
        Write-Host "   2. Check 'Add Python 3.11 to PATH' during installation" -ForegroundColor Cyan
        Write-Host "   3. Then run: py -3.11 -m pip install prowler-cloud" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "   ALTERNATIVE:" -ForegroundColor Cyan
        Write-Host "   Your AWS Optimizer works with built-in CIS rules without Prowler" -ForegroundColor Cyan
        Write-Host "   Start server: npm run dev" -ForegroundColor Cyan
        exit 1
    }
} else {
    Write-Host "❌ Python not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Python 3.11 from: https://www.python.org/downloads/release/python-3111/" -ForegroundColor Yellow
    Write-Host "Make sure to check 'Add Python to PATH' during installation" -ForegroundColor Yellow
    exit 1
}

# Check pip
Write-Host "🔍 Checking pip installation..." -ForegroundColor Yellow

$pipCheck = pip --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ pip not found!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ $pipCheck" -ForegroundColor Green
}

Write-Host ""

# Install/Update Prowler
Write-Host "📦 Installing/Updating Prowler Cloud..." -ForegroundColor Yellow
Write-Host ""

pip install --upgrade prowler-cloud

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Prowler installed successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Verify Prowler
    $prowlerVersion = prowler --version 2>&1
    Write-Host "📌 Prowler Version: $prowlerVersion" -ForegroundColor Cyan
    
    # Check prowler location
    $prowlerLocation = (Get-Command prowler -ErrorAction SilentlyContinue).Source
    if ($prowlerLocation) {
        Write-Host "📌 Prowler Location: $prowlerLocation" -ForegroundColor Cyan
    }
    
} else {
    Write-Host ""
    Write-Host "❌ Failed to install Prowler" -ForegroundColor Red
    Write-Host ""
    Write-Host "If your Python version is 3.14 or higher:" -ForegroundColor Yellow
    Write-Host "  Install Python 3.11: https://www.python.org/downloads/release/python-3111/" -ForegroundColor Yellow
    Write-Host "  Then: py -3.11 -m pip install prowler-cloud" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🧪 Testing Prowler command..." -ForegroundColor Yellow

prowler --help > $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prowler command is accessible" -ForegroundColor Green
} else {
    Write-Host "⚠️  Prowler command test failed" -ForegroundColor Yellow
    Write-Host "    This might be a PATH issue. Try restarting PowerShell." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                          ✅ Installation Complete!                         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Make sure your AWS credentials are set in server/.env:" -ForegroundColor White
Write-Host "   AWS_ACCESS_KEY_ID=your_key" -ForegroundColor Gray
Write-Host "   AWS_SECRET_ACCESS_KEY=your_secret" -ForegroundColor Gray
Write-Host "   AWS_REGION=us-east-1" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start the server:" -ForegroundColor White
Write-Host "   cd c:\Users\pronk\aws-optimizer\server" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Trigger a scan via the API or dashboard" -ForegroundColor White
Write-Host ""
Write-Host "📚 For more help, see:" -ForegroundColor Cyan
Write-Host "   - PROWLER_WINDOWS_SETUP.md" -ForegroundColor Gray
Write-Host "   - PYTHON_311_PROWLER_SETUP.md (if Python version issue)" -ForegroundColor Gray
