/**
 * SimpleOnboardingManager - Simplified working version for Supabase integration
 * 
 * This provides a clean, working interface for onboarding with real Supabase integration.
 * It handles all the onboarding steps with proper error handling and progress tracking.
 */

import { EventEmitter } from 'events';
import { OnboardingSupabaseService, ProfileData, InterestsData, GoalsData, ProjectDetailsData, SkillsData } from './OnboardingSupabaseService';
import { SessionManager } from './SessionManager';
import { supabase } from './supabase';
import { createLogger } from '../utils/logger';

const logger = createLogger('SimpleOnboardingManager');

export interface OnboardingProgress {
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  percentageComplete: number;
  isComplete: boolean;
  canProceedToNext: boolean;
  nextStep?: string;
  userId?: string;
}

export interface OnboardingError {
  type: 'validation' | 'network' | 'auth' | 'database' | 'unknown';
  message: string;
  step?: string;
  retryable: boolean;
  details?: any;
}

export class SimpleOnboardingManager extends EventEmitter {
  private static instance: SimpleOnboardingManager;
  
  private supabaseService: OnboardingSupabaseService;
  private sessionManager: SessionManager;
  private currentUserId?: string;
  private initialized: boolean = false;

  private readonly ONBOARDING_STEPS = [
    'profile',
    'interests', 
    'goals',
    'project_details',
    'skills'
  ];

  constructor() {
    super();
    
    this.supabaseService = OnboardingSupabaseService.getInstance();
    this.sessionManager = SessionManager.getInstance();
    
    logger.info('🎯 SimpleOnboardingManager initialized');
  }

  static getInstance(): SimpleOnboardingManager {
    if (!SimpleOnboardingManager.instance) {
      SimpleOnboardingManager.instance = new SimpleOnboardingManager();
    }
    return SimpleOnboardingManager.instance;
  }

  /**
   * Initialize the onboarding system
   */
  async initialize(): Promise<boolean> {
    try {
      if (this.initialized) {
        return true;
      }

      logger.info('🚀 Initializing SimpleOnboardingManager...');

      // Initialize session
      await this.sessionManager.initializeSession();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        this.currentUserId = user.id;
        
        // Ensure user profile exists
        await this.supabaseService.ensureUserProfile(user.id, user.email);
        
        logger.info('✅ User authenticated:', user.id);
      } else {
        logger.info('ℹ️ No authenticated user found');
      }

      this.initialized = true;
      logger.info('✅ SimpleOnboardingManager initialized successfully');
      
      return true;

    } catch (error) {
      logger.error('❌ Failed to initialize SimpleOnboardingManager:', error);
      this.emitError({
        type: 'unknown',
        message: 'Failed to initialize onboarding system',
        retryable: true,
        details: error
      });
      return false;
    }
  }

  /**
   * Execute a specific onboarding step
   */
  async executeStep(stepId: string, data: any): Promise<{ success: boolean; nextStep?: string; error?: string }> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.currentUserId) {
        throw new Error('User not authenticated');
      }

      logger.info(`🎯 Executing step: ${stepId}`, data);

      // Validate input data
      const validationResult = this.supabaseService.validateStepData(stepId, data);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Execute the step
      let success = false;
      switch (stepId) {
        case 'profile':
          success = await this.supabaseService.saveProfile(this.currentUserId, data as ProfileData);
          break;
        case 'interests':
          success = await this.supabaseService.saveInterests(this.currentUserId, data as InterestsData);
          break;
        case 'goals':
          success = await this.supabaseService.saveGoals(this.currentUserId, data as GoalsData);
          break;
        case 'project_details':
          success = await this.supabaseService.saveProjectDetails(this.currentUserId, data as ProjectDetailsData);
          break;
        case 'skills':
          success = await this.supabaseService.saveSkills(this.currentUserId, data as SkillsData);
          break;
        default:
          throw new Error(`Unknown step: ${stepId}`);
      }

      if (success) {
        // Get current progress to determine next step
        const progress = await this.getCurrentProgress();
        
        // Emit events
        this.emit('step-completed', stepId, data);
        this.emit('progress-updated', progress);

        // Check if onboarding is complete
        if (progress.isComplete) {
          this.emit('flow-completed');
          logger.info('🎉 Onboarding completed!');
        }

        logger.info(`✅ Step ${stepId} completed successfully`);
        return { 
          success: true, 
          nextStep: progress.nextStep 
        };
      } else {
        throw new Error('Step execution failed');
      }

    } catch (error) {
      logger.error(`❌ Error executing step ${stepId}:`, error);
      
      this.emitError({
        type: 'database',
        message: error instanceof Error ? error.message : 'Step execution failed',
        step: stepId,
        retryable: true,
        details: error
      });

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Step execution failed' 
      };
    }
  }

  /**
   * Get current onboarding progress
   */
  async getCurrentProgress(): Promise<OnboardingProgress> {
    try {
      if (!this.currentUserId) {
        return this.getDefaultProgress();
      }

      const progressData = await this.supabaseService.getOnboardingProgress(this.currentUserId);
      
      if (!progressData) {
        return this.getDefaultProgress();
      }

      const currentStepIndex = this.ONBOARDING_STEPS.indexOf(progressData.currentStep);
      const completedSteps = this.ONBOARDING_STEPS.slice(0, Math.max(0, currentStepIndex));
      
      // If completed, add current step to completed list
      if (progressData.isComplete) {
        completedSteps.push(...this.ONBOARDING_STEPS.slice(currentStepIndex));
      }

      const percentageComplete = Math.floor((completedSteps.length / this.ONBOARDING_STEPS.length) * 100);
      
      const nextStepIndex = currentStepIndex + 1;
      const nextStep = nextStepIndex < this.ONBOARDING_STEPS.length 
        ? this.ONBOARDING_STEPS[nextStepIndex] 
        : undefined;

      return {
        currentStep: progressData.currentStep,
        completedSteps,
        totalSteps: this.ONBOARDING_STEPS.length,
        percentageComplete,
        isComplete: progressData.isComplete,
        canProceedToNext: !progressData.isComplete && currentStepIndex < this.ONBOARDING_STEPS.length - 1,
        nextStep,
        userId: this.currentUserId
      };

    } catch (error) {
      logger.error('Error getting current progress:', error);
      return this.getDefaultProgress();
    }
  }

  /**
   * Get data for a specific step
   */
  async getStepData(stepId: string): Promise<any> {
    try {
      if (!this.currentUserId) {
        return null;
      }

      const progressData = await this.supabaseService.getOnboardingProgress(this.currentUserId);
      
      if (!progressData) {
        return null;
      }

      switch (stepId) {
        case 'profile':
          return progressData.profileData;
        case 'interests':
          return progressData.interestsData;
        case 'goals':
          return progressData.goalsData;
        case 'project_details':
          return progressData.projectData;
        case 'skills':
          return progressData.skillsData;
        default:
          return null;
      }

    } catch (error) {
      logger.error(`Error getting data for step ${stepId}:`, error);
      return null;
    }
  }

  /**
   * Get available options for a step (e.g., interests, skills)
   */
  async getStepOptions(stepId: string): Promise<any[]> {
    try {
      switch (stepId) {
        case 'interests':
          return await this.supabaseService.getAvailableInterests();
        case 'skills':
          return await this.supabaseService.getAvailableSkills();
        default:
          return [];
      }
    } catch (error) {
      logger.error(`Error getting options for step ${stepId}:`, error);
      return [];
    }
  }

  /**
   * Check if user is authenticated
   */
  async isUserAuthenticated(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return !!user;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | undefined {
    return this.currentUserId;
  }

  /**
   * Reset onboarding progress (for testing)
   */
  async resetOnboarding(): Promise<boolean> {
    try {
      if (!this.currentUserId) {
        return false;
      }

      logger.info('🔄 Resetting onboarding progress');

      // Reset in database
      await supabase
        .from('profiles')
        .update({ 
          onboarding_step: 'profile',
          onboarding_completed: false,
          first_name: null,
          last_name: null,
          location: null,
          job_title: null,
          bio: null
        })
        .eq('id', this.currentUserId);

      // Clear related data
      await supabase.from('user_interests').delete().eq('user_id', this.currentUserId);
      await supabase.from('user_goals').delete().eq('user_id', this.currentUserId);
      await supabase.from('user_skills').delete().eq('user_id', this.currentUserId);

      this.emit('progress-updated', await this.getCurrentProgress());
      
      logger.info('✅ Onboarding reset complete');
      return true;

    } catch (error) {
      logger.error('Error resetting onboarding:', error);
      return false;
    }
  }

  // Private methods

  private getDefaultProgress(): OnboardingProgress {
    return {
      currentStep: 'profile',
      completedSteps: [],
      totalSteps: this.ONBOARDING_STEPS.length,
      percentageComplete: 0,
      isComplete: false,
      canProceedToNext: true,
      userId: this.currentUserId
    };
  }

  private emitError(error: OnboardingError): void {
    logger.error('Emitting error:', error);
    this.emit('error-occurred', error);
  }

  // Cleanup
  destroy(): void {
    this.removeAllListeners();
    this.initialized = false;
    logger.info('🗑️ SimpleOnboardingManager destroyed');
  }
}

// Export singleton instance
export const getSimpleOnboardingManager = (): SimpleOnboardingManager => {
  return SimpleOnboardingManager.getInstance();
};

export default SimpleOnboardingManager;
