import { supabase } from './supabase';
import { createLogger } from '../utils/logger';

const logger = createLogger('ProfileService');

export interface ProfileData {
  firstName: string;
  lastName: string;
  location?: string;
  jobTitle?: string;
  bio?: string;
  username?: string;
}

export interface ProfileUpdateResult {
  success: boolean;
  error?: string;
  data?: any;
}

export class ProfileService {
  /**
   * Create a new user profile in the database
   */
  static async createProfile(userId: string, email: string, profileData: Partial<ProfileData>): Promise<ProfileUpdateResult> {
    try {
      logger.info('Creating new profile for user:', userId);

      const profileRecord = {
        id: userId,
        email,
        first_name: profileData.firstName || '',
        last_name: profileData.lastName || '',
        full_name: profileData.firstName && profileData.lastName 
          ? `${profileData.firstName} ${profileData.lastName}`.trim() 
          : '',
        location: profileData.location || null,
        job_title: profileData.jobTitle || null,
        bio: profileData.bio || null,
        username: profileData.username || '',
        onboarding_step: 'profile',
        onboarding_completed: false,
        oauth_provider: 'email',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileRecord, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create profile:', error);
        return { success: false, error: error.message };
      }

      logger.info('Profile created successfully:', data.id);
      return { success: true, data };

    } catch (error) {
      logger.error('Exception creating profile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create profile' 
      };
    }
  }

  /**
   * Update user profile with onboarding data
   */
  static async updateProfile(userId: string, profileData: Partial<ProfileData>, nextStep?: string): Promise<ProfileUpdateResult> {
    try {
      logger.info('Updating profile for user:', userId, 'with data:', profileData);

      // First, check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('id', userId)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        logger.warn('Profile does not exist, creating new profile');
        
        // Get user email from auth.users
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
        if (authError || !authUser.user) {
          return { success: false, error: 'User not found in authentication system' };
        }

        return this.createProfile(userId, authUser.user.email || '', profileData);
      }

      if (fetchError) {
        logger.error('Error fetching existing profile:', fetchError);
        return { success: false, error: fetchError.message };
      }

      // Build update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (profileData.firstName !== undefined) {
        updateData.first_name = profileData.firstName;
      }
      if (profileData.lastName !== undefined) {
        updateData.last_name = profileData.lastName;
      }
      if (profileData.firstName || profileData.lastName) {
        const firstName = profileData.firstName || existingProfile?.first_name || '';
        const lastName = profileData.lastName || existingProfile?.last_name || '';
        updateData.full_name = `${firstName} ${lastName}`.trim();
      }
      if (profileData.location !== undefined) {
        updateData.location = profileData.location || null;
      }
      if (profileData.jobTitle !== undefined) {
        updateData.job_title = profileData.jobTitle || null;
      }
      if (profileData.bio !== undefined) {
        updateData.bio = profileData.bio || null;
      }
      if (profileData.username !== undefined) {
        updateData.username = profileData.username;
      }
      if (nextStep) {
        updateData.onboarding_step = nextStep;
      }

      // Update the profile
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update profile:', error);
        return { success: false, error: error.message };
      }

      logger.info('Profile updated successfully:', data.id);
      return { success: true, data };

    } catch (error) {
      logger.error('Exception updating profile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update profile' 
      };
    }
  }

  /**
   * Get user profile data
   */
  static async getProfile(userId: string): Promise<ProfileUpdateResult> {
    try {
      logger.info('Fetching profile for user:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          full_name,
          location,
          job_title,
          bio,
          username,
          avatar_url,
          oauth_provider,
          onboarding_step,
          onboarding_completed,
          onboarding_completed_at,
          created_at,
          updated_at
        `)
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('Failed to fetch profile:', error);
        return { success: false, error: error.message };
      }

      logger.info('Profile fetched successfully for user:', userId);
      return { success: true, data };

    } catch (error) {
      logger.error('Exception fetching profile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch profile' 
      };
    }
  }

  /**
   * Update onboarding step
   */
  static async updateOnboardingStep(userId: string, step: string, completed: boolean = false): Promise<ProfileUpdateResult> {
    try {
      logger.info('Updating onboarding step for user:', userId, 'to step:', step);

      const updateData: any = {
        onboarding_step: step,
        updated_at: new Date().toISOString()
      };

      if (completed) {
        updateData.onboarding_completed = true;
        updateData.onboarding_completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select('id, onboarding_step, onboarding_completed')
        .single();

      if (error) {
        logger.error('Failed to update onboarding step:', error);
        return { success: false, error: error.message };
      }

      logger.info('Onboarding step updated successfully:', data);
      return { success: true, data };

    } catch (error) {
      logger.error('Exception updating onboarding step:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update onboarding step' 
      };
    }
  }

  /**
   * Complete onboarding process
   */
  static async completeOnboarding(userId: string): Promise<ProfileUpdateResult> {
    return this.updateOnboardingStep(userId, 'completed', true);
  }

  /**
   * Reset onboarding (development only)
   */
  static async resetOnboarding(userId: string): Promise<ProfileUpdateResult> {
    try {
      if (process.env.NODE_ENV === 'production') {
        return { success: false, error: 'Reset not allowed in production' };
      }

      logger.info('Resetting onboarding for user:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .update({
          onboarding_step: 'profile',
          onboarding_completed: false,
          onboarding_completed_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to reset onboarding:', error);
        return { success: false, error: error.message };
      }

      logger.info('Onboarding reset successfully');
      return { success: true, data };

    } catch (error) {
      logger.error('Exception resetting onboarding:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to reset onboarding' 
      };
    }
  }
} 