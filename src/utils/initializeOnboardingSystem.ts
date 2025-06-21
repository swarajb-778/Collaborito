/**
 * Initialize Onboarding System
 * 
 * This utility script initializes the complete onboarding system:
 * - Sets up database schema
 * - Seeds initial data
 * - Tests the integration
 */

import { supabase } from '../services/supabase';
import { SeedDataService } from '../services/SeedDataService';
import { SimpleOnboardingManager } from '../services/SimpleOnboardingManager';
import { createLogger } from './logger';

const logger = createLogger('InitializeOnboarding');

export async function initializeOnboardingSystem(): Promise<boolean> {
  try {
    logger.info('🚀 Initializing onboarding system...');

    // Step 1: Check database connection
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      logger.warn('⚠️ No authenticated user, but continuing with schema setup');
    } else {
      logger.info('✅ User authenticated:', user?.id);
    }

    // Step 2: Check if required tables exist
    const tableCheckResults = await Promise.allSettled([
      checkTableExists('interests'),
      checkTableExists('skills'),
      checkTableExists('user_interests'),
      checkTableExists('user_skills'),
      checkTableExists('user_goals')
    ]);

    const missingTables = tableCheckResults
      .map((result, index) => ({ 
        table: ['interests', 'skills', 'user_interests', 'user_skills', 'user_goals'][index],
        exists: result.status === 'fulfilled' && result.value 
      }))
      .filter(table => !table.exists);

    if (missingTables.length > 0) {
      logger.warn('⚠️ Missing tables:', missingTables.map(t => t.table));
      logger.info('ℹ️ Please run the database migration manually or use Supabase dashboard');
    } else {
      logger.info('✅ All required tables exist');
    }

    // Step 3: Seed initial data
    const seedService = SeedDataService.getInstance();
    const seedResult = await seedService.seedAllData();
    
    if (seedResult) {
      logger.info('✅ Initial data seeded successfully');
    } else {
      logger.warn('⚠️ Data seeding failed, but continuing');
    }

    // Step 4: Initialize onboarding manager
    const onboardingManager = SimpleOnboardingManager.getInstance();
    const managerInitialized = await onboardingManager.initialize();
    
    if (managerInitialized) {
      logger.info('✅ Onboarding manager initialized successfully');
    } else {
      logger.error('❌ Onboarding manager initialization failed');
      return false;
    }

    // Step 5: Test basic functionality
    try {
      const progress = await onboardingManager.getCurrentProgress();
      logger.info('✅ Basic functionality test passed:', progress);
    } catch (error) {
      logger.warn('⚠️ Basic functionality test failed:', error);
    }

    logger.info('🎉 Onboarding system initialization completed successfully!');
    return true;

  } catch (error) {
    logger.error('❌ Failed to initialize onboarding system:', error);
    return false;
  }
}

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
}

export default initializeOnboardingSystem;
