const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking Reference Data in Detail...\n');

async function checkReferenceData() {
  try {
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    
    // Check interests with different approaches
    console.log('📊 Checking interests table:');
    
    // Method 1: Count with exact
    const { data: interestCount, error: countError } = await serviceClient
      .from('interests')
      .select('*', { count: 'exact', head: true });
      
    console.log('Count query result:', interestCount, 'Error:', countError?.message);

    // Method 2: Direct select
    const { data: interestData, error: selectError } = await serviceClient
      .from('interests')
      .select('id, name, category')
      .limit(10);
      
    console.log('Direct select result:', interestData?.length, 'records');
    if (selectError) console.log('Select error:', selectError.message);
    
    if (interestData && interestData.length > 0) {
      console.log('Sample interests:', interestData.slice(0, 3));
    }

    // Method 3: Using anon key
    const anonClient = createClient(supabaseUrl, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
    const { data: anonInterests, error: anonError } = await anonClient
      .from('interests')
      .select('id, name')
      .limit(5);
      
    console.log('Anon client result:', anonInterests?.length, 'records');
    if (anonError) console.log('Anon error:', anonError.message);

    // Check skills
    console.log('\n🛠️  Checking skills table:');
    
    const { data: skillsData, error: skillsSelectError } = await serviceClient
      .from('skills')
      .select('id, name, category')
      .limit(10);
      
    console.log('Skills select result:', skillsData?.length, 'records');
    if (skillsSelectError) console.log('Skills select error:', skillsSelectError.message);
    
    if (skillsData && skillsData.length > 0) {
      console.log('Sample skills:', skillsData.slice(0, 3));
    }

    // Check if data exists but count is wrong
    console.log('\n🔄 Alternative count approach:');
    const { data: altInterests, error: altError } = await serviceClient
      .from('interests')
      .select('id');
      
    if (altError) {
      console.log('Alternative count error:', altError.message);
    } else {
      console.log('Alternative count result:', altInterests?.length || 0, 'interests');
    }

  } catch (error) {
    console.error('💥 Error during reference data check:', error);
  }
}

// Run the check
checkReferenceData(); 