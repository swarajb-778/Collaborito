import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL || '';

export interface MockSession {
  access_token: string;
  user: {
    id: string;
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  };
  expires_at: number;
  token_type: 'bearer';
  mock: true;
}

export class SessionManager {
  private static instance: SessionManager;
  private currentSession: any = null;
  private onboardingState: any = null;
  private isMockUser: boolean = false;

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Enhanced session initialization that handles both mock and real Supabase users
   */
  async initializeSession(): Promise<boolean> {
    try {
      // First try to get existing session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!error && session) {
        console.log('✅ Real Supabase session found');
        this.currentSession = session;
        this.isMockUser = false;
        await this.loadOnboardingState();
        return true;
      }
      
      // If no Supabase session, check for mock user from AuthContext
      const mockUser = await this.getMockUserFromAuthContext();
      if (mockUser) {
        console.log('🔧 Mock user detected, creating fallback session');
        this.currentSession = await this.createMockSession(mockUser);
        this.isMockUser = true;
        await this.loadOnboardingState();
        return true;
      }
      
      console.log('❌ No session found');
      return false;
    } catch (error) {
      console.error('Session initialization failed:', error);
      
      // Try fallback with mock user
      const mockUser = await this.getMockUserFromAuthContext();
      if (mockUser) {
        console.log('🔧 Falling back to mock session after error');
        this.currentSession = await this.createMockSession(mockUser);
        this.isMockUser = true;
        await this.loadOnboardingState();
        return true;
      }
      
      return false;
    }
  }

  /**
   * Get mock user data from AuthContext storage
   */
  private async getMockUserFromAuthContext(): Promise<any> {
    try {
      const userJson = await SecureStore.getItemAsync('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        // Check if this is a mock user (has id starting with 'new' or similar pattern)
        if (userData.id && (userData.id.startsWith('new') || userData.id.includes('mock') || userData.oauthProvider === 'email')) {
          return userData;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting mock user:', error);
      return null;
    }
  }

  /**
   * Create a mock session for development/mock users
   */
  private async createMockSession(userData: any): Promise<MockSession> {
    return {
      access_token: `mock_token_${userData.id}_${Date.now()}`,
      user: {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
      },
      expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
      token_type: 'bearer',
      mock: true,
    };
  }

  /**
   * Enhanced onboarding state loading with fallback for mock users
   */
  async loadOnboardingState(): Promise<void> {
    try {
      if (this.isMockUser) {
        // For mock users, load from local storage or create default state
        await this.loadMockOnboardingState();
        return;
      }

      // For real users, try to load from Supabase Edge Function
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
      } else {
        throw new Error('Failed to load onboarding state from server');
      }
      
      // Cache locally for offline access
      await AsyncStorage.setItem('onboarding_state', JSON.stringify(this.onboardingState));
    } catch (error) {
      console.warn('Failed to load onboarding state from server, using fallback:', error);
      // Load from cache if network fails
      const cached = await AsyncStorage.getItem('onboarding_state');
      if (cached) {
        this.onboardingState = JSON.parse(cached);
      } else {
        // Create default state for new users
        await this.createDefaultOnboardingState();
      }
    }
  }

  /**
   * Load onboarding state for mock users from local storage
   */
  private async loadMockOnboardingState(): Promise<void> {
    try {
      const userId = this.currentSession?.user?.id;
      const cacheKey = `mock_onboarding_${userId}`;
      
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        this.onboardingState = JSON.parse(cached);
      } else {
        await this.createDefaultOnboardingState();
        // Save the default state
        await AsyncStorage.setItem(cacheKey, JSON.stringify(this.onboardingState));
      }
    } catch (error) {
      console.error('Error loading mock onboarding state:', error);
      await this.createDefaultOnboardingState();
    }
  }

  /**
   * Create default onboarding state for new users
   */
  private async createDefaultOnboardingState(): Promise<void> {
    this.onboardingState = {
      completed: false,
      currentStep: 'profile',
      steps: {
        profile: { completed: false, data: null },
        interests: { completed: false, data: null },
        goals: { completed: false, data: null },
        project_details: { completed: false, data: null },
        skills: { completed: false, data: null }
      },
      progress: 0,
      user_id: this.currentSession?.user?.id || 'unknown',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Enhanced step saving with mock user support
   */
  async saveOnboardingStep(step: string, data: any): Promise<boolean> {
    try {
      if (this.isMockUser) {
        return await this.saveMockOnboardingStep(step, data);
      }

      // For real users, save to Supabase Edge Function
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
      
      throw new Error(result.error || 'Failed to save step');
    } catch (error) {
      console.warn('Failed to save to server, saving locally:', error);
      return await this.saveMockOnboardingStep(step, data);
    }
  }

  /**
   * Save onboarding step for mock users locally
   */
  private async saveMockOnboardingStep(step: string, data: any): Promise<boolean> {
    try {
      const userId = this.currentSession?.user?.id;
      const cacheKey = `mock_onboarding_${userId}`;
      
      // Update the onboarding state
      if (!this.onboardingState) {
        await this.createDefaultOnboardingState();
      }

      this.onboardingState.steps[step] = {
        completed: true,
        data: data,
        completed_at: new Date().toISOString()
      };

      // Update current step to next step
      const stepOrder = ['profile', 'interests', 'goals', 'project_details', 'skills'];
      const currentIndex = stepOrder.indexOf(step);
      if (currentIndex < stepOrder.length - 1) {
        this.onboardingState.currentStep = stepOrder[currentIndex + 1];
      } else {
        this.onboardingState.completed = true;
        this.onboardingState.currentStep = 'completed';
      }

      // Update progress
      const completedSteps = Object.values(this.onboardingState.steps).filter((s: any) => s.completed).length;
      this.onboardingState.progress = (completedSteps / stepOrder.length) * 100;
      this.onboardingState.updated_at = new Date().toISOString();

      // Save to local storage
      await AsyncStorage.setItem(cacheKey, JSON.stringify(this.onboardingState));
      await AsyncStorage.setItem('onboarding_state', JSON.stringify(this.onboardingState));
      
      console.log(`✅ Mock onboarding step '${step}' saved locally`);
      return true;
    } catch (error) {
      console.error('Error saving mock onboarding step:', error);
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

  isMockSession(): boolean {
    return this.isMockUser;
  }

  /**
   * Enhanced session verification with mock support
   */
  async verifySession(): Promise<boolean> {
    try {
      if (this.isMockUser) {
        // For mock users, just check if session exists and isn't expired
        if (this.currentSession && this.currentSession.expires_at > Date.now()) {
          return true;
        } else {
          // Try to recreate mock session
          const mockUser = await this.getMockUserFromAuthContext();
          if (mockUser) {
            this.currentSession = await this.createMockSession(mockUser);
            return true;
          }
          return false;
        }
      }

      // For real users, verify with Supabase
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
    this.isMockUser = false;
    AsyncStorage.removeItem('onboarding_state');
  }

  /**
   * Get user ID from current session
   */
  getUserId(): string | null {
    return this.currentSession?.user?.id || null;
  }

  /**
   * Get user email from current session
   */
  getUserEmail(): string | null {
    return this.currentSession?.user?.email || null;
  }
} 