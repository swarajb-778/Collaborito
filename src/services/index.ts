// Services Index - Export all active services
// Centralized exports for optimized services

// Core Services
export { supabase, handleError } from './supabase';

// Onboarding Services
export { optimizedOnboardingService } from './OptimizedOnboardingService';
export { onboardingService } from './OnboardingService';

// Flow Management Services
export { OnboardingFlowCoordinator } from './OnboardingFlowCoordinator';
export { OnboardingStepManager } from './OnboardingStepManager';

// Other Available Services
export { OnboardingAnalytics } from './OnboardingAnalytics';
export { OnboardingCompletionService } from './OnboardingCompletionService';
export { SeedDataService } from './SeedDataService';
export { SessionManager } from './SessionManager';
export { DataValidationService } from './DataValidationService';
export { SupabaseDatabaseService } from './SupabaseDatabaseService';

// Service Factory Functions - Use direct imports to avoid circular references
export const getSeedDataService = () => require('./SeedDataService').SeedDataService.getInstance();
export const getSimpleOnboardingManager = () => require('./OnboardingStepManager').OnboardingStepManager.getInstance();

// Configuration
export * from '../config/onboardingConfig';

// Types and Interfaces for Optimized Services
export type {
  Interest,
  Skill,
  UserSkill,
  ProfileData,
  UserGoal,
  OptimizedOnboardingResult,
  OnboardingProgress,
} from './OptimizedOnboardingService';

export type {
  OnboardingEvent,
  OnboardingMetrics,
  OnboardingError,
  AnalyticsInsights,
} from './OnboardingAnalytics';

export type {
  OnboardingStep,
  ValidationRule,
  OnboardingFlow,
} from '../config/onboardingConfig';

// Utility functions for onboarding configuration
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