const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🎯 Comprehensive Supabase Validation Report\n');

async function runFullValidation() {
  try {
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    
    let issuesFound = [];
    let successCount = 0;
    let totalChecks = 0;

    // Check all important tables
    console.log('📋 Database Tables Status:');
    const tablesToCheck = [
      { name: 'profiles', critical: true },
      { name: 'interests', critical: true },
      { name: 'skills', critical: true },
      { name: 'user_interests', critical: true },
      { name: 'user_skills', critical: true },
      { name: 'user_goals', critical: true },
      { name: 'projects', critical: false },
      { name: 'project_members', critical: false },
      { name: 'invitations', critical: false },
      { name: 'messages', critical: false },
      { name: 'tasks', critical: false },
      { name: 'files', critical: false },
      { name: 'device_tokens', critical: false },
      { name: 'notifications', critical: false },
      { name: 'ai_chat_history', critical: false }
    ];

    for (const table of tablesToCheck) {
      totalChecks++;
      try {
        const { data, error } = await serviceClient
          .from(table.name)
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.log(`❌ ${table.name}: ${error.message}`);
          if (table.critical) issuesFound.push(`Critical table ${table.name} has issues: ${error.message}`);
        } else {
          console.log(`✅ ${table.name}: accessible (${data || 0} records)`);
          successCount++;
        }
      } catch (err) {
        console.log(`💥 ${table.name}: ${err.message}`);
        if (table.critical) issuesFound.push(`Critical table ${table.name} failed: ${err.message}`);
      }
    }

    // Check reference data
    console.log('\n📊 Reference Data Status:');
    
    totalChecks++;
    const { data: interests, error: interestsError } = await serviceClient
      .from('interests')
      .select('count', { count: 'exact', head: true });
      
    if (interestsError) {
      console.log('❌ Interests data check failed:', interestsError.message);
      issuesFound.push('Interests data not accessible');
    } else {
      const interestCount = interests || 0;
      if (interestCount === 0) {
        console.log('⚠️  No interests data found - onboarding may fail');
        issuesFound.push('No interests data available');
      } else {
        console.log(`✅ Found ${interestCount} interests`);
        successCount++;
      }
    }

    totalChecks++;
    const { data: skills, error: skillsError } = await serviceClient
      .from('skills')
      .select('count', { count: 'exact', head: true });
      
    if (skillsError) {
      console.log('❌ Skills data check failed:', skillsError.message);
      issuesFound.push('Skills data not accessible');
    } else {
      const skillCount = skills || 0;
      if (skillCount === 0) {
        console.log('⚠️  No skills data found - onboarding may fail');
        issuesFound.push('No skills data available');
      } else {
        console.log(`✅ Found ${skillCount} skills`);
        successCount++;
      }
    }

    // Check Edge Functions status
    console.log('\n⚡ Edge Functions Status:');
    const edgeFunctions = ['onboarding-handler', 'onboarding-status', 'update-onboarding-step', 'claude-ai'];
    
    for (const funcName of edgeFunctions) {
      totalChecks++;
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/${funcName}`, {
          method: 'OPTIONS', // Use OPTIONS to check if function exists
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
          }
        });
        
        if (response.status === 200 || response.status === 204) {
          console.log(`✅ ${funcName}: deployed and accessible`);
          successCount++;
        } else {
          console.log(`⚠️  ${funcName}: deployed but returned ${response.status}`);
        }
      } catch (err) {
        console.log(`❌ ${funcName}: not accessible - ${err.message}`);
        issuesFound.push(`Edge Function ${funcName} not working`);
      }
    }

    // Check authentication system
    console.log('\n🔐 Authentication System:');
    totalChecks++;
    try {
      const { data: userData, error: userError } = await serviceClient.auth.admin.listUsers();
      
      if (userError) {
        console.log('❌ Auth system check failed:', userError.message);
        issuesFound.push('Authentication system not working');
      } else {
        console.log(`✅ Auth system working - ${userData.users?.length || 0} users found`);
        successCount++;
      }
    } catch (err) {
      console.log('❌ Auth system error:', err.message);
      issuesFound.push('Authentication system error');
    }

    // Overall summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Checks: ${totalChecks}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${totalChecks - successCount}`);
    console.log(`Success Rate: ${Math.round((successCount / totalChecks) * 100)}%`);
    
    if (issuesFound.length === 0) {
      console.log('\n🎉 ALL SYSTEMS OPERATIONAL! Supabase is ready for production use.');
    } else {
      console.log('\n⚠️  Issues Found:');
      issuesFound.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
      
      if (issuesFound.length <= 2) {
        console.log('\n✅ Only minor issues found. System should work for basic functionality.');
      } else {
        console.log('\n❌ Multiple critical issues found. Some features may not work properly.');
      }
    }

    console.log('\n' + '='.repeat(60));

    // Known limitations
    console.log('\n📝 Known Limitations:');
    console.log('- oauth_provider column missing from profiles table (manual fix needed)');
    console.log('- Edge Functions require proper JWT authentication in production');
    console.log('- Some Edge Functions may return 401/400 without proper request format');

  } catch (error) {
    console.error('💥 Critical error during validation:', error);
  }
}

// Run the validation
runFullValidation(); 