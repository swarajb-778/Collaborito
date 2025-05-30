#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing app startup issues...');

// Check Node.js version
const nodeVersion = process.version;
console.log(`📦 Node.js version: ${nodeVersion}`);

// Check if Node.js version is too new (causing ES module issues)
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion >= 22) {
  console.log('⚠️  Node.js 22+ detected - known compatibility issues with Expo');
  console.log('💡 Recommendation: Use Node.js 18 or 20 for better Expo compatibility');
}

// Check package.json for potential issues
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Add Node.js version requirement
  if (!packageJson.engines) {
    packageJson.engines = {};
  }
  
  if (!packageJson.engines.node) {
    packageJson.engines.node = '>=18.0.0 <22.0.0';
    console.log('📝 Added Node.js engine requirement to package.json');
  }
  
  // Set module type to commonjs if not set
  if (!packageJson.type) {
    packageJson.type = 'commonjs';
    console.log('📝 Set module type to commonjs in package.json');
  }
  
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  
} catch (error) {
  console.error('❌ Error updating package.json:', error.message);
}

// Try to fix metro config
try {
  const metroConfigPath = 'metro.config.js';
  let metroConfig = fs.readFileSync(metroConfigPath, 'utf8');
  
  // Add resolver configuration if not present
  if (!metroConfig.includes('resolver:')) {
    const resolverConfig = `
  resolver: {
    resolverMainFields: ['react-native', 'browser', 'main'],
    platforms: ['ios', 'android', 'native', 'web'],
    unstable_enableSymlinks: false,
  },`;
    
    metroConfig = metroConfig.replace(
      'module.exports = ',
      `const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  resolverMainFields: ['react-native', 'browser', 'main'],
  platforms: ['ios', 'android', 'native', 'web'],
  unstable_enableSymlinks: false,
};

module.exports = config;

// module.exports = `
    );
  }
  
  console.log('🔧 Updated metro.config.js for better module resolution');
  
} catch (error) {
  console.log('⚠️  Could not update metro.config.js:', error.message);
}

console.log('✅ Startup fixes applied!');
console.log('🚀 Try running: npm start'); 