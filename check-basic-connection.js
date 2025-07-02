const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Basic Supabase Connectivity...\n');

async function testBasicConnection() {
  try {
    console.log('Environment Variables:');
    console.log('- Supabase URL:', supabaseUrl);
    console.log('- Anon Key (first 20 chars):', anonKey?.substring(0, 20) + '...');
    console.log('- Service Role Key (first 20 chars):', serviceRoleKey?.substring(0, 20) + '...');
    console.log('');

    // Test anon client
    console.log('📱 Testing with anon key...');
    const anonClient = createClient(supabaseUrl, anonKey);
    
    // Simple connectivity test
    try {
      const { data: anonData, error: anonError } = await anonClient.auth.getSession();
      if (anonError) {
        console.log('⚠️  Anon auth check (expected):', anonError.message);
      } else {
        console.log('✅ Anon client connection successful');
      }
    } catch (err) {
      console.log('❌ Anon client error:', err.message);
    }

    // Test service role client
    console.log('\n🔑 Testing with service role key...');
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    
    try {
      // Try to access auth admin functions (only service role can do this)
      const { data: userData, error: userError } = await serviceClient.auth.admin.listUsers();
      
      if (userError) {
        console.log('❌ Service role test failed:', userError.message);
      } else {
        console.log('✅ Service role key working - found', userData.users?.length || 0, 'users');
      }
    } catch (err) {
      console.log('💥 Service role error:', err.message);
    }

    // Try direct API call to check if the problem is with the client
    console.log('\n🌐 Testing direct API call...');
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        }
      });
      
      console.log('Direct API Response Status:', response.status);
      if (response.ok) {
        console.log('✅ Direct API call successful');
      } else {
        console.log('❌ Direct API call failed:', response.statusText);
      }
    } catch (err) {
      console.log('💥 Direct API error:', err.message);
    }

    // Test service role with direct API call
    console.log('\n🔐 Testing service role with direct API...');
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        }
      });
      
      console.log('Service Role API Response Status:', response.status);
      if (response.ok) {
        console.log('✅ Service role API call successful');
      } else {
        console.log('❌ Service role API call failed:', response.statusText);
        const errorText = await response.text();
        console.log('Error details:', errorText);
      }
    } catch (err) {
      console.log('💥 Service role API error:', err.message);
    }

  } catch (error) {
    console.error('💥 Critical error during basic connection test:', error);
  }
}

// Run the test
testBasicConnection(); 