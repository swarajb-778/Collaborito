import { SessionManager } from './SessionManager';
import { OnboardingFlowCoordinator } from './OnboardingFlowCoordinator';
import { supabase } from './supabase';
import Constants from 'expo-constants';

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

  static getInstance(): OnboardingStepManager {
    if (!OnboardingStepManager.instance) {
      OnboardingStepManager.instance = new OnboardingStepManager();
    }
    return OnboardingStepManager.instance;
  }

  private async verifySession(): Promise<boolean> {
    const isValid = await this.sessionManager.verifySession();
    if (!isValid) {
      throw new Error('Session invalid. Please sign in again.');
    }
    return true;
  }

  async saveProfileStep(data: ProfileData): Promise<boolean> {
    try {
      await this.verifySession();
      
      // Validate data
      const validation = await this.flowCoordinator.validateStepData('profile', data);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Execute step through flow coordinator
      return await this.flowCoordinator.executeStep('profile', data);
    } catch (error) {
      console.error('Failed to save profile step:', error);
      throw error;
    }
  }

  async saveInterestsStep(data: InterestsData): Promise<boolean> {
    try {
      await this.verifySession();
      
      // Fetch and validate interest IDs exist in database
      const { data: validInterests, error } = await supabase
        .from('interests')
        .select('id')
        .in('id', data.interestIds);

      if (error) throw error;

      if (validInterests.length !== data.interestIds.length) {
        throw new Error('Some selected interests are invalid');
      }

      // Validate data
      const validation = await this.flowCoordinator.validateStepData('interests', data);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Execute step through flow coordinator
      return await this.flowCoordinator.executeStep('interests', data);
    } catch (error) {
      console.error('Failed to save interests step:', error);
      throw error;
    }
  }

  async saveGoalsStep(data: GoalsData): Promise<boolean> {
    try {
      await this.verifySession();
      
      // Validate data
      const validation = await this.flowCoordinator.validateStepData('goals', data);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Execute step through flow coordinator
      const success = await this.flowCoordinator.executeStep('goals', data);
      
      if (success) {
        // Update flow coordinator to set project_details requirement based on goal
        await this.flowCoordinator.updateProgress();
      }

      return success;
    } catch (error) {
      console.error('Failed to save goals step:', error);
      throw error;
    }
  }

  async saveProjectDetailsStep(data: ProjectDetailsData): Promise<boolean> {
    try {
      await this.verifySession();
      
      // Validate data
      const validation = await this.flowCoordinator.validateStepData('project_details', data);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Execute step through flow coordinator
      return await this.flowCoordinator.executeStep('project_details', data);
    } catch (error) {
      console.error('Failed to save project details step:', error);
      throw error;
    }
  }

  async saveSkillsStep(data: SkillsData): Promise<boolean> {
    try {
      await this.verifySession();
      
      // Fetch and validate skill IDs exist in database
      const skillIds = data.skills.map(skill => skill.skillId);
      const { data: validSkills, error } = await supabase
        .from('skills')
        .select('id')
        .in('id', skillIds);

      if (error) throw error;

      if (validSkills.length !== skillIds.length) {
        throw new Error('Some selected skills are invalid');
      }

      // Validate data
      const validation = await this.flowCoordinator.validateStepData('skills', data);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Execute step through flow coordinator
      return await this.flowCoordinator.executeStep('skills', data);
    } catch (error) {
      console.error('Failed to save skills step:', error);
      throw error;
    }
  }

  async getAvailableInterests(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('interests')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch interests:', error);
      throw error;
    }
  }

  async getAvailableSkills(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch skills:', error);
      throw error;
    }
  }

  async getUserProfile(): Promise<any> {
    try {
      await this.verifySession();
      const state = this.sessionManager.getOnboardingState();
      return state?.profile || null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  async getUserInterests(): Promise<any[]> {
    try {
      await this.verifySession();
      const state = this.sessionManager.getOnboardingState();
      return state?.interests || [];
    } catch (error) {
      console.error('Failed to get user interests:', error);
      throw error;
    }
  }

  async getUserGoals(): Promise<any> {
    try {
      await this.verifySession();
      const state = this.sessionManager.getOnboardingState();
      return state?.goal || null;
    } catch (error) {
      console.error('Failed to get user goals:', error);
      throw error;
    }
  }

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

  async skipStep(stepId: string, reason?: string): Promise<boolean> {
    try {
      await this.verifySession();
      return await this.flowCoordinator.skipStep(stepId, reason);
    } catch (error) {
      console.error(`Failed to skip step ${stepId}:`, error);
      throw error;
    }
  }

  async getCurrentStepInfo(): Promise<{ currentStep: string; progress: any; stepInfo: any }> {
    try {
      await this.verifySession();
      const progress = this.flowCoordinator.getProgress();
      const stepInfo = this.flowCoordinator.getStepInfo(progress.currentStep);
      
      return {
        currentStep: progress.currentStep,
        progress,
        stepInfo
      };
    } catch (error) {
      console.error('Failed to get current step info:', error);
      throw error;
    }
  }

  async refreshStepData(): Promise<void> {
    try {
      await this.verifySession();
      await this.sessionManager.refreshOnboardingState();
      await this.flowCoordinator.updateProgress();
    } catch (error) {
      console.error('Failed to refresh step data:', error);
      throw error;
    }
  }

  async validateAndSaveStep(stepId: string, data: any): Promise<boolean> {
    switch (stepId) {
      case 'profile':
        return this.saveProfileStep(data);
      case 'interests':
        return this.saveInterestsStep(data);
      case 'goals':
        return this.saveGoalsStep(data);
      case 'project_details':
        return this.saveProjectDetailsStep(data);
      case 'skills':
        return this.saveSkillsStep(data);
      default:
        throw new Error(`Unknown step: ${stepId}`);
    }
  }

  async canProceedToNext(currentStep: string): Promise<boolean> {
    try {
      await this.verifySession();
      return this.flowCoordinator.canProceedToNextStep(currentStep);
    } catch (error) {
      console.error('Failed to check if can proceed:', error);
      return false;
    }
  }

  async getNextStepRoute(currentStep: string): Promise<string | null> {
    try {
      await this.verifySession();
      const nextStep = this.flowCoordinator.getNextStep(currentStep);
      
      if (!nextStep || nextStep === 'completed') {
        return '/(tabs)'; // Navigate to main app
      }

      // Map step IDs to routes
      const stepRoutes: Record<string, string> = {
        'profile': '/onboarding',
        'interests': '/onboarding/interests',
        'goals': '/onboarding/goals',
        'project_details': '/onboarding/project-detail',
        'skills': '/onboarding/project-skills'
      };

      return stepRoutes[nextStep] || null;
    } catch (error) {
      console.error('Failed to get next step route:', error);
      return null;
    }
  }
} 