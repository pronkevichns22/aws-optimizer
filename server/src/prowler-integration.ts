// ============================================================================
// FILE: prowler-integration.ts
// PURPOSE: Integration with Prowler CIS AWS Benchmark scanner
// Prowler is an open-source AWS security tool that performs 400+ checks
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

interface Alert {
  id: string;
  type: 'SECURITY' | 'FINOPS';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  resourceId: string;
  resourceName?: string;
  ruleId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface ProwlerFinding {
  check_id: string;
  check_title: string;
  check_type: string;
  service_name: string;
  severity: string;
  resource_id: string;
  resource_name: string;
  region: string;
  remediation_recommendation: string;
  compliance: string[];
  status: 'PASS' | 'FAIL' | 'WARNING';
}

/**
 * Check if Prowler is installed on the system
 * Works on Windows, macOS, and Linux
 */
export async function isProwlerInstalled(): Promise<boolean> {
  try {
    // Try different commands for cross-platform support
    const commands = [
      'prowler --version',
      'py -3.11 -m prowler --version',          // Windows Python 3.11
      'python -m prowler --version',
      'python3.11 -m prowler --version',        // Linux/Mac Python 3.11
      'python.exe -m prowler --version'
    ];

    for (const cmd of commands) {
      try {
        await execAsync(cmd, { timeout: 5000 });
        console.log(`  ✅ Found Prowler via: ${cmd}`);
        return true;
      } catch {
        continue;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Parse Prowler JSON output and convert to Alert format
 * Prowler outputs findings in JSON format that we transform to our Alert structure
 */
function parseProwlerFindings(jsonOutput: string): Alert[] {
  const alerts: Alert[] = [];

  try {
    const findings = JSON.parse(jsonOutput);
    
    if (!Array.isArray(findings)) {
      console.error('Invalid Prowler JSON format');
      return alerts;
    }

    for (const finding of findings) {
      // Only process FAIL and WARNING findings (PASS is good)
      if (finding.status === 'PASS') continue;

      // Map Prowler severity to our severity levels
      const severityMap: { [key: string]: Alert['severity'] } = {
        'critical': 'CRITICAL',
        'high': 'HIGH',
        'medium': 'MEDIUM',
        'low': 'WARNING',
        'info': 'INFO'
      };

      const severity = severityMap[finding.severity?.toLowerCase()] || 'MEDIUM';

      const alert: Alert = {
        id: uuidv4(),
        type: 'SECURITY',
        severity,
        title: finding.check_title || 'Unknown Check',
        description: `[${finding.service_name}] ${finding.check_title}\n\nRemediation: ${finding.remediation_recommendation || 'See AWS documentation'}`,
        resourceId: finding.resource_id || 'unknown',
        resourceName: finding.resource_name || finding.resource_id,
        ruleId: finding.check_id,
        timestamp: new Date(),
        metadata: {
          checkId: finding.check_id,
          service: finding.service_name,
          region: finding.region,
          compliance: finding.compliance,
          status: finding.status,
          remediationUrl: getRemediationUrl(finding.check_id),
          cisControl: extractCISControl(finding.check_id)
        }
      };

      alerts.push(alert);
    }

    console.log(`✅ Parsed ${alerts.length} Prowler findings`);
  } catch (error) {
    console.error('Error parsing Prowler JSON:', error);
  }

  return alerts;
}

/**
 * Extract CIS control number from check ID (e.g., "iam_1" -> "CIS 1.1")
 */
function extractCISControl(checkId: string): string {
  // Prowler check IDs follow pattern like "iam_mfa_enabled_arn_user", "ec2_public_eip", etc.
  // We map them to CIS controls
  const controlMap: { [key: string]: string } = {
    'iam_mfa_enabled': 'CIS 2.1',
    'iam_user_console_access': 'CIS 2.1',
    'iam_access_key_age': 'CIS 2.3',
    'ec2_public_eip': 'CIS 5.1',
    'ec2_security_group': 'CIS 5.1',
    'rds_publicly_accessible': 'CIS 2.2.5',
    's3_public_access_block': 'CIS 2.1.5',
    'cloudtrail_enabled': 'CIS 3.1',
    'cloudtrail_log_file_validation': 'CIS 3.2',
    'vpc_flow_logs': 'CIS 4.1',
  };

  for (const [key, control] of Object.entries(controlMap)) {
    if (checkId.includes(key)) {
      return control;
    }
  }

  return 'AWS Security Best Practice';
}

/**
 * Get remediation URL for a specific check
 */
function getRemediationUrl(checkId: string): string {
  const baseUrl = 'https://docs.prowler.cloud/en/latest/checks';
  // Convert check ID to proper format (e.g., iam_1 -> iam_1)
  return `${baseUrl}/${checkId}`;
}

/**
 * Run Prowler CIS benchmark check via CLI
 * Returns JSON array of findings
 * Supports Windows, macOS, and Linux
 */
export async function runProwlerCISBenchmark(credentials: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  isLocalStack?: boolean;
  endpoint?: string;
}): Promise<Alert[]> {
  console.log('\n🔍 Running Prowler CIS AWS Benchmark Scanner...\n');

  try {
    // Check if Prowler is installed
    const prowlerExists = await isProwlerInstalled();
    if (!prowlerExists) {
      console.warn('⚠️  Prowler not installed');
      console.warn('📌 Installation instructions:');
      console.warn('   Windows: pip install prowler-cloud');
      console.warn('   macOS:   brew install prowler');
      console.warn('   Linux:   pip install prowler-cloud');
      console.warn('📖 Full guide: see PROWLER_WINDOWS_SETUP.md');
      console.warn('📌 Using built-in rules engine instead...\n');
      return [];
    }

    // Set AWS credentials as environment variables for Prowler
    const env: Record<string, string> = {
      ...process.env as Record<string, string>,
      AWS_ACCESS_KEY_ID: credentials.accessKeyId,
      AWS_SECRET_ACCESS_KEY: credentials.secretAccessKey,
      AWS_DEFAULT_REGION: credentials.region || 'us-east-1'
    };

    // For LocalStack, add endpoint
    if (credentials.isLocalStack && credentials.endpoint) {
      env.AWS_ENDPOINT_URL = credentials.endpoint;
      console.log(`  📍 Using LocalStack endpoint: ${credentials.endpoint}`);
    }

    // Build Prowler command - use Python 3.11 on Windows for compatibility
    let prowlerCommand = 'py -3.11 -m prowler';  // Windows Python 3.11
    
    // Check if Windows, otherwise use standard command
    if (process.platform !== 'win32') {
      prowlerCommand = 'prowler';
    }
    
    prowlerCommand += ' -f json';                                              // JSON output format
    prowlerCommand += ' -c cis_aws_foundations_benchmark_v1.5.0';             // CIS Benchmark
    prowlerCommand += ' -s iam,ec2,rds,s3,cloudtrail,vpc';                   // Services to scan
    prowlerCommand += ' --no-banner';                                          // Don't show banner
    prowlerCommand += ' --quiet';                                              // Minimal output during scan

    console.log(`  🚀 Running Prowler scan...\n`);
    console.log(`     Benchmarks: CIS AWS Foundations v1.5.0`);
    console.log(`     Services: IAM, EC2, RDS, S3, CloudTrail, VPC`);
    console.log(`     Region: ${credentials.region || 'us-east-1'}\n`);

    // Execute Prowler with timeout
    const { stdout, stderr } = await execAsync(prowlerCommand, {
      env,
      maxBuffer: 15 * 1024 * 1024,      // 15MB buffer for large outputs
      timeout: 5 * 60 * 1000            // 5 minute timeout
    });

    if (stderr && stderr.trim().length > 0) {
      const warnings = stderr.substring(0, 300);
      console.warn(`  ⚠️  Prowler output: ${warnings}`);
    }

    // Parse JSON output
    const alerts = parseProwlerFindings(stdout);

    console.log(`\n✅ Prowler scan complete`);
    console.log(`   📋 Total findings: ${alerts.length}`);
    console.log(`   🔴 Critical: ${alerts.filter(a => a.severity === 'CRITICAL').length}`);
    console.log(`   🟠 High: ${alerts.filter(a => a.severity === 'HIGH').length}`);
    console.log(`   🟡 Medium: ${alerts.filter(a => a.severity === 'MEDIUM').length}\n`);

    return alerts;

  } catch (error: any) {
    const errorMsg = error.message || error.toString();
    
    if (errorMsg.includes('ENOENT') || errorMsg.includes('not found')) {
      console.error('❌ Prowler command not found');
      console.error('   Windows: Install Python 3.11 and run: py -3.11 -m pip install prowler-cloud');
      console.error('   Then restart server\n');
    } else if (errorMsg.includes('timeout')) {
      console.error('❌ Prowler scan timed out (>5 minutes)');
      console.error('   Try scanning fewer services or regions\n');
    } else if (errorMsg.includes('credentials')) {
      console.error('❌ AWS credentials error');
      console.error('   Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY\n');
    } else {
      console.error('❌ Prowler execution error:', errorMsg.substring(0, 200));
    }
    
    console.warn('📌 Falling back to built-in rules engine...\n');
    return [];
  }
}

/**
 * Alternative: Run Prowler using Docker
 * Useful if Prowler is not installed locally but Docker is available
 */
export async function runProwlerViaDocker(credentials: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}): Promise<Alert[]> {
  console.log('\n🐳 Running Prowler via Docker...\n');

  try {
    // Check if Docker is available
    await execAsync('docker --version');

    const dockerCommand = `docker run --rm \
      -e AWS_ACCESS_KEY_ID=${credentials.accessKeyId} \
      -e AWS_SECRET_ACCESS_KEY=${credentials.secretAccessKey} \
      -e AWS_DEFAULT_REGION=${credentials.region} \
      -v ~/.aws:/root/.aws \
      public.ecr.aws/prowler-cloud/prowler:latest \
      -f json \
      -c cis_aws_foundations_benchmark_v1.5.0`;

    console.log('  🚀 Executing Prowler Docker container...');

    const { stdout } = await execAsync(dockerCommand, {
      maxBuffer: 10 * 1024 * 1024
    });

    const alerts = parseProwlerFindings(stdout);

    console.log(`\n✅ Docker Prowler scan complete: ${alerts.length} findings\n`);

    return alerts;

  } catch (error: any) {
    console.error('❌ Docker Prowler error:', error.message);
    return [];
  }
}

/**
 * Get information about Prowler installation
 */
export async function getProwlerInfo(): Promise<{
  installed: boolean;
  version?: string;
  location?: string;
  command?: string;
  pythonVersion?: string;
}> {
  try {
    // Try different commands
    let version = '';
    let location = '';
    let command = 'prowler';

    // Try direct prowler command
    try {
      const { stdout } = await execAsync('prowler --version', { timeout: 5000 });
      version = stdout.trim();
    } catch {
      // Try python module
      try {
        const { stdout } = await execAsync('python -m prowler --version', { timeout: 5000 });
        version = stdout.trim();
        command = 'python -m prowler';
      } catch {
        // Try python.exe (Windows)
        try {
          const { stdout } = await execAsync('python.exe -m prowler --version', { timeout: 5000 });
          version = stdout.trim();
          command = 'python.exe -m prowler';
        } catch {
          // No Prowler found
          return { installed: false };
        }
      }
    }

    // Try to get location
    try {
      const { stdout } = await execAsync(`where ${command}`, { timeout: 5000 });
      location = stdout.trim().split('\n')[0];
    } catch {
      try {
        const { stdout } = await execAsync(`which ${command}`, { timeout: 5000 });
        location = stdout.trim().split('\n')[0];
      } catch {
        location = 'Unable to determine';
      }
    }

    // Get Python version
    let pythonVersion = '';
    try {
      const { stdout } = await execAsync('python --version', { timeout: 5000 });
      pythonVersion = stdout.trim();
    } catch {
      try {
        const { stdout } = await execAsync('python.exe --version', { timeout: 5000 });
        pythonVersion = stdout.trim();
      } catch {
        pythonVersion = 'Unknown';
      }
    }

    return {
      installed: true,
      version,
      location,
      command,
      pythonVersion
    };
  } catch {
    return {
      installed: false
    };
  }
}

/**
 * Generate Windows-specific installation instructions for Prowler
 */
export function getProwlerInstallationInstructions(): string {
  return `
╔════════════════════════════════════════════════════════════════════════════╗
║                    PROWLER Installation Instructions                       ║
╚════════════════════════════════════════════════════════════════════════════╝

Prowler is an open-source AWS security tool that checks CIS Benchmark compliance.

📋 OPTION 1: Windows (Recommended) - Using pip
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Install Python 3.9+ (if needed)
   Download: https://www.python.org/downloads/
   Make sure to check "Add Python to PATH" during installation

Step 2: Install Prowler
   Open PowerShell and run:
   
   pip install prowler-cloud --upgrade
   
   Or as Administrator:
   
   python -m pip install prowler-cloud --upgrade

Step 3: Verify Installation
   prowler --version
   
   Expected output: Prowler 4.x.x

Step 4: Run your server
   cd c:\\Users\\pronk\\aws-optimizer\\server
   npm run dev
   
   When you scan, you should see:
   ✅ Prowler scan complete: 247 findings


📋 OPTION 2: Docker (No Python Required)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Install Docker Desktop
   Download: https://www.docker.com/products/docker-desktop
   Install and restart Windows

Step 2: Set environment variable
   Add to server/.env:
   PROWLER_USE_DOCKER=true

Step 3: Run your server
   npm run dev


📋 AUTOMATIC INSTALLATION (Windows)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Right-click PowerShell and select "Run as Administrator", then run:

   .\\install-prowler.ps1

This script will:
   ✅ Check for Python installation
   ✅ Install Prowler automatically
   ✅ Verify the installation
   ✅ Show configuration instructions


🆘 TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issue: "prowler command not found"
Solution: 
   1. Check Python is in PATH: python --version
   2. Try: python -m prowler --version
   3. Restart PowerShell and try again

Issue: "Permission denied" or "Access is denied"
Solution:
   Right-click PowerShell → "Run as Administrator"
   Then run: pip install prowler-cloud

Issue: "AWS credentials not found"
Solution:
   1. Check your server/.env file has:
      AWS_ACCESS_KEY_ID=your_key
      AWS_SECRET_ACCESS_KEY=your_secret
      AWS_REGION=us-east-1
   
   2. Verify credentials work:
      \$env:AWS_ACCESS_KEY_ID = "your_key"
      prowler --version

Issue: Prowler scan is very slow or times out
Solution:
   Reduce services scanned in src/prowler-integration.ts
   Change: -s iam,ec2,rds,s3,cloudtrail,vpc
   To:     -s iam,ec2,s3


📚 Resources
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 Official Documentation: https://docs.prowler.cloud/
📖 CIS Benchmarks: https://www.cisecurity.org/cis-benchmarks/
📖 Python Downloads: https://www.python.org/downloads/
📖 Docker Desktop: https://www.docker.com/products/docker-desktop
📖 Setup Guide: See PROWLER_WINDOWS_SETUP.md


✨ Once installed, your system will have:
   
   ✅ 400+ automated security checks (CIS Benchmark)
   ✅ Compliance frameworks: PCI-DSS, HIPAA, SOC2, GDPR
   ✅ Real-time security findings with remediation steps
   ✅ Full integration with your AWS Optimizer dashboard

`;
}
