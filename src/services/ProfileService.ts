import { supabase } from './supabase';
import { createLogger } from '../utils/logger';

const logger = createLogger('ProfileService');

export interface ProfileData {
  id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  username?: string;
  location?: string;
  job_title?: string;
  bio?: string;
  avatar_url?: string;
  profile_image_path?: string;
  oauth_provider?: string;
  onboarding_step?: string;
  onboarding_completed?: boolean;
  onboarding_completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdateResult {
  success: boolean;
  data?: ProfileData | null;
  error?: string;
}

class ProfileService {
  /**
   * Create or update user profile in Supabase
   */
  async upsertProfile(userId: string, profileData: Partial<ProfileData>): Promise<ProfileUpdateResult> {
    try {
      logger.info('Upserting profile for user:', userId);
      logger.info('Profile data:', profileData);

      // Prepare the upsert data with proper field mapping
      const upsertData: ProfileData = {
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      };

      // Perform the upsert operation
      const { data, error } = await supabase
        .from('profiles')
        .upsert(upsertData, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        logger.error('Profile upsert error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      logger.info('Profile upserted successfully:', data);
      return {
        success: true,
        data: data
      };

    } catch (error) {
      logger.error('Profile service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user profile from Supabase
   */
  async getProfile(userId: string): Promise<ProfileUpdateResult> {
    try {
      logger.info('Fetching profile for user:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, this is okay for new users
          logger.info('No profile found for user:', userId);
          return {
            success: true,
            data: null
          };
        }
        
        logger.error('Profile fetch error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      logger.info('Profile fetched successfully:', data);
      return {
        success: true,
        data: data
      };

    } catch (error) {
      logger.error('Profile fetch service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update onboarding step
   */
  async updateOnboardingStep(userId: string, step: string): Promise<ProfileUpdateResult> {
    try {
      logger.info('Updating onboarding step for user:', userId, 'to:', step);

      const updateData: Partial<ProfileData> = {
        onboarding_step: step,
        updated_at: new Date().toISOString()
      };

      // If completing onboarding, set completion fields
      if (step === 'completed') {
        updateData.onboarding_completed = true;
        updateData.onboarding_completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Onboarding step update error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      logger.info('Onboarding step updated successfully:', data);
      return {
        success: true,
        data: data
      };

    } catch (error) {
      logger.error('Onboarding step update service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if profile exists for user
   */
  async profileExists(userId: string): Promise<{ exists: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { exists: false };
        }
        return { exists: false, error: error.message };
      }

      return { exists: !!data };

    } catch (error) {
      return { 
        exists: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Create initial profile for new user
   */
  async createInitialProfile(userId: string, email: string, username?: string): Promise<ProfileUpdateResult> {
    try {
      logger.info('Creating initial profile for user:', userId);

      const profileData: ProfileData = {
        id: userId,
        onboarding_step: 'profile',
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        logger.error('Initial profile creation error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      logger.info('Initial profile created successfully:', data);
      return {
        success: true,
        data: data
      };

    } catch (error) {
      logger.error('Initial profile creation service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const profileService = new ProfileService(); 