#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Module Resolution...\n');

// Test files that should import components correctly
const testFiles = [
  'app/(tabs)/explore.tsx',
  'app/+not-found.tsx'
];

// Components that should be resolvable
const expectedComponents = [
  'Collapsible',
  'ThemedText', 
  'ThemedView',
  'ExternalLink',
  'ParallaxScrollView'
];

console.log('📂 Checking component availability:');
expectedComponents.forEach(component => {
  const componentPath = `components/${component}.tsx`;
  const exists = fs.existsSync(componentPath);
  console.log(`   ${component}: ${exists ? '✅' : '❌'} (${componentPath})`);
});

console.log('\n📄 Checking imports in test files:');
let allImportsValid = true;

testFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`\n   ${file}:`);
    const content = fs.readFileSync(file, 'utf8');
    const imports = content.match(/@\/components\/[\w\/]+/g) || [];
    
    imports.forEach(imp => {
      const componentName = imp.replace('@/components/', '').replace('/ui/', '/ui/');
      let componentPath;
      
      if (componentName.includes('/')) {
        // Handle nested paths like ui/IconSymbol
        componentPath = `components/${componentName}.tsx`;
      } else {
        // Handle direct component imports
        componentPath = `components/${componentName}.tsx`;
      }
      
      const exists = fs.existsSync(componentPath);
      console.log(`     ${imp}: ${exists ? '✅' : '❌'} (${componentPath})`);
      
      if (!exists) {
        allImportsValid = false;
      }
    });
  } else {
    console.log(`\n   ${file}: ❌ File not found`);
    allImportsValid = false;
  }
});

console.log('\n⚙️  Checking configuration files:');

// Check tsconfig.json
if (fs.existsSync('tsconfig.json')) {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  const hasPathMapping = tsconfig.compilerOptions && tsconfig.compilerOptions.paths && tsconfig.compilerOptions.paths['@/*'];
  console.log(`   tsconfig.json paths: ${hasPathMapping ? '✅' : '❌'}`);
} else {
  console.log('   tsconfig.json: ❌ Not found');
  allImportsValid = false;
}

// Check metro.config.js
if (fs.existsSync('metro.config.js')) {
  const metroContent = fs.readFileSync('metro.config.js', 'utf8');
  const hasAlias = metroContent.includes('@\': path.resolve(__dirname');
  console.log(`   metro.config.js alias: ${hasAlias ? '✅' : '❌'}`);
} else {
  console.log('   metro.config.js: ❌ Not found');
  allImportsValid = false;
}

// Check global types
if (fs.existsSync('types/global.d.ts')) {
  console.log('   types/global.d.ts: ✅');
} else {
  console.log('   types/global.d.ts: ❌ Not found');
}

console.log('\n🎯 Summary:');
if (allImportsValid) {
  console.log('✅ All module imports should resolve correctly!');
  console.log('💡 If you\'re still seeing import errors, try:');
  console.log('   1. npm run clear-cache');
  console.log('   2. npx expo start --clear');
} else {
  console.log('❌ Some module imports may fail to resolve.');
  console.log('🔧 Recommended fixes:');
  console.log('   1. Ensure all components exist in the components directory');
  console.log('   2. Check path mappings in tsconfig.json and metro.config.js');
  console.log('   3. Clear caches and restart development server');
}

console.log('\n✅ Validation complete!'); 