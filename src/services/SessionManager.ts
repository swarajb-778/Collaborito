import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Fix environment variable loading - try both expo config and process.env
const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL || 
                     Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
                     process.env.EXPO_PUBLIC_SUPABASE_URL || 
                     'https://ekydublgvsoaaepdhtzc.supabase.co';

export class SessionManager {
  private static instance: SessionManager;
  private currentSession: any = null;
  private onboardingState: any = null;

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  async initializeSession(): Promise<boolean> {
    try {
      console.log('🔄 Initializing session...');
      // Check for existing session - first try Supabase Auth
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Supabase session initialization error:', error);
        
        // Try to initialize with local user data as fallback
        const fallbackSuccess = await this.initializeFromLocalData();
        if (fallbackSuccess) {
          console.log('✅ Session initialized from local data');
          return true;
        }
        
        throw error;
      }
      
      if (session) {
        console.log('✅ Supabase session found, loading onboarding state...');
        this.currentSession = session;
        await this.loadOnboardingState();
        return true;
      } else {
        console.log('⚠️ No Supabase session found, trying local fallback...');
        // Try to initialize from local user data
        const fallbackSuccess = await this.initializeFromLocalData();
        if (fallbackSuccess) {
          console.log('✅ Session initialized from local data');
          return true;
        }
      }
      
      console.log('⚠️ No session found');
      return false;
    } catch (error) {
      console.error('❌ Session initialization failed:', error);
      
      // Try local fallback as last resort
      const fallbackSuccess = await this.initializeFromLocalData();
      if (fallbackSuccess) {
        console.log('✅ Session initialized from local data (fallback)');
        return true;
      }
      
      return false;
    }
  }

  /**
   * Initialize session from local storage when Supabase session is not available
   */
  private async initializeFromLocalData(): Promise<boolean> {
    try {
      console.log('🔄 Attempting to initialize from local data...');
      
      // Try to get user data from SecureStore (AuthContext)
      const { getItemAsync } = await import('expo-secure-store');
      const userJson = await getItemAsync('user');
      const userSession = await getItemAsync('userSession');
      
      if (userJson && userSession === 'active') {
        const userData = JSON.parse(userJson);
        console.log('✅ Found local user data:', userData.id);
        
        // Create a pseudo session object for our services to work with
        this.currentSession = {
          access_token: `local_token_${userData.id}`,
          user: {
            id: userData.id,
            email: userData.email
          }
        };
        
        // Set default onboarding state for local users
        this.onboardingState = {
          currentStep: 'profile',
          completed: false,
          profile: userData.firstName && userData.lastName ? {
            firstName: userData.firstName,
            lastName: userData.lastName
          } : null,
          interests: null,
          goals: null,
          projects: null,
          skills: null
        };
        
        console.log('✅ Local session initialized with default state');
        return true;
      }
      
      console.log('⚠️ No valid local user data found');
      return false;
    } catch (error) {
      console.error('❌ Failed to initialize from local data:', error);
      return false;
    }
  }

  async loadOnboardingState(): Promise<void> {
    try {
      console.log('🔄 Loading onboarding state from Edge Function...');
      const response = await fetch(`${SUPABASE_URL}/functions/v1/onboarding-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.currentSession?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'get_status' })
      });

      if (response.ok) {
        this.onboardingState = await response.json();
        console.log('✅ Onboarding state loaded:', this.onboardingState);
        
        // Cache locally for offline access
        await AsyncStorage.setItem('onboarding_state', JSON.stringify(this.onboardingState));
      } else {
        console.log('⚠️ Edge Function response not OK, using cached or default state');
        throw new Error(`Edge Function returned ${response.status}`);
      }
    } catch (error) {
      console.log('🔄 Loading from cache due to error:', (error as Error).message);
      // Load from cache if network fails
      const cached = await AsyncStorage.getItem('onboarding_state');
      if (cached) {
        this.onboardingState = JSON.parse(cached);
        console.log('✅ Using cached onboarding state');
      } else {
        // Set default state for new users
        this.onboardingState = {
          currentStep: 'profile',
          completed: false,
          profile: null,
          interests: null,
          goals: null,
          projects: null,
          skills: null
        };
        console.log('✅ Using default onboarding state for new user');
      }
    }
  }

  async saveOnboardingStep(step: string, data: any): Promise<boolean> {
    try {
      console.log('🔄 Saving onboarding step:', step, 'with data:', data);
      
      // Check if we have a valid session
      if (!this.currentSession?.access_token) {
        console.error('❌ No session available for saving step');
        return false;
      }
      
      // If this is a local session (not Supabase), save locally
      if (this.currentSession.access_token.startsWith('local_token_')) {
        console.log('💾 Saving step locally (no Edge Function available)');
        return await this.saveStepLocally(step, data);
      }
      
      // Try to save via Edge Function first
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/validate-onboarding`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.currentSession?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ step, data })
        });

        const result = await response.json();
        
        if (response.ok) {
          console.log('✅ Step saved via Edge Function');
          await this.loadOnboardingState(); // Refresh state
          return true;
        }
        
        console.warn('⚠️ Edge Function returned error:', result.error);
        throw new Error(result.error);
      } catch (edgeFunctionError) {
        console.warn('⚠️ Edge Function failed, falling back to local save:', (edgeFunctionError as Error).message);
        
        // Fallback to local save
        return await this.saveStepLocally(step, data);
      }
    } catch (error) {
      console.error('❌ Failed to save onboarding step:', error);
      return false;
    }
  }

  /**
   * Save onboarding step locally when Edge Functions are not available
   */
  private async saveStepLocally(step: string, data: any): Promise<boolean> {
    try {
      console.log('💾 Saving step locally:', step);
      
      // Update the onboarding state based on the step
      if (!this.onboardingState) {
        this.onboardingState = {
          currentStep: 'profile',
          completed: false,
          profile: null,
          interests: null,
          goals: null,
          projects: null,
          skills: null
        };
      }
      
      // Update state based on step type
      switch (step) {
        case 'profile':
          this.onboardingState.profile = data;
          this.onboardingState.currentStep = 'interests';
          break;
        case 'interests':
          this.onboardingState.interests = data.interestIds || data;
          this.onboardingState.currentStep = 'goals';
          break;
        case 'goals':
          this.onboardingState.goals = data;
          this.onboardingState.currentStep = 'project_details';
          break;
        case 'project_details':
          this.onboardingState.projects = data;
          this.onboardingState.currentStep = 'skills';
          break;
        case 'skills':
          this.onboardingState.skills = data;
          this.onboardingState.currentStep = 'completed';
          break;
        case 'complete':
          this.onboardingState.completed = true;
          this.onboardingState.currentStep = 'completed';
          break;
      }
      
      // Save to local storage
      await AsyncStorage.setItem('onboarding_state', JSON.stringify(this.onboardingState));
      console.log('✅ Step saved locally with updated state:', this.onboardingState);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to save step locally:', error);
      return false;
    }
  }

  getOnboardingState() {
    return this.onboardingState;
  }

  isOnboardingComplete(): boolean {
    return this.onboardingState?.completed || false;
  }

  getCurrentStep(): string {
    return this.onboardingState?.currentStep || 'profile';
  }

  getSession() {
    return this.currentSession;
  }

  async verifySession(): Promise<boolean> {
    try {
      console.log('🔄 Verifying session...');
      
      // If we have a local session, verify it exists in SecureStore
      if (this.currentSession?.access_token?.startsWith('local_token_')) {
        console.log('🔍 Verifying local session...');
        try {
          const { getItemAsync } = await import('expo-secure-store');
          const userSession = await getItemAsync('userSession');
          const userJson = await getItemAsync('user');
          
          if (userSession === 'active' && userJson) {
            console.log('✅ Local session verified');
            return true;
          } else {
            console.log('❌ Local session invalid');
            this.clearSession();
            return false;
          }
        } catch (error) {
          console.error('❌ Error verifying local session:', error);
          return false;
        }
      }
      
      // For Supabase sessions, verify with Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session verification error:', error);
        return false;
      }
      
      if (session && session.access_token) {
        console.log('✅ Supabase session verified');
        this.currentSession = session;
        return true;
      }
      
      console.log('❌ No valid session found');
      return false;
    } catch (error) {
      console.error('❌ Session verification failed:', error);
      return false;
    }
  }

  async refreshOnboardingState(): Promise<void> {
    await this.loadOnboardingState();
  }

  clearSession(): void {
    this.currentSession = null;
    this.onboardingState = null;
    AsyncStorage.removeItem('onboarding_state');
  }
} 