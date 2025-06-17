import { SessionManager } from './SessionManager';
import { OnboardingFlowCoordinator } from './OnboardingFlowCoordinator';
import { supabase } from './supabase';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  async saveProfileStep(data: { firstName: string; lastName: string; location?: string; jobTitle?: string }): Promise<boolean> {
    try {
      console.log('🔄 Saving profile step with data:', data);
      
      // Verify session first
      const sessionValid = await this.sessionManager.verifySession();
      if (!sessionValid) {
        console.error('❌ Invalid session for profile step');
        return false;
      }

      // Get current user ID
      const session = this.sessionManager.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        console.error('❌ No user ID available');
        return false;
      }

      // Try to save to database first
      try {
        console.log('💾 Saving profile to database...');
        
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            first_name: data.firstName,
            last_name: data.lastName,
            // Additional fields if provided
            ...(data.location && { location: data.location }),
            ...(data.jobTitle && { job_title: data.jobTitle }),
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.warn('⚠️ Database save failed, falling back to session manager:', error.message);
          throw error;
        }

        console.log('✅ Profile saved to database successfully');
      } catch (dbError) {
        console.warn('⚠️ Database operation failed, using session fallback:', (dbError as Error).message);
      }

      // Always also save via session manager for consistency
      const sessionSuccess = await this.sessionManager.saveOnboardingStep('profile', data);
      
      if (!sessionSuccess) {
        console.error('❌ Failed to save profile via session manager');
        return false;
      }

      console.log('✅ Profile step saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to save profile step:', error);
      return false;
    }
  }

  async saveInterestsStep(data: { interestIds: string[] }): Promise<boolean> {
    try {
      console.log('🔄 Saving interests step with IDs:', data.interestIds);
      
      // Verify session
      const sessionValid = await this.sessionManager.verifySession();
      if (!sessionValid) {
        console.error('❌ Invalid session for interests step');
        return false;
      }

      // Save via session manager
      const sessionSuccess = await this.sessionManager.saveOnboardingStep('interests', data);
      
      if (!sessionSuccess) {
        console.error('❌ Failed to save interests via session manager');
        return false;
      }

      console.log('✅ Interests step saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to save interests step:', error);
      return false;
    }
  }

  async saveGoalsStep(data: { goalType: string; goalDescription?: string }): Promise<boolean> {
    try {
      console.log('🔄 Saving goals step:', data);
      
      // Verify session
      const sessionValid = await this.sessionManager.verifySession();
      if (!sessionValid) {
        console.error('❌ Invalid session for goals step');
        return false;
      }

      // Save via session manager
      const sessionSuccess = await this.sessionManager.saveOnboardingStep('goals', data);
      
      if (!sessionSuccess) {
        console.error('❌ Failed to save goals via session manager');
        return false;
      }

      console.log('✅ Goals step saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to save goals step:', error);
      return false;
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
      console.log('🔄 Loading available interests...');
      
      // Try to load from database first
      try {
        const { data, error } = await supabase
          .from('interests')
          .select('*')
          .order('name');

        if (error) throw error;

        if (data && data.length > 0) {
          console.log('✅ Loaded', data.length, 'interests from database');
          return data;
        }
      } catch (dbError) {
        console.warn('⚠️ Failed to load interests from database:', (dbError as Error).message);
      }

      // Fallback to local interests
      console.log('📋 Using fallback interests list');
      const fallbackInterests = [
        { id: '1', name: 'Art' },
        { id: '2', name: 'Artificial Intelligence & Machine Learning' },
        { id: '3', name: 'Biotechnology' },
        { id: '4', name: 'Business' },
        { id: '5', name: 'Books' },
        { id: '6', name: 'Climate Change' },
        { id: '7', name: 'Civic Engagement' },
        { id: '8', name: 'Dancing' },
        { id: '9', name: 'Data Science' },
        { id: '10', name: 'Education' },
        { id: '11', name: 'Entrepreneurship' },
        { id: '12', name: 'Fashion' },
        { id: '13', name: 'Fitness' },
        { id: '14', name: 'Food' },
        { id: '15', name: 'Gaming' },
        { id: '16', name: 'Health & Wellness' },
        { id: '17', name: 'Investing & Finance' },
        { id: '18', name: 'Marketing' },
        { id: '19', name: 'Movies' },
        { id: '20', name: 'Music' },
        { id: '21', name: 'Parenting' },
        { id: '22', name: 'Pets' },
        { id: '23', name: 'Product Design' },
        { id: '24', name: 'Reading' },
        { id: '25', name: 'Real Estate' },
        { id: '26', name: 'Robotics' },
        { id: '27', name: 'Science & Tech' },
        { id: '28', name: 'Social Impact' },
        { id: '29', name: 'Sports' },
        { id: '30', name: 'Travel' },
        { id: '31', name: 'Writing' },
        { id: '32', name: 'Other' },
      ];

      return fallbackInterests;
    } catch (error) {
      console.error('❌ Failed to get available interests:', error);
      return [];
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
      console.log('🔄 Loading user interests...');
      
      // Get from session state first
      const state = this.sessionManager.getOnboardingState();
      if (state?.interests) {
        console.log('✅ Found user interests in session:', state.interests);
        return Array.isArray(state.interests) ? state.interests : [];
      }

      console.log('⚠️ No user interests found');
      return [];
    } catch (error) {
      console.error('❌ Failed to get user interests:', error);
      return [];
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
      console.log('⏭️ Skipping step:', stepId, 'reason:', reason);
      
      // Save skip info via session manager
      const sessionSuccess = await this.sessionManager.saveOnboardingStep(`skip_${stepId}`, { reason });
      
      console.log(sessionSuccess ? '✅ Step skipped successfully' : '❌ Failed to skip step');
      return sessionSuccess;
    } catch (error) {
      console.error('❌ Failed to skip step:', error);
      return false;
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
      console.log('🧭 Getting next step route for:', currentStep);
      
      const routeMap: { [key: string]: string } = {
        'profile': '/onboarding/interests',
        'interests': '/onboarding/goals',
        'goals': '/onboarding/project-detail',
        'project_details': '/onboarding/project-skills',
        'skills': '/(tabs)'
      };

      const nextRoute = routeMap[currentStep] || null;
      console.log('📍 Next route:', nextRoute);
      
      return nextRoute;
    } catch (error) {
      console.error('❌ Failed to get next step route:', error);
      return null;
    }
  }
} 