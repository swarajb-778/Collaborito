/**
 * ServiceContainer - Dependency injection container for onboarding services
 */

import { createLogger } from '../utils/logger';

const logger = createLogger('ServiceContainer');

interface ServiceInstances {
  sessionManager?: any;
  stepManager?: any;
  flowCoordinator?: any;
  errorRecovery?: any;
  dataValidation?: any;
  databaseService?: any;
  analytics?: any;
  onboardingManager?: any;
}

interface ServiceConfig {
  enableAnalytics: boolean;
  enableOfflineMode: boolean;
  enableErrorRecovery: boolean;
  retryAttempts: number;
  timeout: number;
}

export class ServiceContainer {
  private static instance: ServiceContainer;
  private services: ServiceInstances = {};
  private initialized: boolean = false;
  private config: ServiceConfig;

  constructor(config: Partial<ServiceConfig> = {}) {
    this.config = {
      enableAnalytics: true,
      enableOfflineMode: true,
      enableErrorRecovery: true,
      retryAttempts: 3,
      timeout: 10000,
      ...config
    };
    logger.info('🏗️ ServiceContainer created');
  }

  static getInstance(config?: Partial<ServiceConfig>): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer(config);
    }
    return ServiceContainer.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }
    
    try {
      logger.info('🚀 Initializing ServiceContainer...');
      this.initialized = true;
      return true;
    } catch (error) {
      logger.error('❌ Failed to initialize ServiceContainer:', error);
      return false;
    }
  }

  getSessionManager(): any {
    if (!this.services.sessionManager) {
      const { SessionManager } = require('./SessionManager');
      this.services.sessionManager = SessionManager.getInstance();
    }
    return this.services.sessionManager;
  }

  getStepManager(): any {
    if (!this.services.stepManager) {
      const { OnboardingStepManager } = require('./OnboardingStepManager');
      this.services.stepManager = OnboardingStepManager.getInstance();
    }
    return this.services.stepManager;
  }

  getFlowCoordinator(): any {
    if (!this.services.flowCoordinator) {
      const { OnboardingFlowCoordinator } = require('./OnboardingFlowCoordinator');
      this.services.flowCoordinator = OnboardingFlowCoordinator.getInstance();
    }
    return this.services.flowCoordinator;
  }

  getErrorRecovery(): any {
    if (!this.services.errorRecovery) {
      const { OnboardingErrorRecovery } = require('./OnboardingErrorRecovery');
      this.services.errorRecovery = new OnboardingErrorRecovery();
    }
    return this.services.errorRecovery;
  }

  getDataValidation(): any {
    if (!this.services.dataValidation) {
      const { DataValidationService } = require('./DataValidationService');
      this.services.dataValidation = new DataValidationService();
    }
    return this.services.dataValidation;
  }

  getDatabaseService(): any {
    if (!this.services.databaseService) {
      const { SupabaseDatabaseService } = require('./SupabaseDatabaseService');
      this.services.databaseService = new SupabaseDatabaseService();
    }
    return this.services.databaseService;
  }

  getAnalytics(): any {
    if (!this.config.enableAnalytics) {
      return this.createMockAnalytics();
    }
    if (!this.services.analytics) {
      const { OnboardingAnalytics } = require('./OnboardingAnalytics');
      this.services.analytics = OnboardingAnalytics.getInstance();
    }
    return this.services.analytics;
  }

  getOnboardingManager(): any {
    if (!this.services.onboardingManager) {
      const { OnboardingManager } = require('./OnboardingManager');
      this.services.onboardingManager = OnboardingManager.getInstance();
    }
    return this.services.onboardingManager;
  }

  private createMockAnalytics(): any {
    return {
      trackStepStart: async () => {},
      trackStepComplete: async () => {},
      trackStepSkip: async () => {},
      trackError: async () => {},
      trackOnboardingCompletion: async () => {},
      initialize: async () => true,
      getRealtimeDashboard: () => ({
        currentStep: null,
        errors: [],
        metrics: {}
      })
    };
  }
}

export const getServiceContainer = (): ServiceContainer => ServiceContainer.getInstance();
export default ServiceContainer;
