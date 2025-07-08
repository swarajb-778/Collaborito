import { createLogger } from '../utils/logger';
import { OnboardingStepManager } from './OnboardingStepManager';
import { SessionManager } from './SessionManager';

const logger = createLogger('OnboardingFlowCoordinator');

export interface FlowState {
  currentStep: string;
  completed: boolean;
  progress: number;
  canProceed: boolean;
  nextStep?: string;
  previousStep?: string;
}

export interface FlowValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class OnboardingFlowCoordinator {
  private static instance: OnboardingFlowCoordinator;
  private stepManager: OnboardingStepManager;
  private sessionManager: SessionManager;
  private flowSteps = ['profile', 'interests', 'goals', 'project_details', 'skills', 'completed'];

  private constructor() {
    this.stepManager = OnboardingStepManager.getInstance();
    this.sessionManager = SessionManager.getInstance();
  }

  static getInstance(): OnboardingFlowCoordinator {
    if (!OnboardingFlowCoordinator.instance) {
      OnboardingFlowCoordinator.instance = new OnboardingFlowCoordinator();
    }
    return OnboardingFlowCoordinator.instance;
  }

  /**
   * Get current flow state
   */
  async getCurrentFlowState(): Promise<FlowState> {
    try {
      const onboardingState = this.sessionManager.getOnboardingState();
      const currentStep = onboardingState?.currentStep || 'profile';
      const completed = onboardingState?.completed || false;
      const progress = this.calculateProgress(currentStep);
      
      return {
        currentStep,
        completed,
        progress,
        canProceed: this.canProceedToNextStep(currentStep),
        nextStep: this.getNextStep(currentStep),
        previousStep: this.getPreviousStep(currentStep)
      };
    } catch (error) {
      logger.error('Failed to get current flow state:', error);
      return {
        currentStep: 'profile',
        completed: false,
        progress: 0,
        canProceed: true
      };
    }
  }

  /**
   * Validate if user can proceed to next step
   */
  async validateStep(stepId: string): Promise<FlowValidation> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      switch (stepId) {
        case 'profile':
          const profileData = await this.stepManager.getUserProfile();
          if (!profileData?.firstName) errors.push('First name is required');
          if (!profileData?.lastName) errors.push('Last name is required');
          break;

        case 'interests':
          // Add interest validation if needed
          break;

        case 'goals':
          // Add goals validation if needed
          break;

        case 'project_details':
          // Add project details validation if needed
          break;

        case 'skills':
          // Add skills validation if needed
          break;
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      logger.error('Step validation failed:', error);
      return {
        isValid: false,
        errors: ['Validation failed'],
        warnings: []
      };
    }
  }

  /**
   * Navigate to next step
   */
  async proceedToNextStep(currentStep: string): Promise<{ success: boolean; nextStep?: string; error?: string }> {
    try {
      const validation = await this.validateStep(currentStep);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Cannot proceed: ${validation.errors.join(', ')}`
        };
      }

      const nextStep = this.getNextStep(currentStep);
      if (!nextStep) {
        return {
          success: false,
          error: 'No next step available'
        };
      }

      // Update onboarding state
      await this.sessionManager.saveOnboardingStep(currentStep, { completed: true });
      
      logger.info(`Flow proceeding from ${currentStep} to ${nextStep}`);
      return {
        success: true,
        nextStep
      };
    } catch (error) {
      logger.error('Failed to proceed to next step:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Reset flow to beginning
   */
  async resetFlow(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.sessionManager.clearSession();
      logger.info('Onboarding flow reset');
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset flow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Reset failed'
      };
    }
  }

  /**
   * Complete the entire onboarding flow
   */
  async completeFlow(): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate all steps are completed
      for (const step of this.flowSteps.slice(0, -1)) { // Exclude 'completed'
        const validation = await this.validateStep(step);
        if (!validation.isValid) {
          return {
            success: false,
            error: `Step ${step} is not valid: ${validation.errors.join(', ')}`
          };
        }
      }

      // Mark as completed
      await this.sessionManager.saveOnboardingStep('completed', { completed: true });
      
      logger.info('Onboarding flow completed successfully');
      return { success: true };
    } catch (error) {
      logger.error('Failed to complete flow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Completion failed'
      };
    }
  }

  /**
   * Get progress percentage
   */
  private calculateProgress(currentStep: string): number {
    const stepIndex = this.flowSteps.indexOf(currentStep);
    if (stepIndex === -1) return 0;
    return Math.round((stepIndex / (this.flowSteps.length - 1)) * 100);
  }

  /**
   * Check if can proceed to next step
   */
  private canProceedToNextStep(currentStep: string): boolean {
    const stepIndex = this.flowSteps.indexOf(currentStep);
    return stepIndex >= 0 && stepIndex < this.flowSteps.length - 1;
  }

  /**
   * Get next step in flow
   */
  private getNextStep(currentStep: string): string | undefined {
    const stepIndex = this.flowSteps.indexOf(currentStep);
    if (stepIndex >= 0 && stepIndex < this.flowSteps.length - 1) {
      return this.flowSteps[stepIndex + 1];
    }
    return undefined;
  }

  /**
   * Get previous step in flow
   */
  private getPreviousStep(currentStep: string): string | undefined {
    const stepIndex = this.flowSteps.indexOf(currentStep);
    if (stepIndex > 0) {
      return this.flowSteps[stepIndex - 1];
    }
    return undefined;
  }

  /**
   * Get all flow steps
   */
  getFlowSteps(): string[] {
    return [...this.flowSteps];
  }

  /**
   * Check if flow is complete
   */
  async isFlowComplete(): Promise<boolean> {
    try {
      const onboardingState = this.sessionManager.getOnboardingState();
      return onboardingState?.completed || false;
    } catch (error) {
      logger.error('Failed to check flow completion:', error);
      return false;
    }
  }
} 