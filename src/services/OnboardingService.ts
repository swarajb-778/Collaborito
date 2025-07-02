import { supabase } from './supabase';
import { createLogger } from '../utils/logger';
import { profileService, ProfileData } from './ProfileService';

const logger = createLogger('OnboardingService');

// Core interfaces for onboarding
export interface Interest {
  id: string;
  name: string;
  category?: string;
}

export interface Skill {
  id: string;
  name: string;
  category?: string;
}

export interface UserSkill {
  skill_id: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  is_offering: boolean;
}

export interface UserGoal {
  goal_type: 'find_cofounder' | 'find_collaborators' | 'contribute_skills' | 'explore_ideas';
  details?: any;
}

export interface OnboardingResult {
  success: boolean;
  data?: any;
  error?: string;
  nextStep?: string;
}

/**
 * Production-ready OnboardingService
 * Handles all onboarding-related database operations with comprehensive error handling
 */
class OnboardingService {
  /**
   * Save profile data during onboarding
   */
  async saveProfileStep(userId: string, profileData: Partial<ProfileData>): Promise<OnboardingResult> {
    try {
      logger.info('Saving profile step for user:', userId, profileData);

      const result = await profileService.upsertProfile(userId, {
        ...profileData,
        onboarding_step: 'interests'
      });

      if (result.success) {
        logger.info('Profile saved successfully, moving to interests');
        return {
          success: true,
          data: result.data,
          nextStep: '/onboarding/interests'
        };
      } else {
        logger.error('Profile save failed:', result.error);
        return {
          success: false,
          error: result.error || 'Failed to save profile'
        };
      }
    } catch (error) {
      logger.error('Profile step save error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error saving profile'
      };
    }
  }

  /**
   * Get available interests from database
   */
  async getAvailableInterests(): Promise<OnboardingResult> {
    try {
      logger.info('Fetching available interests...');
      
      const { data, error } = await supabase
        .from('interests')
        .select('id, name, category')
        .order('category, name');

      if (error) {
        logger.error('Interests fetch error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      logger.info(`Successfully loaded ${data?.length || 0} interests`);
      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      logger.error('Interests service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch interests'
      };
    }
  }

  /**
   * Save user's selected interests
   */
  async saveInterestsStep(userId: string, interestIds: string[]): Promise<OnboardingResult> {
    try {
      logger.info('Saving interests for user:', userId, 'Count:', interestIds.length);

      // First, delete existing interests for this user
      const { error: deleteError } = await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        logger.error('Error deleting existing interests:', deleteError);
        return {
          success: false,
          error: deleteError.message
        };
      }

      // Insert new interests
      if (interestIds.length > 0) {
        const interestData = interestIds.map(interestId => ({
          user_id: userId,
          interest_id: interestId
        }));

        const { error: insertError } = await supabase
          .from('user_interests')
          .insert(interestData);

        if (insertError) {
          logger.error('Error inserting interests:', insertError);
          return {
            success: false,
            error: insertError.message
          };
        }
      }

      // Update profile to next step
      const profileResult = await profileService.updateOnboardingStep(userId, 'goals');
      
      if (profileResult.success) {
        logger.info('Interests saved successfully, moving to goals');
        return {
          success: true,
          data: { count: interestIds.length },
          nextStep: '/onboarding/goals'
        };
      } else {
        return {
          success: false,
          error: 'Interests saved but failed to update onboarding step'
        };
      }
    } catch (error) {
      logger.error('Interests step save error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save interests'
      };
    }
  }

  /**
   * Save user's goals
   */
  async saveGoalsStep(userId: string, goal: UserGoal): Promise<OnboardingResult> {
    try {
      logger.info('Saving goals for user:', userId, goal);

      // Delete existing goals
      const { error: deleteError } = await supabase
        .from('user_goals')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        logger.error('Error deleting existing goals:', deleteError);
        return {
          success: false,
          error: deleteError.message
        };
      }

      // Insert new goal
      const { error: insertError } = await supabase
        .from('user_goals')
        .insert({
          user_id: userId,
          goal_type: goal.goal_type,
          details: goal.details || {}
        });

      if (insertError) {
        logger.error('Error inserting goal:', insertError);
        return {
          success: false,
          error: insertError.message
        };
      }

      // Update profile to next step
      const profileResult = await profileService.updateOnboardingStep(userId, 'project-skills');
      
      if (profileResult.success) {
        logger.info('Goals saved successfully, moving to project-skills');
        return {
          success: true,
          data: goal,
          nextStep: `/onboarding/project-skills?goalType=${goal.goal_type}`
        };
      } else {
        return {
          success: false,
          error: 'Goals saved but failed to update onboarding step'
        };
      }
    } catch (error) {
      logger.error('Goals step save error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save goals'
      };
    }
  }

  /**
   * Get available skills from database
   */
  async getAvailableSkills(): Promise<OnboardingResult> {
    try {
      logger.info('Fetching available skills...');
      
      const { data, error } = await supabase
        .from('skills')
        .select('id, name, category')
        .order('category, name');

      if (error) {
        logger.error('Skills fetch error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      logger.info(`Successfully loaded ${data?.length || 0} skills`);
      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      logger.error('Skills service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch skills'
      };
    }
  }

  /**
   * Save user's skills and complete onboarding
   */
  async saveSkillsStep(userId: string, skills: UserSkill[]): Promise<OnboardingResult> {
    try {
      logger.info('Saving skills for user:', userId, 'Count:', skills.length);

      // Delete existing skills
      const { error: deleteError } = await supabase
        .from('user_skills')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        logger.error('Error deleting existing skills:', deleteError);
        return {
          success: false,
          error: deleteError.message
        };
      }

      // Insert new skills
      if (skills.length > 0) {
        const skillData = skills.map(skill => ({
          user_id: userId,
          skill_id: skill.skill_id,
          proficiency: skill.proficiency,
          is_offering: skill.is_offering
        }));

        const { error: insertError } = await supabase
          .from('user_skills')
          .insert(skillData);

        if (insertError) {
          logger.error('Error inserting skills:', insertError);
          return {
            success: false,
            error: insertError.message
          };
        }
      }

      // Complete onboarding
      const profileResult = await profileService.completeOnboarding(userId);
      
      if (profileResult.success) {
        logger.info('Skills saved and onboarding completed successfully');
        return {
          success: true,
          data: { count: skills.length, completed: true },
          nextStep: '/(tabs)'
        };
      } else {
        return {
          success: false,
          error: 'Skills saved but failed to complete onboarding'
        };
      }
    } catch (error) {
      logger.error('Skills step save error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save skills'
      };
    }
  }

  /**
   * Get user's onboarding progress
   */
  async getOnboardingProgress(userId: string): Promise<OnboardingResult> {
    try {
      logger.info('Getting onboarding progress for user:', userId);

      const profileResult = await profileService.getProfile(userId);
      
      if (profileResult.success && profileResult.data) {
        const profile = profileResult.data;
        return {
          success: true,
          data: {
            currentStep: profile.onboarding_step || 'profile',
            completed: profile.onboarding_completed || false,
            profile: profile
          }
        };
      } else {
        return {
          success: false,
          error: 'Failed to get onboarding progress'
        };
      }
    } catch (error) {
      logger.error('Onboarding progress error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get onboarding progress'
      };
    }
  }
}

// Export singleton instance
export const onboardingService = new OnboardingService(); 