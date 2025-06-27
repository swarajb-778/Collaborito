import { supabase } from './supabase';
import { createLogger } from '../utils/logger';
import { profileService, ProfileData } from './ProfileService';

const logger = createLogger('OnboardingService');

// Interfaces for onboarding data
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

export interface OnboardingStepResult {
  success: boolean;
  data?: any;
  error?: string;
  nextStep?: string;
}

export interface OnboardingStatus {
  currentStep: string;
  completed: boolean;
  profileData?: ProfileData | null;
  interests?: Interest[];
  goal?: UserGoal;
  skills?: UserSkill[];
}

class OnboardingService {
  /**
   * Save profile step data to Supabase
   */
  async saveProfileStep(
    userId: string, 
    profileData: {
      firstName: string;
      lastName: string;
      location?: string;
      jobTitle?: string;
      bio?: string;
    }
  ): Promise<OnboardingStepResult> {
    try {
      logger.info('Saving profile step for user:', userId);

      // Map to database fields
      const dbProfileData: Partial<ProfileData> = {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        full_name: `${profileData.firstName} ${profileData.lastName}`,
        location: profileData.location,
        job_title: profileData.jobTitle,
        bio: profileData.bio,
        onboarding_step: 'interests'
      };

      const result = await profileService.upsertProfile(userId, dbProfileData);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }

      return {
        success: true,
        data: result.data,
        nextStep: 'interests'
      };

    } catch (error) {
      logger.error('Profile step save error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save interests step data to Supabase
   */
  async saveInterestsStep(userId: string, interestIds: string[]): Promise<OnboardingStepResult> {
    try {
      logger.info('Saving interests step for user:', userId);

      if (!interestIds || interestIds.length === 0) {
        return {
          success: false,
          error: 'At least one interest must be selected'
        };
      }

      // First, delete existing interests
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
      const userInterests = interestIds.map(interestId => ({
        user_id: userId,
        interest_id: interestId
      }));

      const { error: insertError } = await supabase
        .from('user_interests')
        .insert(userInterests);

      if (insertError) {
        logger.error('Error inserting interests:', insertError);
        return {
          success: false,
          error: insertError.message
        };
      }

      // Update profile onboarding step
      await profileService.updateOnboardingStep(userId, 'goals');

      return {
        success: true,
        nextStep: 'goals'
      };

    } catch (error) {
      logger.error('Interests step save error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save goals step data to Supabase
   */
  async saveGoalsStep(userId: string, goalData: UserGoal): Promise<OnboardingStepResult> {
    try {
      logger.info('Saving goals step for user:', userId);

      if (!goalData.goal_type) {
        return {
          success: false,
          error: 'Goal type is required'
        };
      }

      // First, deactivate existing goals
      const { error: updateError } = await supabase
        .from('user_goals')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (updateError) {
        logger.error('Error deactivating existing goals:', updateError);
        return {
          success: false,
          error: updateError.message
        };
      }

      // Insert new goal
      const { error: insertError } = await supabase
        .from('user_goals')
        .insert({
          user_id: userId,
          goal_type: goalData.goal_type,
          details: goalData.details,
          is_active: true
        });

      if (insertError) {
        logger.error('Error inserting goal:', insertError);
        return {
          success: false,
          error: insertError.message
        };
      }

      // Determine next step based on goal type
      const nextStep = goalData.goal_type === 'find_cofounder' ? 'project_details' : 'skills';
      
      // Update profile onboarding step
      await profileService.updateOnboardingStep(userId, nextStep);

      return {
        success: true,
        nextStep
      };

    } catch (error) {
      logger.error('Goals step save error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save skills step data to Supabase
   */
  async saveSkillsStep(userId: string, skills: UserSkill[]): Promise<OnboardingStepResult> {
    try {
      logger.info('Saving skills step for user:', userId);

      if (!skills || skills.length === 0) {
        return {
          success: false,
          error: 'At least one skill must be selected'
        };
      }

      // First, delete existing skills
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
      const userSkills = skills.map(skill => ({
        user_id: userId,
        skill_id: skill.skill_id,
        proficiency: skill.proficiency,
        is_offering: skill.is_offering
      }));

      const { error: insertError } = await supabase
        .from('user_skills')
        .insert(userSkills);

      if (insertError) {
        logger.error('Error inserting skills:', insertError);
        return {
          success: false,
          error: insertError.message
        };
      }

      // Complete onboarding
      await profileService.updateOnboardingStep(userId, 'completed');

      return {
        success: true,
        nextStep: 'completed'
      };

    } catch (error) {
      logger.error('Skills step save error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get available interests from database
   */
  async getAvailableInterests(): Promise<{ success: boolean; data?: Interest[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('interests')
        .select('*')
        .order('name');

      if (error) {
        logger.error('Error fetching interests:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      logger.error('Interests fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get available skills from database
   */
  async getAvailableSkills(): Promise<{ success: boolean; data?: Skill[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('name');

      if (error) {
        logger.error('Error fetching skills:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      logger.error('Skills fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get current onboarding status for user
   */
  async getOnboardingStatus(userId: string): Promise<{ success: boolean; data?: OnboardingStatus; error?: string }> {
    try {
      logger.info('Fetching onboarding status for user:', userId);

      // Get profile data
      const profileResult = await profileService.getProfile(userId);
      if (!profileResult.success) {
        return {
          success: false,
          error: profileResult.error
        };
      }

      const profile = profileResult.data;
      const currentStep = profile?.onboarding_step || 'profile';
      const completed = profile?.onboarding_completed || false;

      // Get user interests
      const { data: userInterests } = await supabase
        .from('user_interests')
        .select('interest_id, interests(id, name, category)')
        .eq('user_id', userId);

      const interests = userInterests?.map((ui: any) => ({
        id: ui.interests?.id || '',
        name: ui.interests?.name || '',
        category: ui.interests?.category
      })).filter((i: any) => i.id) as Interest[];

      // Get user goal
      const { data: userGoals } = await supabase
        .from('user_goals')
        .select('goal_type, details')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      const goal = userGoals ? {
        goal_type: userGoals.goal_type,
        details: userGoals.details
      } as UserGoal : undefined;

      // Get user skills
      const { data: userSkills } = await supabase
        .from('user_skills')
        .select('skill_id, proficiency, is_offering, skills(id, name, category)')
        .eq('user_id', userId);

      const skills = userSkills?.map((us: any) => ({
        skill_id: us.skill_id,
        proficiency: us.proficiency,
        is_offering: us.is_offering
      })) as UserSkill[];

      return {
        success: true,
        data: {
          currentStep,
          completed,
          profileData: profile,
          interests,
          goal,
          skills
        }
      };

    } catch (error) {
      logger.error('Onboarding status fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Initialize profile after signup
   */
  async initializeProfile(userId: string, email: string, username?: string): Promise<OnboardingStepResult> {
    try {
      logger.info('Initializing profile for new user:', userId);

      // Check if profile already exists
      const existsResult = await profileService.profileExists(userId);
      if (existsResult.error) {
        return {
          success: false,
          error: existsResult.error
        };
      }

      if (!existsResult.exists) {
        // Create initial profile
        const result = await profileService.createInitialProfile(userId, email, username);
        if (!result.success) {
          return {
            success: false,
            error: result.error
          };
        }
      }

      return {
        success: true,
        nextStep: 'profile'
      };

    } catch (error) {
      logger.error('Profile initialization error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const onboardingService = new OnboardingService(); 