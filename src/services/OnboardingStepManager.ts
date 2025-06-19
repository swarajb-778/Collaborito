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
  goalType: 'find_cofounder' | 'find_collaborators' | 'contribute_skills' | 'explore_ideas';
  details?: Record<string, any>;
}

export interface ProjectDetailsData {
  name: string;
  description: string;
  tags?: string[];
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

  static getInstance(): OnboardingStepManager {
    if (!OnboardingStepManager.instance) {
      OnboardingStepManager.instance = new OnboardingStepManager();
    }
    return OnboardingStepManager.instance;
  }

  /**
   * Check if current user is a mock user (development mode)
   */
  private isMockUser(): boolean {
    const userId = this.getCurrentUserId();
    return !userId || userId.startsWith('new') || userId.includes('mock');
  }

  /**
   * Get current user ID from session or auth context
   */
  private getCurrentUserId(): string | null {
    try {
      const session = this.sessionManager.getSession();
      if (session?.user?.id) {
        return session.user.id;
      }
      
      // Fallback: try to get from flow coordinator's state
      const state = this.sessionManager.getOnboardingState();
      return state?.userId || null;
    } catch (error) {
      logger.warn('Could not get current user ID:', error);
      return null;
    }
  }

  /**
   * Validate UUID format
   */
  private isValidUUID(uuid: string): boolean {
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
   * Save profile step to Supabase
   */
  async saveProfileStep(data: ProfileData): Promise<boolean> {
    try {
      const userId = this.getCurrentUserId();
      
      if (!userId) {
        throw new Error('No user ID available');
      }

      logger.info(`Saving profile step for user: ${userId}`);
      logger.info(`Profile data to save:`, data);

      // For mock users, save locally and return success
      if (this.isMockUser()) {
        logger.info('🔧 Mock user detected, saving profile locally');
        this.mockData.profile = data;
        logger.info('✅ Mock profile saved locally');
        return true;
      }

      // Update user profile in Supabase
      const profileUpdateData = {
        first_name: data.firstName,
        last_name: data.lastName,
        location: data.location || null,
        job_title: data.jobTitle || null,
        bio: data.bio || null,
        full_name: `${data.firstName} ${data.lastName}`.trim(),
        onboarding_step: 'interests' // Next step after profile
      };

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', userId);

      if (profileError) {
        logger.error('Failed to update user profile:', profileError);
        throw profileError;
      }

      logger.info('✅ Profile step saved successfully');
      return true;

    } catch (error) {
      logger.error('Error in saveProfileStep:', error);
      throw error;
    }
  }

  /**
   * Save interests step with proper UUID validation
   */
  async saveInterestsStep(data: { interestIds: string[] }): Promise<boolean> {
    try {
      const userId = this.getCurrentUserId();
      
      if (!userId) {
        throw new Error('No user ID available');
      }

      logger.info(`Saving interests step for user: ${userId}`);
      logger.info(`Interest IDs to save:`, data.interestIds);

      // Validate all interest IDs are proper UUIDs
      const invalidIds = data.interestIds.filter(id => !this.isValidUUID(id));
      if (invalidIds.length > 0) {
        throw new Error(`Invalid UUID format for interest IDs: ${invalidIds.join(', ')}`);
      }

      // For mock users, save locally and return success
      if (this.isMockUser()) {
        logger.info('🔧 Mock user detected, saving interests locally');
        this.mockData.interests = data.interestIds;
        logger.info('✅ Mock interests saved locally');
        return true;
      }

      // First, delete existing user interests
      const { error: deleteError } = await supabaseAdmin
        .from('user_interests')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        logger.error('Failed to delete existing user interests:', deleteError);
        throw deleteError;
      }

      // Insert new user interests
      if (data.interestIds.length > 0) {
        const userInterests = data.interestIds.map(interestId => ({
          user_id: userId,
          interest_id: interestId
        }));

        const { error: insertError } = await supabaseAdmin
          .from('user_interests')
          .insert(userInterests);

        if (insertError) {
          logger.error('Failed to insert user interests:', insertError);
          throw insertError;
        }
      }

      // Update user profile onboarding step
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ onboarding_step: 'goals' })
        .eq('id', userId);

      if (profileError) {
        logger.warn('Failed to update profile onboarding step:', profileError);
        // Don't throw error for profile update failure
      }

      logger.info('✅ Interests step saved successfully');
      return true;

    } catch (error) {
      logger.error('Error in saveInterestsStep:', error);
      throw error;
    }
  }

  /**
   * Save goals step to Supabase
   */
  async saveGoalsStep(data: GoalsData): Promise<boolean> {
    try {
      const userId = this.getCurrentUserId();
      
      if (!userId) {
        throw new Error('No user ID available');
      }

      logger.info(`Saving goals step for user: ${userId}`);
      logger.info(`Goals data to save:`, data);

      // For mock users, save locally and return success
      if (this.isMockUser()) {
        logger.info('🔧 Mock user detected, saving goals locally');
        this.mockData.goals = data;
        logger.info('✅ Mock goals saved locally');
        return true;
      }

      // First, delete existing user goals
      const { error: deleteError } = await supabaseAdmin
        .from('user_goals')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        logger.error('Failed to delete existing user goals:', deleteError);
        throw deleteError;
      }

      // Insert new user goal
      const userGoal = {
        user_id: userId,
        goal_type: data.goalType,
        details: data.details || {},
        is_active: true
      };

      const { error: insertError } = await supabaseAdmin
        .from('user_goals')
        .insert([userGoal]);

      if (insertError) {
        logger.error('Failed to insert user goal:', insertError);
        throw insertError;
      }

      // Update user profile onboarding step based on goal type
      let nextStep = 'skills'; // Default next step
      if (data.goalType === 'find_cofounder' || data.goalType === 'find_collaborators') {
        nextStep = 'project_details'; // These goals need project details
      }

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ onboarding_step: nextStep })
        .eq('id', userId);

      if (profileError) {
        logger.warn('Failed to update profile onboarding step:', profileError);
        // Don't throw error for profile update failure
      }

      logger.info('✅ Goals step saved successfully');
      return true;

    } catch (error) {
      logger.error('Error in saveGoalsStep:', error);
      throw error;
    }
  }

  /**
   * Save project details step to Supabase
   */
  async saveProjectDetailsStep(data: ProjectDetailsData): Promise<boolean> {
    try {
      const userId = this.getCurrentUserId();
      
      if (!userId) {
        throw new Error('No user ID available');
      }

      logger.info(`Saving project details step for user: ${userId}`);
      logger.info(`Project details data to save:`, data);

      // For mock users, save locally and return success
      if (this.isMockUser()) {
        logger.info('🔧 Mock user detected, saving project details locally');
        this.mockData.projectDetails = data;
        logger.info('✅ Mock project details saved locally');
        return true;
      }

      // Create a new project
      const projectData = {
        title: data.name,
        description: data.description,
        owner_id: userId
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
        role: 'owner'
      };

      const { error: memberError } = await supabaseAdmin
        .from('project_members')
        .insert([memberData]);

      if (memberError) {
        logger.error('Failed to add user as project member:', memberError);
        // Don't throw error - project creation succeeded
      }

      // Update user profile onboarding step
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ onboarding_step: 'skills' })
        .eq('id', userId);

      if (profileError) {
        logger.warn('Failed to update profile onboarding step:', profileError);
        // Don't throw error for profile update failure
      }

      logger.info('✅ Project details step saved successfully, project ID:', createdProject.id);
      return true;

    } catch (error) {
      logger.error('Error in saveProjectDetailsStep:', error);
      throw error;
    }
  }

  /**
   * Save skills step to Supabase
   */
  async saveSkillsStep(data: SkillsData): Promise<boolean> {
    try {
      const userId = this.getCurrentUserId();
      
      if (!userId) {
        throw new Error('No user ID available');
      }

      logger.info(`Saving skills step for user: ${userId}`);
      logger.info(`Skills data to save:`, data);

      // Validate all skill IDs are proper UUIDs
      const skillIds = data.skills.map(skill => skill.skillId);
      const invalidIds = skillIds.filter(id => !this.isValidUUID(id));
      if (invalidIds.length > 0) {
        throw new Error(`Invalid UUID format for skill IDs: ${invalidIds.join(', ')}`);
      }

      // For mock users, save locally and return success
      if (this.isMockUser()) {
        logger.info('🔧 Mock user detected, saving skills locally');
        this.mockData.skills = data.skills;
        logger.info('✅ Mock skills saved locally');
        return true;
      }

      // Fetch and validate skill IDs exist in database
      const { data: validSkills, error: validationError } = await supabaseAdmin
        .from('skills')
        .select('id')
        .in('id', skillIds);

      if (validationError) {
        logger.error('Failed to validate skills:', validationError);
        throw validationError;
      }

      if (validSkills.length !== skillIds.length) {
        throw new Error('Some selected skills are invalid');
      }

      // First, delete existing user skills
      const { error: deleteError } = await supabaseAdmin
        .from('user_skills')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        logger.error('Failed to delete existing user skills:', deleteError);
        throw deleteError;
      }

      // Insert new user skills
      if (data.skills.length > 0) {
        const userSkills = data.skills.map(skill => ({
          user_id: userId,
          skill_id: skill.skillId,
          proficiency: skill.proficiency || 'intermediate',
          is_offering: skill.isOffering
        }));

        const { error: insertError } = await supabaseAdmin
          .from('user_skills')
          .insert(userSkills);

        if (insertError) {
          logger.error('Failed to insert user skills:', insertError);
          throw insertError;
        }
      }

      // Update user profile onboarding step to completed
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          onboarding_step: 'completed',
          onboarding_completed: true
        })
        .eq('id', userId);

      if (profileError) {
        logger.warn('Failed to update profile onboarding completion:', profileError);
        // Don't throw error for profile update failure
      }

      logger.info('✅ Skills step saved successfully');
      return true;

    } catch (error) {
      logger.error('Error in saveSkillsStep:', error);
      throw error;
    }
  }

  /**
   * Get available interests from Supabase
   */
  async getAvailableInterests(): Promise<any[]> {
    try {
      // Check if user is mock user
      if (this.isMockUser()) {
        logger.info('🔧 Loading interests for mock user, using real Supabase data');
      }

      // Always load from Supabase (real data for both mock and real users)
      const { data: interests, error } = await supabaseAdmin
        .from('interests')
        .select('id, name, category')
        .order('name');

      if (error) {
        logger.error('Failed to load interests from Supabase:', error);
        throw error;
      }

      if (!interests || interests.length === 0) {
        logger.warn('No interests found in database');
        return [];
      }

      logger.info(`✅ Loaded ${interests.length} interests from Supabase`);
      return interests;

    } catch (error) {
      logger.error('Error loading interests:', error);
      
      // For mock users, don't throw error - let fallback handle it
      if (this.isMockUser()) {
        logger.info('🔧 Mock user detected, allowing fallback to handle interests');
        return [];
      }
      
      throw error;
    }
  }

  /**
   * Get available skills from Supabase
   */
  async getAvailableSkills(): Promise<any[]> {
    try {
      // Check if user is mock user
      if (this.isMockUser()) {
        logger.info('🔧 Loading skills for mock user, using real Supabase data');
      }

      // Always load from Supabase
      const { data: skills, error } = await supabaseAdmin
        .from('skills')
        .select('id, name, category')
        .order('name');

      if (error) {
        logger.error('Failed to load skills from Supabase:', error);
        throw error;
      }

      if (!skills || skills.length === 0) {
        logger.warn('No skills found in database');
        return [];
      }

      logger.info(`✅ Loaded ${skills.length} skills from Supabase`);
      return skills;

    } catch (error) {
      logger.error('Error loading skills:', error);
      
      // For mock users, don't throw error - let fallback handle it
      if (this.isMockUser()) {
        logger.info('🔧 Mock user detected, allowing fallback to handle skills');
        return [];
      }
      
      throw error;
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
      if (this.isMockUser()) {
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
      if (this.isMockUser()) {
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
   * Skip an onboarding step
   */
  async skipStep(stepId: string, reason?: string): Promise<boolean> {
    try {
      logger.info(`Skipping step: ${stepId}`, reason ? { reason } : {});
      return await this.flowCoordinator.skipStep(stepId, reason);
    } catch (error) {
      logger.error(`Failed to skip step ${stepId}:`, error);
      throw error;
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
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      return await this.flowCoordinator.executeStep(stepId, data);
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
    try {
      const stepMappings = {
        'profile': '/onboarding/interests',
        'interests': '/onboarding/goals',
        'goals': '/onboarding/project-detail',
        'project_details': '/onboarding/project-skills',
        'skills': '/(tabs)',
      };

      return stepMappings[currentStep as keyof typeof stepMappings] || null;
    } catch (error) {
      logger.error(`Failed to get next step route for ${currentStep}:`, error);
      return null;
    }
  }
} 