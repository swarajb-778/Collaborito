/**
 * OnboardingManager - Central orchestrator for the complete onboarding system
 * 
 * This service acts as the main interface between UI components and the backend services.
 * It provides a clean, event-driven API that handles all onboarding operations including:
 * - User profile creation and management
 * - Interests selection and persistence
 * - Goals definition and tracking
 * - Project details management
 * - Skills management
 * - Progress tracking and state management
 * - Error handling and recovery
 * - Real-time data synchronization with Supabase
 */

import { EventEmitter } from 'events';
import { SessionManager } from './SessionManager';
import { OnboardingStepManager, ProfileData, InterestsData, GoalsData, ProjectDetailsData, SkillsData } from './OnboardingStepManager';
import { OnboardingFlowCoordinator } from './OnboardingFlowCoordinator';
import { OnboardingErrorRecovery } from './OnboardingErrorRecovery';
import { DataValidationService } from './DataValidationService';
import { SupabaseDatabaseService } from './SupabaseDatabaseService';
import { OnboardingAnalytics } from './OnboardingAnalytics';
import { supabase } from './supabase';
import { createLogger } from '../utils/logger';

const logger = createLogger('OnboardingManager');

// Event types for the onboarding system
export interface OnboardingEvents {
  'progress-updated': (progress: OnboardingProgress) => void;
  'step-completed': (step: string, data: any) => void;
  'flow-completed': () => void;
  'error-occurred': (error: OnboardingError) => void;
  'migration-started': () => void;
  'migration-completed': (success: boolean) => void;
  'data-synced': (stepId: string) => void;
  'offline-mode': (enabled: boolean) => void;
}

export interface OnboardingProgress {
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  percentageComplete: number;
  isComplete: boolean;
  canProceedToNext: boolean;
  nextStep?: string;
  userId?: string;
  userMigrated: boolean;
  isOnline: boolean;
}

export interface OnboardingError {
  type: 'validation' | 'network' | 'auth' | 'database' | 'migration' | 'unknown';
  message: string;
  step?: string;
  retryable: boolean;
  details?: any;
}

export interface OnboardingState {
  initialized: boolean;
  userMigrated: boolean;
  currentProgress: OnboardingProgress;
  offlineQueue: Array<{ stepId: string; data: any; timestamp: number }>;
  lastSyncTime?: number;
}

export class OnboardingManager extends EventEmitter {
  private static instance: OnboardingManager;
  
  // Core services
  private sessionManager: SessionManager;
  private stepManager: OnboardingStepManager;
  private flowCoordinator: OnboardingFlowCoordinator;
  private errorRecovery: OnboardingErrorRecovery;
  private dataValidation: DataValidationService;
  private databaseService: SupabaseDatabaseService;
  private analytics: OnboardingAnalytics;

  // State management
  private state: OnboardingState;
  private initialized: boolean = false;
  private isOnline: boolean = true;

  // Step definitions
  private readonly ONBOARDING_STEPS = [
    'profile',
    'interests', 
    'goals',
    'project_details',
    'skills'
  ];

  constructor() {
    super();
    
    // Initialize services through ServiceContainer to avoid circular dependencies
    const { getServiceContainer } = require('./ServiceContainer');
    const container = getServiceContainer();
    
    this.sessionManager = container.getSessionManager();
    this.stepManager = container.getStepManager();
    this.flowCoordinator = container.getFlowCoordinator();
    this.errorRecovery = container.getErrorRecovery();
    this.dataValidation = container.getDataValidation();
    this.databaseService = container.getDatabaseService();
    this.analytics = container.getAnalytics();

    // Initialize state
    this.state = {
      initialized: false,
      userMigrated: false,
      currentProgress: this.getDefaultProgress(),
      offlineQueue: [],
      lastSyncTime: undefined
    };

    // Set up event listeners
    this.setupEventListeners();
    
    logger.info('🎯 OnboardingManager initialized');
  }

  static getInstance(): OnboardingManager {
    if (!OnboardingManager.instance) {
      OnboardingManager.instance = new OnboardingManager();
    }
    return OnboardingManager.instance;
  }

  /**
   * Initialize the onboarding system
   */
  async initialize(): Promise<boolean> {
    try {
      logger.info('🚀 Initializing OnboardingManager...');

      // Initialize core services
      const initResults = await Promise.allSettled([
        this.sessionManager.initializeSession(),
        this.flowCoordinator.initializeFlow(),
        Promise.resolve(true), // databaseService.initialize() - mock for now
        Promise.resolve(true)  // analytics.initialize() - mock for now
      ]);

      // Check if all core services initialized successfully
      const failures = initResults.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        logger.warn('⚠️ Some services failed to initialize:', failures);
      }

      // At minimum, we need session and flow coordinator
      const sessionReady = initResults[0].status === 'fulfilled' && (initResults[0] as any).value;
      const flowReady = initResults[1].status === 'fulfilled' && (initResults[1] as any).value;

      if (!sessionReady || !flowReady) {
        throw new Error('Critical services failed to initialize');
      }

      // Check user migration status
      await this.checkUserMigrationStatus();

      // Load current progress
      await this.loadCurrentProgress();

      // Set up network monitoring
      this.setupNetworkMonitoring();

      this.initialized = true;
      this.state.initialized = true;

      logger.info('✅ OnboardingManager initialized successfully');
      this.emit('progress-updated', this.state.currentProgress);
      
      return true;

    } catch (error) {
      logger.error('❌ Failed to initialize OnboardingManager:', error);
      
      // Attempt error recovery
      const recovered = await this.errorRecovery.recoverFromError(error, 'initialization');
      if (recovered) {
        logger.info('🔄 Recovered from initialization error');
        return await this.initialize(); // Retry once
      }

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

      logger.info(`🎯 Executing step: ${stepId}`);

      // Validate input data - mock validation for now
      const validationResult = { isValid: true, errors: [] };
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Check if we're online - if not, queue for later
      if (!this.isOnline) {
        return await this.handleOfflineStep(stepId, data);
      }

      // Handle migration if needed during profile step
      if (stepId === 'profile' && this.flowCoordinator.needsMigration()) {
        const migrationResult = await this.handleUserMigration(data);
        if (!migrationResult.success) {
          throw new Error(migrationResult.error || 'Migration failed');
        }
      }

      // Execute the step through flow coordinator
      const result = await this.flowCoordinator.executeStep(stepId, data);

      if (result.success) {
        // Update progress
        await this.updateProgress(stepId);
        
        // Track analytics
        await this.analytics.trackStepComplete(stepId, data);

        // Emit events
        this.emit('step-completed', stepId, data);
        this.emit('data-synced', stepId);

        // Check if onboarding is complete
        if (await this.isOnboardingComplete()) {
          await this.handleOnboardingCompletion();
        }

        logger.info(`✅ Step ${stepId} completed successfully`);
        return result;
      } else {
        throw new Error(result.error || 'Step execution failed');
      }

    } catch (error) {
      logger.error(`❌ Error executing step ${stepId}:`, error);
      
      // Attempt error recovery
      const recovered = await this.errorRecovery.recoverFromError(error, `executeStep:${stepId}`);
      
      if (!recovered) {
        this.emitError({
          type: 'unknown',
          message: error instanceof Error ? error.message : 'Step execution failed',
          step: stepId,
          retryable: true,
          details: error
        });
      }

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Step execution failed' 
      };
    }
  }

  /**
   * Skip a specific step
   */
  async skipStep(stepId: string, reason?: string): Promise<{ success: boolean; nextStep?: string }> {
    try {
      logger.info(`⏭️ Skipping step: ${stepId}, reason: ${reason}`);

      const result = await this.flowCoordinator.skipStep(stepId, reason);
      
      if (result.success) {
        await this.updateProgress(stepId, true); // Mark as skipped
        await this.analytics.trackStepSkipped(stepId, reason);
        
        logger.info(`✅ Step ${stepId} skipped successfully`);
      }

      return result;

    } catch (error) {
      logger.error(`❌ Error skipping step ${stepId}:`, error);
      return { success: false };
    }
  }

  /**
   * Get current onboarding progress
   */
  getCurrentProgress(): OnboardingProgress {
    return { ...this.state.currentProgress };
  }

  /**
   * Get data for a specific step
   */
  async getStepData(stepId: string): Promise<any> {
    try {
      switch (stepId) {
        case 'profile':
          return await this.stepManager.getUserProfile();
        case 'interests':
          return await this.stepManager.getUserInterests();
        case 'goals':
          return await this.stepManager.getUserGoals();
        case 'project_details':
          return await this.stepManager.getUserProjects();
        case 'skills':
          return await this.stepManager.getUserSkills();
        default:
          throw new Error(`Unknown step: ${stepId}`);
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
          return await this.stepManager.getAvailableInterests();
        case 'skills':
          return await this.stepManager.getAvailableSkills();
        default:
          return [];
      }
    } catch (error) {
      logger.error(`Error getting options for step ${stepId}:`, error);
      return [];
    }
  }

  /**
   * Force sync offline data
   */
  async syncOfflineData(): Promise<boolean> {
    try {
      if (this.state.offlineQueue.length === 0) {
        logger.info('No offline data to sync');
        return true;
      }

      logger.info(`🔄 Syncing ${this.state.offlineQueue.length} offline items`);

      let successCount = 0;
      const queue = [...this.state.offlineQueue];

      for (const item of queue) {
        try {
          const result = await this.executeStep(item.stepId, item.data);
          if (result.success) {
            successCount++;
            // Remove from queue
            this.state.offlineQueue = this.state.offlineQueue.filter(
              queueItem => queueItem.timestamp !== item.timestamp
            );
          }
        } catch (error) {
          logger.error('Error syncing offline item:', error);
        }
      }

      logger.info(`✅ Synced ${successCount}/${queue.length} offline items`);
      
      if (successCount > 0) {
        this.state.lastSyncTime = Date.now();
        this.emit('data-synced', 'offline-sync');
      }

      return successCount === queue.length;

    } catch (error) {
      logger.error('Error syncing offline data:', error);
      return false;
    }
  }

  /**
   * Reset onboarding progress (for testing)
   */
  async resetOnboarding(): Promise<boolean> {
    try {
      logger.info('🔄 Resetting onboarding progress');

      // Clear local state
      this.state.currentProgress = this.getDefaultProgress();
      this.state.offlineQueue = [];
      this.state.lastSyncTime = undefined;

      // Reset in session manager
      await this.sessionManager.resetOnboardingState();

      // Reset in flow coordinator
      this.flowCoordinator.resetFlow();

      this.emit('progress-updated', this.state.currentProgress);
      
      logger.info('✅ Onboarding reset complete');
      return true;

    } catch (error) {
      logger.error('Error resetting onboarding:', error);
      return false;
    }
  }

  /**
   * Check if user is online
   */
  isUserOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get offline queue size
   */
  getOfflineQueueSize(): number {
    return this.state.offlineQueue.length;
  }

  // Private methods

  private setupEventListeners(): void {
    // Listen to network changes
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.emit('offline-mode', false);
        this.syncOfflineData(); // Auto-sync when back online
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.emit('offline-mode', true);
      });
    }
  }

  private setupNetworkMonitoring(): void {
    // Monitor Supabase connection
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        logger.info('🔐 User signed in to Supabase');
        this.state.userMigrated = true;
      } else if (event === 'SIGNED_OUT') {
        logger.info('🚪 User signed out from Supabase');
      }
    });
  }

  private async checkUserMigrationStatus(): Promise<void> {
    try {
      const session = await this.sessionManager.getSession();
      this.state.userMigrated = session && !session.isLocal;
      
      logger.info(`👤 User migration status: ${this.state.userMigrated ? 'migrated' : 'local'}`);
    } catch (error) {
      logger.warn('Could not determine user migration status:', error);
      this.state.userMigrated = false;
    }
  }

  private async loadCurrentProgress(): Promise<void> {
    try {
      const state = this.sessionManager.getOnboardingState();
      
      if (state) {
        this.state.currentProgress = {
          ...this.getDefaultProgress(),
          currentStep: state.currentStep || 'profile',
          completedSteps: state.completedSteps || [],
          isComplete: state.isComplete || false,
          userId: state.userId
        };

        // Calculate percentage
        this.state.currentProgress.percentageComplete = Math.floor(
          (this.state.currentProgress.completedSteps.length / this.ONBOARDING_STEPS.length) * 100
        );
      }

      // Update online status
      this.state.currentProgress.isOnline = this.isOnline;
      this.state.currentProgress.userMigrated = this.state.userMigrated;

      logger.info('📊 Current progress loaded:', this.state.currentProgress);

    } catch (error) {
      logger.error('Error loading current progress:', error);
      this.state.currentProgress = this.getDefaultProgress();
    }
  }

  private async updateProgress(completedStep: string, skipped: boolean = false): Promise<void> {
    try {
      // Update completed steps
      if (!this.state.currentProgress.completedSteps.includes(completedStep)) {
        this.state.currentProgress.completedSteps.push(completedStep);
      }

      // Calculate next step
      const currentIndex = this.ONBOARDING_STEPS.indexOf(completedStep);
      if (currentIndex < this.ONBOARDING_STEPS.length - 1) {
        this.state.currentProgress.currentStep = this.ONBOARDING_STEPS[currentIndex + 1];
        this.state.currentProgress.nextStep = this.ONBOARDING_STEPS[currentIndex + 1];
        this.state.currentProgress.canProceedToNext = true;
      } else {
        this.state.currentProgress.isComplete = true;
        this.state.currentProgress.canProceedToNext = false;
      }

      // Update percentage
      this.state.currentProgress.percentageComplete = Math.floor(
        (this.state.currentProgress.completedSteps.length / this.ONBOARDING_STEPS.length) * 100
      );

      // Update online status
      this.state.currentProgress.isOnline = this.isOnline;
      this.state.currentProgress.userMigrated = this.state.userMigrated;

      // Save to session
      await this.sessionManager.updateOnboardingState({
        currentStep: this.state.currentProgress.currentStep,
        completedSteps: this.state.currentProgress.completedSteps,
        isComplete: this.state.currentProgress.isComplete,
        userId: this.state.currentProgress.userId
      });

      // Emit progress update
      this.emit('progress-updated', this.state.currentProgress);

      logger.info('📊 Progress updated:', this.state.currentProgress);

    } catch (error) {
      logger.error('Error updating progress:', error);
    }
  }

  private async handleUserMigration(profileData: ProfileData): Promise<{ success: boolean; error?: string }> {
    try {
      this.emit('migration-started');
      
      const migrationData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: await this.getUserEmail(),
        password: this.generateTempPassword()
      };

      const result = await this.flowCoordinator.handleUserMigration(migrationData);
      
      this.emit('migration-completed', result.success);
      
      if (result.success) {
        this.state.userMigrated = true;
        this.state.currentProgress.userMigrated = true;
      }

      return result;

    } catch (error) {
      logger.error('Error handling user migration:', error);
      this.emit('migration-completed', false);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Migration failed' 
      };
    }
  }

  private async handleOfflineStep(stepId: string, data: any): Promise<{ success: boolean; nextStep?: string; error?: string }> {
    try {
      // Add to offline queue
      this.state.offlineQueue.push({
        stepId,
        data,
        timestamp: Date.now()
      });

      logger.info(`📤 Queued step ${stepId} for offline sync`);
      
      return { 
        success: true, 
        nextStep: this.getNextStepId(stepId)
      };

    } catch (error) {
      logger.error('Error handling offline step:', error);
      return { 
        success: false, 
        error: 'Failed to queue step for offline sync' 
      };
    }
  }

  private async isOnboardingComplete(): Promise<boolean> {
    return this.state.currentProgress.completedSteps.length >= this.ONBOARDING_STEPS.length;
  }

  private async handleOnboardingCompletion(): Promise<void> {
    try {
      logger.info('🎉 Onboarding completed!');
      
      this.state.currentProgress.isComplete = true;
      await this.analytics.trackOnboardingCompletion();
      
      this.emit('flow-completed');

    } catch (error) {
      logger.error('Error handling onboarding completion:', error);
    }
  }

  private getDefaultProgress(): OnboardingProgress {
    return {
      currentStep: 'profile',
      completedSteps: [],
      totalSteps: this.ONBOARDING_STEPS.length,
      percentageComplete: 0,
      isComplete: false,
      canProceedToNext: true,
      userMigrated: false,
      isOnline: true
    };
  }

  private getNextStepId(currentStepId: string): string | undefined {
    const currentIndex = this.ONBOARDING_STEPS.indexOf(currentStepId);
    if (currentIndex < this.ONBOARDING_STEPS.length - 1) {
      return this.ONBOARDING_STEPS[currentIndex + 1];
    }
    return undefined;
  }

  private emitError(error: OnboardingError): void {
    logger.error('Emitting error:', error);
    this.emit('error-occurred', error);
  }

  private async getUserEmail(): Promise<string> {
    try {
      const session = await this.sessionManager.getSession();
      return session?.user?.email || 'temp@collaborito.app';
    } catch (error) {
      return 'temp@collaborito.app';
    }
  }

  private generateTempPassword(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Cleanup
  destroy(): void {
    this.removeAllListeners();
    this.initialized = false;
    this.state.initialized = false;
    logger.info('🗑️ OnboardingManager destroyed');
  }
}

// Export singleton instance
export const getOnboardingManager = (): OnboardingManager => {
  return OnboardingManager.getInstance();
};

export default OnboardingManager; 