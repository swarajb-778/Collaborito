const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Testing Onboarding Flow...\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUserProfileCreation() {
  console.log('📝 Testing user profile creation...');
  
  try {
    // Test profile creation for a mock user
    const mockUserId = uuidv4();
    
    // Create profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: mockUserId,
        first_name: 'Test',
        last_name: 'User',
        onboarding_completed: false,
        onboarding_step: 'profile'
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Profile creation successful');
    
    // Test profile update
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: 'Updated',
        last_name: 'TestUser',
        location: 'Test City',
        job_title: 'Test Developer',
        onboarding_step: 'interests'
      })
      .eq('id', mockUserId);
    
    if (updateError) {
      throw updateError;
    }
    
    console.log('✅ Profile update successful');
    
    // Clean up test data
    await supabase
      .from('profiles')
      .delete()
      .eq('id', mockUserId);
    
    console.log('✅ Test cleanup successful');
    
    return true;
  } catch (error) {
    console.error('❌ Profile creation test failed:', error.message);
    return false;
  }
}

async function testInterestsFlow() {
  console.log('\n🎯 Testing interests flow...');
  
  try {
    // Get available interests
    const { data: interests, error } = await supabase
      .from('interests')
      .select('*')
      .limit(5);
    
    if (error) {
      throw error;
    }
    
    if (!interests || interests.length === 0) {
      throw new Error('No interests available in database');
    }
    
    console.log(`✅ Found ${interests.length} sample interests`);
    console.log('   Sample interests:', interests.map(i => i.name).join(', '));
    
    return true;
  } catch (error) {
    console.error('❌ Interests test failed:', error.message);
    return false;
  }
}

async function testSkillsFlow() {
  console.log('\n🛠️ Testing skills flow...');
  
  try {
    // Get available skills
    const { data: skills, error } = await supabase
      .from('skills')
      .select('*')
      .limit(5);
    
    if (error) {
      throw error;
    }
    
    if (!skills || skills.length === 0) {
      throw new Error('No skills available in database');
    }
    
    console.log(`✅ Found ${skills.length} sample skills`);
    console.log('   Sample skills:', skills.map(s => s.name).join(', '));
    
    return true;
  } catch (error) {
    console.error('❌ Skills test failed:', error.message);
    return false;
  }
}

async function testUserInterestsAndSkills() {
  console.log('\n👤 Testing user interests and skills...');
  
  try {
    const mockUserId = uuidv4();
    
    // Create a test profile first
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: mockUserId,
        first_name: 'Test',
        last_name: 'User',
        onboarding_completed: false,
        onboarding_step: 'interests'
      });
    
    if (profileError) {
      throw profileError;
    }
    
    // Get some interests and skills
    const { data: interests } = await supabase
      .from('interests')
      .select('id')
      .limit(2);
    
    const { data: skills } = await supabase
      .from('skills')
      .select('id')
      .limit(2);
    
    if (interests && interests.length > 0) {
      // Test user interests
      const { error: interestsError } = await supabase
        .from('user_interests')
        .insert(interests.map(interest => ({
          user_id: mockUserId,
          interest_id: interest.id
        })));
      
      if (interestsError) {
        throw interestsError;
      }
      
      console.log('✅ User interests creation successful');
    }
    
    if (skills && skills.length > 0) {
      // Test user skills
      const { error: skillsError } = await supabase
        .from('user_skills')
        .insert(skills.map((skill, index) => ({
          user_id: mockUserId,
          skill_id: skill.id,
          is_offering: index === 0,
          proficiency: 'intermediate'
        })));
      
      if (skillsError) {
        throw skillsError;
      }
      
      console.log('✅ User skills creation successful');
    }
    
    // Test user goals
    const { error: goalsError } = await supabase
      .from('user_goals')
      .insert({
        user_id: mockUserId,
        goal_type: 'find_collaborators',
        details: { description: 'Looking for team members' },
        is_active: true
      });
    
    if (goalsError) {
      throw goalsError;
    }
    
    console.log('✅ User goals creation successful');
    
    // Clean up test data
    await Promise.all([
      supabase.from('user_interests').delete().eq('user_id', mockUserId),
      supabase.from('user_skills').delete().eq('user_id', mockUserId),
      supabase.from('user_goals').delete().eq('user_id', mockUserId),
      supabase.from('profiles').delete().eq('id', mockUserId)
    ]);
    
    console.log('✅ Test cleanup successful');
    
    return true;
  } catch (error) {
    console.error('❌ User interests/skills test failed:', error.message);
    return false;
  }
}

async function testOnboardingCompletion() {
  console.log('\n🎉 Testing onboarding completion...');
  
  try {
    const mockUserId = uuidv4();
    
    // Create a test profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: mockUserId,
        first_name: 'Test',
        last_name: 'User',
        onboarding_completed: false,
        onboarding_step: 'skills'
      });
    
    if (profileError) {
      throw profileError;
    }
    
    // Complete onboarding
    const { error: completeError } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_step: 'completed'
      })
      .eq('id', mockUserId);
    
    if (completeError) {
      throw completeError;
    }
    
    console.log('✅ Onboarding completion successful');
    
    // Verify completion
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('onboarding_completed, onboarding_step')
      .eq('id', mockUserId)
      .single();
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!profile.onboarding_completed || profile.onboarding_step !== 'completed') {
      throw new Error('Onboarding completion not properly saved');
    }
    
    console.log('✅ Onboarding completion verification successful');
    
    // Clean up
    await supabase.from('profiles').delete().eq('id', mockUserId);
    
    return true;
  } catch (error) {
    console.error('❌ Onboarding completion test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Onboarding Flow Tests\n');
  console.log('='.repeat(60));
  
  const tests = [
    { name: 'User Profile Creation', fn: testUserProfileCreation },
    { name: 'Interests Flow', fn: testInterestsFlow },
    { name: 'Skills Flow', fn: testSkillsFlow },
    { name: 'User Interests & Skills', fn: testUserInterestsAndSkills },
    { name: 'Onboarding Completion', fn: testOnboardingCompletion }
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
    console.log('🎉 All tests passed! Onboarding flow is ready.');
  } else {
    console.log('⚠️  Some tests failed. Please review the issues above.');
  }
  
  return totalPassed === results.length;
}

if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests }; 