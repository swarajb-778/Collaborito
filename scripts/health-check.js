#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Console colors for better output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);
const success = (message) => log('green', `✅ ${message}`);
const error = (message) => log('red', `❌ ${message}`);
const warning = (message) => log('yellow', `⚠️  ${message}`);
const info = (message) => log('blue', `ℹ️  ${message}`);
const header = (message) => log('bold', `\n🔍 ${message}`);

async function runHealthCheck() {
  console.log(`${colors.bold}${colors.blue}
╔═══════════════════════════════════════╗
║        COLLABORITO HEALTH CHECK       ║
╚═══════════════════════════════════════╝${colors.reset}`);

  let issuesFound = 0;

  // Check 1: Node.js version
  header('Checking Node.js Version');
  try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
    if (majorVersion >= 18) {
      success(`Node.js version: ${nodeVersion}`);
    } else {
      error(`Node.js version ${nodeVersion} is too old. Please upgrade to v18 or higher.`);
      issuesFound++;
    }
  } catch (err) {
    error('Failed to check Node.js version');
    issuesFound++;
  }

  // Check 2: Package.json exists and is valid
  header('Checking package.json');
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      success('package.json exists and is valid JSON');
      
      // Check for required scripts
      const requiredScripts = ['start', 'android', 'ios', 'web', 'test'];
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
      if (missingScripts.length === 0) {
        success('All required npm scripts are present');
      } else {
        warning(`Missing scripts: ${missingScripts.join(', ')}`);
      }
    } else {
      error('package.json not found');
      issuesFound++;
    }
  } catch (err) {
    error(`package.json is invalid: ${err.message}`);
    issuesFound++;
  }

  // Check 3: Dependencies
  header('Checking Dependencies');
  try {
    execSync('npm ls --depth=0', { stdio: 'pipe' });
    success('All dependencies are properly installed');
  } catch (err) {
    warning('Some dependency issues detected. Run "npm install" to fix.');
  }

  // Check 4: Expo CLI
  header('Checking Expo Configuration');
  try {
    const expoVersion = execSync('npx expo --version', { encoding: 'utf8' }).trim();
    success(`Expo CLI version: ${expoVersion}`);
    
    // Check expo install status
    try {
      execSync('npx expo install --check', { stdio: 'pipe' });
      success('All Expo packages are up to date');
    } catch (err) {
      warning('Some Expo packages need updating. Run "npm run deps-update" to fix.');
    }
  } catch (err) {
    error('Expo CLI not found or not working properly');
    issuesFound++;
  }

  // Check 5: Environment variables
  header('Checking Environment Variables');
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    success('.env file exists');
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredEnvVars = [
      'EXPO_PUBLIC_SUPABASE_URL',
      'EXPO_PUBLIC_SUPABASE_ANON_KEY'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => 
      !envContent.includes(envVar) || envContent.includes(`${envVar}=your_`)
    );
    
    if (missingEnvVars.length === 0) {
      success('Required environment variables are configured');
    } else {
      warning(`Missing or placeholder environment variables: ${missingEnvVars.join(', ')}`);
    }
  } else {
    warning('.env file not found. Copy .env.example to .env and configure it.');
  }

  // Check 6: TypeScript configuration
  header('Checking TypeScript Configuration');
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    try {
      JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      success('tsconfig.json exists and is valid');
      
      // Run TypeScript check
      try {
        execSync('npx tsc --noEmit', { stdio: 'pipe' });
        success('TypeScript compilation check passed');
      } catch (err) {
        warning('TypeScript compilation has errors. Run "npm run type-check" for details.');
      }
    } catch (err) {
      error('tsconfig.json is invalid JSON');
      issuesFound++;
    }
  } else {
    error('tsconfig.json not found');
    issuesFound++;
  }

  // Check 7: ESLint configuration
  header('Checking ESLint Configuration');
  const eslintrcPath = path.join(process.cwd(), '.eslintrc.js');
  if (fs.existsSync(eslintrcPath)) {
    success('.eslintrc.js exists');
    try {
      execSync('npx eslint --version', { stdio: 'pipe' });
      success('ESLint is properly installed');
    } catch (err) {
      warning('ESLint not working properly');
    }
  } else {
    warning('.eslintrc.js not found');
  }

  // Check 8: Git repository
  header('Checking Git Repository');
  if (fs.existsSync(path.join(process.cwd(), '.git'))) {
    success('Git repository initialized');
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      if (gitStatus.trim() === '') {
        success('Working directory is clean');
      } else {
        info('Working directory has uncommitted changes');
      }
    } catch (err) {
      warning('Git status check failed');
    }
  } else {
    warning('Git repository not initialized');
  }

  // Check 9: Security audit
  header('Running Security Audit');
  try {
    execSync('npm audit --audit-level=moderate', { stdio: 'pipe' });
    success('No security vulnerabilities found');
  } catch (err) {
    warning('Security vulnerabilities detected. Run "npm audit fix" to resolve.');
  }

  // Summary
  console.log(`\n${colors.bold}${colors.blue}╔═══════════════════════════════════════╗`);
  console.log(`║              SUMMARY                  ║`);
  console.log(`╚═══════════════════════════════════════╝${colors.reset}`);
  
  if (issuesFound === 0) {
    success(`Health check completed successfully! No critical issues found.`);
    console.log(`\n${colors.green}🚀 Your development environment is ready!${colors.reset}`);
  } else {
    error(`Health check found ${issuesFound} critical issue(s) that need attention.`);
    console.log(`\n${colors.yellow}📝 Please fix the issues above before continuing development.${colors.reset}`);
  }

  // Helpful commands
  console.log(`\n${colors.blue}💡 Helpful commands:${colors.reset}`);
  console.log(`   npm run health-check  - Run this health check`);
  console.log(`   npm run deps-update   - Update all dependencies`);
  console.log(`   npm run clean         - Clean and fix dependencies`);
  console.log(`   npm run lint:fix      - Fix ESLint issues`);
  console.log(`   npm run type-check    - Check TypeScript compilation`);

  return issuesFound === 0;
}

// Run the health check
if (require.main === module) {
  runHealthCheck()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Health check failed:', err);
      process.exit(1);
    });
}

module.exports = { runHealthCheck }; 