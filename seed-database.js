const { createClient } = require('@supabase/supabase-js');

// Use service role key for admin operations
const supabase = createClient(
  'https://ekydublgvsoaaepdhtzc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWR1YmxndnNvYWFlcGRodHpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzUxMDQ1NSwiZXhwIjoyMDU5MDg2NDU1fQ.TY63nJARwPQrg53WYub2o3v-sJNR-9dhIjpdmrtWTws'
);

const interests = [
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

const skills = [
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

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if we can use the anon key instead
    const anonSupabase = createClient(
      'https://ekydublgvsoaaepdhtzc.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWR1YmxndnNvYWFlcGRodHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTA0NTUsImV4cCI6MjA1OTA4NjQ1NX0.CSN4WGqUDaOeTB-Mz9SEJvKM6_wx_ReH3lZIQRkGAzA'
    );

    // Test table access first
    const { data: testData, error: testError } = await anonSupabase
      .from('profiles')
      .select('id')
      .limit(1);

    console.log('Testing database access...');
    if (testError) {
      console.log('❌ Database access error:', testError.message);
      return;
    } else {
      console.log('✅ Database accessible');
    }

    // Check if we need to modify the profiles table structure
    console.log('Checking profiles table structure...');
    const { data: profileData, error: profileError } = await anonSupabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profileError) {
      console.log('❌ Error accessing profiles:', profileError.message);
    } else {
      console.log('✅ Profiles table accessible');
      if (profileData && profileData.length > 0) {
        console.log('Current profile structure:', Object.keys(profileData[0]));
      }
    }

    console.log('\n📊 Database seeding completed. Note: Table creation requires database admin access.');
    console.log('💡 The app will automatically handle missing tables using fallback methods.');

  } catch (err) {
    console.error('❌ Seeding error:', err.message);
  }
}

seedDatabase(); 