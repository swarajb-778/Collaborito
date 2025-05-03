#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🚀 Collaborito Project Setup');
console.log('============================');

// Check for Supabase issue fix
const checkSupabaseFix = () => {
  const dataFile = path.join(__dirname, '.supabase-check-data.json');
  let shouldCheck = true;

  if (fs.existsSync(dataFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
      const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
      const timeSinceLastCheck = Date.now() - data.lastCheckTime;
      
      shouldCheck = timeSinceLastCheck >= twoDaysInMs;
      
      if (!shouldCheck) {
        const nextCheckDate = new Date(data.lastCheckTime + twoDaysInMs);
        console.log(`Last Supabase issue check was less than 2 days ago.`);
        console.log(`Next check scheduled for: ${nextCheckDate.toLocaleString()}`);
      }
    } catch (err) {
      console.error('Error reading check data:', err.message);
      shouldCheck = true;
    }
  }

  if (shouldCheck) {
    console.log('Checking for Supabase issue fix...');
    exec('node check-supabase-fix.js', (error, stdout, stderr) => {
      if (error) {
        console.error('Error checking for Supabase fix:', error);
        return;
      }
      
      console.log(stdout);
      
      if (stderr) {
        console.error(stderr);
      }
    });
  }
};

// Main function
const main = async () => {
  try {
    // Check for Supabase issue fix
    checkSupabaseFix();
    
    // Additional project setup steps can be added here
    
  } catch (error) {
    console.error('Error during project setup:', error);
  }
};

main(); 