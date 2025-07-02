const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Connection...\n');

async function testSupabaseConnection() {
  try {
    // Test with anon key
    const anonClient = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Anon client created successfully');

    // Test with service role key
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    console.log('✅ Service role client created successfully');

    // Test basic database connectivity
    console.log('\n📊 Testing database connectivity...');
    
    // Check if we can query system tables
    const { data: healthCheck, error: healthError } = await anonClient
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (healthError) {
      console.log('❌ Database health check failed:', healthError.message);
    } else {
      console.log('✅ Database is accessible');
      console.log(`📋 Profiles table contains ${healthCheck || 0} records`);
    }

    // Check interests table
    const { data: interests, error: interestsError } = await anonClient
      .from('interests')
      .select('id, name')
      .limit(5);

    if (interestsError) {
      console.log('❌ Interests table query failed:', interestsError.message);
    } else {
      console.log(`✅ Interests table accessible with ${interests.length} sample records`);
    }

    // Check skills table
    const { data: skills, error: skillsError } = await anonClient
      .from('skills')
      .select('id, name')
      .limit(5);

    if (skillsError) {
      console.log('❌ Skills table query failed:', skillsError.message);
    } else {
      console.log(`✅ Skills table accessible with ${skills.length} sample records`);
    }

    // Test authentication
    console.log('\n🔐 Testing authentication...');
    const { data: authData, error: authError } = await anonClient.auth.getSession();
    
    if (authError) {
      console.log('⚠️  Auth check returned error (expected for unauthenticated):', authError.message);
    } else {
      console.log('✅ Auth system is responsive');
    }

    // Check Edge Functions
    console.log('\n⚡ Checking Edge Functions...');
    try {
      const { data: funcData, error: funcError } = await serviceClient.functions.invoke('onboarding-handler', {
        body: { step: 'get_interests' }
      });
      
      if (funcError) {
        console.log('❌ Edge Function test failed:', funcError.message);
      } else {
        console.log('✅ Edge Functions are accessible');
      }
    } catch (funcErr) {
      console.log('⚠️  Edge Function test error (might be expected):', funcErr.message);
    }

    console.log('\n🎉 Supabase connection test completed!');

  } catch (error) {
    console.error('💥 Critical error during connection test:', error);
  }
}

// Run the test
testSupabaseConnection(); 