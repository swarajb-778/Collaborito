const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Checking and documenting schema fixes needed...\n');

async function checkAndDocumentFixes() {
  try {
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    
    console.log('🔍 Checking profiles table schema...');
    
    // Check if oauth_provider column exists
    try {
      const { data: testData, error: testError } = await serviceClient
        .from('profiles')
        .select('oauth_provider')
        .limit(1);
        
      if (testError && testError.message.includes('does not exist')) {
        console.log('❌ oauth_provider column missing');
        console.log('\n📋 Manual Fix Required:');
        console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/ekydublgvsoaaepdhtzc');
        console.log('2. Navigate to Table Editor > profiles table');
        console.log('3. Click "Add Column" and add:');
        console.log('   - Name: oauth_provider');
        console.log('   - Type: text');
        console.log('   - Default value: email');
        console.log('   - Allow nullable: true');
        console.log('');
        
        return false;
      } else if (testError) {
        console.log('❌ Error checking oauth_provider column:', testError.message);
        return false;
      } else {
        console.log('✅ oauth_provider column exists');
        return true;
      }
    } catch (err) {
      console.log('💥 Error during column check:', err.message);
      return false;
    }

  } catch (error) {
    console.error('💥 Critical error during schema check:', error);
    return false;
  }
}

async function performPostValidation() {
  console.log('\n🔍 Performing comprehensive validation...\n');
  
  try {
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    
    // Check all important tables
    const tablesToCheck = [
      { name: 'profiles', critical: true },
      { name: 'interests', critical: true },
      { name: 'skills', critical: true },
      { name: 'user_interests', critical: true },
      { name: 'user_skills', critical: true },
      { name: 'user_goals', critical: true }
    ];

    let allGood = true;
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await serviceClient
          .from(table.name)
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.log(`❌ ${table.name}: ${error.message}`);
          if (table.critical) allGood = false;
        } else {
          console.log(`✅ ${table.name}: accessible (${data || 0} records)`);
        }
      } catch (err) {
        console.log(`💥 ${table.name}: ${err.message}`);
        if (table.critical) allGood = false;
      }
    }

    // Check data availability
    console.log('\n📊 Checking reference data...');
    
    const { data: interests, error: interestsError } = await serviceClient
      .from('interests')
      .select('count', { count: 'exact', head: true });
      
    if (interestsError) {
      console.log('❌ Interests data check failed:', interestsError.message);
      allGood = false;
    } else {
      const interestCount = interests || 0;
      if (interestCount === 0) {
        console.log('⚠️  No interests data found - onboarding may fail');
        allGood = false;
      } else {
        console.log(`✅ Found ${interestCount} interests`);
      }
    }

    const { data: skills, error: skillsError } = await serviceClient
      .from('skills')
      .select('count', { count: 'exact', head: true });
      
    if (skillsError) {
      console.log('❌ Skills data check failed:', skillsError.message);
      allGood = false;
    } else {
      const skillCount = skills || 0;
      if (skillCount === 0) {
        console.log('⚠️  No skills data found - onboarding may fail');
        allGood = false;
      } else {
        console.log(`✅ Found ${skillCount} skills`);
      }
    }

    return allGood;
    
  } catch (error) {
    console.error('💥 Error during validation:', error);
    return false;
  }
}

// Main execution
async function main() {
  const schemaOk = await checkAndDocumentFixes();
  
  if (schemaOk) {
    console.log('✅ Schema looks good, performing full validation...');
    const validationPassed = await performPostValidation();
    
    if (validationPassed) {
      console.log('\n🎉 All checks passed! Supabase is ready for the onboarding flow.');
    } else {
      console.log('\n⚠️  Some issues found that may affect onboarding functionality.');
    }
  } else {
    console.log('\n⚠️  Schema fixes needed before full validation.');
  }
}

main(); 