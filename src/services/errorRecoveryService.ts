import { supabase } from './supabase';
import { syncService } from './syncService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface ErrorLog {
  id: string;
  timestamp: number;
  errorType: string;
  errorMessage: string;
  context: string;
  userId?: string;
  resolved: boolean;
  recoveryAttempts: number;
}

interface RecoveryStrategy {
  name: string;
  condition: (error: Error, context: string) => boolean;
  action: (error: Error, context: string, userId?: string) => Promise<boolean>;
  priority: number;
}

class ErrorRecoveryService {
  private errorLogs: ErrorLog[] = [];
  private maxErrorLogs = 50;
  private recoveryStrategies: RecoveryStrategy[] = [];

  constructor() {
    this.initializeRecoveryStrategies();
    this.loadErrorLogs();
  }

  /**
   * Initialize recovery strategies
   */
  private initializeRecoveryStrategies() {
    this.recoveryStrategies = [
      // Network connectivity issues
      {
        name: 'Network Retry',
        condition: (error) => 
          error.message.includes('network') || 
          error.message.includes('fetch') ||
          error.message.includes('timeout'),
        action: async (error, context, userId) => {
          console.log('🔄 Attempting network retry...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          return await this.retryNetworkOperation(context, userId);
        },
        priority: 1
      },

      // Authentication token issues
      {
        name: 'Auth Token Refresh',
        condition: (error) => 
          error.message.includes('token') || 
          error.message.includes('unauthorized') ||
          error.message.includes('401'),
        action: async (error, context, userId) => {
          console.log('🔐 Attempting token refresh...');
          return await this.refreshAuthToken();
        },
        priority: 2
      },

      // Database connection issues
      {
        name: 'Database Reconnect',
        condition: (error) => 
          error.message.includes('relation') || 
          error.message.includes('does not exist') ||
          error.message.includes('connection'),
        action: async (error, context, userId) => {
          console.log('🗄️ Attempting database recovery...');
          return await this.recoverDatabaseConnection();
        },
        priority: 3
      },

      // Edge Function availability issues
      {
        name: 'Edge Function Fallback',
        condition: (error) => 
          error.message.includes('Edge Functions') ||
          error.message.includes('function'),
        action: async (error, context, userId) => {
          console.log('⚡ Using Edge Function fallback...');
          return await this.enableFallbackMode(userId);
        },
        priority: 4
      },

      // Data validation issues
      {
        name: 'Data Validation Recovery',
        condition: (error) => 
          error.message.includes('validation') ||
          error.message.includes('invalid') ||
          error.message.includes('constraint'),
        action: async (error, context, userId) => {
          console.log('📝 Attempting data validation recovery...');
          return await this.recoverDataValidation(context, userId);
        },
        priority: 5
      },

      // Generic fallback
      {
        name: 'Generic Recovery',
        condition: () => true,
        action: async (error, context, userId) => {
          console.log('🛠️ Attempting generic recovery...');
          return await this.genericRecovery(error, context, userId);
        },
        priority: 10
      }
    ];

    // Sort by priority
    this.recoveryStrategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Handle error with recovery attempts
   */
  async handleError(
    error: Error,
    context: string,
    userId?: string,
    showUserAlert = true
  ): Promise<boolean> {
    console.error(`❌ Error in ${context}:`, error.message);

    // Log the error
    const errorLog = this.logError(error, context, userId);

    // Find appropriate recovery strategy
    const strategy = this.recoveryStrategies.find(s => s.condition(error, context));

    if (strategy) {
      try {
        console.log(`🔧 Applying recovery strategy: ${strategy.name}`);
        const success = await strategy.action(error, context, userId);

        if (success) {
          errorLog.resolved = true;
          await this.saveErrorLogs();
          console.log(`✅ Recovery successful with strategy: ${strategy.name}`);
          return true;
        } else {
          errorLog.recoveryAttempts++;
          await this.saveErrorLogs();
          console.log(`❌ Recovery failed with strategy: ${strategy.name}`);
        }
      } catch (recoveryError) {
        console.error(`Recovery strategy ${strategy.name} failed:`, recoveryError);
        errorLog.recoveryAttempts++;
        await this.saveErrorLogs();
      }
    }

    // Show user-friendly error message if requested
    if (showUserAlert) {
      this.showUserFriendlyError(error, context);
    }

    return false;
  }

  /**
   * Log error for tracking
   */
  private logError(error: Error, context: string, userId?: string): ErrorLog {
    const errorLog: ErrorLog = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      errorType: error.constructor.name,
      errorMessage: error.message,
      context,
      userId,
      resolved: false,
      recoveryAttempts: 0
    };

    this.errorLogs.push(errorLog);

    // Keep only latest errors
    if (this.errorLogs.length > this.maxErrorLogs) {
      this.errorLogs = this.errorLogs.slice(-this.maxErrorLogs);
    }

    this.saveErrorLogs();
    return errorLog;
  }

  /**
   * Retry network operation
   */
  private async retryNetworkOperation(context: string, userId?: string): Promise<boolean> {
    try {
      // Test network connectivity with timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ Network connectivity restored');
        
        // Trigger sync if user is available
        if (userId) {
          syncService.syncNow();
        }
        
        return true;
      }
    } catch (error) {
      console.log('❌ Network still unavailable');
    }

    return false;
  }

  /**
   * Refresh authentication token
   */
  private async refreshAuthToken(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Token refresh failed:', error);
        return false;
      }

      if (data.session) {
        console.log('✅ Auth token refreshed successfully');
        return true;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }

    return false;
  }

  /**
   * Recover database connection
   */
  private async recoverDatabaseConnection(): Promise<boolean> {
    try {
      // Test basic database connectivity
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (!error) {
        console.log('✅ Database connection restored');
        return true;
      } else {
        console.log('❌ Database still unavailable:', error.message);
      }
    } catch (error) {
      console.log('❌ Database connection test failed:', error);
    }

    return false;
  }

  /**
   * Enable fallback mode for Edge Functions
   */
  private async enableFallbackMode(userId?: string): Promise<boolean> {
    try {
      // Set fallback mode flag
      await AsyncStorage.setItem('fallback_mode', 'true');
      
      // Ensure sync service uses fallback methods
      if (userId) {
        syncService.syncNow();
      }

      console.log('✅ Fallback mode enabled');
      return true;
    } catch (error) {
      console.error('Failed to enable fallback mode:', error);
    }

    return false;
  }

  /**
   * Recover data validation issues
   */
  private async recoverDataValidation(context: string, userId?: string): Promise<boolean> {
    try {
      // Clear any corrupted cached data
      await AsyncStorage.removeItem('cached_onboarding_data');
      await AsyncStorage.removeItem('sync_queue');
      
      console.log('✅ Cleared potentially corrupted data');
      return true;
    } catch (error) {
      console.error('Data validation recovery failed:', error);
    }

    return false;
  }

  /**
   * Generic recovery strategy
   */
  private async genericRecovery(error: Error, context: string, userId?: string): Promise<boolean> {
    try {
      // Log error details for debugging
      console.log('🔍 Generic recovery - gathering error details...');
      console.log('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        context
      });

      // Clear potentially problematic cached data
      await AsyncStorage.removeItem(`error_context_${context}`);
      
      // Wait a bit before suggesting retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return false; // Generic recovery doesn't auto-fix, just cleans up
    } catch (recoveryError) {
      console.error('Generic recovery failed:', recoveryError);
    }

    return false;
  }

  /**
   * Show user-friendly error message
   */
  private showUserFriendlyError(error: Error, context: string) {
    let userMessage = 'Something went wrong. Please try again.';
    let title = 'Error';

    if (error.message.includes('network') || error.message.includes('fetch')) {
      title = 'Connection Issue';
      userMessage = 'Please check your internet connection and try again.';
    } else if (error.message.includes('token') || error.message.includes('unauthorized')) {
      title = 'Authentication Issue';
      userMessage = 'Please sign in again to continue.';
    } else if (error.message.includes('validation')) {
      title = 'Data Issue';
      userMessage = 'Please check your information and try again.';
    } else if (context.includes('onboarding')) {
      title = 'Setup Issue';
      userMessage = 'We\'re having trouble saving your information. Your data is safe and we\'ll keep trying.';
    }

    Alert.alert(title, userMessage, [
      { text: 'OK', style: 'default' }
    ]);
  }

  /**
   * Load error logs from storage
   */
  private async loadErrorLogs() {
    try {
      const logsData = await AsyncStorage.getItem('error_logs');
      if (logsData) {
        this.errorLogs = JSON.parse(logsData);
      }
    } catch (error) {
      console.error('Error loading error logs:', error);
    }
  }

  /**
   * Save error logs to storage
   */
  private async saveErrorLogs() {
    try {
      await AsyncStorage.setItem('error_logs', JSON.stringify(this.errorLogs));
    } catch (error) {
      console.error('Error saving error logs:', error);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const total = this.errorLogs.length;
    const resolved = this.errorLogs.filter(log => log.resolved).length;
    const recent = this.errorLogs.filter(log => 
      Date.now() - log.timestamp < 24 * 60 * 60 * 1000
    ).length;

    return {
      total,
      resolved,
      unresolved: total - resolved,
      recentErrors: recent,
      recoveryRate: total > 0 ? (resolved / total) * 100 : 0
    };
  }

  /**
   * Clear error logs
   */
  async clearErrorLogs() {
    this.errorLogs = [];
    await this.saveErrorLogs();
    console.log('🗑️ Error logs cleared');
  }

  /**
   * Get recent errors
   */
  getRecentErrors(hours = 24): ErrorLog[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.errorLogs.filter(log => log.timestamp > cutoff);
  }
}

export const errorRecoveryService = new ErrorRecoveryService(); 