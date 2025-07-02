const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking Database Schema...\n');

async function checkDatabaseSchema() {
  try {
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    
    // List of expected tables
    const expectedTables = [
      'profiles',
      'interests',
      'skills', 
      'user_interests',
      'user_skills',
      'user_goals',
      'projects',
      'project_members',
      'invitations',
      'messages',
      'tasks',
      'files',
      'device_tokens',
      'notifications',
      'ai_chat_history'
    ];

    console.log('📋 Checking table existence...');
    
    for (const table of expectedTables) {
      try {
        const { data, error } = await serviceClient
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: exists (${data || 0} records)`);
        }
      } catch (err) {
        console.log(`💥 ${table}: ${err.message}`);
      }
    }

    // Check specific table structures
    console.log('\n🔍 Checking profiles table structure...');
    try {
      const { data: profilesData, error: profilesError } = await serviceClient
        .from('profiles')
        .select('*')
        .limit(1);
        
      if (!profilesError && profilesData.length === 0) {
        console.log('ℹ️  Profiles table is empty but accessible');
      }
    } catch (err) {
      console.log('❌ Profiles table structure check failed:', err.message);
    }

    // Check interests data
    console.log('\n📊 Checking interests data...');
    try {
      const { data: interestsData, error: interestsError } = await serviceClient
        .from('interests')
        .select('id, name, category')
        .limit(10);
        
      if (interestsError) {
        console.log('❌ Interests query failed:', interestsError.message);
      } else {
        console.log(`✅ Found ${interestsData.length} interests:`);
        interestsData.forEach(interest => {
          console.log(`   - ${interest.name} (${interest.category})`);
        });
      }
    } catch (err) {
      console.log('💥 Interests check failed:', err.message);
    }

    // Check skills data  
    console.log('\n🛠️  Checking skills data...');
    try {
      const { data: skillsData, error: skillsError } = await serviceClient
        .from('skills')
        .select('id, name, category')
        .limit(10);
        
      if (skillsError) {
        console.log('❌ Skills query failed:', skillsError.message);
      } else {
        console.log(`✅ Found ${skillsData.length} skills:`);
        skillsData.forEach(skill => {
          console.log(`   - ${skill.name} (${skill.category})`);
        });
      }
    } catch (err) {
      console.log('💥 Skills check failed:', err.message);
    }

    // Check for missing columns in profiles table
    console.log('\n🔧 Checking profiles table columns...');
    try {
      const { data: profileSample, error: profileError } = await serviceClient
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          full_name,
          location,
          job_title,
          bio,
          onboarding_step,
          onboarding_completed,
          oauth_provider,
          created_at,
          updated_at
        `)
        .limit(1);
        
      if (profileError) {
        console.log('❌ Profiles column check failed:', profileError.message);
        
        // Check which specific columns might be missing
        const individualColumns = [
          'first_name', 'last_name', 'full_name', 'location', 'job_title', 
          'bio', 'onboarding_step', 'onboarding_completed', 'oauth_provider'
        ];
        
        for (const column of individualColumns) {
          try {
            const { error: colError } = await serviceClient
              .from('profiles')
              .select(column)
              .limit(1);
              
            if (colError) {
              console.log(`   ❌ Missing column: ${column}`);
            } else {
              console.log(`   ✅ Column exists: ${column}`);
            }
          } catch (err) {
            console.log(`   💥 Error checking ${column}: ${err.message}`);
          }
        }
      } else {
        console.log('✅ All expected profiles columns exist');
      }
    } catch (err) {
      console.log('💥 Profiles column check failed:', err.message);
    }

    // Check triggers
    console.log('\n⚙️ Checking database functions and triggers...');
    try {
      // Try to call a simple database function if it exists
      const { data: triggerTest, error: triggerError } = await serviceClient.rpc('handle_new_user');
      
      if (triggerError) {
        console.log('ℹ️  User creation trigger function not directly callable (expected)');
      }
    } catch (err) {
      console.log('ℹ️  Trigger check skipped (functions are protected)');
    }

    console.log('\n🎉 Database schema check completed!');

  } catch (error) {
    console.error('💥 Critical error during schema check:', error);
  }
}

// Run the check
checkDatabaseSchema(); 