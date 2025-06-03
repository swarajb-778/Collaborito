#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

console.log('🚀 Inserting sample data for Collaborito...');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

async function insertSampleData() {
  try {
    // Check if data already exists
    const { data: existingInterests } = await supabase.from('interests').select('count', { count: 'exact', head: true });
    const { data: existingSkills } = await supabase.from('skills').select('count', { count: 'exact', head: true });

    console.log(`Current interests: ${existingInterests?.count || 0}`);
    console.log(`Current skills: ${existingSkills?.count || 0}`);

    // Insert interests if missing
    if ((existingInterests?.count || 0) === 0) {
      console.log('📋 Inserting sample interests...');
      const { error: interestsError } = await supabase
        .from('interests')
        .insert(sampleInterests);

      if (interestsError) {
        console.error('❌ Failed to insert interests:', interestsError.message);
      } else {
        console.log(`✅ Inserted ${sampleInterests.length} interests`);
      }
    } else {
      console.log('✅ Interests already exist');
    }

    // Insert skills if missing
    if ((existingSkills?.count || 0) === 0) {
      console.log('🛠️ Inserting sample skills...');
      const { error: skillsError } = await supabase
        .from('skills')
        .insert(sampleSkills);

      if (skillsError) {
        console.error('❌ Failed to insert skills:', skillsError.message);
      } else {
        console.log(`✅ Inserted ${sampleSkills.length} skills`);
      }
    } else {
      console.log('✅ Skills already exist');
    }

    // Final verification
    const { data: finalInterests } = await supabase.from('interests').select('count', { count: 'exact', head: true });
    const { data: finalSkills } = await supabase.from('skills').select('count', { count: 'exact', head: true });

    console.log(`\n🎉 Final count - Interests: ${finalInterests?.count || 0}, Skills: ${finalSkills?.count || 0}`);
    
    if ((finalInterests?.count || 0) > 0 && (finalSkills?.count || 0) > 0) {
      console.log('✅ Sample data successfully populated!');
      return true;
    } else {
      console.log('❌ Sample data insertion incomplete');
      return false;
    }

  } catch (error) {
    console.error('❌ Error inserting sample data:', error.message);
    return false;
  }
}

if (require.main === module) {
  insertSampleData().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { insertSampleData }; 