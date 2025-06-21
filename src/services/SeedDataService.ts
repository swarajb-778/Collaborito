/**
 * SeedDataService - Service to populate initial data in Supabase
 * 
 * This service creates the initial interests and skills data needed for the onboarding flow.
 */

import { supabase } from './supabase';
import { createLogger } from '../utils/logger';

const logger = createLogger('SeedDataService');

export class SeedDataService {
  private static instance: SeedDataService;

  static getInstance(): SeedDataService {
    if (!SeedDataService.instance) {
      SeedDataService.instance = new SeedDataService();
    }
    return SeedDataService.instance;
  }

  /**
   * Seed all initial data
   */
  async seedAllData(): Promise<boolean> {
    try {
      logger.info('🌱 Starting to seed all data...');

      const results = await Promise.allSettled([
        this.seedInterests(),
        this.seedSkills()
      ]);

      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        logger.warn('⚠️ Some seed operations failed:', failures);
      }

      logger.info('✅ Data seeding completed');
      return true;

    } catch (error) {
      logger.error('❌ Error seeding data:', error);
      return false;
    }
  }

  /**
   * Seed interests data
   */
  async seedInterests(): Promise<boolean> {
    try {
      const interests = [
        { name: 'Artificial Intelligence', category: 'Technology' },
        { name: 'Machine Learning', category: 'Technology' },
        { name: 'Web Development', category: 'Technology' },
        { name: 'Mobile Development', category: 'Technology' },
        { name: 'Data Science', category: 'Technology' },
        { name: 'Blockchain', category: 'Technology' },
        { name: 'Cloud Computing', category: 'Technology' },
        { name: 'Cybersecurity', category: 'Technology' },
        { name: 'DevOps', category: 'Technology' },
        { name: 'UI/UX Design', category: 'Design' },
        { name: 'Graphic Design', category: 'Design' },
        { name: 'Product Design', category: 'Design' },
        { name: 'E-commerce', category: 'Business' },
        { name: 'FinTech', category: 'Business' },
        { name: 'HealthTech', category: 'Business' },
        { name: 'EdTech', category: 'Business' },
        { name: 'SaaS', category: 'Business' },
        { name: 'Marketing', category: 'Business' },
        { name: 'Sales', category: 'Business' },
        { name: 'Project Management', category: 'Business' },
        { name: 'Content Creation', category: 'Creative' },
        { name: 'Video Production', category: 'Creative' },
        { name: 'Photography', category: 'Creative' },
        { name: 'Writing', category: 'Creative' },
        { name: 'Music', category: 'Creative' },
        { name: 'Gaming', category: 'Entertainment' },
        { name: 'Social Impact', category: 'Social' },
        { name: 'Environment', category: 'Social' },
        { name: 'Sustainability', category: 'Social' },
        { name: 'Fitness & Health', category: 'Health' }
      ];

      // Check if interests already exist
      const { data: existingInterests } = await supabase
        .from('interests')
        .select('id')
        .limit(1);

      if (existingInterests && existingInterests.length > 0) {
        logger.info('ℹ️ Interests already seeded');
        return true;
      }

      const { data, error } = await supabase
        .from('interests')
        .insert(interests)
        .select();

      if (error) {
        logger.error('❌ Error seeding interests:', error);
        return false;
      }

      logger.info('✅ Interests seeded successfully:', data?.length);
      return true;

    } catch (error) {
      logger.error('❌ Exception seeding interests:', error);
      return false;
    }
  }

  /**
   * Seed skills data
   */
  async seedSkills(): Promise<boolean> {
    try {
      const skills = [
        // Programming Languages
        { name: 'JavaScript', category: 'Programming' },
        { name: 'TypeScript', category: 'Programming' },
        { name: 'Python', category: 'Programming' },
        { name: 'Java', category: 'Programming' },
        { name: 'C++', category: 'Programming' },
        { name: 'Go', category: 'Programming' },
        { name: 'Rust', category: 'Programming' },
        { name: 'Swift', category: 'Programming' },
        { name: 'Kotlin', category: 'Programming' },
        { name: 'PHP', category: 'Programming' },
        
        // Frontend Technologies
        { name: 'React', category: 'Frontend' },
        { name: 'Vue.js', category: 'Frontend' },
        { name: 'Angular', category: 'Frontend' },
        { name: 'HTML/CSS', category: 'Frontend' },
        { name: 'React Native', category: 'Mobile' },
        { name: 'Flutter', category: 'Mobile' },
        { name: 'iOS Development', category: 'Mobile' },
        { name: 'Android Development', category: 'Mobile' },
        
        // Backend Technologies
        { name: 'Node.js', category: 'Backend' },
        { name: 'Express.js', category: 'Backend' },
        { name: 'Django', category: 'Backend' },
        { name: 'Flask', category: 'Backend' },
        { name: 'Spring Boot', category: 'Backend' },
        { name: 'Rails', category: 'Backend' },
        
        // Databases
        { name: 'PostgreSQL', category: 'Database' },
        { name: 'MySQL', category: 'Database' },
        { name: 'MongoDB', category: 'Database' },
        { name: 'Redis', category: 'Database' },
        { name: 'Supabase', category: 'Database' },
        { name: 'Firebase', category: 'Database' },
        
        // Cloud & DevOps
        { name: 'AWS', category: 'Cloud' },
        { name: 'Google Cloud', category: 'Cloud' },
        { name: 'Azure', category: 'Cloud' },
        { name: 'Docker', category: 'DevOps' },
        { name: 'Kubernetes', category: 'DevOps' },
        { name: 'CI/CD', category: 'DevOps' },
        
        // Design
        { name: 'Figma', category: 'Design' },
        { name: 'Sketch', category: 'Design' },
        { name: 'Adobe Creative Suite', category: 'Design' },
        { name: 'Prototyping', category: 'Design' },
        { name: 'User Research', category: 'Design' },
        
        // Data & AI
        { name: 'Machine Learning', category: 'Data' },
        { name: 'Data Analysis', category: 'Data' },
        { name: 'TensorFlow', category: 'AI' },
        { name: 'PyTorch', category: 'AI' },
        { name: 'Pandas', category: 'Data' },
        { name: 'NumPy', category: 'Data' },
        
        // Business
        { name: 'Product Management', category: 'Business' },
        { name: 'Business Strategy', category: 'Business' },
        { name: 'Marketing', category: 'Business' },
        { name: 'Sales', category: 'Business' },
        { name: 'Customer Success', category: 'Business' },
        { name: 'Financial Modeling', category: 'Business' }
      ];

      // Check if skills already exist
      const { data: existingSkills } = await supabase
        .from('skills')
        .select('id')
        .limit(1);

      if (existingSkills && existingSkills.length > 0) {
        logger.info('ℹ️ Skills already seeded');
        return true;
      }

      const { data, error } = await supabase
        .from('skills')
        .insert(skills)
        .select();

      if (error) {
        logger.error('❌ Error seeding skills:', error);
        return false;
      }

      logger.info('✅ Skills seeded successfully:', data?.length);
      return true;

    } catch (error) {
      logger.error('❌ Exception seeding skills:', error);
      return false;
    }
  }

  /**
   * Clear all seed data (for testing)
   */
  async clearAllData(): Promise<boolean> {
    try {
      logger.info('🧹 Clearing all seed data...');

      await Promise.all([
        supabase.from('user_interests').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('user_skills').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('interests').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('skills').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      ]);

      logger.info('✅ All seed data cleared');
      return true;

    } catch (error) {
      logger.error('❌ Error clearing data:', error);
      return false;
    }
  }
}

export const getSeedDataService = (): SeedDataService => {
  return SeedDataService.getInstance();
};

export default SeedDataService;
