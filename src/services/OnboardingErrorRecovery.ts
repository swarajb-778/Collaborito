import { Alert } from 'react-native';
import { SessionManager } from './SessionManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { UserProfileService } from './UserProfileService';

const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL || '';

export class OnboardingErrorRecovery {
  private sessionManager = SessionManager.getInstance();
  private profileService = UserProfileService.getInstance();

  async attemptRecovery(): Promise<boolean> {
    try {
      console.log('🔄 Attempting onboarding error recovery...');

      // Step 1: Check network connectivity (simple approach)
      console.log('🌐 Checking network connectivity...');
      const isOnline = await this.checkNetworkConnectivity();
      
      if (!isOnline) {
        console.warn('⚠️ No network connection - enabling offline mode');
        return await this.enableOfflineMode();
      }

      console.log('✅ Network connection available');

      // Step 2: Try to recover session
      console.log('🔑 Attempting session recovery...');
      const sessionRecovered = await this.recoverSession();
      
      if (!sessionRecovered) {
        console.warn('⚠️ Session recovery failed');
        return false;
      }

      console.log('✅ Session recovered successfully');

      // Step 3: Verify/create user profile
      console.log('👤 Verifying user profile...');
      const profileRecovered = await this.recoverUserProfile();
      
      if (!profileRecovered) {
        console.warn('⚠️ Profile recovery failed, but continuing...');
        // Don't fail completely for profile issues
      }

      console.log('✅ Recovery process completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Recovery attempt failed:', error);
      return false;
    }
  }

  private async enableOfflineMode(): Promise<boolean> {
    try {
      console.log('📱 Enabling offline mode...');
      
      // Try to initialize session from local data only
      const sessionInitialized = await this.sessionManager.initializeSession();
      
      if (sessionInitialized) {
        console.log('✅ Offline mode enabled with local session');
        return true;
      }

      console.log('❌ Failed to enable offline mode');
      return false;
    } catch (error) {
      console.error('❌ Error enabling offline mode:', error);
      return false;
    }
  }

  private async recoverSession(): Promise<boolean> {
    try {
      console.log('🔑 Attempting session recovery...');
      
      // Try to initialize session (this includes local fallback)
      const sessionInitialized = await this.sessionManager.initializeSession();
      
      if (sessionInitialized) {
        console.log('✅ Session recovery successful');
        return true;
      }

      console.log('❌ Session recovery failed');
      return false;
    } catch (error) {
      console.error('❌ Session recovery error:', error);
      return false;
    }
  }

  private async recoverUserProfile(): Promise<boolean> {
    try {
      console.log('👤 Attempting profile recovery...');
      
      // Get current session to extract user info
      const session = this.sessionManager.getSession();
      if (!session?.user?.id) {
        console.log('⚠️ No user ID available for profile recovery');
        return false;
      }

      // Check if profile exists
      const profileExists = await this.profileService.profileExists(session.user.id);
      
      if (profileExists) {
        console.log('✅ User profile exists');
        return true;
      }

      console.log('⚠️ Profile does not exist, attempting to create...');
      
      // Try to get user data from local storage to recreate profile
      try {
        const { getItemAsync } = await import('expo-secure-store');
        const userJson = await getItemAsync('user');
        
        if (userJson) {
          const userData = JSON.parse(userJson);
          console.log('📋 Found local user data, creating profile...');
          
          const createResult = await this.profileService.createOrUpdateProfile({
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            username: userData.username,
            profileImage: userData.profileImage,
            oauthProvider: userData.oauthProvider
          });

          if (createResult.success) {
            console.log('✅ Profile created successfully');
            return true;
          } else {
            console.warn('⚠️ Profile creation failed:', createResult.error);
          }
        }
      } catch (localError) {
        console.warn('⚠️ Could not access local user data:', localError);
      }

      console.log('⚠️ Profile recovery incomplete, but continuing...');
      return false;
    } catch (error) {
      console.error('❌ Profile recovery error:', error);
      return false;
    }
  }

  async recoverFromError(error: any, context: string): Promise<boolean> {
    try {
      console.log(`🔧 Recovering from error in ${context}:`, error);
      
      // Attempt automatic recovery first
      const recoverySuccessful = await this.attemptRecovery();
      
      if (recoverySuccessful) {
        console.log('✅ Automatic recovery successful');
        return true;
      }

      // If automatic recovery fails, offer user options
      console.log('⚠️ Automatic recovery failed, showing user options...');
      return await this.showRecoveryDialog();
    } catch (recoveryError) {
      console.error('❌ Error recovery failed:', recoveryError);
      return false;
    }
  }

  async showRecoveryDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Connection Issue',
        'We\'re having trouble connecting to our services. You can continue offline or try again.',
        [
          {
            text: 'Continue Offline',
            onPress: async () => {
              console.log('👤 User chose to continue offline');
              const offlineEnabled = await this.enableOfflineMode();
              resolve(offlineEnabled);
            }
          },
          {
            text: 'Retry',
            onPress: async () => {
              console.log('🔄 User chose to retry');
              const retrySuccessful = await this.attemptRecovery();
              resolve(retrySuccessful);
            }
          },
          {
            text: 'Sign In Again',
            style: 'destructive',
            onPress: () => {
              console.log('🔑 User chose to sign in again');
              resolve(false);
            }
          }
        ],
        { cancelable: false }
      );
    });
  }

  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      // Simple network check using fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('Network connectivity check failed:', error);
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
} 