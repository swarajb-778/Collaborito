#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

console.log('🔍 Validating Supabase configuration...');

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Environment variables check:');
console.log('- EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('- EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set (length: ' + supabaseAnonKey?.length + ')' : '❌ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ Missing required Supabase environment variables!');
  console.log('\nPlease ensure your .env file contains:');
  console.log('EXPO_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

console.log('\n🔗 Testing Supabase connection...');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function validateConnection() {
  try {
    // Test basic connectivity
    console.log('Testing basic connectivity...');
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      
      // Provide specific error guidance
      if (error.message.includes('Invalid API key')) {
        console.log('\n🔧 Troubleshooting Invalid API key:');
        console.log('1. Check if your Supabase project is still active');
        console.log('2. Verify the SUPABASE_URL is correct');
        console.log('3. Verify the SUPABASE_ANON_KEY is correct and not expired');
        console.log('4. Check if your project has been paused or suspended');
        console.log('5. Try regenerating the API key in your Supabase dashboard');
      }
      
      return false;
    }
    
    console.log('✅ Connection successful!');
    
    // Test auth functionality
    console.log('\nTesting authentication system...');
    const { data: session } = await supabase.auth.getSession();
    console.log('✅ Auth system accessible');
    
    // Test if required tables exist
    console.log('\nChecking database schema...');
    const tables = ['profiles', 'interests', 'skills', 'goals'];
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (tableError) {
          console.log(`⚠️  Table '${table}': ${tableError.message}`);
        } else {
          console.log(`✅ Table '${table}': accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}': error -`, err.message);
      }
    }
    
    console.log('\n🎉 Supabase validation completed!');
    return true;
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return false;
  }
}

validateConnection().then(success => {
  process.exit(success ? 0 : 1);
}); 