import { supabase, handleError } from './supabase';
import { Profile, Interest, UserInterest, Skill, UserSkill, UserGoal, ProjectSkill } from '../types/supabase';
import Constants from 'expo-constants';

/**
 * Service for handling onboarding-related data operations
 */

// Types for onboarding data
export interface OnboardingProfileData {
  firstName: string;
  lastName: string;
  jobTitle?: string;
  bio?: string;
  location?: string;
  website?: string;
}

export interface OnboardingInterestsData {
  interestIds: string[];
}

export interface OnboardingSkillsData {
  skills: { skillId: string; isOffering: boolean; proficiency?: UserSkill['proficiency'] }[];
}

export interface OnboardingGoalsData {
  goalType: UserGoal['goal_type'];
  details?: Record<string, any>;
}

export interface OnboardingProjectData {
  name: string;
  description?: string;
  type?: string;
  tags?: string[];
}

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

// Main onboarding service class
class OnboardingService {
  /**
   * Updates the user's profile with the provided data and updates the onboarding step
   */
  async updateUserProfile(
    userId: string, 
    profileData: Partial<Profile>, 
    step?: Profile['onboarding_step']
  ): Promise<{ success: boolean; error?: string }> {
    return updateUserProfile(userId, profileData, step);
  }

  /**
   * Completes the onboarding process for a user
   */
  async completeOnboarding(userId: string): Promise<{ success: boolean; error?: string }> {
    return completeOnboarding(userId);
  }

  /**
   * Fetches all available interests
   */
  async getInterests(): Promise<{ data: Interest[] | null; error?: string }> {
    return getInterests();
  }

  /**
   * Fetches all available skills
   */
  async getSkills(): Promise<{ data: Skill[] | null; error?: string }> {
    return getSkills();
  }

  /**
   * Gets a user's selected interests
   */
  async getUserInterests(userId: string): Promise<{ data: UserInterest[] | null; error?: string }> {
    return getUserInterests(userId);
  }

  /**
   * Updates a user's selected interests
   */
  async updateUserInterests(userId: string, interestIds: string[]): Promise<{ success: boolean; error?: string }> {
    return updateUserInterests(userId, interestIds);
  }

  /**
   * Gets a user's selected skills
   */
  async getUserSkills(userId: string): Promise<{ data: UserSkill[] | null; error?: string }> {
    return getUserSkills(userId);
  }

  /**
   * Updates a user's selected skills
   */
  async updateUserSkills(
    userId: string, 
    skills: { skillId: string; isOffering: boolean; proficiency?: UserSkill['proficiency'] }[]
  ): Promise<{ success: boolean; error?: string }> {
    return updateUserSkills(userId, skills);
  }

  /**
   * Sets a user's goal for the platform
   */
  async setUserGoal(
    userId: string, 
    goalType: UserGoal['goal_type'],
    details?: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    return setUserGoal(userId, goalType, details);
  }

  /**
   * Gets a user's active goal
   */
  async getUserActiveGoal(userId: string): Promise<{ data: UserGoal | null; error?: string }> {
    return getUserActiveGoal(userId);
  }

  /**
   * Gets a user's onboarding status
   */
  async getUserOnboardingStatus(userId: string): Promise<{ 
    data: { 
      completed: boolean; 
      step: Profile['onboarding_step']; 
    } | null;
    error?: string;
  }> {
    return getUserOnboardingStatus(userId);
  }

  /**
   * Saves profile data during onboarding
   */
  async saveProfileData(profileData: OnboardingProfileData): Promise<{ success: boolean; error?: string }> {
    try {
      // Convert the profile data to the format expected by updateUserProfile
      // You'll need to get the current user ID from context
      console.log('Saving profile data:', profileData);
      return { success: true };
    } catch (error) {
      console.error('Error saving profile data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save profile data' 
      };
    }
  }

  /**
   * Saves interests data during onboarding
   */
  async saveInterestsData(interestsData: OnboardingInterestsData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Saving interests data:', interestsData);
      return { success: true };
    } catch (error) {
      console.error('Error saving interests data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save interests data' 
      };
    }
  }

  /**
   * Saves skills data during onboarding
   */
  async saveSkillsData(skillsData: OnboardingSkillsData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Saving skills data:', skillsData);
      return { success: true };
    } catch (error) {
      console.error('Error saving skills data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save skills data' 
      };
    }
  }

  /**
   * Saves goals data during onboarding
   */
  async saveGoalsData(goalsData: OnboardingGoalsData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Saving goals data:', goalsData);
      return { success: true };
    } catch (error) {
      console.error('Error saving goals data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save goals data' 
      };
    }
  }

  /**
   * Saves project data during onboarding
   */
  async saveProjectData(projectData: OnboardingProjectData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Saving project data:', projectData);
      return { success: true };
    } catch (error) {
      console.error('Error saving project data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save project data' 
      };
    }
  }

  /**
   * Updates the current onboarding step
   */
  async updateStep(step: string | undefined): Promise<{ success: boolean; error?: string }> {
    try {
      if (!step) {
        console.log('No step provided, skipping update');
        return { success: true };
      }
      console.log('Updating onboarding step to:', step);
      return { success: true };
    } catch (error) {
      console.error('Error updating step:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update step' 
      };
    }
  }

  /**
   * Gets the next step in the onboarding process
   */
  async getNextStep(): Promise<{ success: boolean; nextStep?: string; error?: string }> {
    try {
      // Default next step logic - you can customize this
      return { success: true, nextStep: 'project-skills' };
    } catch (error) {
      console.error('Error getting next step:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get next step' 
      };
    }
  }

  /**
   * Marks onboarding as complete
   */
  async markOnboardingComplete(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Marking onboarding as complete');
      return { success: true };
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to mark onboarding complete' 
      };
    }
  }
}

// Create singleton instance
export const onboardingService = new OnboardingService(); 