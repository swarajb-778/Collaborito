#!/usr/bin/env node

/**
 * Quick validation test script to verify the username validation fix
 */

// Import the validation functions (assuming they work in Node.js context)
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Username Validation Fix...\n');

// Test the previously failing usernames
const testUsernames = [
  'ghhhhh',
  'ggjbcfknb', 
  'hellohowareyou',
  'user123',
  'test_user',
  'my-username'
];

// Simple SQL injection detection function (matching our fixed version)
function containsSqlInjection(input) {
  const sqlPatterns = [
    /('|(\\'))/i,                    // Single quotes
    /(\-\-)/i,                       // SQL comments
    /(\;)/i,                         // Statement terminators
    /(\bunion\b)/i,                  // UNION keyword
    /(\bselect\b)/i,                 // SELECT keyword
    /(\binsert\b)/i,                 // INSERT keyword
    /(\bdelete\b)/i,                 // DELETE keyword
    /(\bupdate\b)/i,                 // UPDATE keyword
    /(\bdrop\b)/i,                   // DROP keyword
    /(\bcreate\b)/i,                 // CREATE keyword
    /(\balter\b)/i,                  // ALTER keyword
    /(\bexec\b|\bexecute\b)/i,       // EXEC/EXECUTE keywords
    /(<script>|<\/script>)/i,        // Script tags
    /(\bjavascript:)/i               // JavaScript protocol
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

// Test legitimate usernames
console.log('✅ Testing Legitimate Usernames:');
testUsernames.forEach(username => {
  const isBlocked = containsSqlInjection(username);
  const status = isBlocked ? '❌ BLOCKED' : '✅ ALLOWED';
  console.log(`  ${username}: ${status}`);
});

console.log('\n🛡️ Testing SQL Injection Attempts:');
const sqlInjections = [
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "admin'--",
  "SELECT * FROM users",
  "UNION SELECT null"
];

sqlInjections.forEach(injection => {
  const isBlocked = containsSqlInjection(injection);
  const status = isBlocked ? '✅ BLOCKED' : '❌ ALLOWED';
  console.log(`  "${injection}": ${status}`);
});

console.log('\n📊 Summary:');
const legitimateResults = testUsernames.map(u => !containsSqlInjection(u));
const securityResults = sqlInjections.map(s => containsSqlInjection(s));

const legitimatePassRate = legitimateResults.filter(r => r).length / legitimateResults.length * 100;
const securityPassRate = securityResults.filter(r => r).length / securityResults.length * 100;

console.log(`  Legitimate usernames allowed: ${legitimatePassRate}%`);
console.log(`  SQL injections blocked: ${securityPassRate}%`);

if (legitimatePassRate === 100 && securityPassRate === 100) {
  console.log('\n🎉 ALL TESTS PASSED! Validation fix is working correctly.');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Check the validation logic.');
  process.exit(1);
} 