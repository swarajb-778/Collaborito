#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

console.log('🎯 FINAL STATUS CHECK - Collaborito Supabase Configuration');
console.log('='.repeat(60));

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function finalStatusCheck() {
  const results = {
    envVars: false,
    connection: false,
    auth: false,
    coreTable: false,
    onboardingTables: false,
    sampleData: false
  };

  try {
    // 1. Environment Variables Check
    console.log('\n1️⃣ Environment Variables Check');
    console.log('   EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('   EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? `✅ Set (${supabaseAnonKey.length} chars)` : '❌ Missing');
    results.envVars = !!(supabaseUrl && supabaseAnonKey);

    // 2. Connection Test
    console.log('\n2️⃣ Connection Test');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.log('   ❌ Connection failed:', testError.message);
      if (testError.message.includes('Invalid API key')) {
        console.log('   🔧 Issue: API key problem - Check your Supabase dashboard');
      }
    } else {
      console.log('   ✅ Connection successful');
      results.connection = true;
    }

    // 3. Authentication Test
    console.log('\n3️⃣ Authentication System Test');
    try {
      const { data: session } = await supabase.auth.getSession();
      console.log('   ✅ Auth system accessible');
      results.auth = true;
    } catch (authError) {
      console.log('   ❌ Auth system error:', authError.message);
    }

    // 4. Core Tables Check
    console.log('\n4️⃣ Core Tables Check');
    const coreTables = ['profiles'];
    let coreTablesOk = true;
    
    for (const table of coreTables) {
      try {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
          coreTablesOk = false;
        } else {
          console.log(`   ✅ ${table}: accessible`);
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`);
        coreTablesOk = false;
      }
    }
    results.coreTable = coreTablesOk;

    // 5. Onboarding Tables Check
    console.log('\n5️⃣ Onboarding Tables Check');
    const onboardingTables = ['interests', 'skills', 'user_interests', 'user_skills', 'user_goals'];
    let onboardingTablesOk = true;
    
    for (const table of onboardingTables) {
      try {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
          onboardingTablesOk = false;
        } else {
          console.log(`   ✅ ${table}: accessible`);
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`);
        onboardingTablesOk = false;
      }
    }
    results.onboardingTables = onboardingTablesOk;

    // 6. Sample Data Check
    console.log('\n6️⃣ Sample Data Check');
    if (onboardingTablesOk) {
      const { data: interests } = await supabase.from('interests').select('count', { count: 'exact', head: true });
      const { data: skills } = await supabase.from('skills').select('count', { count: 'exact', head: true });
      
      const interestsCount = interests?.count || 0;
      const skillsCount = skills?.count || 0;
      
      console.log(`   📋 Interests: ${interestsCount}`);
      console.log(`   🛠️  Skills: ${skillsCount}`);
      
      if (interestsCount > 0 && skillsCount > 0) {
        console.log('   ✅ Sample data present');
        results.sampleData = true;
      } else {
        console.log('   ⚠️  Sample data missing (onboarding may not work fully)');
        console.log('   💡 Note: Tables exist but need sample data for interests/skills selection');
      }
    }

    // Final Assessment
    console.log('\n' + '='.repeat(60));
    console.log('🎯 FINAL ASSESSMENT');
    console.log('='.repeat(60));

    const criticalIssues = [];
    const warnings = [];

    if (!results.envVars) criticalIssues.push('Environment variables missing');
    if (!results.connection) criticalIssues.push('Supabase connection failed');
    if (!results.auth) criticalIssues.push('Authentication system issues');
    if (!results.coreTable) criticalIssues.push('Core tables missing');
    if (!results.onboardingTables) criticalIssues.push('Onboarding tables missing');
    if (!results.sampleData) warnings.push('Sample data missing');

    if (criticalIssues.length === 0) {
      console.log('🎉 SUCCESS: All critical Supabase issues have been resolved!');
      console.log('✅ API key errors: FIXED');
      console.log('✅ Database connection: WORKING');
      console.log('✅ Authentication: WORKING');
      console.log('✅ Database tables: CREATED');
      
      if (warnings.length === 0) {
        console.log('✅ Sample data: POPULATED');
        console.log('\n🚀 Your app should work completely now!');
      } else {
        console.log('⚠️  Sample data: MISSING (app will work but onboarding may be limited)');
        console.log('\n🔧 To fix sample data issue:');
        console.log('   1. Go to your Supabase dashboard SQL editor');
        console.log('   2. Run the INSERT statements from scripts/setup-database.sql');
        console.log('   3. Or manually add some interests and skills data');
      }
    } else {
      console.log('❌ ISSUES FOUND:');
      criticalIssues.forEach(issue => console.log(`   • ${issue}`));
      if (warnings.length > 0) {
        console.log('⚠️  WARNINGS:');
        warnings.forEach(warning => console.log(`   • ${warning}`));
      }
    }

    const overallSuccess = criticalIssues.length === 0;
    console.log(`\n📊 Overall Status: ${overallSuccess ? '✅ READY' : '❌ NEEDS ATTENTION'}`);
    
    return overallSuccess;

  } catch (error) {
    console.error('\n❌ Status check failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  finalStatusCheck().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { finalStatusCheck }; 