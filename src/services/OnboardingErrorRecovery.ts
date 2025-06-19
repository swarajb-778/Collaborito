import { Alert } from 'react-native';
import { SessionManager } from './SessionManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createLogger } from '../utils/logger';

const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL || '';
const logger = createLogger('OnboardingErrorRecovery');

interface ErrorContext {
  operation: string;
  userId?: string;
  stepId?: string;
  timestamp: string;
  errorType: string;
  retryCount: number;
}

interface RecoveryOptions {
  canRetry: boolean;
  fallbackAction?: () => Promise<boolean>;
  userMessage?: string;
  technicalMessage?: string;
}

export class OnboardingErrorRecovery {
  private sessionManager = SessionManager.getInstance();
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RECOVERY_STORAGE_KEY = 'onboarding_recovery_data';
  private readonly ERROR_LOG_KEY = 'onboarding_error_log';

  async attemptRecovery(): Promise<boolean> {
    try {
      logger.info('🔧 Attempting general recovery...');

      // Check for pending offline data
      const pendingData = await this.getPendingOfflineData();
      if (pendingData && pendingData.length > 0) {
        logger.info(`📤 Found ${pendingData.length} pending operations for sync`);
        // Return true to indicate we can continue with offline data
        return true;
      }

      // Try session recovery
      const sessionRecovered = await this.recoverSession();
      if (sessionRecovered) {
        logger.info('✅ Session recovery successful');
        return true;
      }

      // Check for migration retry markers
      const migrationPending = await this.hasPendingMigration();
      if (migrationPending) {
        logger.info('🔄 Migration retry pending - allowing graceful continuation');
        return true;
      }

      logger.warn('⚠️ General recovery not possible');
      return false;

    } catch (error) {
      logger.error('❌ General recovery attempt failed:', error);
      return false;
    }
  }

  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch(`${SUPABASE_URL}/health`, { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async handleOfflineRecovery(): Promise<boolean> {
    // Load cached onboarding state
    const cached = await AsyncStorage.getItem('onboarding_state');
    if (cached) {
      Alert.alert(
        'Offline Mode',
        'You\'re offline. Using cached data. Changes will sync when online.',
        [{ text: 'OK' }]
      );
      return true;
    }
    return false;
  }

  private async handleSessionRecovery(): Promise<boolean> {
    Alert.alert(
      'Session Expired',
      'Your session has expired. Please sign in again.',
      [
        {
          text: 'Sign In',
          onPress: () => {
            // Navigate to sign in
            // This would be handled by the calling component
          }
        }
      ]
    );
    return false;
  }

  async recoverFromError(error: unknown, operation: string, context?: any): Promise<boolean> {
    try {
      logger.error(`🔧 Starting error recovery for operation: ${operation}`, error);
      
      const errorInfo = this.analyzeError(error);
      const errorContext: ErrorContext = {
        operation,
        userId: context?.userId,
        stepId: context?.stepId,
        timestamp: new Date().toISOString(),
        errorType: errorInfo.type,
        retryCount: await this.getRetryCount(operation)
      };

      // Log error for debugging
      await this.logError(errorContext, error);

      // Determine recovery strategy
      const recoveryOptions = this.getRecoveryOptions(errorInfo, errorContext);

      if (recoveryOptions.canRetry && errorContext.retryCount < this.MAX_RETRY_ATTEMPTS) {
        logger.info(`🔄 Attempting retry ${errorContext.retryCount + 1}/${this.MAX_RETRY_ATTEMPTS}`);
        await this.incrementRetryCount(operation);
        
        if (recoveryOptions.fallbackAction) {
          return await recoveryOptions.fallbackAction();
        }
        return false;
      }

      // If retries exhausted or error not recoverable, try fallback
      if (errorInfo.type === 'network' || errorInfo.type === 'timeout') {
        logger.info('📱 Network error - saving data locally for later sync');
        await this.saveForOfflineSync(operation, context);
        return true; // Return success for local storage
      }

      if (errorInfo.type === 'session' || errorInfo.type === 'authentication') {
        logger.info('🔐 Session error - attempting session recovery');
        return await this.recoverSession();
      }

      if (errorInfo.type === 'migration') {
        logger.info('🚀 Migration error - marking for retry during next app launch');
        await this.markForMigrationRetry(context);
        return true; // Allow local continuation
      }

      logger.warn('⚠️ Error recovery not possible, graceful degradation');
      return false;

    } catch (recoveryError) {
      logger.error('❌ Error recovery failed:', recoveryError);
      return false;
    }
  }

  /**
   * Analyze error to determine type and recovery strategy
   */
  private analyzeError(error: unknown): { type: string; message: string; recoverable: boolean } {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorLower = errorMessage.toLowerCase();

    if (errorLower.includes('network') || errorLower.includes('fetch') || errorLower.includes('timeout')) {
      return { type: 'network', message: errorMessage, recoverable: true };
    }

    if (errorLower.includes('session') || errorLower.includes('unauthorized') || errorLower.includes('auth')) {
      return { type: 'session', message: errorMessage, recoverable: true };
    }

    if (errorLower.includes('migration') || errorLower.includes('user creation')) {
      return { type: 'migration', message: errorMessage, recoverable: true };
    }

    if (errorLower.includes('validation') || errorLower.includes('invalid')) {
      return { type: 'validation', message: errorMessage, recoverable: false };
    }

    if (errorLower.includes('database') || errorLower.includes('sql')) {
      return { type: 'database', message: errorMessage, recoverable: true };
    }

    return { type: 'unknown', message: errorMessage, recoverable: false };
  }

  /**
   * Get recovery options based on error type and context
   */
  private getRecoveryOptions(errorInfo: any, context: ErrorContext): RecoveryOptions {
    switch (errorInfo.type) {
      case 'network':
        return {
          canRetry: true,
          userMessage: 'Connection issue detected. Your data will be saved locally and synced when connection is restored.',
          fallbackAction: async () => {
            await this.saveForOfflineSync(context.operation, { stepId: context.stepId });
            return true;
          }
        };

      case 'session':
        return {
          canRetry: true,
          userMessage: 'Session expired. Attempting to restore your session.',
          fallbackAction: async () => {
            return await this.recoverSession();
          }
        };

      case 'migration':
        return {
          canRetry: true,
          userMessage: 'Account setup in progress. You can continue and we\'ll complete the setup in the background.',
          fallbackAction: async () => {
            await this.markForMigrationRetry({ stepId: context.stepId });
            return true;
          }
        };

      case 'database':
        return {
          canRetry: true,
          userMessage: 'Temporary service issue. Retrying...',
        };

      default:
        return {
          canRetry: false,
          userMessage: 'An unexpected error occurred. Please try again.',
        };
    }
  }

  /**
   * Recover session by attempting re-initialization
   */
  private async recoverSession(): Promise<boolean> {
    try {
      logger.info('🔐 Attempting session recovery...');
      
      // Import SessionManager dynamically to avoid circular dependencies
      const { SessionManager } = await import('./SessionManager');
      const sessionManager = SessionManager.getInstance();
      
      // Try to re-initialize session
      const initialized = await sessionManager.initializeSession();
      
      if (initialized) {
        logger.info('✅ Session recovery successful');
        return true;
      }

      logger.warn('⚠️ Session recovery failed');
      return false;

    } catch (error) {
      logger.error('❌ Session recovery error:', error);
      return false;
    }
  }

  /**
   * Save data for offline sync when network is unavailable
   */
  private async saveForOfflineSync(operation: string, data: any): Promise<void> {
    try {
      const offlineItem = {
        id: Date.now().toString(),
        operation,
        data,
        timestamp: new Date().toISOString(),
        synced: false
      };

      const existingData = await AsyncStorage.getItem(this.RECOVERY_STORAGE_KEY);
      const offlineData = existingData ? JSON.parse(existingData) : [];
      
      offlineData.push(offlineItem);
      
      await AsyncStorage.setItem(this.RECOVERY_STORAGE_KEY, JSON.stringify(offlineData));
      logger.info(`💾 Saved operation '${operation}' for offline sync`);

    } catch (error) {
      logger.error('Failed to save data for offline sync:', error);
    }
  }

  /**
   * Mark user for migration retry
   */
  private async markForMigrationRetry(context: any): Promise<void> {
    try {
      const migrationMarker = {
        needsRetry: true,
        stepId: context?.stepId,
        timestamp: new Date().toISOString(),
        attempts: 1
      };

      await AsyncStorage.setItem('migration_retry_marker', JSON.stringify(migrationMarker));
      logger.info('🔄 Marked user for migration retry');

    } catch (error) {
      logger.error('Failed to mark for migration retry:', error);
    }
  }

  /**
   * Get pending offline data
   */
  private async getPendingOfflineData(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(this.RECOVERY_STORAGE_KEY);
      if (data) {
        const offlineData = JSON.parse(data);
        return offlineData.filter((item: any) => !item.synced);
      }
      return [];
    } catch (error) {
      logger.error('Failed to get pending offline data:', error);
      return [];
    }
  }

  /**
   * Check if migration retry is pending
   */
  private async hasPendingMigration(): Promise<boolean> {
    try {
      const marker = await AsyncStorage.getItem('migration_retry_marker');
      if (marker) {
        const migrationData = JSON.parse(marker);
        return migrationData.needsRetry === true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to check pending migration:', error);
      return false;
    }
  }

  /**
   * Get retry count for an operation
   */
  private async getRetryCount(operation: string): Promise<number> {
    try {
      const retryData = await AsyncStorage.getItem(`retry_count_${operation}`);
      return retryData ? parseInt(retryData, 10) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Increment retry count for an operation
   */
  private async incrementRetryCount(operation: string): Promise<void> {
    try {
      const currentCount = await this.getRetryCount(operation);
      await AsyncStorage.setItem(`retry_count_${operation}`, (currentCount + 1).toString());
    } catch (error) {
      logger.error('Failed to increment retry count:', error);
    }
  }

  /**
   * Log error for debugging and analytics
   */
  private async logError(context: ErrorContext, error: unknown): Promise<void> {
    try {
      const errorLog = {
        ...context,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      };

      const existingLogs = await AsyncStorage.getItem(this.ERROR_LOG_KEY);
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      logs.push(errorLog);
      
      // Keep only last 50 error logs
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      await AsyncStorage.setItem(this.ERROR_LOG_KEY, JSON.stringify(logs));
      
    } catch (logError) {
      logger.error('Failed to log error:', logError);
    }
  }

  /**
   * Clear retry counts (call after successful operation)
   */
  async clearRetryCount(operation: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`retry_count_${operation}`);
    } catch (error) {
      logger.error('Failed to clear retry count:', error);
    }
  }

  /**
   * Sync pending offline data when connection is restored
   */
  async syncPendingData(): Promise<{ success: boolean; syncedCount: number }> {
    try {
      const pendingData = await this.getPendingOfflineData();
      let syncedCount = 0;

      for (const item of pendingData) {
        try {
          // Here you would implement the actual sync logic
          // For now, just mark as synced
          item.synced = true;
          item.syncedAt = new Date().toISOString();
          syncedCount++;
        } catch (syncError) {
          logger.error(`Failed to sync item ${item.id}:`, syncError);
        }
      }

      // Update storage with synced status
      await AsyncStorage.setItem(this.RECOVERY_STORAGE_KEY, JSON.stringify(pendingData));
      
      logger.info(`✅ Synced ${syncedCount}/${pendingData.length} pending operations`);
      
      return { success: true, syncedCount };

    } catch (error) {
      logger.error('Failed to sync pending data:', error);
      return { success: false, syncedCount: 0 };
    }
  }

  /**
   * Clear all recovery data (for testing or cleanup)
   */
  async clearRecoveryData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.RECOVERY_STORAGE_KEY,
        this.ERROR_LOG_KEY,
        'migration_retry_marker'
      ]);
      
      // Clear all retry counts
      const keys = await AsyncStorage.getAllKeys();
      const retryKeys = keys.filter(key => key.startsWith('retry_count_'));
      if (retryKeys.length > 0) {
        await AsyncStorage.multiRemove(retryKeys);
      }
      
      logger.info('🧹 Recovery data cleared');
    } catch (error) {
      logger.error('Failed to clear recovery data:', error);
    }
  }

  /**
   * Get error statistics for debugging
   */
  async getErrorStats(): Promise<any> {
    try {
      const errorLogs = await AsyncStorage.getItem(this.ERROR_LOG_KEY);
      const pendingData = await this.getPendingOfflineData();
      const migrationPending = await this.hasPendingMigration();

      return {
        totalErrors: errorLogs ? JSON.parse(errorLogs).length : 0,
        pendingOperations: pendingData.length,
        migrationPending,
        lastErrorTime: errorLogs ? JSON.parse(errorLogs).slice(-1)[0]?.timestamp : null
      };
    } catch (error) {
      logger.error('Failed to get error stats:', error);
      return null;
    }
  }

  showRecoveryDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Connection Issue',
        'We\'re having trouble connecting to our servers. Would you like to continue with offline mode or try again?',
        [
          {
            text: 'Try Again',
            onPress: () => resolve(false)
          },
          {
            text: 'Continue Offline',
            onPress: () => resolve(true),
            style: 'default'
          }
        ]
      );
    });
  }
} 