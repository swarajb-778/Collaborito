import { supabase } from './supabase';

export interface WorkingOnboardingResult {
  success: boolean;
  error?: string;
  nextStep?: string;
  data?: any;
}

/**
 * Working Onboarding Service - Clean implementation for immediate use
 */
class WorkingOnboardingService {
  
  async saveProfileStep(
    userId: string, 
    profileData: {
      firstName: string;
      lastName: string;
      location?: string;
      jobTitle?: string;
    }
  ): Promise<WorkingOnboardingResult> {
    try {
      console.log('🔄 Saving profile step for user:', userId);

      // Update the profiles table with basic profile data
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          full_name: `${profileData.firstName} ${profileData.lastName}`,
          location: profileData.location || null,
          job_title: profileData.jobTitle || null,
          onboarding_step: 'interests',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Profile save error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Profile saved successfully:', data);
      return {
        success: true,
        nextStep: 'interests'
      };

    } catch (error) {
      console.error('❌ Profile save service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getAvailableInterests(): Promise<WorkingOnboardingResult> {
    try {
      console.log('🔄 Loading available interests...');

      const { data, error } = await supabase
        .from('interests')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Interests fetch error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Interests loaded successfully:', data?.length || 0, 'interests');
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Interests fetch service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async saveInterestsStep(userId: string, interestIds: string[]): Promise<WorkingOnboardingResult> {
    try {
      console.log('🔄 Saving interests step for user:', userId);

      if (!interestIds || interestIds.length === 0) {
        return {
          success: false,
          error: 'At least one interest must be selected'
        };
      }

      // First, delete existing interests
      await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', userId);

      // Insert new interests
      const userInterests = interestIds.map(interestId => ({
        user_id: userId,
        interest_id: interestId
      }));

      const { error: insertError } = await supabase
        .from('user_interests')
        .insert(userInterests);

      if (insertError) {
        console.error('❌ Interests save error:', insertError);
        return {
          success: false,
          error: insertError.message
        };
      }

      // Update profile onboarding step
      await supabase
        .from('profiles')
        .update({ onboarding_step: 'goals' })
        .eq('id', userId);

      console.log('✅ Interests saved successfully');
      return {
        success: true,
        nextStep: 'goals'
      };

    } catch (error) {
      console.error('❌ Interests save service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async saveGoalsStep(
    userId: string, 
    goalData: {
      goal_type: 'find_cofounder' | 'find_collaborators' | 'contribute_skills' | 'explore_ideas';
      details?: any;
    }
  ): Promise<WorkingOnboardingResult> {
    try {
      console.log('🔄 Saving goals step for user:', userId);

      // Deactivate existing goals
      await supabase
        .from('user_goals')
        .update({ is_active: false })
        .eq('user_id', userId);

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
        console.error('❌ Goals save error:', insertError);
        return {
          success: false,
          error: insertError.message
        };
      }

      // Determine next step based on goal type
      const nextStep = goalData.goal_type === 'find_cofounder' ? 'project-detail' : 'project-skills';
      
      // Update profile onboarding step
      await supabase
        .from('profiles')
        .update({ onboarding_step: nextStep })
        .eq('id', userId);

      console.log('✅ Goals saved successfully');
      return {
        success: true,
        nextStep
      };

    } catch (error) {
      console.error('❌ Goals save service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getAvailableSkills(): Promise<WorkingOnboardingResult> {
    try {
      console.log('🔄 Loading available skills...');

      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Skills fetch error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Skills loaded successfully:', data?.length || 0, 'skills');
      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('❌ Skills fetch service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async saveSkillsStep(
    userId: string, 
    skills: Array<{
      skillId: string;
      proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      isOffering: boolean;
    }>
  ): Promise<WorkingOnboardingResult> {
    try {
      console.log('🔄 Saving skills step for user:', userId);

      // Delete existing skills
      await supabase
        .from('user_skills')
        .delete()
        .eq('user_id', userId);

      // Insert new skills
      const userSkills = skills.map(skill => ({
        user_id: userId,
        skill_id: skill.skillId,
        proficiency: skill.proficiency,
        is_offering: skill.isOffering
      }));

      const { error: insertError } = await supabase
        .from('user_skills')
        .insert(userSkills);

      if (insertError) {
        console.error('❌ Skills save error:', insertError);
        return {
          success: false,
          error: insertError.message
        };
      }

      // Complete onboarding
      await supabase
        .from('profiles')
        .update({ 
          onboarding_step: 'completed',
          onboarding_completed: true
        })
        .eq('id', userId);

      console.log('✅ Skills saved and onboarding completed successfully');
      return {
        success: true,
        nextStep: 'completed'
      };

    } catch (error) {
      console.error('❌ Skills save service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export a singleton instance
export const workingOnboardingService = new WorkingOnboardingService(); 