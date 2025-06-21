/**
 * OnboardingSupabaseService - Direct Supabase integration for onboarding
 * 
 * This service provides the actual database operations for the onboarding system.
 * It handles all CRUD operations with Supabase tables and provides real-time updates.
 */

import { supabase } from './supabase';
import { createLogger } from '../utils/logger';

const logger = createLogger('OnboardingSupabaseService');

export interface ProfileData {
  firstName: string;
  lastName: string;
  location?: string;
  jobTitle?: string;
  bio?: string;
}

export interface InterestsData {
  interestIds: string[];
}

export interface GoalsData {
  goalType: 'find_cofounder' | 'find_collaborators' | 'contribute_skills' | 'explore_ideas';
  details?: any;
}

export interface ProjectDetailsData {
  name: string;
  description: string;
  tags: string[];
}

export interface SkillsData {
  skills: Array<{
    skillId: string;
    isOffering: boolean;
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }>;
}

export class OnboardingSupabaseService {
  private static instance: OnboardingSupabaseService;

  static getInstance(): OnboardingSupabaseService {
    if (!OnboardingSupabaseService.instance) {
      OnboardingSupabaseService.instance = new OnboardingSupabaseService();
    }
    return OnboardingSupabaseService.instance;
  }

  /**
   * Save profile data to Supabase
   */
  async saveProfile(userId: string, profileData: ProfileData): Promise<boolean> {
    try {
      logger.info('💾 Saving profile data to Supabase:', { userId, profileData });

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          location: profileData.location,
          job_title: profileData.jobTitle,
          bio: profileData.bio,
          onboarding_step: 'interests',
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        logger.error('❌ Error saving profile:', error);
        return false;
      }

      logger.info('✅ Profile saved successfully:', data);
      return true;

    } catch (error) {
      logger.error('❌ Exception saving profile:', error);
      return false;
    }
  }

  /**
   * Save interests data to Supabase
   */
  async saveInterests(userId: string, interestsData: InterestsData): Promise<boolean> {
    try {
      logger.info('💾 Saving interests data to Supabase:', { userId, interestsData });

      // First, delete existing interests
      await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', userId);

      // Then insert new interests
      if (interestsData.interestIds.length > 0) {
        const userInterests = interestsData.interestIds.map(interestId => ({
          user_id: userId,
          interest_id: interestId
        }));

        const { error } = await supabase
          .from('user_interests')
          .insert(userInterests);

        if (error) {
          logger.error('❌ Error saving interests:', error);
          return false;
        }
      }

      // Update onboarding step
      await supabase
        .from('profiles')
        .update({ 
          onboarding_step: 'goals',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      logger.info('✅ Interests saved successfully');
      return true;

    } catch (error) {
      logger.error('❌ Exception saving interests:', error);
      return false;
    }
  }

  /**
   * Save goals data to Supabase
   */
  async saveGoals(userId: string, goalsData: GoalsData): Promise<boolean> {
    try {
      logger.info('💾 Saving goals data to Supabase:', { userId, goalsData });

      const { data, error } = await supabase
        .from('user_goals')
        .upsert({
          user_id: userId,
          goal_type: goalsData.goalType,
          details: goalsData.details,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        logger.error('❌ Error saving goals:', error);
        return false;
      }

      // Update onboarding step based on goal type
      const nextStep = goalsData.goalType === 'find_cofounder' ? 'project_details' : 'skills';
      
      await supabase
        .from('profiles')
        .update({ 
          onboarding_step: nextStep,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      logger.info('✅ Goals saved successfully:', data);
      return true;

    } catch (error) {
      logger.error('❌ Exception saving goals:', error);
      return false;
    }
  }

  /**
   * Save project details to Supabase
   */
  async saveProjectDetails(userId: string, projectData: ProjectDetailsData): Promise<boolean> {
    try {
      logger.info('💾 Saving project details to Supabase:', { userId, projectData });

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          description: projectData.description,
          tags: projectData.tags,
          created_by: userId,
          created_at: new Date().toISOString()
        })
        .select();

      if (error) {
        logger.error('❌ Error saving project:', error);
        return false;
      }

      // Update onboarding step
      await supabase
        .from('profiles')
        .update({ 
          onboarding_step: 'skills',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      logger.info('✅ Project details saved successfully:', data);
      return true;

    } catch (error) {
      logger.error('❌ Exception saving project details:', error);
      return false;
    }
  }

  /**
   * Save skills data to Supabase
   */
  async saveSkills(userId: string, skillsData: SkillsData): Promise<boolean> {
    try {
      logger.info('💾 Saving skills data to Supabase:', { userId, skillsData });

      // First, delete existing skills
      await supabase
        .from('user_skills')
        .delete()
        .eq('user_id', userId);

      // Then insert new skills
      if (skillsData.skills.length > 0) {
        const userSkills = skillsData.skills.map(skill => ({
          user_id: userId,
          skill_id: skill.skillId,
          is_offering: skill.isOffering,
          proficiency: skill.proficiency
        }));

        const { error } = await supabase
          .from('user_skills')
          .insert(userSkills);

        if (error) {
          logger.error('❌ Error saving skills:', error);
          return false;
        }
      }

      // Complete onboarding
      await supabase
        .from('profiles')
        .update({ 
          onboarding_step: 'completed',
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      logger.info('✅ Skills saved successfully and onboarding completed');
      return true;

    } catch (error) {
      logger.error('❌ Exception saving skills:', error);
      return false;
    }
  }

  /**
   * Get available interests from Supabase
   */
  async getAvailableInterests(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('interests')
        .select('*')
        .order('name');

      if (error) {
        logger.error('❌ Error fetching interests:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      logger.error('❌ Exception fetching interests:', error);
      return [];
    }
  }

  /**
   * Get available skills from Supabase
   */
  async getAvailableSkills(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('name');

      if (error) {
        logger.error('❌ Error fetching skills:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      logger.error('❌ Exception fetching skills:', error);
      return [];
    }
  }

  /**
   * Get user's onboarding progress
   */
  async getOnboardingProgress(userId: string): Promise<{
    currentStep: string;
    isComplete: boolean;
    profileData?: any;
    interestsData?: any;
    goalsData?: any;
    projectData?: any;
    skillsData?: any;
  } | null> {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        logger.error('❌ Error fetching profile:', profileError);
        return null;
      }

      const result = {
        currentStep: profile.onboarding_step || 'profile',
        isComplete: profile.onboarding_completed || false,
        profileData: {
          firstName: profile.first_name,
          lastName: profile.last_name,
          location: profile.location,
          jobTitle: profile.job_title,
          bio: profile.bio
        }
      };

      // Fetch interests if user has progressed past profile
      if (profile.onboarding_step !== 'profile') {
        const { data: interests } = await supabase
          .from('user_interests')
          .select('interest_id')
          .eq('user_id', userId);

        if (interests) {
          result.interestsData = {
            interestIds: interests.map(i => i.interest_id)
          };
        }
      }

      // Fetch goals if user has progressed past interests
      if (['goals', 'project_details', 'skills', 'completed'].includes(profile.onboarding_step)) {
        const { data: goals } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true);

        if (goals && goals.length > 0) {
          result.goalsData = {
            goalType: goals[0].goal_type,
            details: goals[0].details
          };
        }
      }

      return result;

    } catch (error) {
      logger.error('❌ Exception fetching onboarding progress:', error);
      return null;
    }
  }

  /**
   * Validate step data before saving
   */
  validateStepData(stepId: string, data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (stepId) {
      case 'profile':
        if (!data.firstName || data.firstName.trim().length === 0) {
          errors.push('First name is required');
        }
        if (!data.lastName || data.lastName.trim().length === 0) {
          errors.push('Last name is required');
        }
        break;

      case 'interests':
        if (!data.interestIds || !Array.isArray(data.interestIds) || data.interestIds.length === 0) {
          errors.push('At least one interest must be selected');
        }
        break;

      case 'goals':
        const validGoalTypes = ['find_cofounder', 'find_collaborators', 'contribute_skills', 'explore_ideas'];
        if (!data.goalType || !validGoalTypes.includes(data.goalType)) {
          errors.push('Valid goal type is required');
        }
        break;

      case 'project_details':
        if (!data.name || data.name.trim().length === 0) {
          errors.push('Project name is required');
        }
        if (!data.description || data.description.trim().length < 10) {
          errors.push('Project description must be at least 10 characters');
        }
        break;

      case 'skills':
        if (!data.skills || !Array.isArray(data.skills) || data.skills.length === 0) {
          errors.push('At least one skill must be selected');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if user exists and create profile if needed
   */
  async ensureUserProfile(userId: string, email?: string): Promise<boolean> {
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingProfile) {
        // Create new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email,
            onboarding_step: 'profile',
            onboarding_completed: false,
            created_at: new Date().toISOString()
          });

        if (error) {
          logger.error('❌ Error creating user profile:', error);
          return false;
        }

        logger.info('✅ User profile created successfully');
      }

      return true;

    } catch (error) {
      logger.error('❌ Exception ensuring user profile:', error);
      return false;
    }
  }
}

export const getOnboardingSupabaseService = (): OnboardingSupabaseService => {
  return OnboardingSupabaseService.getInstance();
};

export default OnboardingSupabaseService;
