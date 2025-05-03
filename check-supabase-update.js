const https = require('https');
const currentVersion = require('./package.json').dependencies['@supabase/supabase-js'];

// Remove ^ or ~ from version string
const cleanVersion = currentVersion.replace(/[\^~]/g, '');

https.get('https://registry.npmjs.org/@supabase/supabase-js', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const packageInfo = JSON.parse(data);
    const latestVersion = packageInfo['dist-tags'].latest;
    
    console.log(`Current Supabase version: ${cleanVersion}`);
    console.log(`Latest Supabase version: ${latestVersion}`);
    
    if (latestVersion !== cleanVersion) {
      console.log('\nA newer version is available! Consider updating and testing if the stream module issue is fixed.');
      console.log('Run: npm install @supabase/supabase-js@latest --legacy-peer-deps');
      console.log('Then remove the workaround from metro.config.js and test your app.');
    } else {
      console.log('\nYou are using the latest version of Supabase.');
    }
  });
}).on('error', (err) => {
  console.error('Error checking for updates:', err.message);
}); 