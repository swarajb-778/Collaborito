// Test script to validate Supabase connection
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log('Connecting to Supabase with:');
console.log(`URL: ${SUPABASE_URL}`);
console.log(`Key: ${SUPABASE_ANON_KEY.substring(0, 5)}...${SUPABASE_ANON_KEY.substring(SUPABASE_ANON_KEY.length - 5)}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Check auth configuration
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error connecting to Supabase:', error.message);
    } else {
      console.log('Successfully connected to Supabase!');
      console.log('Session:', data.session ? 'Active session found' : 'No active session');
    }
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

testConnection(); 