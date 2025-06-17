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
      // Check for existing session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session initialization error:', error);
        throw error;
      }
      
      if (session) {
        console.log('✅ Session found, loading onboarding state...');
        this.currentSession = session;
        await this.loadOnboardingState();
        return true;
      }
      
      console.log('⚠️ No session found');
      return false;
    } catch (error) {
      console.error('❌ Session initialization failed:', error);
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
        await this.loadOnboardingState(); // Refresh state
        return true;
      }
      
      throw new Error(result.error);
    } catch (error) {
      console.error('Failed to save onboarding step:', error);
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
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session && session.access_token) {
        this.currentSession = session;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Session verification failed:', error);
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