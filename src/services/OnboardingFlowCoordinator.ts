import { SessionManager } from './SessionManager';
import { OnboardingStepManager } from './OnboardingStepManager';
import { OnboardingErrorRecovery } from './OnboardingErrorRecovery';
import { createLogger } from '../utils/logger';

const logger = createLogger('OnboardingFlowCoordinator');

interface FlowState {
  initialized: boolean;
  currentStep: string;
  userMigrated: boolean;
  canProceed: boolean;
  requiresMigration: boolean;
}

export class OnboardingFlowCoordinator {
  private static instance: OnboardingFlowCoordinator;
  private sessionManager: SessionManager;
  private stepManager: OnboardingStepManager;
  private errorRecovery: OnboardingErrorRecovery;
  private flowState: FlowState;

  constructor() {
    this.sessionManager = SessionManager.getInstance();
    this.stepManager = OnboardingStepManager.getInstance();
    this.errorRecovery = new OnboardingErrorRecovery();
    this.flowState = {
      initialized: false,
      currentStep: 'profile',
      userMigrated: false,
      canProceed: false,
      requiresMigration: false
    };
  }

  static getInstance(): OnboardingFlowCoordinator {
    if (!OnboardingFlowCoordinator.instance) {
      OnboardingFlowCoordinator.instance = new OnboardingFlowCoordinator();
    }
    return OnboardingFlowCoordinator.instance;
  }

  /**
   * Initialize onboarding flow - handles both local and migrated users
   */
  async initializeFlow(): Promise<boolean> {
    try {
      logger.info('🚀 Initializing onboarding flow...');

      // Initialize session first
      const sessionReady = await this.sessionManager.initializeSession();
      if (!sessionReady) {
        logger.error('❌ Session initialization failed');
        return false;
      }

      const session = await this.sessionManager.getSession();
      if (!session || !session.user) {
        logger.error('❌ No valid session after initialization');
        return false;
      }

      // Check if this is a local user that needs migration
      if (session.isLocal && session.needsMigration) {
        logger.info('📱 Local user detected - onboarding will handle migration');
        this.flowState.requiresMigration = true;
        this.flowState.userMigrated = false;
      } else {
        logger.info('✅ Migrated user detected - using Supabase backend');
        this.flowState.requiresMigration = false;
        this.flowState.userMigrated = true;
      }

      // Initialize onboarding state
      await this.initializeOnboardingState();

      this.flowState.initialized = true;
      this.flowState.canProceed = true;

      logger.info('✅ Onboarding flow initialized successfully');
      logger.info('📊 Flow state:', this.flowState);

      return true;

    } catch (error) {
      logger.error('❌ Failed to initialize onboarding flow:', error);
      this.flowState.initialized = false;
      this.flowState.canProceed = false;
      return false;
    }
  }

  /**
   * Initialize onboarding state based on user type
   */
  private async initializeOnboardingState(): Promise<void> {
    try {
      const session = await this.sessionManager.getSession();
      
      if (session.isLocal) {
        // For local users, ensure local onboarding state is ready
        const state = this.sessionManager.getOnboardingState();
        if (state) {
          this.flowState.currentStep = state.currentStep || 'profile';
          logger.info(`📍 Local user current step: ${this.flowState.currentStep}`);
        }
      } else {
        // For migrated users, refresh state from Supabase
        await this.sessionManager.refreshOnboardingState();
        const state = this.sessionManager.getOnboardingState();
        if (state) {
          this.flowState.currentStep = state.currentStep || 'profile';
          logger.info(`📍 Migrated user current step: ${this.flowState.currentStep}`);
        }
      }
    } catch (error) {
      logger.error('Failed to initialize onboarding state:', error);
      // Default to profile step
      this.flowState.currentStep = 'profile';
    }
  }

  /**
   * Handle user migration during profile step
   */
  async handleUserMigration(profileData: { firstName: string; lastName: string; email: string; password?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('🔄 Starting user migration process...');

      if (!this.flowState.requiresMigration) {
        logger.info('ℹ️ User migration not required');
        return { success: true };
      }

      const migrationResult = await this.sessionManager.migrateUserToSupabase(profileData);
      
      if (migrationResult.success) {
        logger.info('✅ User migration completed successfully');
        this.flowState.userMigrated = true;
        this.flowState.requiresMigration = false;
        
        // Refresh onboarding state after migration
        await this.sessionManager.refreshOnboardingState();
        
        return { success: true };
      } else {
        logger.error('❌ User migration failed');
        return { 
          success: false, 
          error: 'Failed to create your account. Please check your internet connection and try again.' 
        };
      }

    } catch (error) {
      logger.error('❌ Error during user migration:', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred. Please try again.' 
      };
    }
  }

  /**
   * Check if user needs migration
   */
  needsMigration(): boolean {
    return this.flowState.requiresMigration && !this.flowState.userMigrated;
  }

  /**
   * Check if flow is ready to proceed
   */
  canProceed(): boolean {
    return this.flowState.canProceed && this.flowState.initialized;
  }

  /**
   * Get current flow state
   */
  getFlowState(): FlowState {
    return { ...this.flowState };
  }

  /**
   * Get current step
   */
  getCurrentStep(): string {
    return this.flowState.currentStep;
  }

  /**
   * Check if onboarding is complete
   */
  async isOnboardingComplete(): Promise<boolean> {
    try {
      if (this.flowState.userMigrated) {
        // For migrated users, check Supabase
        await this.sessionManager.refreshOnboardingState();
      }
      
      return this.sessionManager.isOnboardingComplete();
    } catch (error) {
      logger.error('Error checking onboarding completion:', error);
      return false;
    }
  }

  /**
   * Execute a step in the onboarding process
   */
  async executeStep(stepId: string, data: any): Promise<{ success: boolean; nextStep?: string; error?: string }> {
    try {
      logger.info(`🎯 Executing step: ${stepId}`);

      if (!this.flowState.initialized) {
        throw new Error('Flow not initialized');
      }

      // Special handling for profile step (triggers migration)
      if (stepId === 'profile' && this.needsMigration()) {
        logger.info('🔄 Profile step detected - handling user migration');
        
        const migrationResult = await this.handleUserMigration({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password
        });

        if (!migrationResult.success) {
          return {
            success: false,
            error: migrationResult.error
          };
        }
      }

      // Execute the step using the step manager
      let success: boolean;
      
      switch (stepId) {
        case 'profile':
          success = await this.stepManager.saveProfileStep(data);
          break;
        case 'interests':
          success = await this.stepManager.saveInterestsStep(data);
          break;
        case 'goals':
          success = await this.stepManager.saveGoalsStep(data);
          break;
        case 'project_details':
          success = await this.stepManager.saveProjectDetailsStep(data);
          break;
        case 'skills':
          success = await this.stepManager.saveSkillsStep(data);
          break;
        default:
          throw new Error(`Unknown step: ${stepId}`);
      }

      if (!success) {
        throw new Error(`Failed to save ${stepId} step`);
      }

      // Update flow state
      this.flowState.currentStep = await this.getNextStep(stepId);
      
      // Save step completion to session manager
      await this.sessionManager.saveOnboardingStep(stepId, data);

      logger.info(`✅ Step ${stepId} completed successfully`);
      
      return {
        success: true,
        nextStep: this.flowState.currentStep
      };

    } catch (error) {
      logger.error(`❌ Error executing step ${stepId}:`, error);
      
      // Use error recovery
      const recovered = await this.errorRecovery.recoverFromError(error, `executeStep_${stepId}`);
      
      return {
        success: false,
        error: recovered ? 'Step saved locally - will sync when connection is restored' : (error instanceof Error ? error.message : 'An unknown error occurred')
      };
    }
  }

  /**
   * Get next step in the flow
   */
  private async getNextStep(currentStep: string): Promise<string> {
    const stepOrder = ['profile', 'interests', 'goals', 'project_details', 'skills'];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex >= 0 && currentIndex < stepOrder.length - 1) {
      let nextStep = stepOrder[currentIndex + 1];
      
      // Check for conditional steps
      if (nextStep === 'project_details') {
        // Only show project details if user selected cofounder/collaborator goals
        const goalsData = await this.getStepData('goals');
        if (goalsData && goalsData.goals) {
          const needsProject = goalsData.goals.some((goal: string) => 
            goal.includes('cofounder') || goal.includes('collaborator')
          );
          if (!needsProject) {
            // Skip project details step
            nextStep = 'skills';
          }
        }
      }
      
      return nextStep;
    }
    
    return 'completed';
  }

  /**
   * Get step data
   */
  private async getStepData(stepId: string): Promise<any> {
    try {
      const state = this.sessionManager.getOnboardingState();
      return state?.steps[stepId]?.data || null;
    } catch (error) {
      logger.error(`Error getting step data for ${stepId}:`, error);
      return null;
    }
  }

  /**
   * Skip a step
   */
  async skipStep(stepId: string, reason?: string): Promise<{ success: boolean; nextStep?: string }> {
    try {
      logger.info(`⏭️ Skipping step: ${stepId}, reason: ${reason || 'User choice'}`);

      // Save skip action
      await this.sessionManager.saveOnboardingStep(stepId, { 
        skipped: true, 
        reason: reason || 'User choice',
        skipped_at: new Date().toISOString()
      });

      // Update flow state to next step
      this.flowState.currentStep = await this.getNextStep(stepId);

      return {
        success: true,
        nextStep: this.flowState.currentStep
      };

    } catch (error) {
      logger.error(`Error skipping step ${stepId}:`, error);
      return { success: false };
    }
  }

  /**
   * Get step route path
   */
  async getStepRoute(stepId: string): Promise<string | null> {
    const routes: { [key: string]: string } = {
      'profile': '/onboarding',
      'interests': '/onboarding/interests',
      'goals': '/onboarding/goals',
      'project_details': '/onboarding/project-detail',
      'skills': '/onboarding/project-skills',
      'completed': '/(tabs)'
    };

    return routes[stepId] || null;
  }

  /**
   * Reset flow state
   */
  resetFlow(): void {
    this.flowState = {
      initialized: false,
      currentStep: 'profile',
      userMigrated: false,
      canProceed: false,
      requiresMigration: false
    };
    logger.info('🔄 Flow state reset');
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    const state = this.sessionManager.getOnboardingState();
    return state?.progress || 0;
  }
} 