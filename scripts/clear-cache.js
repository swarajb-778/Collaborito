#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing development caches...');

try {
  // Clear Expo cache directory
  if (fs.existsSync('.expo')) {
    console.log('🗑️  Removing .expo directory...');
    fs.rmSync('.expo', { recursive: true, force: true });
  }

  // Clear Metro bundler cache
  try {
    console.log('🚇 Clearing Metro bundler cache...');
    execSync('npx react-native start --reset-cache', { 
      stdio: 'pipe',
      timeout: 5000 
    });
  } catch (error) {
    // Metro command may fail if not in a React Native project, continue anyway
    console.log('   Metro cache clear skipped (not available)');
  }

  // Clear npm cache
  console.log('📦 Clearing npm cache...');
  execSync('npm cache clean --force', { stdio: 'inherit' });

  // Clear node_modules cache if it exists
  const nodeModulesCache = path.join('node_modules', '.cache');
  if (fs.existsSync(nodeModulesCache)) {
    console.log('🗑️  Removing node_modules/.cache...');
    fs.rmSync(nodeModulesCache, { recursive: true, force: true });
  }

  // Clear temporary directories
  const tempDirs = ['tmp', '.tmp', 'temp'];
  tempDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`🗑️  Removing ${dir} directory...`);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  console.log('✅ All caches cleared successfully!');
  console.log('\n💡 Recommendation: Restart your development server after clearing caches.');

} catch (error) {
  console.error('❌ Error clearing caches:', error.message);
  process.exit(1);
}
