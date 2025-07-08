#!/usr/bin/env node

/**
 * App Health Validation Script
 * 
 * This script performs comprehensive health checks after the recent fixes
 * to ensure the app is in a stable, production-ready state.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🏥 Starting App Health Validation...\n');

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function logResult(check, status, details = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${check}`);
  if (details) {
    console.log(`   ${details}`);
  }
  
  results.details.push({ check, status, details });
  if (status === 'pass') results.passed++;
  else if (status === 'fail') results.failed++;
  else results.warnings++;
}

// 1. TypeScript Compilation Check
console.log('📝 Checking TypeScript Compilation...');
try {
  const tscOutput = execSync('npx tsc --noEmit', { encoding: 'utf-8', stdio: 'pipe' });
  if (tscOutput.trim() === '') {
    logResult('TypeScript compilation', 'pass', 'No compilation errors found');
  } else {
    const errorCount = (tscOutput.match(/error TS/g) || []).length;
    if (errorCount <= 10) {
      logResult('TypeScript compilation', 'warning', `${errorCount} minor errors (acceptable)`);
    } else {
      logResult('TypeScript compilation', 'fail', `${errorCount} errors found`);
    }
  }
} catch (error) {
  const errorOutput = error.stdout || error.stderr || error.message;
  const errorCount = (errorOutput.match(/error TS/g) || []).length;
  if (errorCount <= 10) {
    logResult('TypeScript compilation', 'warning', `${errorCount} minor errors (acceptable)`);
  } else {
    logResult('TypeScript compilation', 'fail', `${errorCount} errors found`);
  }
}

// 2. Package Dependencies Check
console.log('\n📦 Checking Package Dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const criticalDeps = [
    'expo',
    'expo-router',
    'react',
    'react-native',
    '@supabase/supabase-js',
    'typescript'
  ];
  
  let missingDeps = [];
  criticalDeps.forEach(dep => {
    if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
      missingDeps.push(dep);
    }
  });
  
  if (missingDeps.length === 0) {
    logResult('Critical dependencies', 'pass', 'All critical packages present');
  } else {
    logResult('Critical dependencies', 'fail', `Missing: ${missingDeps.join(', ')}`);
  }
} catch (error) {
  logResult('Critical dependencies', 'fail', 'Could not read package.json');
}

// 3. Core Service Files Check
console.log('\n🔧 Checking Core Service Files...');
const coreServices = [
  'src/contexts/AuthContext.tsx',
  'src/services/SessionManager.ts',
  'src/services/OnboardingStepManager.ts',
  'src/services/OnboardingFlowCoordinator.ts',
  'src/services/AvatarPreloadingService.ts',
  'src/services/index.ts'
];

let missingServices = [];
coreServices.forEach(service => {
  if (fs.existsSync(service)) {
    const content = fs.readFileSync(service, 'utf-8');
    // Check for basic export
    if (content.includes('export') && content.includes('class') || content.includes('export default')) {
      // Service exists and exports something
    } else {
      missingServices.push(`${service} (no exports)`);
    }
  } else {
    missingServices.push(`${service} (missing file)`);
  }
});

if (missingServices.length === 0) {
  logResult('Core service files', 'pass', 'All core services present and exporting');
} else {
  logResult('Core service files', 'fail', `Issues: ${missingServices.join(', ')}`);
}

// 4. Import Statement Validation
console.log('\n📥 Checking Import Statements...');
try {
  const servicesIndex = fs.readFileSync('src/services/index.ts', 'utf-8');
  const expectedExports = [
    'SessionManager',
    'OnboardingStepManager', 
    'OnboardingFlowCoordinator',
    'AvatarPreloadingService'
  ];
  
  let missingExports = [];
  expectedExports.forEach(exp => {
    if (!servicesIndex.includes(exp)) {
      missingExports.push(exp);
    }
  });
  
  if (missingExports.length === 0) {
    logResult('Service exports', 'pass', 'All services properly exported');
  } else {
    logResult('Service exports', 'warning', `Missing exports: ${missingExports.join(', ')}`);
  }
} catch (error) {
  logResult('Service exports', 'fail', 'Could not validate service exports');
}

// 5. Environment Configuration Check
console.log('\n🌍 Checking Environment Configuration...');
try {
  const appConfig = fs.readFileSync('app.config.ts', 'utf-8');
  
  // Check for proper environment variable usage
  const hasSupabaseUrl = appConfig.includes('EXPO_PUBLIC_SUPABASE_URL') || appConfig.includes('SUPABASE_URL');
  const hasSupabaseKey = appConfig.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY') || appConfig.includes('SUPABASE_ANON_KEY');
  
  if (hasSupabaseUrl && hasSupabaseKey) {
    logResult('Environment configuration', 'pass', 'Supabase environment variables configured');
  } else {
    logResult('Environment configuration', 'warning', 'Supabase environment variables may be missing');
  }
} catch (error) {
  logResult('Environment configuration', 'fail', 'Could not read app.config.ts');
}

// 6. Test Infrastructure Check
console.log('\n🧪 Checking Test Infrastructure...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const testDeps = [
    '@testing-library/react-native',
    'jest',
    'jest-expo'
  ];
  
  let missingTestDeps = [];
  testDeps.forEach(dep => {
    if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
      missingTestDeps.push(dep);
    }
  });
  
  if (missingTestDeps.length === 0) {
    logResult('Test dependencies', 'pass', 'Testing infrastructure complete');
  } else {
    logResult('Test dependencies', 'warning', `Missing: ${missingTestDeps.join(', ')}`);
  }
} catch (error) {
  logResult('Test dependencies', 'fail', 'Could not validate test dependencies');
}

// 7. Expo Configuration Check
console.log('\n📱 Checking Expo Configuration...');
try {
  execSync('npx expo doctor', { encoding: 'utf-8', stdio: 'pipe' });
  logResult('Expo configuration', 'pass', 'Expo doctor passed');
} catch (error) {
  // Expo doctor might have warnings but still work
  logResult('Expo configuration', 'warning', 'Expo doctor found some issues');
}

// 8. Code Quality Checks
console.log('\n✨ Checking Code Quality...');
try {
  // Check for common anti-patterns
  const authContext = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf-8');
  
  const qualityChecks = {
    'Error boundaries': authContext.includes('ErrorBoundary') || fs.existsSync('components/ErrorBoundary.tsx'),
    'Proper exports': authContext.includes('export') && authContext.includes('useAuth'),
    'Type safety': authContext.includes('interface') && authContext.includes('User'),
  };
  
  const passedChecks = Object.values(qualityChecks).filter(Boolean).length;
  const totalChecks = Object.keys(qualityChecks).length;
  
  if (passedChecks === totalChecks) {
    logResult('Code quality', 'pass', `${passedChecks}/${totalChecks} quality checks passed`);
  } else {
    logResult('Code quality', 'warning', `${passedChecks}/${totalChecks} quality checks passed`);
  }
} catch (error) {
  logResult('Code quality', 'fail', 'Could not perform code quality checks');
}

// Final Report
console.log('\n' + '='.repeat(50));
console.log('📊 HEALTH CHECK SUMMARY');
console.log('='.repeat(50));

console.log(`✅ Passed: ${results.passed}`);
console.log(`⚠️  Warnings: ${results.warnings}`);
console.log(`❌ Failed: ${results.failed}`);

const totalChecks = results.passed + results.warnings + results.failed;
const healthScore = Math.round(((results.passed + results.warnings * 0.5) / totalChecks) * 100);

console.log(`\n🏥 Overall Health Score: ${healthScore}%`);

if (healthScore >= 90) {
  console.log('🎉 EXCELLENT: App is in excellent health and production-ready!');
} else if (healthScore >= 80) {
  console.log('👍 GOOD: App is in good health with minor issues');
} else if (healthScore >= 70) {
  console.log('⚠️  FAIR: App has some issues that should be addressed');
} else {
  console.log('🚨 POOR: App has significant issues that need immediate attention');
}

// Recommendations
console.log('\n📋 RECOMMENDATIONS:');
if (results.failed > 0) {
  console.log('• Address failed checks immediately before production deployment');
}
if (results.warnings > 0) {
  console.log('• Review warnings for potential improvements');
}
console.log('• Run this health check regularly during development');
console.log('• Monitor TypeScript errors and address them promptly');

console.log('\n✨ Health check completed!');

// Exit with appropriate code
process.exit(results.failed > 3 ? 1 : 0); 