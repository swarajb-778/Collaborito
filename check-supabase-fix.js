const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const https = require('https');

// Path to store the last check timestamp
const DATA_FILE = path.join(__dirname, '.supabase-check-data.json');

// Initialize or load check data
function getCheckData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading check data file:', err.message);
  }
  
  // Default data if file doesn't exist or has issues
  return {
    lastCheckTime: 0,
    supabaseVersion: require('./package.json').dependencies['@supabase/supabase-js'].replace(/[\^~]/g, ''),
    issueResolved: false
  };
}

// Save check data
function saveCheckData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving check data:', err.message);
  }
}

// Check if it's time to run the test (every 2 days)
function shouldRunCheck() {
  const data = getCheckData();
  const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
  const timeSinceLastCheck = Date.now() - data.lastCheckTime;
  
  return timeSinceLastCheck >= twoDaysInMs || data.lastCheckTime === 0;
}

// Check for new Supabase version
function checkSupabaseVersion() {
  return new Promise((resolve, reject) => {
    const data = getCheckData();
    const currentVersion = data.supabaseVersion;
    
    https.get('https://registry.npmjs.org/@supabase/supabase-js', (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const packageInfo = JSON.parse(responseData);
          const latestVersion = packageInfo['dist-tags'].latest;
          
          console.log(`Current Supabase version: ${currentVersion}`);
          console.log(`Latest Supabase version: ${latestVersion}`);
          
          resolve({
            currentVersion,
            latestVersion,
            hasNewVersion: latestVersion !== currentVersion
          });
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Create a backup of metro.config.js
function backupMetroConfig() {
  return new Promise((resolve, reject) => {
    const metroConfigPath = path.join(__dirname, 'metro.config.js');
    const backupPath = path.join(__dirname, 'metro.config.js.bak');
    
    fs.copyFile(metroConfigPath, backupPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('Created backup of metro.config.js');
      resolve();
    });
  });
}

// Create a test metro config without the workaround
function createTestMetroConfig() {
  return new Promise((resolve, reject) => {
    const testConfig = `const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Commented out the workaround to test if the issue is fixed with latest Supabase
// config.resolver.unstable_enablePackageExports = false;

module.exports = config;`;

    const metroConfigPath = path.join(__dirname, 'metro.config.js');
    
    fs.writeFile(metroConfigPath, testConfig, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('Created test metro.config.js without the workaround');
      resolve();
    });
  });
}

// Restore the backup metro config
function restoreMetroConfig() {
  return new Promise((resolve, reject) => {
    const metroConfigPath = path.join(__dirname, 'metro.config.js');
    const backupPath = path.join(__dirname, 'metro.config.js.bak');
    
    fs.copyFile(backupPath, metroConfigPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('Restored metro.config.js from backup');
      resolve();
    });
  });
}

// Run Expo and check for errors
function testExpoStart() {
  return new Promise((resolve, reject) => {
    console.log('Testing if the app runs without the workaround...');
    
    // Start Expo and pipe output to a string to check for errors
    const expoProcess = exec('npx expo start --non-interactive', { timeout: 60000 });
    
    let output = '';
    let hasStreamError = false;
    
    expoProcess.stdout.on('data', (data) => {
      output += data;
      
      // Check for stream error in real-time
      if (data.includes('node_modules/ws/lib/stream.js') && 
          data.includes('import the Node standard library module "stream"')) {
        hasStreamError = true;
        console.log('\nDetected stream module error. Stopping test.');
        expoProcess.kill();
      }
      
      // If we see successful bundling without errors, wait a bit then stop
      if (data.includes('Bundled') && !data.includes('Bundling failed') && !hasStreamError) {
        setTimeout(() => {
          expoProcess.kill();
        }, 5000);
      }
    });
    
    expoProcess.stderr.on('data', (data) => {
      output += data;
      
      // Also check stderr for errors
      if (data.includes('node_modules/ws/lib/stream.js') && 
          data.includes('import the Node standard library module "stream"')) {
        hasStreamError = true;
        console.log('\nDetected stream module error. Stopping test.');
        expoProcess.kill();
      }
    });
    
    expoProcess.on('error', (error) => {
      console.error('Error running Expo:', error);
      reject(error);
    });
    
    expoProcess.on('close', (code) => {
      // Final check of complete output
      if (!hasStreamError) {
        hasStreamError = output.includes('node_modules/ws/lib/stream.js') && 
                        output.includes('import the Node standard library module "stream"');
      }
      
      resolve({
        success: !hasStreamError,
        output
      });
    });
  });
}

// Check GitHub issues for updates
function checkGitHubIssues() {
  const issues = [
    { repo: 'supabase/supabase-js', issue: '1400' },
    { repo: 'expo/expo', issue: '36477' }
  ];
  
  console.log('\nChecking GitHub issues for updates:');
  issues.forEach(({ repo, issue }) => {
    console.log(`- https://github.com/${repo}/issues/${issue}`);
  });
  
  console.log('\nPlease check these issues manually for the latest updates.');
}

// Main check function
async function runCheck() {
  try {
    console.log('=== Supabase Issue Fix Checker ===');
    console.log('Checking if the Supabase stream module issue has been resolved...');
    
    // Get current check data
    const data = getCheckData();
    
    // Skip if the issue is already marked as resolved
    if (data.issueResolved) {
      console.log('✅ This issue has been marked as resolved. No need to check further.');
      console.log('If you still experience issues, delete the .supabase-check-data.json file and run this script again.');
      return;
    }
    
    // Check for new Supabase version
    const versionInfo = await checkSupabaseVersion();
    
    if (versionInfo.hasNewVersion) {
      console.log('\n🔄 New Supabase version available!');
      console.log('Would you like to update and test if the issue is fixed? (y/n)');
      
      // This is a synchronous approach for simplicity
      const readline = require('readline-sync');
      const shouldUpdate = readline.question('> ').toLowerCase() === 'y';
      
      if (shouldUpdate) {
        console.log('\nUpdating Supabase...');
        await new Promise((resolve, reject) => {
          exec('npm install @supabase/supabase-js@latest --legacy-peer-deps', (error, stdout, stderr) => {
            if (error) {
              console.error('Error updating Supabase:', error);
              reject(error);
              return;
            }
            console.log(stdout);
            resolve();
          });
        });
        
        // Update version in our data
        data.supabaseVersion = versionInfo.latestVersion;
      }
    }
    
    // Backup current metro config
    await backupMetroConfig();
    
    try {
      // Create test metro config
      await createTestMetroConfig();
      
      // Test if app runs without the workaround
      const testResult = await testExpoStart();
      
      if (testResult.success) {
        console.log('\n✅ SUCCESS! The Supabase stream module issue appears to be fixed!');
        console.log('You can now remove the workaround from metro.config.js.');
        
        data.issueResolved = true;
      } else {
        console.log('\n❌ The issue still exists. Restoring the workaround...');
        
        // Check GitHub issues for updates
        checkGitHubIssues();
      }
    } finally {
      // Always restore the backup if not resolved
      if (!data.issueResolved) {
        await restoreMetroConfig();
      }
    }
    
    // Update last check time
    data.lastCheckTime = Date.now();
    saveCheckData(data);
    
    console.log('\nCheck completed. Will check again in 2 days if the issue persists.');
    
  } catch (error) {
    console.error('Error during check:', error);
  }
}

// Check if we should run the check
if (shouldRunCheck()) {
  runCheck();
} else {
  const data = getCheckData();
  const nextCheckDate = new Date(data.lastCheckTime + 2 * 24 * 60 * 60 * 1000);
  
  console.log('=== Supabase Issue Fix Checker ===');
  console.log(`Last check was performed less than 2 days ago.`);
  console.log(`Next check scheduled for: ${nextCheckDate.toLocaleString()}`);
  console.log('To force a check, run: node check-supabase-fix.js --force');
  
  // Check if --force flag is provided
  if (process.argv.includes('--force')) {
    console.log('\nForce flag detected. Running check anyway...\n');
    runCheck();
  }
} 