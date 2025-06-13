#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing Module Resolution Issues...\n');

// Check both component directories
const rootComponents = './components';
const srcComponents = './src/components';

console.log('📁 Component Directory Analysis:');

function getDirectoryStructure(dir) {
  if (!fs.existsSync(dir)) {
    return { exists: false, files: [], dirs: [] };
  }
  
  const items = fs.readdirSync(dir);
  const files = items.filter(item => {
    const itemPath = path.join(dir, item);
    return fs.statSync(itemPath).isFile();
  });
  
  const dirs = items.filter(item => {
    const itemPath = path.join(dir, item);
    return fs.statSync(itemPath).isDirectory();
  });
  
  return { exists: true, files, dirs };
}

const rootStructure = getDirectoryStructure(rootComponents);
const srcStructure = getDirectoryStructure(srcComponents);

console.log(`\n🗂️  Root components (${rootComponents}):`);
if (rootStructure.exists) {
  console.log(`   Files: ${rootStructure.files.join(', ')}`);
  console.log(`   Dirs: ${rootStructure.dirs.join(', ')}`);
} else {
  console.log('   ❌ Does not exist');
}

console.log(`\n🗂️  Src components (${srcComponents}):`);
if (srcStructure.exists) {
  console.log(`   Files: ${srcStructure.files.join(', ')}`);
  console.log(`   Dirs: ${srcStructure.dirs.join(', ')}`);
} else {
  console.log('   ❌ Does not exist');
}

// Check problematic imports
console.log('\n🔍 Checking Problematic Imports:');

const problemFiles = [
  'app/(tabs)/explore.tsx',
  'app/+not-found.tsx'
];

problemFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const imports = content.match(/@\/components\/\w+/g) || [];
    console.log(`\n📄 ${file}:`);
    imports.forEach(imp => {
      const componentName = imp.replace('@/components/', '');
      
      // Check if component exists in root
      const rootPath = path.join(rootComponents, `${componentName}.tsx`);
      const rootExists = fs.existsSync(rootPath);
      
      // Check if component exists in src
      const srcPath = path.join(srcComponents, `layout/${componentName}.tsx`);
      const srcExists = fs.existsSync(srcPath);
      
      console.log(`   ${imp}:`);
      console.log(`     Root: ${rootExists ? '✅' : '❌'} (${rootPath})`);
      console.log(`     Src:  ${srcExists ? '✅' : '❌'} (${srcPath})`);
    });
  }
});

console.log('\n🛠️  Recommendations:');
console.log('1. Consolidate components into single directory');
console.log('2. Update path mappings in tsconfig.json');
console.log('3. Update Metro config for proper resolution');
console.log('4. Clear Metro cache after changes');

console.log('\n✅ Analysis complete!'); 