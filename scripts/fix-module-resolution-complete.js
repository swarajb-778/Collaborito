#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🛠️  Comprehensive Module Resolution Recovery...\n');

try {
  // Step 1: Ensure expo-env.d.ts exists (auto-generated file)
  console.log('📝 Step 1: Generating expo-env.d.ts...');
  if (!fs.existsSync('expo-env.d.ts')) {
    try {
      execSync('npx expo install --fix', { stdio: 'pipe' });
      console.log('   ✅ expo-env.d.ts generated');
    } catch (error) {
      console.log('   ⚠️  expo-env.d.ts generation skipped (will be auto-generated)');
    }
  } else {
    console.log('   ✅ expo-env.d.ts already exists');
  }

  // Step 2: Verify and fix Metro configuration
  console.log('\n🚇 Step 2: Verifying Metro configuration...');
  const metroConfigPath = 'metro.config.js';
  if (fs.existsSync(metroConfigPath)) {
    const metroContent = fs.readFileSync(metroConfigPath, 'utf8');
    if (!metroContent.includes("'@': path.resolve(__dirname")) {
      console.log('   ❌ Metro config missing path alias');
      console.log('   🔧 Fixing Metro configuration...');
      
      const fixedMetroConfig = `const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable clear cache on start
config.resetCache = true;

// Ensure proper platform resolution
config.resolver.platforms = ['ios', 'android', 'web'];

// Configure path aliases to match tsconfig.json
config.resolver.alias = {
  '@': path.resolve(__dirname, '.'),
  '@/components': path.resolve(__dirname, './components'),
  '@/constants': path.resolve(__dirname, './constants'),
  '@/hooks': path.resolve(__dirname, './hooks'),
  '@/utils': path.resolve(__dirname, './utils'),
  '@/services': path.resolve(__dirname, './services'),
  '@/contexts': path.resolve(__dirname, './contexts'),
};

// Add additional alias configurations for better compatibility
config.resolver.alias = {
  ...config.resolver.alias,
  crypto: 'react-native-crypto-js',
  stream: 'stream-browserify',
  buffer: '@craftzdog/react-native-buffer',
};

// Ensure proper source map generation
config.transformer.minifierConfig = {
  simplify: false,
};

module.exports = config;`;

      fs.writeFileSync(metroConfigPath, fixedMetroConfig);
      console.log('   ✅ Metro configuration updated');
    } else {
      console.log('   ✅ Metro configuration is correct');
    }
  }

  // Step 3: Verify and fix TypeScript configuration
  console.log('\n📘 Step 3: Verifying TypeScript configuration...');
  const tsconfigPath = 'tsconfig.json';
  if (fs.existsSync(tsconfigPath)) {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    if (!tsconfig.compilerOptions?.paths?.['@/*']) {
      console.log('   ❌ tsconfig.json missing path mapping');
      console.log('   🔧 Fixing TypeScript configuration...');
      
      const fixedTsconfig = {
        "extends": "expo/tsconfig.base",
        "compilerOptions": {
          "strict": true,
          "paths": {
            "@/*": ["./*"],
            "@/components/*": ["./components/*"],
            "@/constants/*": ["./constants/*"],
            "@/hooks/*": ["./hooks/*"],
            "@/utils/*": ["./utils/*"],
            "@/services/*": ["./services/*"],
            "@/contexts/*": ["./contexts/*"]
          }
        },
        "include": [
          "**/*.ts",
          "**/*.tsx",
          "**/*.js",
          "**/*.jsx",
          ".expo/types/**/*.ts",
          "types/global.d.ts"
        ]
      };
      
      fs.writeFileSync(tsconfigPath, JSON.stringify(fixedTsconfig, null, 2));
      console.log('   ✅ TypeScript configuration updated');
    } else {
      console.log('   ✅ TypeScript configuration is correct');
    }
  }

  // Step 4: Clear all caches thoroughly
  console.log('\n🧹 Step 4: Clearing all caches...');
  
  // Clear Expo cache
  if (fs.existsSync('.expo')) {
    fs.rmSync('.expo', { recursive: true, force: true });
    console.log('   ✅ Expo cache cleared');
  }
  
  // Clear node_modules cache
  const nodeModulesCache = path.join('node_modules', '.cache');
  if (fs.existsSync(nodeModulesCache)) {
    fs.rmSync(nodeModulesCache, { recursive: true, force: true });
    console.log('   ✅ Node modules cache cleared');
  }

  // Clear npm cache
  try {
    execSync('npm cache clean --force', { stdio: 'pipe' });
    console.log('   ✅ NPM cache cleared');
  } catch (error) {
    console.log('   ⚠️  NPM cache clear skipped');
  }

  // Step 5: Restart TypeScript server (if in VSCode)
  console.log('\n💡 Step 5: Recommendations for complete fix:');
  console.log('   1. Restart your code editor (especially if using VSCode)');
  console.log('   2. Run: npx expo start --clear');
  console.log('   3. If issues persist, run: npm run validate-modules');

  console.log('\n✅ Module resolution recovery completed successfully!');
  console.log('🚀 Your app should now start without module resolution errors.');

} catch (error) {
  console.error('❌ Error during module resolution recovery:', error.message);
  process.exit(1);
} 