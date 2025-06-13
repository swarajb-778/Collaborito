#!/usr/bin/env node
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
