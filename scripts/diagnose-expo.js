#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Expo diagnostics script to identify and resolve package compatibility issues
 */
class ExpoDiagnostics {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.packageJsonPath = path.join(this.rootDir, 'package.json');
  }

  /**
   * Check current Expo SDK version
   */
  getExpoSdkVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      const expoVersion = packageJson.dependencies.expo;
      
      // Extract SDK version from expo version
      const match = expoVersion.match(/(\d+)\./);
      return match ? parseInt(match[1]) : null;
    } catch (error) {
      console.error('Error reading Expo version:', error.message);
      return null;
    }
  }

  /**
   * Get the expected versions for current SDK
   */
  getExpectedVersions(sdkVersion) {
    // SDK 53 expected versions
    const sdk53Versions = {
      'expo': '53.0.11',
      'expo-auth-session': '~6.2.0',
      'expo-blur': '~14.1.5',
      'expo-linear-gradient': '~14.1.5',
      'expo-router': '~5.1.0',
      'expo-splash-screen': '~0.30.9',
      'expo-symbols': '~0.4.5',
      'expo-system-ui': '~5.0.8',
      'react-native': '0.79.3',
      'jest-expo': '~53.0.7'
    };

    return sdkVersion === 53 ? sdk53Versions : {};
  }

  /**
   * Check installed package versions
   */
  checkInstalledVersions() {
    console.log('🔍 Checking installed package versions...\n');
    
    const sdkVersion = this.getExpoSdkVersion();
    if (!sdkVersion) {
      console.error('❌ Could not determine Expo SDK version');
      return false;
    }

    console.log(`📱 Detected Expo SDK: ${sdkVersion}`);
    
    const expectedVersions = this.getExpectedVersions(sdkVersion);
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const issues = [];
    const resolved = [];

    Object.entries(expectedVersions).forEach(([packageName, expectedVersion]) => {
      const installedVersion = allDeps[packageName];
      
      if (!installedVersion) {
        issues.push({
          package: packageName,
          expected: expectedVersion,
          installed: 'not installed',
          action: 'install'
        });
      } else if (installedVersion !== expectedVersion) {
        // Check if it's just a format difference (e.g., ^53.0.11 vs 53.0.11)
        const cleanInstalled = installedVersion.replace(/[\^~]/, '');
        const cleanExpected = expectedVersion.replace(/[\^~]/, '');
        
        if (cleanInstalled === cleanExpected) {
          resolved.push({
            package: packageName,
            expected: expectedVersion,
            installed: installedVersion,
            status: 'format difference only'
          });
        } else {
          issues.push({
            package: packageName,
            expected: expectedVersion,
            installed: installedVersion,
            action: 'update'
          });
        }
      } else {
        resolved.push({
          package: packageName,
          expected: expectedVersion,
          installed: installedVersion,
          status: 'correct'
        });
      }
    });

    // Show resolved packages
    if (resolved.length > 0) {
      console.log('\n✅ Packages with correct versions:');
      resolved.forEach(pkg => {
        console.log(`  ${pkg.package}: ${pkg.installed} ${pkg.status === 'correct' ? '✓' : '(format diff)'}`);
      });
    }

    // Show issues
    if (issues.length > 0) {
      console.log('\n⚠️ Package version issues:');
      issues.forEach(issue => {
        console.log(`  ${issue.package}:`);
        console.log(`    Expected: ${issue.expected}`);
        console.log(`    Installed: ${issue.installed}`);
        console.log(`    Action: ${issue.action}`);
      });
      
      return { hasIssues: true, issues };
    } else {
      console.log('\n🎉 All package versions are compatible!');
      return { hasIssues: false, issues: [] };
    }
  }

  /**
   * Generate fix commands for issues
   */
  generateFixCommands(issues) {
    console.log('\n🔧 Suggested fix commands:\n');
    
    const toInstall = issues.filter(issue => issue.action === 'install');
    const toUpdate = issues.filter(issue => issue.action === 'update');
    
    if (toInstall.length > 0) {
      const installCmd = `npx expo install ${toInstall.map(i => `${i.package}@${i.expected}`).join(' ')}`;
      console.log('Install missing packages:');
      console.log(`  ${installCmd}\n`);
    }
    
    if (toUpdate.length > 0) {
      const updateCmd = `npx expo install ${toUpdate.map(i => `${i.package}@${i.expected}`).join(' ')}`;
      console.log('Update mismatched packages:');
      console.log(`  ${updateCmd}\n`);
    }
    
    console.log('Or run all fixes automatically:');
    console.log('  npm run fix-packages\n');
  }

  /**
   * Auto-fix package versions
   */
  autoFixPackages(issues) {
    console.log('🔧 Auto-fixing package versions...\n');
    
    try {
      const packagesToFix = issues.map(issue => `${issue.package}@${issue.expected}`);
      const command = `npx expo install ${packagesToFix.join(' ')}`;
      
      console.log(`Running: ${command}`);
      execSync(command, { stdio: 'inherit' });
      
      console.log('\n✅ Package versions fixed!');
      return true;
    } catch (error) {
      console.error('❌ Error fixing packages:', error.message);
      return false;
    }
  }

  /**
   * Check for common configuration issues
   */
  checkConfiguration() {
    console.log('\n⚙️ Checking configuration files...\n');
    
    const configs = [
      {
        file: 'metro.config.js',
        required: true,
        check: (content) => content.includes('getDefaultConfig')
      },
      {
        file: 'app.config.ts',
        required: true,
        check: (content) => !content.includes('development-placeholder')
      },
      {
        file: '.env',
        required: true,
        check: (content) => content.includes('EXPO_PUBLIC_SUPABASE_URL')
      }
    ];
    
    configs.forEach(config => {
      const filePath = path.join(this.rootDir, config.file);
      
      if (!fs.existsSync(filePath)) {
        if (config.required) {
          console.log(`❌ Missing required file: ${config.file}`);
        } else {
          console.log(`⚠️ Optional file missing: ${config.file}`);
        }
      } else {
        const content = fs.readFileSync(filePath, 'utf8');
        if (config.check && !config.check(content)) {
          console.log(`⚠️ Configuration issue in ${config.file}`);
        } else {
          console.log(`✅ ${config.file} looks good`);
        }
      }
    });
  }

  /**
   * Run comprehensive diagnostics
   */
  async run(autoFix = false) {
    console.log('🩺 Running Expo diagnostics...\n');
    
    // Check package versions
    const versionCheck = this.checkInstalledVersions();
    
    if (versionCheck && versionCheck.hasIssues) {
      this.generateFixCommands(versionCheck.issues);
      
      if (autoFix) {
        const fixed = this.autoFixPackages(versionCheck.issues);
        if (!fixed) {
          process.exit(1);
        }
      }
    }
    
    // Check configuration
    this.checkConfiguration();
    
    console.log('\n📋 Next steps:');
    console.log('  1. Fix any package version issues shown above');
    console.log('  2. Run: npx expo start --clear');
    console.log('  3. Check for remaining warnings');
    
    console.log('\n✅ Diagnostics complete!');
  }
}

// Run diagnostics if called directly
if (require.main === module) {
  const diagnostics = new ExpoDiagnostics();
  const autoFix = process.argv.includes('--fix');
  diagnostics.run(autoFix).catch(console.error);
}

module.exports = ExpoDiagnostics; 