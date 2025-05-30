const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ekydublgvsoaaepdhtzc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWR1YmxndnNvYWFlcGRodHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTA0NTUsImV4cCI6MjA1OTA4NjQ1NX0.CSN4WGqUDaOeTB-Mz9SEJvKM6_wx_ReH3lZIQRkGAzA'
);

async function testConnection() {
  try {
    console.log('Testing Supabase remote database connection...');
    
    // Test profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Profiles table error:', profilesError.message);
    } else {
      console.log('✅ Profiles table accessible');
    }
    
    // Test interests table
    const { data: interests, error: interestsError } = await supabase
      .from('interests')
      .select('count')
      .limit(1);
    
    if (interestsError) {
      console.log('❌ Interests table error:', interestsError.message);
    } else {
      console.log('✅ Interests table accessible');
    }
    
    // Test skills table
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('count')
      .limit(1);
    
    if (skillsError) {
      console.log('❌ Skills table error:', skillsError.message);
    } else {
      console.log('✅ Skills table accessible');
    }
    
    // Test user_interests table
    const { data: userInterests, error: userInterestsError } = await supabase
      .from('user_interests')
      .select('count')
      .limit(1);
    
    if (userInterestsError) {
      console.log('❌ User interests table error:', userInterestsError.message);
    } else {
      console.log('✅ User interests table accessible');
    }
    
    // Test user_skills table
    const { data: userSkills, error: userSkillsError } = await supabase
      .from('user_skills')
      .select('count')
      .limit(1);
    
    if (userSkillsError) {
      console.log('❌ User skills table error:', userSkillsError.message);
    } else {
      console.log('✅ User skills table accessible');
    }
    
    // Test user_goals table
    const { data: userGoals, error: userGoalsError } = await supabase
      .from('user_goals')
      .select('count')
      .limit(1);
    
    if (userGoalsError) {
      console.log('❌ User goals table error:', userGoalsError.message);
    } else {
      console.log('✅ User goals table accessible');
    }
    
    console.log('\nDatabase connection test completed.');
    
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  }
}

testConnection(); 