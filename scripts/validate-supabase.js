#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Validating Supabase Connection...\n');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('SUPABASE_URL:', SUPABASE_URL ? '✓' : '❌');
  console.error('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓' : '❌');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log(`📍 URL: ${SUPABASE_URL}`);
console.log(`🔑 Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function validateConnection() {
  try {
    console.log('\n🔗 Testing connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Connection successful');
    console.log(`📊 Profiles table exists with ${data?.length || 0} records`);
    
    return true;
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    return false;
  }
}

async function validateTables() {
  console.log('\n📋 Checking required tables...');
  
  const requiredTables = [
    'profiles',
    'interests', 
    'skills',
    'user_interests',
    'user_skills',
    'user_goals'
  ];
  
  const results = {};
  
  for (const table of requiredTables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        results[table] = { exists: false, count: 0, error: error.message };
      } else {
        console.log(`✅ ${table}: ${count || 0} records`);
        results[table] = { exists: true, count: count || 0 };
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
      results[table] = { exists: false, count: 0, error: error.message };
    }
  }
  
  return results;
}

async function checkSampleData() {
  console.log('\n🎯 Checking sample data...');
  
  try {
    const { data: interests, error: interestsError } = await supabase
      .from('interests')
      .select('*')
      .limit(5);
    
    if (interestsError) {
      console.log('❌ Interests data:', interestsError.message);
    } else {
      console.log(`✅ Sample interests: ${interests?.length || 0} found`);
      if (interests && interests.length > 0) {
        console.log('   -', interests.map(i => i.name).join(', '));
      }
    }
    
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('*')
      .limit(5);
    
    if (skillsError) {
      console.log('❌ Skills data:', skillsError.message);
    } else {
      console.log(`✅ Sample skills: ${skills?.length || 0} found`);
      if (skills && skills.length > 0) {
        console.log('   -', skills.map(s => s.name).join(', '));
      }
    }
  } catch (error) {
    console.log('❌ Sample data check failed:', error.message);
  }
}

async function main() {
  const connected = await validateConnection();
  
  if (!connected) {
    console.log('\n❌ Validation failed - connection issue');
    process.exit(1);
  }
  
  const tableResults = await validateTables();
  await checkSampleData();
  
  console.log('\n📈 Validation Summary:');
  console.log('='.repeat(40));
  
  const allTablesExist = Object.values(tableResults).every(result => result.exists);
  
  if (allTablesExist) {
    console.log('✅ All required tables exist');
    console.log('✅ Supabase is ready for onboarding flow');
  } else {
    console.log('⚠️  Some tables are missing or have issues');
    console.log('💡 Run the database setup script to create missing tables');
  }
  
  return allTablesExist;
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { validateConnection, validateTables, checkSampleData }; 