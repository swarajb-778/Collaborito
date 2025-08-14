/**
 * Simple Supabase connection test (Node runtime)
 * Uses env vars directly to avoid importing TS modules.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error('❌ Missing Supabase env configuration');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, anonKey);

  try {
    // Test basic connection
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('⚠️ Auth error (expected if not logged in):', error.message);
    } else {
      console.log('✅ Supabase connection successful');
      console.log('📊 Session data:', data?.session ? 'User logged in' : 'No active session');
    }

    // Test database a11ccess by checking profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (profileError) {
      console.log('❌ Database connection failed:', profileError.message);
    } else {
      console.log('✅ Database connection successful');
      console.log('📊 Profiles table accessible');
    }

    // Test if interests table exists
    const { error: interestError } = await supabase
      .from('interests')
      .select('id')
      .limit(1);
    if (interestError) {
      console.log('⚠️ Interests table not found:', interestError.message);
    } else {
      console.log('✅ Interests table exists');
    }

    // Test if skills table exists
    const { error: skillError } = await supabase
      .from('skills')
      .select('id')
      .limit(1);
    if (skillError) {
      console.log('⚠️ Skills table not found:', skillError.message);
    } else {
      console.log('✅ Skills table exists');
    }

    console.log('\n🎯 Test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSupabaseConnection();
