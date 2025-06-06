import { supabase, handleError } from './supabase';
import { Profile, Interest, UserInterest, Skill, UserSkill, UserGoal, ProjectSkill } from '../types/supabase';
import Constants from 'expo-constants';
import { syncService } from './syncService';
import { errorRecoveryService } from './errorRecoveryService';
import { performanceService } from './performanceService';
import { databaseInit } from '../utils/databaseInit';

/**
 * Service for handling onboarding-related data operations
 */

/**
 * Updates the user's profile with the provided data and updates the onboarding step
 */
export const updateUserProfile = async (
  userId: string, 
  profileData: Partial<Profile>, 
  step?: Profile['onboarding_step']
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Update the onboarding step if provided
    const dataToUpdate = { ...profileData };
    if (step) {
      dataToUpdate.onboarding_step = step;
    }

    const { error } = await supabase
      .from('profiles')
      .update(dataToUpdate)
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update profile' 
    };
  }
};

/**
 * Completes the onboarding process for a user
 */
export const completeOnboarding = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_step: 'completed'
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to complete onboarding' 
    };
  }
};

/**
 * Fetches all available interests
 */
export const getInterests = async (): Promise<{ data: Interest[] | null; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('interests')
      .select('*')
      .order('name');

    if (error) {
      throw error;
    }

    return { data };
  } catch (error) {
    console.error('Error fetching interests:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to fetch interests' 
    };
  }
};

/**
 * Fetches all available skills
 */
export const getSkills = async (): Promise<{ data: Skill[] | null; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('name');

    if (error) {
      throw error;
    }

    return { data };
  } catch (error) {
    console.error('Error fetching skills:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to fetch skills' 
    };
  }
};

/**
 * Gets a user's selected interests
 */
export const getUserInterests = async (userId: string): Promise<{ data: UserInterest[] | null; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('user_interests')
      .select(`
        *,
        interest:interest_id (*)
      `)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return { data };
  } catch (error) {
    console.error('Error fetching user interests:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to fetch user interests' 
    };
  }
};

/**
 * Updates a user's selected interests
 */
export const updateUserInterests = async (
  userId: string, 
  interestIds: string[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    // First delete existing user interests
    const { error: deleteError } = await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      throw deleteError;
    }

    // Then insert the new interests if there are any
    if (interestIds.length > 0) {
      const interestsToInsert = interestIds.map(interestId => ({
        user_id: userId,
        interest_id: interestId
      }));

      const { error: insertError } = await supabase
        .from('user_interests')
        .insert(interestsToInsert);

      if (insertError) {
        throw insertError;
      }
    }

    // Update the onboarding step
    await updateUserProfile(userId, {}, 'interests');

    return { success: true };
  } catch (error) {
    console.error('Error updating user interests:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update interests' 
    };
  }
};

/**
 * Gets a user's selected skills
 */
export const getUserSkills = async (userId: string): Promise<{ data: UserSkill[] | null; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('user_skills')
      .select(`
        *,
        skill:skill_id (*)
      `)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return { data };
  } catch (error) {
    console.error('Error fetching user skills:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to fetch user skills' 
    };
  }
};

/**
 * Updates a user's selected skills
 */
export const updateUserSkills = async (
  userId: string, 
  skills: { skillId: string; isOffering: boolean; proficiency?: UserSkill['proficiency'] }[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    // First delete existing user skills
    const { error: deleteError } = await supabase
      .from('user_skills')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      throw deleteError;
    }

    // Then insert the new skills if there are any
    if (skills.length > 0) {
      const skillsToInsert = skills.map(skill => ({
        user_id: userId,
        skill_id: skill.skillId,
        is_offering: skill.isOffering,
        proficiency: skill.proficiency
      }));

      const { error: insertError } = await supabase
        .from('user_skills')
        .insert(skillsToInsert);

      if (insertError) {
        throw insertError;
      }
    }

    // Update the onboarding step
    await updateUserProfile(userId, {}, 'skills');

    return { success: true };
  } catch (error) {
    console.error('Error updating user skills:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update skills' 
    };
  }
};

/**
 * Sets a user's goal for the platform
 */
export const setUserGoal = async (
  userId: string, 
  goalType: UserGoal['goal_type'],
  details?: Record<string, any>
): Promise<{ success: boolean; error?: string }> => {
  try {
    // First update any existing active goals to inactive
    const { error: updateError } = await supabase
      .from('user_goals')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (updateError) {
      throw updateError;
    }

    // Then insert the new goal
    const { error: insertError } = await supabase
      .from('user_goals')
      .insert({
        user_id: userId,
        goal_type: goalType,
        is_active: true,
        details: details || {}
      });

    if (insertError) {
      throw insertError;
    }

    // Update the onboarding step
    await updateUserProfile(userId, {}, 'goals');

    return { success: true };
  } catch (error) {
    console.error('Error setting user goal:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to set goal' 
    };
  }
};

/**
 * Gets a user's active goal
 */
export const getUserActiveGoal = async (userId: string): Promise<{ data: UserGoal | null; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
      throw error;
    }

    return { data: data || null };
  } catch (error) {
    console.error('Error fetching user active goal:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to fetch active goal' 
    };
  }
};

/**
 * Gets a user's onboarding status
 */
export const getUserOnboardingStatus = async (userId: string): Promise<{ 
  data: { 
    completed: boolean; 
    step: Profile['onboarding_step']; 
  } | null;
  error?: string;
}> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_completed, onboarding_step')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return { 
      data: { 
        completed: data.onboarding_completed || false, 
        step: data.onboarding_step || 'profile'
      } 
    };
  } catch (error) {
    console.error('Error fetching user onboarding status:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to fetch onboarding status' 
    };
  }
}; 

export interface OnboardingProfileData {
  firstName: string;
  lastName: string;
  location?: string;
  jobTitle?: string;
  bio?: string;
}

export interface OnboardingInterestsData {
  interestIds: string[];
}

export interface OnboardingGoalsData {
  goalType: 'find_cofounder' | 'find_collaborators' | 'contribute_skills' | 'explore_ideas';
  details?: Record<string, any>;
}

export interface OnboardingProjectData {
  name: string;
  description: string;
  tags?: string[];
}

export interface OnboardingSkillData {
  skillId: string;
  isOffering: boolean;
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface OnboardingSkillsData {
  skills: OnboardingSkillData[];
}

export type OnboardingStep = 'profile' | 'interests' | 'goals' | 'project_details' | 'skills' | 'completed';

class OnboardingService {
  constructor() {
    // Initialize performance monitoring
    performanceService.startPerformanceMonitoring();
  }

  private async callEdgeFunction(functionName: string, data: any) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.warn('No authentication token available, falling back to direct database operations');
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${Constants.expoConfig?.extra?.SUPABASE_URL}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to call ${functionName}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Edge function ${functionName} failed:`, error);
      
      // Use error recovery service
      const recovered = await errorRecoveryService.handleError(
        error as Error,
        `edge_function_${functionName}`,
        undefined,
        false
      );
      
      if (!recovered) {
        throw error;
      }
    }
  }

  // Fallback method for saving profile data directly to Supabase
  private async saveProfileDataDirect(data: OnboardingProfileData) {
    console.log('💾 Saving profile data directly to Supabase...');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user found');
    }

    console.log('Current user ID:', user.id);

    // First check if profile exists, if not create it
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine
      console.error('Error checking existing profile:', fetchError);
      throw fetchError;
    }

    const profileData = {
      id: user.id,
      first_name: data.firstName,
      last_name: data.lastName,
      location: data.location,
      job_title: data.jobTitle,
      bio: data.bio,
      onboarding_step: 'interests',
      onboarding_completed: false,
      updated_at: new Date().toISOString()
    };

    let error;

    if (existingProfile) {
      console.log('Updating existing profile');
      // Update existing profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);
      error = updateError;
    } else {
      console.log('Creating new profile');
      // Create new profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          ...profileData,
          created_at: new Date().toISOString()
        });
      error = insertError;
    }

    if (error) {
      console.error('Error saving profile:', error);
      throw error;
    }

    console.log('✅ Profile data saved successfully');
    return { success: true };
  }

  // Fallback method for saving interests directly to Supabase
  private async saveInterestsDataDirect(data: OnboardingInterestsData) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user found');
    }

    // First delete existing interests
    const { error: deleteError } = await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    // Insert new interests if any
    if (data.interestIds.length > 0) {
      const interestsToInsert = data.interestIds.map(id => ({
        user_id: user.id,
        interest_id: id
      }));

      const { error: insertError } = await supabase
        .from('user_interests')
        .insert(interestsToInsert);

      if (insertError) {
        throw insertError;
      }
    }

    // Update onboarding step
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ onboarding_step: 'interests' })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return { success: true };
  }

  // Fallback method for saving goals directly to Supabase
  private async saveGoalsDataDirect(data: OnboardingGoalsData) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user found');
    }

    // First deactivate existing goals
    const { error: updateError } = await supabase
      .from('user_goals')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (updateError) {
      throw updateError;
    }

    // Insert new goal
    const { error: insertError } = await supabase
      .from('user_goals')
      .insert({
        user_id: user.id,
        goal_type: data.goalType,
        details: data.details || {},
        is_active: true
      });

    if (insertError) {
      throw insertError;
    }

    // Update onboarding step
    const { error: stepError } = await supabase
      .from('profiles')
      .update({ onboarding_step: 'goals' })
      .eq('id', user.id);

    if (stepError) {
      throw stepError;
    }

    return { success: true };
  }

  // Fallback method for saving project data directly to Supabase
  private async saveProjectDataDirect(data: OnboardingProjectData) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user found');
    }

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: data.name,
        description: data.description,
        owner_id: user.id,
        tags: data.tags || []
      })
      .select()
      .single();

    if (projectError) {
      throw projectError;
    }

    // Update onboarding step
    const { error: stepError } = await supabase
      .from('profiles')
      .update({ onboarding_step: 'project_details' })
      .eq('id', user.id);

    if (stepError) {
      throw stepError;
    }

    return { success: true, project };
  }

  // Fallback method for saving skills directly to Supabase
  private async saveSkillsDataDirect(data: OnboardingSkillsData) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user found');
    }

    // First delete existing skills
    const { error: deleteError } = await supabase
      .from('user_skills')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    // Insert new skills if any
    if (data.skills.length > 0) {
      const skillsToInsert = data.skills.map(skill => ({
        user_id: user.id,
        skill_id: skill.skillId,
        is_offering: skill.isOffering,
        proficiency: skill.proficiency
      }));

      const { error: insertError } = await supabase
        .from('user_skills')
        .insert(skillsToInsert);

      if (insertError) {
        throw insertError;
      }
    }

    // Update onboarding step
    const { error: stepError } = await supabase
      .from('profiles')
      .update({ onboarding_step: 'skills' })
      .eq('id', user.id);

    if (stepError) {
      throw stepError;
    }

    return { success: true };
  }

  async saveProfileData(data: OnboardingProfileData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user found');

    try {
      // Use performance service for caching and metrics
      return await performanceService.getOrFetch(
        `save_profile_${user.id}`,
        async () => {
          try {
            return await this.callEdgeFunction('validate-onboarding', {
              step: 'profile',
              data,
            });
          } catch (error) {
            console.log('Edge function failed, using direct database approach');
            return await this.saveProfileDataDirect(data);
          }
        },
        30 * 1000 // Cache for 30 seconds
      );
    } catch (error) {
      // Queue for sync and use error recovery
      await syncService.queueOperation('profile', data, user.id);
      
      const recovered = await errorRecoveryService.handleError(
        error as Error,
        'save_profile_data',
        user.id
      );
      
      if (!recovered) {
        throw error;
      }
      
      return { success: true, fromCache: true };
    }
  }

  async saveInterestsData(data: OnboardingInterestsData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user found');

    try {
      return await performanceService.getOrFetch(
        `save_interests_${user.id}`,
        async () => {
          try {
            return await this.callEdgeFunction('validate-onboarding', {
              step: 'interests',
              data,
            });
          } catch (error) {
            console.log('Edge function failed, using direct database approach');
            return await this.saveInterestsDataDirect(data);
          }
        },
        30 * 1000
      );
    } catch (error) {
      await syncService.queueOperation('interests', data, user.id);
      
      const recovered = await errorRecoveryService.handleError(
        error as Error,
        'save_interests_data',
        user.id
      );
      
      if (!recovered) {
        throw error;
      }
      
      return { success: true, fromCache: true };
    }
  }

  async saveGoalsData(data: OnboardingGoalsData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user found');

    try {
      return await performanceService.getOrFetch(
        `save_goals_${user.id}`,
        async () => {
          try {
            return await this.callEdgeFunction('validate-onboarding', {
              step: 'goals',
              data,
            });
          } catch (error) {
            console.log('Edge function failed, using direct database approach');
            return await this.saveGoalsDataDirect(data);
          }
        },
        30 * 1000
      );
    } catch (error) {
      await syncService.queueOperation('goals', data, user.id);
      
      const recovered = await errorRecoveryService.handleError(
        error as Error,
        'save_goals_data',
        user.id
      );
      
      if (!recovered) {
        throw error;
      }
      
      return { success: true, fromCache: true };
    }
  }

  async saveProjectData(data: OnboardingProjectData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user found');

    try {
      return await performanceService.getOrFetch(
        `save_project_${user.id}`,
        async () => {
          try {
            return await this.callEdgeFunction('validate-onboarding', {
              step: 'project_details',
              data,
            });
          } catch (error) {
            console.log('Edge function failed, using direct database approach');
            return await this.saveProjectDataDirect(data);
          }
        },
        30 * 1000
      );
    } catch (error) {
      await syncService.queueOperation('project', data, user.id);
      
      const recovered = await errorRecoveryService.handleError(
        error as Error,
        'save_project_data',
        user.id
      );
      
      if (!recovered) {
        throw error;
      }
      
      return { success: true, fromCache: true };
    }
  }

  async saveSkillsData(data: OnboardingSkillsData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user found');

    try {
      return await performanceService.getOrFetch(
        `save_skills_${user.id}`,
        async () => {
          try {
            return await this.callEdgeFunction('validate-onboarding', {
              step: 'skills',
              data,
            });
          } catch (error) {
            console.log('Edge function failed, using direct database approach');
            return await this.saveSkillsDataDirect(data);
          }
        },
        30 * 1000
      );
    } catch (error) {
      await syncService.queueOperation('skills', data, user.id);
      
      const recovered = await errorRecoveryService.handleError(
        error as Error,
        'save_skills_data',
        user.id
      );
      
      if (!recovered) {
        throw error;
      }
      
      return { success: true, fromCache: true };
    }
  }

  async updateStep(step: OnboardingStep) {
    try {
      return await this.callEdgeFunction('update-onboarding-step', {
        action: 'update_step',
        step,
      });
    } catch (edgeFunctionError) {
      console.log('Edge function failed, updating step directly');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_step: step })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      return { success: true };
    }
  }

  async getNextStep() {
    try {
      return await this.callEdgeFunction('update-onboarding-step', {
        action: 'get_next_step',
      });
    } catch (edgeFunctionError) {
      console.log('Edge function failed, determining next step directly');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Get user's current goal to determine next step
      const { data: goals } = await supabase
        .from('user_goals')
        .select('goal_type')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      // Determine next step based on goal
      if (goals?.goal_type === 'find_cofounder' || goals?.goal_type === 'find_collaborators') {
        return { nextStep: 'project_details' };
      } else {
        return { nextStep: 'skills' };
      }
    }
  }

  async getOnboardingStatus() {
    try {
      return await this.callEdgeFunction('update-onboarding-step', {
        action: 'get_status',
      });
    } catch (edgeFunctionError) {
      console.log('Edge function failed, getting status directly');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, onboarding_step')
        .eq('id', user.id)
        .single();

      return {
        completed: profile?.onboarding_completed || false,
        step: profile?.onboarding_step || 'profile'
      };
    }
  }

  async markOnboardingComplete() {
    try {
      return await this.callEdgeFunction('onboarding-status', {
        action: 'complete',
      });
    } catch (edgeFunctionError) {
      console.log('Edge function failed, marking complete directly');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_step: 'completed'
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      return { success: true };
    }
  }

  // Helper methods for getting reference data
  async getInterests() {
    try {
      return await performanceService.getOrFetch(
        'interests_data',
        async () => {
          const { data, error } = await supabase
            .from('interests')
            .select('*')
            .order('name');
          
          if (error) {
            // Use enhanced database initialization fallback
            console.log('Falling back to cached interests data');
            return await databaseInit.getCachedInterests();
          }
          
          return data || [];
        },
        10 * 60 * 1000 // Cache for 10 minutes
      );
    } catch (error) {
      console.error('Error fetching interests:', error);
      
      // Ultimate fallback
      return await databaseInit.getCachedInterests();
    }
  }

  async getSkills() {
    try {
      return await performanceService.getOrFetch(
        'skills_data',
        async () => {
          const { data, error } = await supabase
            .from('skills')
            .select('*')
            .order('name');
          
          if (error) {
            // Use enhanced database initialization fallback
            console.log('Falling back to cached skills data');
            return await databaseInit.getCachedSkills();
          }
          
          return data || [];
        },
        10 * 60 * 1000 // Cache for 10 minutes
      );
    } catch (error) {
      console.error('Error fetching skills:', error);
      
      // Ultimate fallback
      return await databaseInit.getCachedSkills();
    }
  }
}

export const onboardingService = new OnboardingService(); 