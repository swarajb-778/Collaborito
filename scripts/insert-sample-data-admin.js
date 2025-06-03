#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

console.log('🚀 Inserting sample data with admin privileges...');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables!');
  console.log('Required: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const sampleInterests = [
  { name: 'Art', category: 'Creative' },
  { name: 'Artificial Intelligence & Machine Learning', category: 'Technology' },
  { name: 'Biotechnology', category: 'Science' },
  { name: 'Business', category: 'Business' },
  { name: 'Books', category: 'Entertainment' },
  { name: 'Climate Change', category: 'Environmental' },
  { name: 'Civic Engagement', category: 'Social' },
  { name: 'Dancing', category: 'Entertainment' },
  { name: 'Data Science', category: 'Technology' },
  { name: 'Education', category: 'Education' },
  { name: 'Entrepreneurship', category: 'Business' },
  { name: 'Fashion', category: 'Creative' },
  { name: 'Fitness', category: 'Health' },
  { name: 'Food', category: 'Lifestyle' },
  { name: 'Gaming', category: 'Entertainment' },
  { name: 'Health & Wellness', category: 'Health' },
  { name: 'Investing & Finance', category: 'Business' },
  { name: 'Marketing', category: 'Business' },
  { name: 'Movies', category: 'Entertainment' },
  { name: 'Music', category: 'Entertainment' },
  { name: 'Parenting', category: 'Lifestyle' },
  { name: 'Pets', category: 'Lifestyle' },
  { name: 'Product Design', category: 'Creative' },
  { name: 'Reading', category: 'Entertainment' },
  { name: 'Real Estate', category: 'Business' },
  { name: 'Robotics', category: 'Technology' },
  { name: 'Science & Tech', category: 'Technology' },
  { name: 'Social Impact', category: 'Social' },
  { name: 'Sports', category: 'Entertainment' },
  { name: 'Travel', category: 'Lifestyle' },
  { name: 'Writing', category: 'Creative' },
  { name: 'Other', category: 'Other' }
];

const sampleSkills = [
  { name: 'Accounting', category: 'Business' },
  { name: 'Artificial Intelligence & Machine Learning', category: 'Technology' },
  { name: 'Biotechnology', category: 'Science' },
  { name: 'Business Development', category: 'Business' },
  { name: 'Content Creation', category: 'Marketing' },
  { name: 'Counseling & Therapy', category: 'Health' },
  { name: 'Data Analysis', category: 'Technology' },
  { name: 'DevOps', category: 'Technology' },
  { name: 'Finance', category: 'Business' },
  { name: 'Fundraising', category: 'Business' },
  { name: 'Graphic Design', category: 'Creative' },
  { name: 'Legal', category: 'Professional' },
  { name: 'Manufacturing', category: 'Industrial' },
  { name: 'Marketing', category: 'Business' },
  { name: 'Policy', category: 'Government' },
  { name: 'Product Management', category: 'Business' },
  { name: 'Project Management', category: 'Business' },
  { name: 'Public Relations', category: 'Marketing' },
  { name: 'Research', category: 'Science' },
  { name: 'Sales', category: 'Business' },
  { name: 'Software Development (Backend)', category: 'Technology' },
  { name: 'Software Development (Frontend)', category: 'Technology' },
  { name: 'UI/UX Design', category: 'Creative' },
  { name: 'Other', category: 'Other' }
];

async function insertSampleDataWithAdmin() {
  try {
    console.log('🔍 Checking current data...');
    
    // Check existing data
    const { data: existingInterests, error: interestsCheckError } = await supabase
      .from('interests')
      .select('count', { count: 'exact', head: true });
    
    const { data: existingSkills, error: skillsCheckError } = await supabase
      .from('skills')
      .select('count', { count: 'exact', head: true });

    if (interestsCheckError || skillsCheckError) {
      console.error('❌ Error checking existing data:', interestsCheckError?.message || skillsCheckError?.message);
      return false;
    }

    console.log(`Current interests: ${existingInterests?.count || 0}`);
    console.log(`Current skills: ${existingSkills?.count || 0}`);

    let successCount = 0;

    // Insert interests if missing
    if ((existingInterests?.count || 0) === 0) {
      console.log('📋 Inserting sample interests with admin privileges...');
      
      const { data: insertedInterests, error: interestsError } = await supabase
        .from('interests')
        .insert(sampleInterests)
        .select();

      if (interestsError) {
        console.error('❌ Failed to insert interests:', interestsError.message);
        console.error('Error details:', interestsError);
      } else {
        console.log(`✅ Successfully inserted ${insertedInterests?.length || sampleInterests.length} interests`);
        successCount++;
      }
    } else {
      console.log('✅ Interests already exist');
      successCount++;
    }

    // Insert skills if missing
    if ((existingSkills?.count || 0) === 0) {
      console.log('🛠️ Inserting sample skills with admin privileges...');
      
      const { data: insertedSkills, error: skillsError } = await supabase
        .from('skills')
        .insert(sampleSkills)
        .select();

      if (skillsError) {
        console.error('❌ Failed to insert skills:', skillsError.message);
        console.error('Error details:', skillsError);
      } else {
        console.log(`✅ Successfully inserted ${insertedSkills?.length || sampleSkills.length} skills`);
        successCount++;
      }
    } else {
      console.log('✅ Skills already exist');
      successCount++;
    }

    // Final verification
    console.log('\n🔍 Final verification...');
    const { data: finalInterests } = await supabase.from('interests').select('count', { count: 'exact', head: true });
    const { data: finalSkills } = await supabase.from('skills').select('count', { count: 'exact', head: true });

    console.log(`📊 Final count - Interests: ${finalInterests?.count || 0}, Skills: ${finalSkills?.count || 0}`);
    
    const hasData = (finalInterests?.count || 0) > 0 && (finalSkills?.count || 0) > 0;
    
    if (hasData) {
      console.log('🎉 Sample data successfully populated!');
      console.log('✅ Onboarding should now work properly');
    } else {
      console.log('❌ Sample data insertion incomplete');
    }
    
    return hasData;

  } catch (error) {
    console.error('❌ Error inserting sample data:', error.message);
    return false;
  }
}

if (require.main === module) {
  insertSampleDataWithAdmin().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { insertSampleDataWithAdmin }; 