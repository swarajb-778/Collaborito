const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🎮 Testing Complete Onboarding Flow...\n');

async function testOnboardingFlow() {
  try {
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    
    // Create a test user first
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    console.log('👤 Creating test user...');
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (authError) {
      console.log('❌ User creation failed:', authError.message);
      return;
    }
    
    const userId = authData.user.id;
    console.log('✅ Test user created:', userId);

    // Test 1: Profile Creation
    console.log('\n📝 Test 1: Profile Creation');
    const profileData = {
      id: userId,
      first_name: 'Test',
      last_name: 'User',
      full_name: 'Test User',
      location: 'San Francisco, CA',
      job_title: 'Software Engineer',
      bio: 'Testing the onboarding flow',
      onboarding_step: 'profile',
      onboarding_completed: false
    };

    const { data: profileResult, error: profileError } = await serviceClient
      .from('profiles')
      .upsert(profileData)
      .select()
      .single();

    if (profileError) {
      console.log('❌ Profile creation failed:', profileError.message);
    } else {
      console.log('✅ Profile created successfully');
    }

    // Test 2: Get available interests
    console.log('\n📊 Test 2: Getting Available Interests');
    const { data: interests, error: interestsError } = await serviceClient
      .from('interests')
      .select('id, name, category')
      .limit(5);

    if (interestsError) {
      console.log('❌ Interests fetch failed:', interestsError.message);
    } else {
      console.log(`✅ Found ${interests.length} interests:`, interests.map(i => i.name).join(', '));
    }

    // Test 3: Save user interests
    if (interests && interests.length > 0) {
      console.log('\n💫 Test 3: Saving User Interests');
      const selectedInterests = interests.slice(0, 3).map(interest => ({
        user_id: userId,
        interest_id: interest.id
      }));

      const { data: userInterestsResult, error: userInterestsError } = await serviceClient
        .from('user_interests')
        .insert(selectedInterests)
        .select();

      if (userInterestsError) {
        console.log('❌ User interests save failed:', userInterestsError.message);
      } else {
        console.log(`✅ Saved ${selectedInterests.length} user interests`);
      }
    }

    // Test 4: Update profile to interests step
    console.log('\n🔄 Test 4: Update to Interests Step');
    const { error: stepUpdateError } = await serviceClient
      .from('profiles')
      .update({ onboarding_step: 'interests' })
      .eq('id', userId);

    if (stepUpdateError) {
      console.log('❌ Step update failed:', stepUpdateError.message);
    } else {
      console.log('✅ Updated to interests step');
    }

    // Test 5: Get available skills
    console.log('\n🛠️  Test 5: Getting Available Skills');
    const { data: skills, error: skillsError } = await serviceClient
      .from('skills')
      .select('id, name, category')
      .limit(5);

    if (skillsError) {
      console.log('❌ Skills fetch failed:', skillsError.message);
    } else {
      console.log(`✅ Found ${skills.length} skills:`, skills.map(s => s.name).join(', '));
    }

    // Test 6: Save user skills
    if (skills && skills.length > 0) {
      console.log('\n🎯 Test 6: Saving User Skills');
      const selectedSkills = skills.slice(0, 2).map(skill => ({
        user_id: userId,
        skill_id: skill.id,
        proficiency: 'intermediate',
        is_offering: true
      }));

      const { data: userSkillsResult, error: userSkillsError } = await serviceClient
        .from('user_skills')
        .insert(selectedSkills)
        .select();

      if (userSkillsError) {
        console.log('❌ User skills save failed:', userSkillsError.message);
      } else {
        console.log(`✅ Saved ${selectedSkills.length} user skills`);
      }
    }

    // Test 7: Save user goals
    console.log('\n🎯 Test 7: Saving User Goals');
    const userGoals = [{
      user_id: userId,
      goal_type: 'find_collaborators',
      details: { project_type: 'web_app', timeline: '3_months' }
    }];

    const { data: userGoalsResult, error: userGoalsError } = await serviceClient
      .from('user_goals')
      .insert(userGoals)
      .select();

    if (userGoalsError) {
      console.log('❌ User goals save failed:', userGoalsError.message);
    } else {
      console.log('✅ Saved user goals');
    }

    // Test 8: Complete onboarding
    console.log('\n🎉 Test 8: Complete Onboarding');
    const { error: completionError } = await serviceClient
      .from('profiles')
      .update({ 
        onboarding_step: 'completed',
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (completionError) {
      console.log('❌ Onboarding completion failed:', completionError.message);
    } else {
      console.log('✅ Onboarding completed successfully');
    }

    // Test 9: Verify final profile
    console.log('\n🔍 Test 9: Verify Final Profile');
    const { data: finalProfile, error: finalProfileError } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (finalProfileError) {
      console.log('❌ Final profile fetch failed:', finalProfileError.message);
    } else {
      console.log('✅ Final profile:', {
        name: finalProfile.full_name,
        step: finalProfile.onboarding_step,
        completed: finalProfile.onboarding_completed
      });
    }

    // Cleanup: Delete test user
    console.log('\n🧹 Cleanup: Deleting test user...');
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.log('⚠️  User cleanup failed (manual cleanup needed):', deleteError.message);
      console.log('🗑️  Please manually delete user:', userId);
    } else {
      console.log('✅ Test user cleaned up successfully');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 ONBOARDING FLOW TEST COMPLETED');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('💥 Critical error during onboarding flow test:', error);
  }
}

// Run the test
testOnboardingFlow(); 