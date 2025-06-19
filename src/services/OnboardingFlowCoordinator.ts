import { SessionManager } from './SessionManager';
import { supabase } from './supabase';
import { createLogger } from '../utils/logger';

const logger = createLogger('OnboardingFlowCoordinator');

export interface OnboardingStep {
  id: string;
  name: string;
  route: string;
  required: boolean;
  completed: boolean;
  dependencies?: string[];
}

export interface FlowValidation {
  valid: boolean;
  errors: string[];
  nextStep?: string;
}

export class OnboardingFlowCoordinator {
  private static instance: OnboardingFlowCoordinator;
  private sessionManager = SessionManager.getInstance();
  private flowInitialized = false;
  
  // Define the onboarding steps flow
  private readonly steps: OnboardingStep[] = [
    {
      id: 'profile',
      name: 'Profile Setup',
      route: '/onboarding',
      required: true,
      completed: false
    },
    {
      id: 'interests',
      name: 'Interests Selection',
      route: '/onboarding/interests',
      required: true,
      completed: false,
      dependencies: ['profile']
    },
    {
      id: 'goals',
      name: 'Goals Selection',
      route: '/onboarding/goals',
      required: true,
      completed: false,
      dependencies: ['interests']
    },
    {
      id: 'project_details',
      name: 'Project Details',
      route: '/onboarding/project-detail',
      required: false, // Conditional based on goals
      completed: false,
      dependencies: ['goals']
    },
    {
      id: 'skills',
      name: 'Skills Selection',
      route: '/onboarding/project-skills',
      required: true,
      completed: false,
      dependencies: ['goals'] // Can skip project_details
    }
  ];

  static getInstance(): OnboardingFlowCoordinator {
    if (!OnboardingFlowCoordinator.instance) {
      OnboardingFlowCoordinator.instance = new OnboardingFlowCoordinator();
    }
    return OnboardingFlowCoordinator.instance;
  }

  /**
   * Initialize the onboarding flow
   */
  async initializeFlow(): Promise<boolean> {
    try {
      logger.info('Initializing onboarding flow...');
      
      // Verify session is valid
      const session = await this.sessionManager.getSession();
      if (!session) {
        logger.error('No valid session for flow initialization');
        return false;
      }

      // Update step completion status from user profile
      await this.refreshStepStatus();
      
      this.flowInitialized = true;
      logger.info('✅ Onboarding flow initialized successfully');
      return true;

    } catch (error) {
      logger.error('Failed to initialize onboarding flow:', error);
      return false;
    }
  }

  /**
   * Refresh step completion status from database
   */
  async refreshStepStatus(): Promise<void> {
    try {
      const session = await this.sessionManager.getSession();
      if (!session?.user?.id) return;

      // Get user profile to check current onboarding status
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarding_step, onboarding_completed, first_name, last_name')
        .eq('id', session.user.id)
        .single();

      if (error) {
        logger.warn('Failed to fetch user profile:', error);
        return;
      }

      // Update step completion based on profile data
      const currentStep = profile?.onboarding_step || 'profile';
      
      // Mark steps as completed based on current step
      this.steps.forEach(step => {
        if (step.id === 'profile') {
          step.completed = !!(profile?.first_name && profile?.last_name);
        } else if (step.id === currentStep) {
          step.completed = false; // Current step is not yet completed
        } else {
          // Check if this step comes before current step in flow
          step.completed = this.isStepBefore(step.id, currentStep);
        }
      });

      // Check for conditional requirements
      await this.updateConditionalRequirements(session.user.id);

    } catch (error) {
      logger.error('Failed to refresh step status:', error);
    }
  }

  /**
   * Check if stepA comes before stepB in the flow
   */
  private isStepBefore(stepA: string, stepB: string): boolean {
    const stepOrder = ['profile', 'interests', 'goals', 'project_details', 'skills'];
    const indexA = stepOrder.indexOf(stepA);
    const indexB = stepOrder.indexOf(stepB);
    return indexA !== -1 && indexB !== -1 && indexA < indexB;
  }

  /**
   * Update conditional requirements based on user goals
   */
  private async updateConditionalRequirements(userId: string): Promise<void> {
    try {
      // Check if user has goals that require project details
      const { data: userGoals } = await supabase
        .from('user_goals')
        .select('goal_type')
        .eq('user_id', userId)
        .eq('is_active', true);

      const needsProjectDetails = userGoals?.some(
        goal => goal.goal_type === 'find_cofounder' || goal.goal_type === 'find_collaborators'
      );

      // Update project_details step requirement
      const projectDetailsStep = this.steps.find(step => step.id === 'project_details');
      if (projectDetailsStep) {
        projectDetailsStep.required = needsProjectDetails || false;
      }

    } catch (error) {
      logger.warn('Failed to update conditional requirements:', error);
    }
  }

  /**
   * Get the next step in the onboarding flow
   */
  async getNextStep(currentStepId: string): Promise<string | null> {
    try {
      await this.refreshStepStatus();
      
      const currentIndex = this.steps.findIndex(step => step.id === currentStepId);
      if (currentIndex === -1) {
        logger.warn(`Unknown step: ${currentStepId}`);
        return null;
      }

      // Find next required step that's not completed
      for (let i = currentIndex + 1; i < this.steps.length; i++) {
        const step = this.steps[i];
        if (step.required && !step.completed) {
          // Check dependencies are met
          if (await this.areDependenciesMet(step)) {
            return step.id;
          }
        }
      }

      // If all steps are completed
      return 'completed';

    } catch (error) {
      logger.error('Failed to get next step:', error);
      return null;
    }
  }

  /**
   * Check if step dependencies are met
   */
  private async areDependenciesMet(step: OnboardingStep): Promise<boolean> {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true;
    }

    // Check all dependencies are completed
    for (const depId of step.dependencies) {
      const depStep = this.steps.find(s => s.id === depId);
      if (!depStep || !depStep.completed) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get route for next step
   */
  async getNextStepRoute(currentStepId: string): Promise<string | null> {
    const nextStepId = await this.getNextStep(currentStepId);
    if (!nextStepId || nextStepId === 'completed') {
      return '/(tabs)'; // Navigate to main app
    }

    const nextStep = this.steps.find(step => step.id === nextStepId);
    return nextStep?.route || null;
  }

  /**
   * Check if user can proceed to next step
   */
  async canProceedToNextStep(currentStepId: string): Promise<boolean> {
    try {
      const nextStep = await this.getNextStep(currentStepId);
      return nextStep !== null;
    } catch (error) {
      logger.error('Failed to check if can proceed:', error);
      return false;
    }
  }

  /**
   * Get current onboarding progress (0-1)
   */
  getProgress(): number {
    const totalRequiredSteps = this.steps.filter(step => step.required).length;
    const completedRequiredSteps = this.steps.filter(step => step.required && step.completed).length;
    
    return totalRequiredSteps > 0 ? completedRequiredSteps / totalRequiredSteps : 0;
  }

  /**
   * Get all onboarding steps with status
   */
  getSteps(): OnboardingStep[] {
    return [...this.steps];
  }

  /**
   * Update progress after step completion
   */
  async updateProgress(): Promise<void> {
    try {
      await this.refreshStepStatus();
      logger.info(`Onboarding progress: ${Math.round(this.getProgress() * 100)}%`);
    } catch (error) {
      logger.error('Failed to update progress:', error);
    }
  }

  /**
   * Mark step as completed
   */
  markStepCompleted(stepId: string): void {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      step.completed = true;
      logger.info(`✅ Step '${stepId}' marked as completed`);
    }
  }

  /**
   * Check if onboarding flow is initialized
   */
  isInitialized(): boolean {
    return this.flowInitialized;
  }

  /**
   * Reset the flow coordinator (for testing/development)
   */
  reset(): void {
    this.flowInitialized = false;
    this.steps.forEach(step => {
      step.completed = false;
      if (step.id === 'project_details') {
        step.required = false;
      }
    });
    logger.info('🔄 Flow coordinator reset');
  }
} 