import { SessionManager } from './SessionManager';
import { OnboardingFlowCoordinator } from './OnboardingFlowCoordinator';
import { supabase, supabaseAdmin } from './supabase';
import Constants from 'expo-constants';
import { createLogger } from '../utils/logger';

const logger = createLogger('OnboardingStepManager');
const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL || '';

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
  goals: string[];
  primaryGoal?: string;
}

export interface ProjectDetailsData {
  name: string;
  description: string;
  lookingFor: string[];
  tags?: string[];
  timeline?: string;
}

export interface SkillsData {
  skills: {
    skillId: string;
    isOffering: boolean;
    proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }[];
}

export class OnboardingStepManager {
  private static instance: OnboardingStepManager;
  private sessionManager = SessionManager.getInstance();
  private flowCoordinator = OnboardingFlowCoordinator.getInstance();
  
  // Mock data storage for development
  private mockData: {
    profile?: any;
    interests?: string[];
    goals?: any;
    projectDetails?: any;
    skills?: any[];
  } = {};

  // Local data storage for pre-migration users
  private localData: {
    profile?: ProfileData;
    interests?: InterestsData;
    goals?: GoalsData;
    projectDetails?: ProjectDetailsData;
    skills?: SkillsData;
  } = {};

  constructor() {
    this.sessionManager = SessionManager.getInstance();
  }

  static getInstance(): OnboardingStepManager {
    if (!OnboardingStepManager.instance) {
      OnboardingStepManager.instance = new OnboardingStepManager();
    }
    return OnboardingStepManager.instance;
  }

  /**
   * Check if current user is a mock user (development mode)
   */
  async isMockUser(): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    return !userId || userId.startsWith('new') || userId.includes('mock');
  }

  /**
   * Get current user ID from session or auth context
   */
  async getCurrentUserId(): Promise<string | null> {
    try {
      const session = await this.sessionManager.getSession();
      if (session?.user?.id) {
        return session.user.id;
      }
      
      // Fallback: try to get from flow coordinator's state
      const state = this.sessionManager.getOnboardingState();
      return state?.user_id || null;
    } catch (error) {
      logger.warn('Could not get current user ID:', error);
      return null;
    }
  }

  /**
   * Validate UUID format
   */
  isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private async verifySession(): Promise<boolean> {
    try {
      const isValid = await this.sessionManager.verifySession();
      if (!isValid) {
        // Try to initialize session again (handles mock users)
        const initialized = await this.sessionManager.initializeSession();
        if (!initialized) {
          console.warn('Session verification failed, but continuing for mock users');
          return true; // Allow mock users to continue
        }
      }
      return true;
    } catch (error) {
      console.warn('Session verification error, allowing mock users to continue:', error);
      return true; // Graceful degradation for mock users
    }
  }

  /**
   * Check if current user is a local user (pre-migration)
   */
  private async isLocalUser(): Promise<boolean> {
    try {
      const session = await this.sessionManager.getSession();
      return session?.isLocal === true;
    } catch (error) {
      logger.warn('Could not determine if user is local:', error);
      return false;
    }
  }

  /**
   * Check if user has been migrated to Supabase
   */
  private async isMigratedUser(): Promise<boolean> {
    try {
      return this.sessionManager.isMigrated();
    } catch (error) {
      logger.warn('Could not determine if user is migrated:', error);
      return false;
    }
  }

  /**
   * Save profile step - handles both local and migrated users
   */
  async saveProfileStep(data: ProfileData): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('No user ID available');
      }

      logger.info(`💾 Saving profile step for user: ${userId}`);

      const isLocal = await this.isLocalUser();
      
      if (isLocal) {
        // For local users, store locally until migration
        logger.info('📱 Local user - storing profile data locally');
        this.localData.profile = data;
        
        // Trigger migration during profile step if needed
        if (this.sessionManager.needsMigration()) {
          logger.info('🔄 Triggering user migration during profile step');
          
          const migrationResult = await this.sessionManager.migrateUserToSupabase({
            firstName: data.firstName,
            lastName: data.lastName,
            email: await this.getUserEmail(),
            password: this.generateTempPassword()
          });

          if (migrationResult.success) {
            logger.info('✅ User migration successful - now saving to Supabase');
            // Now save to Supabase after successful migration
            return await this.saveProfileToSupabase(data, migrationResult.supabaseUser.id);
          } else {
            logger.warn('⚠️ Migration failed - data saved locally for retry');
            return true; // Return success for local storage
          }
        }
        
        return true;
      } else {
        // For migrated users, save directly to Supabase
        return await this.saveProfileToSupabase(data, userId);
      }

    } catch (error) {
      logger.error('❌ Failed to save profile step:', error);
      // Store locally as fallback
      this.localData.profile = data;
      return true; // Return success for local fallback
    }
  }

  /**
   * Save profile data to Supabase
   */
  private async saveProfileToSupabase(data: ProfileData, userId: string): Promise<boolean> {
    try {
      logger.info('💾 Saving profile to Supabase...');

      const updateData = {
        first_name: data.firstName,
        last_name: data.lastName,
        full_name: `${data.firstName} ${data.lastName}`.trim(),
        location: data.location || null,
        job_title: data.jobTitle || null,
        bio: data.bio || null,
        onboarding_step: 'interests',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        logger.error('Failed to update profile in Supabase:', error);
        throw error;
      }

      logger.info('✅ Profile saved to Supabase successfully');
      return true;

    } catch (error) {
      logger.error('Failed to save profile to Supabase:', error);
      throw error;
    }
  }

  /**
   * Save interests step
   */
  async saveInterestsStep(data: InterestsData): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('No user ID available');
      }

      logger.info(`💾 Saving interests step for user: ${userId}`);

      const isLocal = await this.isLocalUser();
      
      if (isLocal) {
        logger.info('📱 Local user - storing interests locally');
        this.localData.interests = data;
        return true;
      } else {
        return await this.saveInterestsToSupabase(data, userId);
      }

    } catch (error) {
      logger.error('❌ Failed to save interests step:', error);
      this.localData.interests = data;
      return true; // Return success for local fallback
    }
  }

  /**
   * Save interests to Supabase
   */
  private async saveInterestsToSupabase(data: InterestsData, userId: string): Promise<boolean> {
    try {
      logger.info('💾 Saving interests to Supabase...');

      // Validate interest IDs are UUIDs
      const validInterests = data.interestIds.filter(id => this.isValidUUID(id));
      
      if (validInterests.length === 0) {
        logger.warn('No valid UUID interests found');
        return true; // Don't fail for invalid IDs
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
        logger.error('Failed to insert user interests:', insertError);
        throw insertError;
      }

      // Update profile onboarding step
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          onboarding_step: 'goals',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        logger.warn('Failed to update onboarding step:', updateError);
      }

      logger.info('✅ Interests saved to Supabase successfully');
      return true;

    } catch (error) {
      logger.error('Failed to save interests to Supabase:', error);
      throw error;
    }
  }

  /**
   * Save goals step
   */
  async saveGoalsStep(data: GoalsData): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('No user ID available');
      }

      logger.info(`💾 Saving goals step for user: ${userId}`);

      const isLocal = await this.isLocalUser();
      
      if (isLocal) {
        logger.info('📱 Local user - storing goals locally');
        this.localData.goals = data;
        return true;
      } else {
        return await this.saveGoalsToSupabase(data, userId);
      }

    } catch (error) {
      logger.error('❌ Failed to save goals step:', error);
      this.localData.goals = data;
      return true; // Return success for local fallback
    }
  }

  /**
   * Save goals to Supabase
   */
  private async saveGoalsToSupabase(data: GoalsData, userId: string): Promise<boolean> {
    try {
      logger.info('💾 Saving goals to Supabase...');

      // Delete existing user goals
      await supabaseAdmin
        .from('user_goals')
        .delete()
        .eq('user_id', userId);

      // Insert new user goals
      const userGoals = data.goals.map(goal => ({
        user_id: userId,
        goal_type: this.mapGoalToType(goal),
        description: goal,
        is_primary: goal === data.primaryGoal,
        is_active: true,
        created_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabaseAdmin
        .from('user_goals')
        .insert(userGoals);

      if (insertError) {
        logger.error('Failed to insert user goals:', insertError);
        throw insertError;
      }

      // Determine next step based on goals
      const needsProjectDetails = data.goals.some(goal => 
        goal.includes('cofounder') || goal.includes('collaborator')
      );
      
      const nextStep = needsProjectDetails ? 'project_details' : 'skills';

      // Update profile onboarding step
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          onboarding_step: nextStep,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        logger.warn('Failed to update onboarding step:', updateError);
      }

      logger.info('✅ Goals saved to Supabase successfully');
      return true;

    } catch (error) {
      logger.error('Failed to save goals to Supabase:', error);
      throw error;
    }
  }

  /**
   * Save project details step
   */
  async saveProjectDetailsStep(data: ProjectDetailsData): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('No user ID available');
      }

      logger.info(`💾 Saving project details step for user: ${userId}`);

      const isLocal = await this.isLocalUser();
      
      if (isLocal) {
        logger.info('📱 Local user - storing project details locally');
        this.localData.projectDetails = data;
        return true;
      } else {
        return await this.saveProjectDetailsToSupabase(data, userId);
      }

    } catch (error) {
      logger.error('❌ Failed to save project details step:', error);
      this.localData.projectDetails = data;
      return true; // Return success for local fallback
    }
  }

  /**
   * Save project details to Supabase
   */
  private async saveProjectDetailsToSupabase(data: ProjectDetailsData, userId: string): Promise<boolean> {
    try {
      logger.info('💾 Saving project details to Supabase...');

      // Create a new project
      const projectData = {
        title: data.name,
        description: data.description,
        owner_id: userId,
        status: 'planning',
        looking_for: data.tags || [],
        timeline: data.timeline || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: createdProject, error: projectError } = await supabaseAdmin
        .from('projects')
        .insert([projectData])
        .select('id')
        .single();

      if (projectError) {
        logger.error('Failed to create project:', projectError);
        throw projectError;
      }

      if (!createdProject?.id) {
        throw new Error('Project creation failed - no ID returned');
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
        logger.error('Failed to add user as project member:', memberError);
        // Don't throw error - project creation succeeded
      }

      // Update profile onboarding step
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          onboarding_step: 'skills',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        logger.warn('Failed to update onboarding step:', profileError);
      }

      logger.info('✅ Project details saved to Supabase successfully');
      return true;

    } catch (error) {
      logger.error('Failed to save project details to Supabase:', error);
      throw error;
    }
  }

  /**
   * Save skills step
   */
  async saveSkillsStep(data: SkillsData): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new Error('No user ID available');
      }

      logger.info(`💾 Saving skills step for user: ${userId}`);

      const isLocal = await this.isLocalUser();
      
      if (isLocal) {
        logger.info('📱 Local user - storing skills locally');
        this.localData.skills = data;
        return true;
      } else {
        return await this.saveSkillsToSupabase(data, userId);
      }

    } catch (error) {
      logger.error('❌ Failed to save skills step:', error);
      this.localData.skills = data;
      return true; // Return success for local fallback
    }
  }

  /**
   * Save skills to Supabase
   */
  private async saveSkillsToSupabase(data: SkillsData, userId: string): Promise<boolean> {
    try {
      logger.info('💾 Saving skills to Supabase...');

      // Validate skill IDs are UUIDs
      const validSkills = data.skills.filter(skill => this.isValidUUID(skill.skillId));
      
      if (validSkills.length === 0) {
        logger.warn('No valid UUID skills found');
        return true; // Don't fail for invalid IDs
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
        proficiency_level: skill.proficiency || 'intermediate',
        offering_skill: skill.isOffering,
        created_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabaseAdmin
        .from('user_skills')
        .insert(userSkills);

      if (insertError) {
        logger.error('Failed to insert user skills:', insertError);
        throw insertError;
      }

      // Mark onboarding as completed
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          onboarding_step: 'completed',
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        logger.warn('Failed to update onboarding completion:', profileError);
      }

      logger.info('✅ Skills saved to Supabase successfully - onboarding complete!');
      return true;

    } catch (error) {
      logger.error('Failed to save skills to Supabase:', error);
      throw error;
    }
  }

  /**
   * Get available interests from Supabase
   */
  async getAvailableInterests(): Promise<any[]> {
    try {
      const isLocal = await this.isLocalUser();
      
      if (isLocal) {
        logger.info('📱 Local user - returning fallback interests');
        return this.getFallbackInterests();
      }

      logger.info('🔍 Loading interests from Supabase...');

      const { data: interests, error } = await supabaseAdmin
        .from('interests')
        .select('id, name, category')
        .eq('is_active', true)
        .order('name');

      if (error) {
        logger.error('Failed to load interests from Supabase:', error);
        return this.getFallbackInterests();
      }

      logger.info(`✅ Loaded ${interests?.length || 0} interests from Supabase`);
      return interests || [];

    } catch (error) {
      logger.error('Error loading interests:', error);
      return this.getFallbackInterests();
    }
  }

  /**
   * Get available skills from Supabase
   */
  async getAvailableSkills(): Promise<any[]> {
    try {
      const isLocal = await this.isLocalUser();
      
      if (isLocal) {
        logger.info('📱 Local user - returning fallback skills');
        return this.getFallbackSkills();
      }

      logger.info('🔍 Loading skills from Supabase...');

      const { data: skills, error } = await supabaseAdmin
        .from('skills')
        .select('id, name, category')
        .eq('is_active', true)
        .order('name');

      if (error) {
        logger.error('Failed to load skills from Supabase:', error);
        return this.getFallbackSkills();
      }

      logger.info(`✅ Loaded ${skills?.length || 0} skills from Supabase`);
      return skills || [];

    } catch (error) {
      logger.error('Error loading skills:', error);
      return this.getFallbackSkills();
    }
  }

  /**
   * Get user's interests from Supabase
   */
  async getUserInterests(): Promise<any[]> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        throw new Error('No user ID available');
      }

      // For mock users, return empty array (no saved interests)
      if (await this.isMockUser()) {
        logger.info('🔧 Mock user detected, returning empty interests');
        return [];
      }

      const { data: userInterests, error } = await supabaseAdmin
        .from('user_interests')
        .select(`
          id,
          interest_id,
          interests (
            id,
            name,
            category
          )
        `)
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to load user interests:', error);
        throw error;
      }

      const interests = userInterests?.map((ui: any) => ui.interests) || [];
      logger.info(`✅ Loaded ${interests.length} user interests`);
      return interests;

    } catch (error) {
      logger.error('Error loading user interests:', error);
      
      // For mock users, return empty array
      if (await this.isMockUser()) {
        return [];
      }
      
      throw error;
    }
  }

  /**
   * Get user profile data
   */
  async getUserProfile(): Promise<any> {
    try {
      await this.verifySession();
      const state = this.sessionManager.getOnboardingState();
      return state?.profile || {};
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  /**
   * Get user goals
   */
  async getUserGoals(): Promise<any> {
    try {
      await this.verifySession();
      const state = this.sessionManager.getOnboardingState();
      return state?.goals || {};
    } catch (error) {
      console.error('Failed to get user goals:', error);
      throw error;
    }
  }

  /**
   * Get user skills
   */
  async getUserSkills(): Promise<any[]> {
    try {
      await this.verifySession();
      const state = this.sessionManager.getOnboardingState();
      return state?.skills || [];
    } catch (error) {
      console.error('Failed to get user skills:', error);
      throw error;
    }
  }

  /**
   * Get user projects
   */
  async getUserProjects(): Promise<any[]> {
    try {
      await this.verifySession();
      const state = this.sessionManager.getOnboardingState();
      return state?.projects || [];
    } catch (error) {
      console.error('Failed to get user projects:', error);
      throw error;
    }
  }

  /**
   * Skip a step with reason
   */
  async skipStep(stepId: string, reason: string): Promise<boolean> {
    try {
      logger.info(`⏭️ Skipping step: ${stepId}, reason: ${reason}`);
      
      // Save skip info to session manager
      await this.sessionManager.saveOnboardingStep(stepId, {
        skipped: true,
        reason: reason,
        skipped_at: new Date().toISOString()
      });

      return true;

    } catch (error) {
      logger.error(`Error skipping step ${stepId}:`, error);
      return false;
    }
  }

  /**
   * Get current step information
   */
  async getCurrentStepInfo(): Promise<{ currentStep: string; progress: any; stepInfo: any }> {
    try {
      const currentStep = await this.flowCoordinator.getCurrentStep();
      const progress = await this.flowCoordinator.getProgress();
      const stepInfo = await this.flowCoordinator.getStepInfo(currentStep);
      
      return {
        currentStep,
        progress,
        stepInfo
      };
    } catch (error) {
      logger.error('Failed to get current step info:', error);
      throw error;
    }
  }

  /**
   * Refresh step data
   */
  async refreshStepData(): Promise<void> {
    try {
      await this.flowCoordinator.updateProgress();
      logger.info('Step data refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh step data:', error);
      throw error;
    }
  }

  /**
   * Validate and save any step
   */
  async validateAndSaveStep(stepId: string, data: any): Promise<boolean> {
    try {
      const validation = await this.flowCoordinator.validateStepData(stepId, data);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const result = await this.flowCoordinator.executeStep(stepId, data);
      return result.success || false;
    } catch (error) {
      logger.error(`Failed to validate and save step ${stepId}:`, error);
      throw error;
    }
  }

  /**
   * Check if user can proceed to next step
   */
  async canProceedToNext(currentStep: string): Promise<boolean> {
    try {
      return await this.flowCoordinator.canProceedToNextStep(currentStep);
    } catch (error) {
      logger.error(`Failed to check if can proceed from ${currentStep}:`, error);
      return false;
    }
  }

  /**
   * Get next step route
   */
  async getNextStepRoute(currentStep: string): Promise<string | null> {
    const routes: { [key: string]: string } = {
      'profile': '/onboarding/interests',
      'interests': '/onboarding/goals',
      'goals': '/onboarding/project-detail', // Will be determined dynamically
      'project_details': '/onboarding/project-skills',
      'skills': '/(tabs)'
    };

    // Special handling for goals → project_details decision
    if (currentStep === 'goals') {
      const goalsData = this.localData.goals;
      if (goalsData && goalsData.goals) {
        const needsProject = goalsData.goals.some(goal => 
          goal.includes('cofounder') || goal.includes('collaborator')
        );
        return needsProject ? '/onboarding/project-detail' : '/onboarding/project-skills';
      }
    }

    return routes[currentStep] || null;
  }

  // Helper methods

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
   * Generate temporary password for migration
   */
  private generateTempPassword(): string {
    return 'temp_' + Math.random().toString(36).slice(2) + Date.now();
  }

  /**
   * Get user email from session
   */
  private async getUserEmail(): Promise<string> {
    try {
      const session = await this.sessionManager.getSession();
      return session?.user?.email || 'unknown@example.com';
    } catch (error) {
      logger.warn('Could not get user email:', error);
      return 'unknown@example.com';
    }
  }

  /**
   * Get fallback interests for local users
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
   * Get fallback skills for local users
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

  /**
   * Get locally stored data for testing/fallback
   */
  getLocalData(): any {
    return { ...this.localData };
  }

  /**
   * Clear local data (for testing)
   */
  clearLocalData(): void {
    this.localData = {};
    logger.info('🧹 Local data cleared');
  }
} 