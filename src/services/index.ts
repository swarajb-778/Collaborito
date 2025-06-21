// Enhanced Services Index - Export all onboarding and core services
// Centralized exports for all services including new onboarding infrastructure

// Core Services
export { supabase, handleError } from './supabase';
export * as onboardingService from './onboardingService';

// Enhanced Onboarding Services
export { SessionManager } from './SessionManager';
export { OnboardingErrorRecovery } from './OnboardingErrorRecovery';
export { OnboardingFlowCoordinator } from './OnboardingFlowCoordinator';
export { OnboardingStepManager } from './OnboardingStepManager';
export { OnboardingAnalytics } from './OnboardingAnalytics';
export { OnboardingManager, getOnboardingManager } from './OnboardingManager';
export { SimpleOnboardingManager, getSimpleOnboardingManager } from './SimpleOnboardingManager';
export { OnboardingSupabaseService, getOnboardingSupabaseService } from './OnboardingSupabaseService';
export { ServiceContainer, getServiceContainer } from './ServiceContainer';

// Configuration
export * from '../config/onboardingConfig';

// Types and Interfaces
export type {
  OnboardingEvent,
  OnboardingMetrics,
  OnboardingError,
  AnalyticsInsights,
} from './OnboardingAnalytics';

export type {
  ProfileData,
  InterestsData,
  GoalsData,
  ProjectDetailsData,
  SkillsData,
} from './OnboardingStepManager';

export type {
  OnboardingStep,
  ValidationRule,
  OnboardingFlow,
} from '../config/onboardingConfig';

// Utility functions for easy access
export {
  getFlowForGoalType,
  getStepByRoute,
  validateStepData,
  calculateProgress,
  getNextStep,
  getPreviousStep,
  isStepRequired,
  getEstimatedTimeRemaining,
} from '../config/onboardingConfig';

// Service factory functions for easier initialization
export const createOnboardingServices = () => {
  const { SessionManager } = require('./SessionManager');
  const { OnboardingFlowCoordinator } = require('./OnboardingFlowCoordinator');
  const { OnboardingStepManager } = require('./OnboardingStepManager');
  const { OnboardingAnalytics } = require('./OnboardingAnalytics');
  const { OnboardingErrorRecovery } = require('./OnboardingErrorRecovery');

  const sessionManager = SessionManager.getInstance();
  const flowCoordinator = OnboardingFlowCoordinator.getInstance();
  const stepManager = OnboardingStepManager.getInstance();
  const analytics = OnboardingAnalytics.getInstance();
  const errorRecovery = new OnboardingErrorRecovery();

  return {
    sessionManager,
    flowCoordinator,
    stepManager,
    analytics,
    errorRecovery,
  };
};

// Enhanced service orchestrator for complex onboarding operations
export class OnboardingOrchestrator {
  private services: ReturnType<typeof createOnboardingServices>;

  constructor() {
    this.services = createOnboardingServices();
  }

  // Complete onboarding initialization with analytics tracking
  async initializeOnboarding(userId: string): Promise<boolean> {
    try {
      await this.services.analytics.trackStepStart(userId, 'initialization');
      
      const sessionReady = await this.services.sessionManager.initializeSession();
      if (!sessionReady) {
        await this.services.analytics.trackError(userId, 'initialization', 'session_failed', 'Failed to initialize session');
        return false;
      }

      const flowReady = await this.services.flowCoordinator.initializeFlow();
      if (!flowReady) {
        await this.services.analytics.trackError(userId, 'initialization', 'flow_failed', 'Failed to initialize flow');
        return false;
      }

      await this.services.analytics.trackStepComplete(userId, 'initialization');
      return true;
    } catch (error) {
      await this.services.analytics.trackError(userId, 'initialization', 'unknown', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  // Execute a step with full analytics and error handling
  async executeStep(userId: string, stepId: string, data: any): Promise<boolean> {
    try {
      await this.services.analytics.trackStepStart(userId, stepId);

      // Validate step data
      const { validateStepData } = require('../config/onboardingConfig');
      const validation = validateStepData(stepId, data);
      if (!validation.valid) {
        await this.services.analytics.trackError(userId, stepId, 'validation', validation.errors.join(', '));
        return false;
      }

      // Execute the step
      let success = false;
      switch (stepId) {
        case 'profile':
          success = await this.services.stepManager.saveProfileStep(data);
          break;
        case 'interests':
          success = await this.services.stepManager.saveInterestsStep(data);
          break;
        case 'goals':
          success = await this.services.stepManager.saveGoalsStep(data);
          break;
        case 'project_details':
          success = await this.services.stepManager.saveProjectDetailsStep(data);
          break;
        case 'skills':
          success = await this.services.stepManager.saveSkillsStep(data);
          break;
        default:
          throw new Error(`Unknown step: ${stepId}`);
      }

      if (success) {
        await this.services.analytics.trackStepComplete(userId, stepId);
      } else {
        await this.services.analytics.trackError(userId, stepId, 'execution', 'Step execution failed');
      }

      return success;
    } catch (error) {
      await this.services.analytics.trackError(userId, stepId, 'exception', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  // Skip a step with analytics tracking
  async skipStep(userId: string, stepId: string, reason?: string): Promise<boolean> {
    try {
      await this.services.analytics.trackStepSkip(userId, stepId, reason);
      return await this.services.stepManager.skipStep(stepId, reason);
    } catch (error) {
      await this.services.analytics.trackError(userId, stepId, 'skip_failed', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  // Get comprehensive onboarding status with analytics
  async getOnboardingStatus(userId: string): Promise<{
    progress: number;
    currentStep: string;
    completedSteps: string[];
    analytics: any;
    estimatedTimeRemaining: number;
  }> {
    try {
      const flowCoordinator = this.services.flowCoordinator;
      const analytics = this.services.analytics;

      const progress = flowCoordinator.getProgress();
      const dashboard = analytics.getRealtimeDashboard(userId);
      const userGoal = await this.services.stepManager.getUserGoals();
      const goalType = userGoal?.goalType;
      
      const { getEstimatedTimeRemaining } = require('../config/onboardingConfig');

      return {
        progress: progress.completionPercentage,
        currentStep: progress.currentStep,
        completedSteps: progress.completedSteps,
        analytics: dashboard,
        estimatedTimeRemaining: getEstimatedTimeRemaining(progress.completedSteps, goalType),
      };
    } catch (error) {
      console.error('Failed to get onboarding status:', error);
      return {
        progress: 0,
        currentStep: 'profile',
        completedSteps: [],
        analytics: {
          currentStep: null,
          progress: 0,
          timeSpent: 0,
          errorsCount: 0,
          retriesCount: 0,
        },
        estimatedTimeRemaining: 15, // Default fallback
      };
    }
  }

  // Handle onboarding abandonment
  async handleAbandonment(userId: string, currentStep: string, reason?: string): Promise<void> {
    try {
      await this.services.analytics.trackAbandon(userId, currentStep, reason);
      
      // Additional cleanup or recovery actions could go here
      console.log(`User ${userId} abandoned onboarding at step ${currentStep}. Reason: ${reason}`);
    } catch (error) {
      console.error('Failed to handle abandonment:', error);
    }
  }

  // Get services for direct access when needed
  getServices() {
    return this.services;
  }
}

// Global onboarding orchestrator instance
let globalOrchestrator: OnboardingOrchestrator | null = null;

export const getOnboardingOrchestrator = (): OnboardingOrchestrator => {
  if (!globalOrchestrator) {
    globalOrchestrator = new OnboardingOrchestrator();
  }
  return globalOrchestrator;
}; 