const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Simple Onboarding Validation Test...\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testBasicConnectivity() {
  console.log('🔗 Testing basic connectivity...');
  
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

async function testRequiredTables() {
  console.log('\n📋 Testing required tables...');
  
  const requiredTables = [
    'profiles',
    'interests', 
    'skills',
    'user_interests',
    'user_skills',
    'user_goals'
  ];
  
  let allTablesExist = true;
  
  for (const table of requiredTables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        allTablesExist = false;
      } else {
        console.log(`✅ ${table}: ${count || 0} records`);
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
      allTablesExist = false;
    }
  }
  
  return allTablesExist;
}

async function testSampleData() {
  console.log('\n🎯 Testing sample data availability...');
  
  try {
    // Test interests
    const { data: interests, error: interestsError } = await supabase
      .from('interests')
      .select('*')
      .limit(5);
    
    if (interestsError) {
      console.log('❌ Interests query failed:', interestsError.message);
      return false;
    }
    
    if (!interests || interests.length === 0) {
      console.log('❌ No interests found in database');
      return false;
    }
    
    console.log(`✅ Found ${interests.length} sample interests:`);
    console.log('   -', interests.map(i => i.name).join(', '));
    
    // Test skills
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('*')
      .limit(5);
    
    if (skillsError) {
      console.log('❌ Skills query failed:', skillsError.message);
      return false;
    }
    
    if (!skills || skills.length === 0) {
      console.log('❌ No skills found in database');
      return false;
    }
    
    console.log(`✅ Found ${skills.length} sample skills:`);
    console.log('   -', skills.map(s => s.name).join(', '));
    
    return true;
  } catch (error) {
    console.error('❌ Sample data test failed:', error.message);
    return false;
  }
}

async function testAuthenticationFlow() {
  console.log('\n🔐 Testing authentication flow...');
  
  try {
    // Test getting current session (should be null for anonymous)
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Auth session test failed:', error.message);
      return false;
    }
    
    if (!session) {
      console.log('✅ No active session (expected for anonymous test)');
    } else {
      console.log('✅ Active session found:', session.user.id);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    return false;
  }
}

async function testOnboardingService() {
  console.log('\n⚙️ Testing onboarding service functions...');
  
  try {
    // Test that we can query interests and skills directly
    const { data: interests, error: interestsError } = await supabase
      .from('interests')
      .select('*');
    
    if (interestsError) {
      console.log('❌ getInterests query failed:', interestsError.message);
      return false;
    }
    
    console.log(`✅ Interests query: returned ${interests?.length || 0} interests`);
    
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('*');
    
    if (skillsError) {
      console.log('❌ getSkills query failed:', skillsError.message);
      return false;
    }
    
    console.log(`✅ Skills query: returned ${skills?.length || 0} skills`);
    
    return true;
  } catch (error) {
    console.error('❌ Onboarding service test failed:', error.message);
    return false;
  }
}

async function runSimpleTests() {
  console.log('🚀 Starting Simple Onboarding Validation Tests\n');
  console.log('='.repeat(60));
  
  const tests = [
    { name: 'Basic Connectivity', fn: testBasicConnectivity },
    { name: 'Required Tables', fn: testRequiredTables },
    { name: 'Sample Data', fn: testSampleData },
    { name: 'Authentication Flow', fn: testAuthenticationFlow },
    { name: 'Onboarding Service', fn: testOnboardingService }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.error(`❌ Test "${test.name}" threw an error:`, error);
      results.push({ name: test.name, passed: false });
    }
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(60));
  
  let totalPassed = 0;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.name}`);
    if (result.passed) totalPassed++;
  });
  
  console.log('='.repeat(60));
  console.log(`Total: ${totalPassed}/${results.length} tests passed`);
  
  if (totalPassed === results.length) {
    console.log('🎉 All tests passed! Core onboarding functionality is ready.');
    console.log('\n💡 Next steps:');
    console.log('- Test the onboarding flow in the app');
    console.log('- Verify user registration and profile creation');
    console.log('- Test interest and skill selection');
  } else {
    console.log('⚠️  Some tests failed. Please review the issues above.');
  }
  
  return totalPassed === results.length;
}

if (require.main === module) {
  runSimpleTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { runSimpleTests }; 