const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('Required environment variables:');
  console.log('- EXPO_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const interests = [
  { name: 'Artificial Intelligence', category: 'Technology' },
  { name: 'Machine Learning', category: 'Technology' },
  { name: 'Web Development', category: 'Technology' },
  { name: 'Mobile Development', category: 'Technology' },
  { name: 'Blockchain', category: 'Technology' },
  { name: 'Cybersecurity', category: 'Technology' },
  { name: 'Data Science', category: 'Technology' },
  { name: 'Cloud Computing', category: 'Technology' },
  { name: 'DevOps', category: 'Technology' },
  { name: 'UI/UX Design', category: 'Design' },
  { name: 'Graphic Design', category: 'Design' },
  { name: 'Product Design', category: 'Design' },
  { name: 'Digital Marketing', category: 'Marketing' },
  { name: 'Content Marketing', category: 'Marketing' },
  { name: 'Social Media Marketing', category: 'Marketing' },
  { name: 'E-commerce', category: 'Business' },
  { name: 'Entrepreneurship', category: 'Business' },
  { name: 'Finance', category: 'Business' },
  { name: 'Project Management', category: 'Business' },
  { name: 'Healthcare', category: 'Industry' },
  { name: 'Education', category: 'Industry' },
  { name: 'Gaming', category: 'Entertainment' },
  { name: 'Music', category: 'Entertainment' },
  { name: 'Photography', category: 'Creative' },
  { name: 'Writing', category: 'Creative' },
  { name: 'Sustainability', category: 'Social Impact' },
  { name: 'Environmental', category: 'Social Impact' },
  { name: 'Fitness', category: 'Health' },
  { name: 'Mental Health', category: 'Health' },
  { name: 'Travel', category: 'Lifestyle' },
  { name: 'Food & Beverage', category: 'Lifestyle' },
  { name: 'Real Estate', category: 'Business' }
];

const skills = [
  { name: 'JavaScript', category: 'Programming Languages' },
  { name: 'Python', category: 'Programming Languages' },
  { name: 'React', category: 'Frontend Frameworks' },
  { name: 'Node.js', category: 'Backend Technologies' },
  { name: 'SQL', category: 'Databases' },
  { name: 'MongoDB', category: 'Databases' },
  { name: 'AWS', category: 'Cloud Platforms' },
  { name: 'Docker', category: 'DevOps Tools' },
  { name: 'Git', category: 'Development Tools' },
  { name: 'Figma', category: 'Design Tools' },
  { name: 'Adobe Photoshop', category: 'Design Tools' },
  { name: 'Project Management', category: 'Management' },
  { name: 'Digital Marketing', category: 'Marketing' },
  { name: 'SEO', category: 'Marketing' },
  { name: 'Content Writing', category: 'Content Creation' },
  { name: 'Copywriting', category: 'Content Creation' },
  { name: 'Data Analysis', category: 'Analytics' },
  { name: 'Financial Modeling', category: 'Finance' },
  { name: 'Sales', category: 'Business Development' },
  { name: 'Customer Service', category: 'Operations' },
  { name: 'Team Leadership', category: 'Management' },
  { name: 'Communication', category: 'Soft Skills' },
  { name: 'Problem Solving', category: 'Soft Skills' },
  { name: 'Public Speaking', category: 'Soft Skills' }
];

async function insertSampleData() {
  try {
    console.log('🔍 Checking existing data...');
    
    // Check existing interests
    const { data: existingInterests } = await supabase
      .from('interests')
      .select('name');
    
    // Check existing skills
    const { data: existingSkills } = await supabase
      .from('skills')
      .select('name');
    
    console.log(`📊 Current data: ${existingInterests?.length || 0} interests, ${existingSkills?.length || 0} skills`);
    
    // Insert interests if none exist
    if (!existingInterests || existingInterests.length === 0) {
      console.log('📝 Inserting interests...');
      const { error: interestsError } = await supabase
        .from('interests')
        .insert(interests);
      
      if (interestsError) {
        console.error('❌ Error inserting interests:', interestsError.message);
      } else {
        console.log(`✅ Inserted ${interests.length} interests`);
      }
    } else {
      console.log('ℹ️  Interests already exist, skipping...');
    }
    
    // Insert skills if none exist
    if (!existingSkills || existingSkills.length === 0) {
      console.log('📝 Inserting skills...');
      const { error: skillsError } = await supabase
        .from('skills')
        .insert(skills);
      
      if (skillsError) {
        console.error('❌ Error inserting skills:', skillsError.message);
      } else {
        console.log(`✅ Inserted ${skills.length} skills`);
      }
    } else {
      console.log('ℹ️  Skills already exist, skipping...');
    }
    
    console.log('🎉 Sample data insertion completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

insertSampleData(); 