import { supabase } from '../services/supabase';
import { Alert } from 'react-native';

export const initializeDatabase = async (): Promise<boolean> => {
  try {
    console.log('Starting database initialization...');
    
    // Check if interests table exists and has data
    const { data: interests, error: interestsError } = await supabase
      .from('interests')
      .select('id')
      .limit(1);
    
    if (interestsError) {
      console.log('Interests table not found or empty, attempting to create...');
      
      // Try to create interests with a simple INSERT that will work if table exists
      const interestsData = [
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
      
      // Try inserting interests one by one to avoid conflicts
      for (const interest of interestsData) {
        try {
          await supabase
            .from('interests')
            .insert(interest);
        } catch (error) {
          // Ignore conflicts, the interest already exists
          console.log(`Interest "${interest.name}" already exists or failed to insert`);
        }
      }
    }
    
    // Check if skills table exists and has data
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id')
      .limit(1);
    
    if (skillsError) {
      console.log('Skills table not found or empty, attempting to create...');
      
      const skillsData = [
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
      
      // Try inserting skills one by one to avoid conflicts
      for (const skill of skillsData) {
        try {
          await supabase
            .from('skills')
            .insert(skill);
        } catch (error) {
          // Ignore conflicts, the skill already exists
          console.log(`Skill "${skill.name}" already exists or failed to insert`);
        }
      }
    }
    
    console.log('Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
};

export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    // Check if we can access the basic tables
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    const { error: interestsError } = await supabase
      .from('interests')
      .select('id')
      .limit(1);
    
    const { error: skillsError } = await supabase
      .from('skills')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      console.error('Profiles table not accessible:', profilesError);
      return false;
    }
    
    if (interestsError) {
      console.error('Interests table not accessible:', interestsError);
      return false;
    }
    
    if (skillsError) {
      console.error('Skills table not accessible:', skillsError);
      return false;
    }
    
    console.log('Database health check passed');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}; 