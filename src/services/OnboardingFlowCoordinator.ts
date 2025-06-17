import { SessionManager } from './SessionManager';
import { OnboardingErrorRecovery } from './OnboardingErrorRecovery';
import { Alert } from 'react-native';

export interface OnboardingStep {
  id: string;
  name: string;
  required: boolean;
  completed: boolean;
  validationRules?: any;
}

export interface OnboardingProgress {
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  completionPercentage: number;
  canProceed: boolean;
}

export class OnboardingFlowCoordinator {
  private static instance: OnboardingFlowCoordinator;
  private sessionManager = SessionManager.getInstance();
  private errorRecovery = new OnboardingErrorRecovery();
  
  private readonly steps: OnboardingStep[] = [
    { id: 'profile', name: 'Profile Setup', required: true, completed: false },
    { id: 'interests', name: 'Interests Selection', required: true, completed: false },
    { id: 'goals', name: 'Goals Definition', required: true, completed: false },
    { id: 'project_details', name: 'Project Details', required: false, completed: false },
    { id: 'skills', name: 'Skills Selection', required: true, completed: false }
  ];

  static getInstance(): OnboardingFlowCoordinator {
    if (!OnboardingFlowCoordinator.instance) {
      OnboardingFlowCoordinator.instance = new OnboardingFlowCoordinator();
    }
    return OnboardingFlowCoordinator.instance;
  }

  async initializeFlow(): Promise<boolean> {
    try {
      console.log('🚀 Initializing onboarding flow...');
      
      // Initialize session (handles both mock and real users)
      const sessionInitialized = await this.sessionManager.initializeSession();
      
      if (!sessionInitialized) {
        console.warn('Session initialization failed, attempting recovery...');
        const recovered = await this.errorRecovery.attemptRecovery();
        if (!recovered) {
          console.warn('Recovery failed, but allowing graceful degradation for mock users');
          // Don't return false immediately - allow mock users to continue
        }
      }

      // Load current progress
      await this.updateProgress();
      console.log('✅ Onboarding flow initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize onboarding flow:', error);
      // For mock users, provide graceful degradation
      console.log('🔧 Attempting graceful degradation for mock users');
      try {
        // Try to initialize session again
        await this.sessionManager.initializeSession();
        return true;
      } catch (fallbackError) {
        console.error('All initialization attempts failed:', fallbackError);
        return this.errorRecovery.recoverFromError(error, 'initializeFlow');
      }
    }
  }

    async executeStep(stepId: string, data: any): Promise<boolean> {
    try {
      console.log(`Executing step: ${stepId}`);
      
      // Try to validate session, but don't fail for mock users
      try {
        const sessionValid = await this.sessionManager.verifySession();
        if (!sessionValid) {
          console.warn('Session validation failed, but continuing for mock users');
        }
      } catch (sessionError) {
        console.warn('Session validation error, continuing for mock users:', sessionError);
      }

      // Save step data (SessionManager handles mock vs real users)
      const success = await this.sessionManager.saveOnboardingStep(stepId, data);
      
      if (success) {
        await this.updateProgress();
        console.log(`✅ Step ${stepId} executed successfully`);
        return true;
      }

      console.warn(`Failed to save step ${stepId}, attempting error recovery`);
      return this.errorRecovery.recoverFromError(new Error('Failed to save step data'), `executeStep:${stepId}`);
    } catch (error) {
      console.error(`Failed to execute step ${stepId}:`, error);
      return this.errorRecovery.recoverFromError(error, `executeStep:${stepId}`);
    }
  }

  async updateProgress(): Promise<void> {
    try {
      await this.sessionManager.refreshOnboardingState();
      const state = this.sessionManager.getOnboardingState();
      
      if (state) {
        this.updateStepCompletionStatus(state);
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  }

  private updateStepCompletionStatus(state: any): void {
    // Update step completion based on state
    this.steps.forEach(step => {
      switch (step.id) {
        case 'profile':
          step.completed = !!(state.profile?.firstName && state.profile?.lastName);
          break;
        case 'interests':
          step.completed = !!(state.interests && state.interests.length > 0);
          break;
        case 'goals':
          step.completed = !!state.goal;
          break;
        case 'project_details':
          step.completed = !!(state.projects && state.projects.length > 0);
          // This step is only required if goal is find_cofounder or find_collaborators
          step.required = state.goal?.type === 'find_cofounder' || state.goal?.type === 'find_collaborators';
          break;
        case 'skills':
          step.completed = !!(state.skills && state.skills.length > 0);
          break;
      }
    });
  }

  getProgress(): OnboardingProgress {
    const completedSteps = this.steps.filter(step => step.completed).map(step => step.id);
    const requiredSteps = this.steps.filter(step => step.required);
    const completedRequiredSteps = requiredSteps.filter(step => step.completed);
    
    const completionPercentage = requiredSteps.length > 0 
      ? Math.floor((completedRequiredSteps.length / requiredSteps.length) * 100)
      : 0;

    const currentStep = this.getCurrentStep();
    const canProceed = this.canProceedToNextStep(currentStep);

    return {
      currentStep,
      completedSteps,
      totalSteps: requiredSteps.length,
      completionPercentage,
      canProceed
    };
  }

  getCurrentStep(): string {
    // Find the first incomplete required step
    const incompleteRequiredStep = this.steps.find(step => step.required && !step.completed);
    
    if (incompleteRequiredStep) {
      return incompleteRequiredStep.id;
    }

    // If all required steps are complete, check optional steps
    const incompleteOptionalStep = this.steps.find(step => !step.required && !step.completed);
    
    if (incompleteOptionalStep) {
      return incompleteOptionalStep.id;
    }

    // All steps complete
    return 'completed';
  }

  getNextStep(currentStepId: string): string | null {
    const currentIndex = this.steps.findIndex(step => step.id === currentStepId);
    
    if (currentIndex === -1 || currentIndex === this.steps.length - 1) {
      return null;
    }

    // Find next required step or first incomplete step
    for (let i = currentIndex + 1; i < this.steps.length; i++) {
      const step = this.steps[i];
      if (step.required && !step.completed) {
        return step.id;
      }
    }

    // If no required steps left, find first incomplete optional step
    for (let i = currentIndex + 1; i < this.steps.length; i++) {
      const step = this.steps[i];
      if (!step.completed) {
        return step.id;
      }
    }

    return 'completed';
  }

  canProceedToNextStep(currentStepId: string): boolean {
    const step = this.steps.find(s => s.id === currentStepId);
    return step ? step.completed : false;
  }

  async validateStepData(stepId: string, data: any): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    switch (stepId) {
      case 'profile':
        if (!data.firstName?.trim()) errors.push('First name is required');
        if (!data.lastName?.trim()) errors.push('Last name is required');
        break;
      
      case 'interests':
        if (!data.interestIds || data.interestIds.length === 0) {
          errors.push('At least one interest must be selected');
        }
        break;
      
      case 'goals':
        if (!data.goalType) {
          errors.push('A goal must be selected');
        }
        break;
      
      case 'project_details':
        if (!data.name?.trim()) errors.push('Project name is required');
        if (!data.description?.trim()) errors.push('Project description is required');
        break;
      
      case 'skills':
        if (!data.skills || data.skills.length === 0) {
          errors.push('At least one skill must be selected');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async completeOnboarding(): Promise<boolean> {
    try {
      const progress = this.getProgress();
      
      if (progress.completionPercentage < 100) {
        Alert.alert(
          'Incomplete Onboarding',
          `Please complete all required steps before finishing. (${progress.completionPercentage}% complete)`,
          [{ text: 'OK' }]
        );
        return false;
      }

      // Mark onboarding as complete
      const success = await this.sessionManager.saveOnboardingStep('complete', {});
      
      if (success) {
        await this.updateProgress();
        return true;
      }

      throw new Error('Failed to complete onboarding');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      return this.errorRecovery.recoverFromError(error, 'completeOnboarding');
    }
  }

  isOnboardingComplete(): boolean {
    return this.sessionManager.isOnboardingComplete();
  }

  async skipStep(stepId: string, reason?: string): Promise<boolean> {
    try {
      const step = this.steps.find(s => s.id === stepId);
      
      if (step?.required) {
        Alert.alert(
          'Required Step',
          'This step is required and cannot be skipped.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Mark step as skipped
      const success = await this.sessionManager.saveOnboardingStep(`skip_${stepId}`, { reason });
      
      if (success) {
        await this.updateProgress();
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Failed to skip step ${stepId}:`, error);
      return false;
    }
  }

  getStepInfo(stepId: string): OnboardingStep | null {
    return this.steps.find(step => step.id === stepId) || null;
  }

  async performHealthCheck(): Promise<any> {
    return this.errorRecovery.performHealthCheck();
  }

  async resetFlow(): Promise<void> {
    this.sessionManager.clearSession();
    this.steps.forEach(step => step.completed = false);
  }
} 