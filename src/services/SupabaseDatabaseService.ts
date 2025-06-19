import { supabaseAdmin } from './supabase';
import { createLogger } from '../utils/logger';

const logger = createLogger('SupabaseDatabaseService');

export interface ProfileData {
  firstName: string;
  lastName: string;
  location?: string;
  jobTitle?: string;
  bio?: string;
}

export interface UserCreationData extends ProfileData {
  email: string;
  supabaseUserId: string;
}

export class SupabaseDatabaseService {
  private static instance: SupabaseDatabaseService;

  static getInstance(): SupabaseDatabaseService {
    if (!SupabaseDatabaseService.instance) {
      SupabaseDatabaseService.instance = new SupabaseDatabaseService();
    }
    return SupabaseDatabaseService.instance;
  }

  /**
   * Create user profile in Supabase after Auth user creation
   */
  async createUserProfile(data: UserCreationData): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('👤 Creating user profile in database...');

      const profileData = {
        id: data.supabaseUserId,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        full_name: `${data.firstName} ${data.lastName}`.trim(),
        location: data.location || null,
        job_title: data.jobTitle || null,
        bio: data.bio || null,
        onboarding_step: 'interests',
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabaseAdmin
        .from('profiles')
        .insert([profileData]);

      if (error) {
        logger.error('❌ Failed to create profile:', error);
        return { success: false, error: error.message };
      }

      logger.info('✅ Profile created successfully');
      return { success: true };

    } catch (error) {
      logger.error('❌ Error creating profile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create profile' 
      };
    }
  }

  /**
   * Save user interests
   */
  async saveUserInterests(userId: string, interestIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(`💾 Saving ${interestIds.length} interests for user ${userId}...`);

      // Validate interest IDs are UUIDs
      const validInterests = interestIds.filter(id => this.isValidUUID(id));
      
      if (validInterests.length === 0) {
        logger.warn('⚠️ No valid UUID interests found');
        return { success: true }; // Don't fail for invalid IDs
      }

      // Delete existing user interests
      await supabaseAdmin
        .from('user_interests')
        .delete()
        .eq('user_id', userId);

      // Insert new user interests
      const userInterests = validInterests.map(interestId => ({
        user_id: userId,
        interest_id: interestId,
        created_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabaseAdmin
        .from('user_interests')
        .insert(userInterests);

      if (insertError) {
        logger.error('❌ Failed to insert user interests:', insertError);
        return { success: false, error: insertError.message };
      }

      // Update profile onboarding step
      await this.updateOnboardingStep(userId, 'goals');

      logger.info('✅ Interests saved successfully');
      return { success: true };

    } catch (error) {
      logger.error('❌ Error saving interests:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save interests' 
      };
    }
  }

  /**
   * Save user goals
   */
  async saveUserGoals(userId: string, goals: string[], primaryGoal?: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(`💾 Saving ${goals.length} goals for user ${userId}...`);

      // Delete existing user goals
      await supabaseAdmin
        .from('user_goals')
        .delete()
        .eq('user_id', userId);

      // Insert new user goals
      const userGoals = goals.map(goal => ({
        user_id: userId,
        goal_type: this.mapGoalToType(goal),
        description: goal,
        is_primary: goal === primaryGoal,
        is_active: true,
        created_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabaseAdmin
        .from('user_goals')
        .insert(userGoals);

      if (insertError) {
        logger.error('❌ Failed to insert user goals:', insertError);
        return { success: false, error: insertError.message };
      }

      // Determine next step based on goals
      const needsProjectDetails = goals.some(goal => 
        goal.includes('cofounder') || goal.includes('collaborator')
      );
      
      const nextStep = needsProjectDetails ? 'project_details' : 'skills';
      await this.updateOnboardingStep(userId, nextStep);

      logger.info('✅ Goals saved successfully');
      return { success: true };

    } catch (error) {
      logger.error('❌ Error saving goals:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save goals' 
      };
    }
  }

  /**
   * Save project details and create project
   */
  async saveProjectDetails(userId: string, projectData: { name: string; description: string; lookingFor: string[]; timeline?: string }): Promise<{ success: boolean; projectId?: string; error?: string }> {
    try {
      logger.info(`💾 Creating project for user ${userId}...`);

      // Create a new project
      const project = {
        title: projectData.name,
        description: projectData.description,
        owner_id: userId,
        status: 'planning',
        looking_for: projectData.lookingFor,
        timeline: projectData.timeline || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: createdProject, error: projectError } = await supabaseAdmin
        .from('projects')
        .insert([project])
        .select('id')
        .single();

      if (projectError || !createdProject?.id) {
        logger.error('❌ Failed to create project:', projectError);
        return { success: false, error: projectError?.message || 'Failed to create project' };
      }

      // Add the user as the project owner in project_members
      const memberData = {
        project_id: createdProject.id,
        user_id: userId,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString()
      };

      const { error: memberError } = await supabaseAdmin
        .from('project_members')
        .insert([memberData]);

      if (memberError) {
        logger.warn('⚠️ Failed to add user as project member:', memberError);
        // Don't fail the whole operation for this
      }

      // Update profile onboarding step
      await this.updateOnboardingStep(userId, 'skills');

      logger.info('✅ Project created successfully');
      return { success: true, projectId: createdProject.id };

    } catch (error) {
      logger.error('❌ Error saving project details:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save project details' 
      };
    }
  }

  /**
   * Save user skills
   */
  async saveUserSkills(userId: string, skills: Array<{ skillId: string; proficiencyLevel: string; offeringSkill: boolean }>): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(`💾 Saving ${skills.length} skills for user ${userId}...`);

      // Validate skill IDs are UUIDs
      const validSkills = skills.filter(skill => this.isValidUUID(skill.skillId));
      
      if (validSkills.length === 0) {
        logger.warn('⚠️ No valid UUID skills found');
        return { success: true }; // Don't fail for invalid IDs
      }

      // Delete existing user skills
      await supabaseAdmin
        .from('user_skills')
        .delete()
        .eq('user_id', userId);

      // Insert new user skills
      const userSkills = validSkills.map(skill => ({
        user_id: userId,
        skill_id: skill.skillId,
        proficiency_level: skill.proficiencyLevel,
        offering_skill: skill.offeringSkill,
        created_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabaseAdmin
        .from('user_skills')
        .insert(userSkills);

      if (insertError) {
        logger.error('❌ Failed to insert user skills:', insertError);
        return { success: false, error: insertError.message };
      }

      // Mark onboarding as completed
      await this.completeOnboarding(userId);

      logger.info('✅ Skills saved successfully - onboarding complete!');
      return { success: true };

    } catch (error) {
      logger.error('❌ Error saving skills:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save skills' 
      };
    }
  }

  /**
   * Get available interests from database
   */
  async getAvailableInterests(): Promise<any[]> {
    try {
      logger.info('🔍 Loading interests from database...');

      const { data: interests, error } = await supabaseAdmin
        .from('interests')
        .select('id, name, category')
        .eq('is_active', true)
        .order('name');

      if (error) {
        logger.error('❌ Failed to load interests:', error);
        return this.getFallbackInterests();
      }

      logger.info(`✅ Loaded ${interests?.length || 0} interests from database`);
      return interests || [];

    } catch (error) {
      logger.error('❌ Error loading interests:', error);
      return this.getFallbackInterests();
    }
  }

  /**
   * Get available skills from database
   */
  async getAvailableSkills(): Promise<any[]> {
    try {
      logger.info('🔍 Loading skills from database...');

      const { data: skills, error } = await supabaseAdmin
        .from('skills')
        .select('id, name, category')
        .eq('is_active', true)
        .order('name');

      if (error) {
        logger.error('❌ Failed to load skills:', error);
        return this.getFallbackSkills();
      }

      logger.info(`✅ Loaded ${skills?.length || 0} skills from database`);
      return skills || [];

    } catch (error) {
      logger.error('❌ Error loading skills:', error);
      return this.getFallbackSkills();
    }
  }

  /**
   * Update user's onboarding step
   */
  private async updateOnboardingStep(userId: string, nextStep: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          onboarding_step: nextStep,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        logger.warn('⚠️ Failed to update onboarding step:', error);
      }
    } catch (error) {
      logger.warn('⚠️ Error updating onboarding step:', error);
    }
  }

  /**
   * Mark onboarding as completed
   */
  private async completeOnboarding(userId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          onboarding_step: 'completed',
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        logger.warn('⚠️ Failed to mark onboarding as completed:', error);
      }
    } catch (error) {
      logger.warn('⚠️ Error completing onboarding:', error);
    }
  }

  /**
   * Validate UUID format
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Map goal description to goal type
   */
  private mapGoalToType(goal: string): string {
    const goalLower = goal.toLowerCase();
    
    if (goalLower.includes('cofounder')) return 'find_cofounder';
    if (goalLower.includes('collaborator')) return 'find_collaborators';
    if (goalLower.includes('mentor')) return 'find_mentorship';
    if (goalLower.includes('network')) return 'expand_network';
    if (goalLower.includes('skill')) return 'develop_skills';
    if (goalLower.includes('project')) return 'work_on_projects';
    
    return 'other';
  }

  /**
   * Get fallback interests for offline scenarios
   */
  private getFallbackInterests(): any[] {
    return [
      { id: 'f7bff181-f722-44fd-8704-77816f16cdf8', name: 'Art', category: 'Creative' },
      { id: 'e9e68517-2d26-46e9-8220-39d3745b3d92', name: 'Artificial Intelligence & Machine Learning', category: 'Technology' },
      { id: '814d804f-04e3-421e-b1ff-64ba42f30e60', name: 'Biotechnology', category: 'Science' },
      { id: 'cc7ee20f-171b-4142-a839-9dc840d9a333', name: 'Business', category: 'Business' },
      { id: 'b58c1144-26c5-4f03-a2d1-d631bbdf29ae', name: 'Books', category: 'Lifestyle' },
      { id: '83be43cd-3d73-403b-9064-980b8fbb1229', name: 'Climate Change', category: 'Environment' },
      { id: 'c3d05bc9-9de7-4bcd-96b7-f8d0f981dd22', name: 'Civic Engagement', category: 'Social' },
      { id: 'e44bdf24-f37d-4ae7-8f21-edd136d51562', name: 'Dancing', category: 'Creative' },
      { id: '7e7ced62-8869-4679-b8f9-c8eb71eabd87', name: 'Data Science', category: 'Technology' },
      { id: '37276e28-ecb5-4725-9463-dd8f761973e2', name: 'Education', category: 'Social' }
    ];
  }

  /**
   * Get fallback skills for offline scenarios
   */
  private getFallbackSkills(): any[] {
    return [
      { id: '4182fd46-0754-4911-a91a-7dac8d5ac3f7', name: 'Accounting', category: 'Business' },
      { id: 'b8e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', name: 'JavaScript', category: 'Programming' },
      { id: 'c9f3d4e5-6a7b-8c9d-0e1f-2a3b4c5d6e7f', name: 'Python', category: 'Programming' },
      { id: 'd0a4e5f6-7b8c-9d0e-1f2a-3b4c5d6e7f8a', name: 'UI/UX Design', category: 'Design' },
      { id: 'e1b5f6a7-8c9d-0e1f-2a3b-4c5d6e7f8a9b', name: 'Marketing', category: 'Business' },
      { id: 'f2c6a7b8-9d0e-1f2a-3b4c-5d6e7f8a9b0c', name: 'Project Management', category: 'Management' },
      { id: 'a3d7b8c9-0e1f-2a3b-4c5d-6e7f8a9b0c1d', name: 'Data Analysis', category: 'Analytics' },
      { id: 'b4e8c9d0-1f2a-3b4c-5d6e-7f8a9b0c1d2e', name: 'React', category: 'Programming' },
      { id: 'c5f9d0e1-2a3b-4c5d-6e7f-8a9b0c1d2e3f', name: 'Graphic Design', category: 'Design' },
      { id: 'd6a0e1f2-3b4c-5d6e-7f8a-9b0c1d2e3f4a', name: 'Sales', category: 'Business' }
    ];
  }
} 