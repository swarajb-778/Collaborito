#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing expo-auth-session .js.js import issue for Node.js v22...');

// Fix the main index.js file in expo-auth-session
const indexPath = path.join(__dirname, '..', 'node_modules', 'expo-auth-session', 'build', 'index.js');

if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Check if the double .js.js issue exists
  if (content.includes('.js.js')) {
    console.log('Found .js.js import issue, fixing...');
    
    // Fix the double .js.js extension
    content = content.replace(/\.js\.js/g, '.js');
    
    fs.writeFileSync(indexPath, content);
    console.log('✅ Fixed expo-auth-session .js.js import issue');
  } else {
    console.log('✅ expo-auth-session already fixed or no .js.js issue found');
  }
} else {
  console.log('⚠️  expo-auth-session index.js not found');
}

console.log('🎉 Fix completed!'); 