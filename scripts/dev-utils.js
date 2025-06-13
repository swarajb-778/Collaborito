#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Console colors
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

// Development utilities
class DevUtils {
  static cleanProject() {
    console.log(`${colors.bold}${colors.blue}🧹 Cleaning Project${colors.reset}`);
    
    const dirsToClean = [
      'node_modules',
      '.expo',
      '.metro-cache',
      'dist',
      'build',
      'ios/build',
      'android/build',
      'android/.gradle'
    ];
    
    dirsToClean.forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        success(`Cleaned ${dir}`);
      } else {
        info(`${dir} doesn't exist, skipping`);
      }
    });
    
    // Clean npm cache
    try {
      execSync('npm cache clean --force', { stdio: 'pipe' });
      success('Cleaned npm cache');
    } catch (err) {
      warning('Failed to clean npm cache');
    }
  }
  
  static async reinstallDependencies() {
    console.log(`${colors.bold}${colors.blue}📦 Reinstalling Dependencies${colors.reset}`);
    
    try {
      info('Installing dependencies...');
      execSync('npm install', { stdio: 'inherit' });
      success('Dependencies installed');
      
      info('Fixing Expo packages...');
      execSync('npx expo install --fix', { stdio: 'inherit' });
      success('Expo packages fixed');
      
      info('Running security audit...');
      execSync('npm audit fix', { stdio: 'inherit' });
      success('Security audit completed');
      
    } catch (err) {
      error('Failed to reinstall dependencies');
      throw err;
    }
  }
  
  static createGitignore() {
    console.log(`${colors.bold}${colors.blue}📝 Creating .gitignore${colors.reset}`);
    
    const gitignoreContent = `# OSX
.DS_Store

# Xcode
build/
*.pbxuser
!default.pbxuser
*.mode1v3
!default.mode1v3
*.mode2v3
!default.mode2v3
*.perspectivev3
!default.perspectivev3
xcuserdata
*.xccheckout
*.moved-aside
DerivedData
*.hmap
*.ipa
*.xcuserstate
project.xcworkspace

# Android/IntelliJ
build/
.idea
.gradle
local.properties
*.iml
*.hprof
.cxx/
*.keystore
!debug.keystore

# Node.js
node_modules/
npm-debug.log
yarn-error.log

# Bundle artifacts
*.jsbundle

# CocoaPods
ios/Pods/

# Expo
.expo/
dist/
web-build/

# Environment Variables
.env.local
.env.development.local
.env.test.local
.env.production.local

# Metro
.metro-cache/
.metro-health-check*

# EAS Build
build-*
eas-build-local-logs.txt

# Temporary files
*.log
*.cache
.tmp/

# IDEs
.vscode/
.idea/

# TypeScript
*.tsbuildinfo

# Testing
coverage/`;
    
    try {
      fs.writeFileSync('.gitignore', gitignoreContent);
      success('Created .gitignore file');
    } catch (err) {
      error('Failed to create .gitignore file');
    }
  }
  
  static checkProjectStructure() {
    console.log(`${colors.bold}${colors.blue}🏗️  Checking Project Structure${colors.reset}`);
    
    const requiredDirs = [
      'src',
      'components',
      'constants',
      'hooks',
      'app',
      'assets',
      'scripts'
    ];
    
    requiredDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        success(`${dir}/ exists`);
      } else {
        warning(`${dir}/ is missing`);
      }
    });
    
    const requiredFiles = [
      'package.json',
      'app.config.ts',
      'tsconfig.json',
      '.eslintrc.js',
      'metro.config.js',
      '.env.example'
    ];
    
    requiredFiles.forEach(file => {
      if (fs.existsSync(file)) {
        success(`${file} exists`);
      } else {
        warning(`${file} is missing`);
      }
    });
  }
  
  static showProjectInfo() {
    console.log(`${colors.bold}${colors.blue}📊 Project Information${colors.reset}`);
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      info(`Project: ${packageJson.name}`);
      info(`Version: ${packageJson.version}`);
      
      // Count dependencies
      const depCount = Object.keys(packageJson.dependencies || {}).length;
      const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
      info(`Dependencies: ${depCount} runtime, ${devDepCount} development`);
      
      // Count files
      const countFiles = (dir) => {
        try {
          return fs.readdirSync(dir, { withFileTypes: true })
            .filter(dirent => dirent.isFile()).length;
        } catch {
          return 0;
        }
      };
      
      info(`Source files: ${countFiles('src')} in src/, ${countFiles('app')} in app/`);
      info(`Components: ${countFiles('components')}`);
      
    } catch (err) {
      error('Failed to read project information');
    }
  }
  
  static optimizeProject() {
    console.log(`${colors.bold}${colors.blue}⚡ Optimizing Project${colors.reset}`);
    
    // Remove unnecessary files
    const unnecessaryFiles = [
      '.DS_Store',
      'npm-debug.log',
      'yarn-error.log',
      '*.log',
      '.tmp'
    ];
    
    unnecessaryFiles.forEach(pattern => {
      try {
        execSync(`find . -name "${pattern}" -type f -delete`, { stdio: 'pipe' });
      } catch {
        // Ignore errors for files that don't exist
      }
    });
    
    success('Removed unnecessary files');
    
    // Optimize package.json
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // Sort dependencies alphabetically
      if (packageJson.dependencies) {
        const sortedDeps = {};
        Object.keys(packageJson.dependencies).sort().forEach(key => {
          sortedDeps[key] = packageJson.dependencies[key];
        });
        packageJson.dependencies = sortedDeps;
      }
      
      if (packageJson.devDependencies) {
        const sortedDevDeps = {};
        Object.keys(packageJson.devDependencies).sort().forEach(key => {
          sortedDevDeps[key] = packageJson.devDependencies[key];
        });
        packageJson.devDependencies = sortedDevDeps;
      }
      
      fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
      success('Optimized package.json');
    } catch (err) {
      warning('Failed to optimize package.json');
    }
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'clean':
    DevUtils.cleanProject();
    break;
  case 'reinstall':
    DevUtils.cleanProject();
    DevUtils.reinstallDependencies();
    break;
  case 'gitignore':
    DevUtils.createGitignore();
    break;
  case 'check':
    DevUtils.checkProjectStructure();
    break;
  case 'info':
    DevUtils.showProjectInfo();
    break;
  case 'optimize':
    DevUtils.optimizeProject();
    break;
  case 'full-reset':
    DevUtils.cleanProject();
    DevUtils.reinstallDependencies();
    DevUtils.createGitignore();
    DevUtils.optimizeProject();
    success('Full project reset completed!');
    break;
  default:
    console.log(`${colors.bold}Collaborito Development Utilities${colors.reset}

Usage: node scripts/dev-utils.js <command>

Commands:
  clean       - Clean build artifacts and caches
  reinstall   - Clean and reinstall all dependencies
  gitignore   - Create/update .gitignore file
  check       - Check project structure
  info        - Show project information
  optimize    - Optimize project files
  full-reset  - Complete project cleanup and reset

Examples:
  node scripts/dev-utils.js clean
  node scripts/dev-utils.js full-reset
`);
}

module.exports = DevUtils; 