import { supabase } from './supabase';
import { ProfileService } from './ProfileService';
import { createLogger } from '../utils/logger';

const logger = createLogger('SimpleOnboardingService');

export interface InterestData {
  id: string;
  name: string;
}

export interface GoalData {
  type: 'find_cofounder' | 'find_collaborators' | 'contribute_skills' | 'explore_ideas';
  details?: any;
}

export interface SkillData {
  id: string;
  name: string;
  isOffering: boolean;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface OnboardingResult {
  success: boolean;
  error?: string;
  data?: any;
}

export class SimpleOnboardingService {
  /**
   * Get available interests from database
   */
  static async getInterests(): Promise<OnboardingResult> {
    try {
      logger.info('Fetching available interests...');

      const { data, error } = await supabase
        .from('interests')
        .select('id, name, category')
        .order('name');

      if (error) {
        logger.error('Failed to fetch interests:', error);
        return { success: false, error: error.message };
      }

      logger.info('Interests fetched successfully:', data?.length);
      return { success: true, data: data || [] };

    } catch (error) {
      logger.error('Exception fetching interests:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch interests' 
      };
    }
  }

  /**
   * Save user interests
   */
  static async saveInterests(userId: string, interestIds: string[]): Promise<OnboardingResult> {
    try {
      logger.info('Saving interests for user:', userId, 'interests:', interestIds.length);

      if (!interestIds || interestIds.length === 0) {
        return { success: false, error: 'At least one interest must be selected' };
      }

      // Delete existing interests first
      const { error: deleteError } = await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        logger.error('Failed to delete existing interests:', deleteError);
        return { success: false, error: deleteError.message };
      }

      // Insert new interests
      const userInterests = interestIds.map(interestId => ({
        user_id: userId,
        interest_id: interestId,
        created_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('user_interests')
        .insert(userInterests);

      if (insertError) {
        logger.error('Failed to insert user interests:', insertError);
        return { success: false, error: insertError.message };
      }

      // Update onboarding step
      const stepResult = await ProfileService.updateOnboardingStep(userId, 'goals');
      if (!stepResult.success) {
        logger.warn('Failed to update onboarding step:', stepResult.error);
      }

      logger.info('Interests saved successfully');
      return { success: true };

    } catch (error) {
      logger.error('Exception saving interests:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save interests' 
      };
    }
  }

  /**
   * Save user goal
   */
  static async saveGoal(userId: string, goalData: GoalData): Promise<OnboardingResult> {
    try {
      logger.info('Saving goal for user:', userId, 'goal:', goalData.type);

      // Delete existing goals first
      const { error: deleteError } = await supabase
        .from('user_goals')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        logger.error('Failed to delete existing goals:', deleteError);
        return { success: false, error: deleteError.message };
      }

      // Insert new goal
      const { error: insertError } = await supabase
        .from('user_goals')
        .insert({
          user_id: userId,
          goal_type: goalData.type,
          details: goalData.details || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        logger.error('Failed to insert user goal:', insertError);
        return { success: false, error: insertError.message };
      }

      // Determine next step based on goal type
      const nextStep = goalData.type === 'find_cofounder' ? 'project_details' : 'skills';
      
      // Update onboarding step
      const stepResult = await ProfileService.updateOnboardingStep(userId, nextStep);
      if (!stepResult.success) {
        logger.warn('Failed to update onboarding step:', stepResult.error);
      }

      logger.info('Goal saved successfully, next step:', nextStep);
      return { success: true, data: { nextStep } };

    } catch (error) {
      logger.error('Exception saving goal:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save goal' 
      };
    }
  }

  /**
   * Get available skills from database
   */
  static async getSkills(): Promise<OnboardingResult> {
    try {
      logger.info('Fetching available skills...');

      const { data, error } = await supabase
        .from('skills')
        .select('id, name, category')
        .order('name');

      if (error) {
        logger.error('Failed to fetch skills:', error);
        return { success: false, error: error.message };
      }

      logger.info('Skills fetched successfully:', data?.length);
      return { success: true, data: data || [] };

    } catch (error) {
      logger.error('Exception fetching skills:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch skills' 
      };
    }
  }

  /**
   * Save user skills and complete onboarding
   */
  static async saveSkills(userId: string, skills: SkillData[]): Promise<OnboardingResult> {
    try {
      logger.info('Saving skills for user:', userId, 'skills:', skills.length);

      if (!skills || skills.length === 0) {
        return { success: false, error: 'At least one skill must be selected' };
      }

      // Delete existing skills first
      const { error: deleteError } = await supabase
        .from('user_skills')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        logger.error('Failed to delete existing skills:', deleteError);
        return { success: false, error: deleteError.message };
      }

      // Insert new skills
      const userSkills = skills.map(skill => ({
        user_id: userId,
        skill_id: skill.id,
        is_offering: skill.isOffering,
        proficiency: skill.proficiency,
        created_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('user_skills')
        .insert(userSkills);

      if (insertError) {
        logger.error('Failed to insert user skills:', insertError);
        return { success: false, error: insertError.message };
      }

      // Complete onboarding
      const completeResult = await ProfileService.completeOnboarding(userId);
      if (!completeResult.success) {
        logger.warn('Failed to complete onboarding:', completeResult.error);
      }

      logger.info('Skills saved successfully and onboarding completed');
      return { success: true, data: { completed: true } };

    } catch (error) {
      logger.error('Exception saving skills:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save skills' 
      };
    }
  }

  /**
   * Get user onboarding progress
   */
  static async getOnboardingProgress(userId: string): Promise<OnboardingResult> {
    try {
      logger.info('Fetching onboarding progress for user:', userId);

      // Get profile data
      const profileResult = await ProfileService.getProfile(userId);
      if (!profileResult.success) {
        return profileResult;
      }

      const profile = profileResult.data;

      // Get user interests
      const { data: interests, error: interestsError } = await supabase
        .from('user_interests')
        .select('interest_id, interests(name)')
        .eq('user_id', userId);

      // Get user goal
      const { data: goals, error: goalsError } = await supabase
        .from('user_goals')
        .select('goal_type, details')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);

      // Get user skills
      const { data: skills, error: skillsError } = await supabase
        .from('user_skills')
        .select('skill_id, is_offering, proficiency, skills(name)')
        .eq('user_id', userId);

      // Calculate progress
      const progress = {
        currentStep: profile.onboarding_step || 'profile',
        completed: profile.onboarding_completed || false,
        profile: {
          firstName: profile.first_name,
          lastName: profile.last_name,
          location: profile.location,
          jobTitle: profile.job_title,
          bio: profile.bio
        },
        interests: interests || [],
        goals: goals && goals.length > 0 ? goals[0] : null,
        skills: skills || []
      };

      logger.info('Onboarding progress fetched successfully');
      return { success: true, data: progress };

    } catch (error) {
      logger.error('Exception fetching onboarding progress:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch onboarding progress' 
      };
    }
  }

  /**
   * Reset onboarding for development/testing
   */
  static async resetOnboarding(userId: string): Promise<OnboardingResult> {
    try {
      if (process.env.NODE_ENV === 'production') {
        return { success: false, error: 'Reset not allowed in production' };
      }

      logger.info('Resetting onboarding for user:', userId);

      // Reset profile
      const profileResult = await ProfileService.resetOnboarding(userId);
      if (!profileResult.success) {
        return profileResult;
      }

      // Clear user data
      await Promise.all([
        supabase.from('user_interests').delete().eq('user_id', userId),
        supabase.from('user_goals').delete().eq('user_id', userId),
        supabase.from('user_skills').delete().eq('user_id', userId)
      ]);

      logger.info('Onboarding reset successfully');
      return { success: true };

    } catch (error) {
      logger.error('Exception resetting onboarding:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to reset onboarding' 
      };
    }
  }
} 