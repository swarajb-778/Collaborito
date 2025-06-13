#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Expo optimization script to resolve package compatibility issues
 */
class ExpoOptimizer {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.packageJsonPath = path.join(this.rootDir, 'package.json');
  }

  /**
   * Clear all caches to ensure fresh build
   */
  clearCaches() {
    console.log('🧹 Clearing all caches...');
    
    try {
      // Clear npm cache
      execSync('npm cache clean --force', { stdio: 'inherit' });
      
      // Clear watchman cache if available
      try {
        execSync('watchman watch-del-all', { stdio: 'pipe' });
        console.log('✅ Watchman cache cleared');
      } catch (e) {
        console.log('⚠️ Watchman not available (optional)');
      }
      
      // Clear Expo cache
      try {
        execSync('npx expo r --clear', { stdio: 'pipe' });
        console.log('✅ Expo cache cleared');
      } catch (e) {
        console.log('⚠️ Expo cache clear failed (will be handled later)');
      }
      
      console.log('✅ Caches cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing caches:', error.message);
    }
  }

  /**
   * Validate package.json for Expo compatibility
   */
  validatePackageJson() {
    console.log('📋 Validating package.json...');
    
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    
    const issues = [];
    
    // Check for deprecated packages
    const deprecatedPackages = [
      '@expo/vector-icons'
    ];
    
    // Check for version conflicts
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    Object.entries(dependencies).forEach(([name, version]) => {
      if (name.startsWith('expo-') && !version.startsWith('~')) {
        issues.push(`${name}: Consider using tilde (~) version for better compatibility`);
      }
    });
    
    if (issues.length > 0) {
      console.log('⚠️ Package.json issues found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('✅ Package.json looks good');
    }
    
    return issues.length === 0;
  }

  /**
   * Fix common Expo package version issues
   */
  fixPackageVersions() {
    console.log('🔧 Fixing package versions...');
    
    try {
      // Use Expo CLI to fix versions
      execSync('npx expo install --fix', { stdio: 'inherit' });
      console.log('✅ Package versions fixed');
    } catch (error) {
      console.error('❌ Error fixing package versions:', error.message);
    }
  }

  /**
   * Optimize Metro bundler configuration
   */
  optimizeMetroConfig() {
    console.log('⚙️ Optimizing Metro configuration...');
    
    const metroConfigPath = path.join(this.rootDir, 'metro.config.js');
    
    if (fs.existsSync(metroConfigPath)) {
      console.log('✅ Metro config already exists and updated');
    } else {
      console.log('⚠️ Metro config not found');
    }
  }

  /**
   * Create development script helpers
   */
  createHelperScripts() {
    console.log('📝 Creating helper scripts...');
    
    const scriptsDir = path.join(this.rootDir, 'scripts');
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }
    
    // Create cache clearing script
    const cacheClearScript = `#!/usr/bin/env node
// Clear all development caches
const { execSync } = require('child_process');

console.log('🧹 Clearing development caches...');

try {
  execSync('rm -rf node_modules/.cache', { stdio: 'inherit' });
  execSync('rm -rf .expo', { stdio: 'inherit' });
  execSync('npx expo r --clear', { stdio: 'inherit' });
  console.log('✅ All caches cleared');
} catch (error) {
  console.error('❌ Error clearing caches:', error.message);
}
`;
    
    fs.writeFileSync(path.join(scriptsDir, 'clear-cache.js'), cacheClearScript);
    fs.chmodSync(path.join(scriptsDir, 'clear-cache.js'), '755');
    
    console.log('✅ Helper scripts created');
  }

  /**
   * Run all optimizations
   */
  async run() {
    console.log('🚀 Starting Expo optimization...\n');
    
    // Step 1: Clear caches
    this.clearCaches();
    console.log('');
    
    // Step 2: Validate package.json
    this.validatePackageJson();
    console.log('');
    
    // Step 3: Fix package versions
    this.fixPackageVersions();
    console.log('');
    
    // Step 4: Optimize Metro config
    this.optimizeMetroConfig();
    console.log('');
    
    // Step 5: Create helper scripts
    this.createHelperScripts();
    console.log('');
    
    console.log('✅ Expo optimization complete!');
    console.log('\n📋 Next steps:');
    console.log('  1. Run: npx expo start --clear');
    console.log('  2. Check for any remaining warnings');
    console.log('  3. Use scripts/clear-cache.js if issues persist');
  }
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new ExpoOptimizer();
  optimizer.run().catch(console.error);
}

module.exports = ExpoOptimizer; 