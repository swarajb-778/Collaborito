import { Alert } from 'react-native';
import { SessionManager } from './SessionManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL || '';

export class OnboardingErrorRecovery {
  private sessionManager = SessionManager.getInstance();

  async attemptRecovery(): Promise<boolean> {
    try {
      // Check network connectivity
      const isOnline = await this.checkNetworkConnectivity();
      
      if (!isOnline) {
        return this.handleOfflineRecovery();
      }

      // Attempt session recovery
      const sessionRecovered = await this.sessionManager.initializeSession();
      
      if (!sessionRecovered) {
        return this.handleSessionRecovery();
      }

      // Validate onboarding state
      await this.sessionManager.loadOnboardingState();
      
      return true;
    } catch (error) {
      console.error('Recovery failed:', error);
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

  async recoverFromError(error: any, context: string): Promise<boolean> {
    console.error(`Error in ${context}:`, error);

    // Check if this is a mock user - be more lenient with errors
    const session = this.sessionManager.getSession();
    const isMockUser = session && (session as any).mock;
    
    if (isMockUser) {
      console.log('🔧 Mock user detected, applying lenient error recovery');
      return this.handleMockUserError(error, context);
    }

    // Check if it's a network error
    if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
      return this.handleNetworkError();
    }

    // Check if it's an authentication error
    if (error.status === 401 || error.message?.includes('Invalid JWT')) {
      return this.handleAuthError();
    }

    // Check if it's a validation error
    if (error.status === 400) {
      return this.handleValidationError(error);
    }

    // Generic error handling
    return this.handleGenericError(error);
  }

  /**
   * Handle errors for mock users with more lenient approach
   */
  private async handleMockUserError(error: any, context: string): Promise<boolean> {
    console.log(`🔧 Handling mock user error in ${context}:`, error.message || error);
    
    // For mock users, most errors are recoverable
    if (context.includes('initializeFlow') || context.includes('session')) {
      console.log('✅ Mock user session/flow error - allowing graceful continuation');
      return true;
    }
    
    if (context.includes('executeStep')) {
      console.log('✅ Mock user step execution error - allowing local storage fallback');
      return true;
    }
    
    if (context.includes('network') || context.includes('supabase')) {
      console.log('✅ Mock user network/supabase error - using local fallback');
      return true;
    }
    
    // For any other mock user errors, allow continuation with warning
    console.warn(`Mock user error in ${context}, but allowing continuation:`, error);
    return true;
  }

  private async handleNetworkError(): Promise<boolean> {
    const isOnline = await this.checkNetworkConnectivity();
    
    if (!isOnline) {
      Alert.alert(
        'Connection Error',
        'Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: () => window.location.reload?.() },
          { text: 'Continue Offline', onPress: () => {} }
        ]
      );
      return false;
    }
    
    return true;
  }

  private async handleAuthError(): Promise<boolean> {
    // Try to refresh the session
    const recovered = await this.sessionManager.verifySession();
    
    if (!recovered) {
      Alert.alert(
        'Authentication Error',
        'Your session has expired. Please sign in again.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  }

  private handleValidationError(error: any): boolean {
    const errorMessage = error.message || 'Please check your input and try again.';
    
    Alert.alert(
      'Validation Error',
      errorMessage,
      [{ text: 'OK' }]
    );
    
    return false;
  }

  private handleGenericError(error: any): boolean {
    const errorMessage = error.message || 'An unexpected error occurred. Please try again.';
    
    Alert.alert(
      'Error',
      errorMessage,
      [
        { text: 'Retry', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
    
    return false;
  }

  async performHealthCheck(): Promise<{
    sessionValid: boolean;
    networkOnline: boolean;
    cacheAvailable: boolean;
  }> {
    const sessionValid = await this.sessionManager.verifySession();
    const networkOnline = await this.checkNetworkConnectivity();
    const cached = await AsyncStorage.getItem('onboarding_state');
    const cacheAvailable = !!cached;

    return {
      sessionValid,
      networkOnline,
      cacheAvailable
    };
  }

  async recoverOnboardingData(): Promise<any> {
    try {
      // First try to load from session manager
      await this.sessionManager.refreshOnboardingState();
      const state = this.sessionManager.getOnboardingState();
      
      if (state) {
        return state;
      }

      // Fallback to cached data
      const cached = await AsyncStorage.getItem('onboarding_state');
      if (cached) {
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      console.error('Failed to recover onboarding data:', error);
      return null;
    }
  }

  showRecoveryDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Recovery Options',
        'We encountered an issue. How would you like to proceed?',
        [
          {
            text: 'Retry',
            onPress: () => resolve(true)
          },
          {
            text: 'Use Offline Data',
            onPress: async () => {
              const success = await this.handleOfflineRecovery();
              resolve(success);
            }
          },
          {
            text: 'Start Over',
            style: 'destructive',
            onPress: () => {
              AsyncStorage.removeItem('onboarding_state');
              resolve(false);
            }
          }
        ]
      );
    });
  }
} 