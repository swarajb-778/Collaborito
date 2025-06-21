/**
 * Simple Supabase connection test
 */

const { supabase } = require('./src/services/supabase');

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('⚠️ Auth error (expected if not logged in):', error.message);
    } else {
      console.log('✅ Supabase connection successful');
      console.log('📊 Session data:', data?.session ? 'User logged in' : 'No active session');
    }

    // Test database connection by checking profiles table
    const { data: profiles, error: profileError } = await supabase
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
    const { data: interests, error: interestError } = await supabase
      .from('interests')
      .select('id')
      .limit(1);

    if (interestError) {
      console.log('⚠️ Interests table not found:', interestError.message);
      console.log('💡 You may need to run the database migration');
    } else {
      console.log('✅ Interests table exists');
    }

    // Test if skills table exists
    const { data: skills, error: skillError } = await supabase
      .from('skills')
      .select('id')
      .limit(1);

    if (skillError) {
      console.log('⚠️ Skills table not found:', skillError.message);
      console.log('💡 You may need to run the database migration');
    } else {
      console.log('✅ Skills table exists');
    }

    console.log('\n🎯 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSupabaseConnection();
