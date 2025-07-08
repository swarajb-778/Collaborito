import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { createLogger } from '../utils/logger';

const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL || '';
const logger = createLogger('SessionManager');

interface LocalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  profileImage: string | null;
  oauthProvider: string;
  isLocal?: boolean;
}

interface SupabaseUser {
  id: string;
  email: string;
  supabaseId: string;
  profileId: string;
}

interface OnboardingState {
  completed: boolean;
  currentStep: string;
  steps: any;
  progress: number;
  user_id: string;
  supabaseUserId?: string;
  created_at: string;
  updated_at: string;
}

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
  private onboardingState: OnboardingState | null = null;
  private userMigrated = false;
  private isMockUser: boolean = false;

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Initialize session - handles both local and Supabase users
   */
  async initializeSession(): Promise<boolean> {
    try {
      logger.info('🚀 Initializing session manager...');

      // First, try to get local user data
      const localUser = await this.getLocalUser();
      
      if (localUser) {
        // Check if this is a local user (pre-Supabase) or migrated user
        if (this.isLocalUser(localUser)) {
          logger.info('📱 Local user detected:', localUser.id);
          this.currentSession = {
            user: localUser,
            isLocal: true,
            needsMigration: true
          };
          await this.initializeLocalOnboardingState(localUser);
          return true;
        } else {
          // This is a migrated user, try to get Supabase session
          const supabaseSession = await this.getSupabaseSession();
          if (supabaseSession) {
            this.currentSession = supabaseSession;
            await this.refreshOnboardingState();
            return true;
          }
        }
      }

      // Try to get Supabase session for existing users
      const supabaseSession = await this.getSupabaseSession();
      if (supabaseSession) {
        this.currentSession = supabaseSession;
        await this.refreshOnboardingState();
        return true;
      }

      logger.warn('No valid session found');
      return false;

    } catch (error) {
      logger.error('Failed to initialize session:', error);
      return false;
    }
  }

  /**
   * Check if user is a local user (pre-Supabase)
   */
  private isLocalUser(user: any): boolean {
    if (!user || !user.id) return false;
    
    // Local users have IDs that start with 'new', 'demo', 'mock', etc.
    const localPatterns = ['new', 'demo', 'mock', 'linkedin_mock'];
    return localPatterns.some(pattern => user.id.startsWith(pattern)) ||
           user.oauthProvider === 'email' && !user.supabaseId;
  }

  /**
   * Get local user from secure storage
   */
  private async getLocalUser(): Promise<LocalUser | null> {
    try {
      const userJson = await SecureStore.getItemAsync('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        return {
          ...userData,
          isLocal: this.isLocalUser(userData)
        };
      }
      return null;
    } catch (error) {
      logger.error('Error getting local user:', error);
      return null;
    }
  }

  /**
   * Get Supabase session
   */
  private async getSupabaseSession(): Promise<any> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.warn('Supabase session error:', error);
        return null;
      }

      if (session?.user) {
        logger.info('✅ Valid Supabase session found');
        return {
          user: session.user,
          session: session,
          isLocal: false,
          needsMigration: false
        };
      }

      return null;
    } catch (error) {
      logger.error('Error getting Supabase session:', error);
      return null;
    }
  }

  /**
   * Migrate local user to Supabase during onboarding profile step
   */
  async migrateUserToSupabase(profileData: { firstName: string; lastName: string; email: string; password?: string }): Promise<{ success: boolean; supabaseUser?: any; profileId?: string }> {
    try {
      logger.info('🔄 Starting user migration to Supabase...');

      const localUser = this.currentSession?.user;
      if (!localUser || !this.currentSession?.isLocal) {
        throw new Error('No local user to migrate');
      }

      // Create user in Supabase Auth
      let { data: authData, error: authError } = await supabase.auth.signUp({
        email: profileData.email,
        password: profileData.password || 'temp_password_' + Date.now(),
        options: {
          data: {
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            username: localUser.username || '',
            profile_image: localUser.profileImage || null
          }
        }
      });

      if (authError) {
        logger.error('Failed to create Supabase auth user:', authError);
        
        // If user already exists, try to sign them in
        if (authError.message?.includes('already registered')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: profileData.email,
            password: profileData.password || 'temp_password_' + Date.now()
          });

          if (signInError) {
            throw new Error(`User exists but cannot sign in: ${signInError.message}`);
          }

          authData = signInData;
        } else {
          throw authError;
        }
      }

      if (!authData.user) {
        throw new Error('Failed to create Supabase user');
      }

      logger.info('✅ Supabase auth user created:', authData.user.id);

      // Create profile in profiles table
      const profileInsertData = {
        id: authData.user.id,
        email: profileData.email,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        full_name: `${profileData.firstName} ${profileData.lastName}`.trim(),
        username: localUser.username || '',
        profile_image: localUser.profileImage || null,
        oauth_provider: localUser.oauthProvider || 'email',
        onboarding_step: 'interests',
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      let { data: profileData_response, error: profileError } = await supabase
        .from('profiles')
        .insert([profileInsertData])
        .select('id')
        .single();

      if (profileError) {
        // If profile already exists, update it
        if (profileError.code === '23505') {
          const { data: updateData, error: updateError } = await supabase
            .from('profiles')
            .update(profileInsertData)
            .eq('id', authData.user.id)
            .select('id')
            .single();

          if (updateError) {
            logger.error('Failed to update existing profile:', updateError);
            throw updateError;
          }
          profileData_response = updateData;
        } else {
          logger.error('Failed to create profile:', profileError);
          throw profileError;
        }
      }

      logger.info('✅ User profile created in Supabase:', profileData_response?.id);

      // Update current session
      this.currentSession = {
        user: authData.user,
        session: authData.session,
        isLocal: false,
        needsMigration: false,
        profileId: profileData_response?.id
      };

      // Update local storage with migration info
      const migratedUser = {
        ...localUser,
        supabaseId: authData.user.id,
        profileId: profileData_response?.id,
        isLocal: false,
        migrated: true
      };

      await SecureStore.setItemAsync('user', JSON.stringify(migratedUser));

      // Update onboarding state
      if (this.onboardingState) {
        this.onboardingState.supabaseUserId = authData.user.id;
        this.onboardingState.user_id = authData.user.id;
        await this.saveOnboardingState();
      }

      this.userMigrated = true;
      logger.info('✅ User migration completed successfully');

      return {
        success: true,
        supabaseUser: authData.user,
        profileId: profileData_response?.id
      };

    } catch (error) {
      logger.error('Failed to migrate user to Supabase:', error);
      return { success: false };
    }
  }

  /**
   * Initialize onboarding state for local users
   */
  private async initializeLocalOnboardingState(user: LocalUser): Promise<void> {
    try {
      // Try to load existing onboarding state
      const existingState = await this.loadOnboardingState();
      
      if (existingState) {
        this.onboardingState = existingState;
        return;
      }

      // Create new onboarding state for local user
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
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await this.saveOnboardingState();
      logger.info('✅ Local onboarding state initialized');

    } catch (error) {
      logger.error('Failed to initialize local onboarding state:', error);
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<any> {
    if (!this.currentSession) {
      await this.initializeSession();
    }
    return this.currentSession;
  }

  /**
   * Verify current session is valid
   */
  async verifySession(): Promise<boolean> {
    try {
      const session = await this.getSession();
      
      if (!session || !session.user) {
        return false;
      }

      // For local users, session is always valid during onboarding
      if (session.isLocal) {
        return true;
      }

      // For Supabase users, verify with Supabase
      const { data: { user }, error } = await supabase.auth.getUser();
      return !error && !!user;

    } catch (error) {
      logger.error('Session verification failed:', error);
      return false;
    }
  }

  /**
   * Check if user needs migration to Supabase
   */
  needsMigration(): boolean {
    return this.currentSession?.needsMigration === true;
  }

  /**
   * Check if user has been migrated
   */
  isMigrated(): boolean {
    return this.userMigrated || (this.currentSession && !this.currentSession.isLocal);
  }

  /**
   * Load onboarding state from storage
   */
  private async loadOnboardingState(): Promise<OnboardingState | null> {
    try {
      const stateJson = await SecureStore.getItemAsync('onboarding_state');
      if (stateJson) {
        return JSON.parse(stateJson);
      }
      return null;
    } catch (error) {
      logger.error('Failed to load onboarding state:', error);
      return null;
    }
  }

  /**
   * Save onboarding state to storage
   */
  private async saveOnboardingState(): Promise<void> {
    try {
      if (this.onboardingState) {
        this.onboardingState.updated_at = new Date().toISOString();
        await SecureStore.setItemAsync('onboarding_state', JSON.stringify(this.onboardingState));
      }
    } catch (error) {
      logger.error('Failed to save onboarding state:', error);
    }
  }

  /**
   * Refresh onboarding state from Supabase (for migrated users)
   */
  async refreshOnboardingState(): Promise<void> {
    try {
      if (!this.currentSession || this.currentSession.isLocal) {
        return;
      }

      // For Supabase users, get onboarding state from database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarding_step, onboarding_completed')
        .eq('id', this.currentSession.user.id)
        .single();

      if (error) {
        logger.warn('Failed to refresh onboarding state from Supabase:', error);
        return;
      }

      if (profile) {
        this.onboardingState = {
          completed: profile.onboarding_completed || false,
          currentStep: profile.onboarding_step || 'profile',
          steps: {},
          progress: 0,
          user_id: this.currentSession.user.id,
          supabaseUserId: this.currentSession.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

    } catch (error) {
      logger.error('Failed to refresh onboarding state:', error);
    }
  }

  /**
   * Get current onboarding state
   */
  getOnboardingState(): OnboardingState | null {
    return this.onboardingState;
  }

  /**
   * Save onboarding step data
   */
  async saveOnboardingStep(stepId: string, data: any): Promise<boolean> {
    try {
      if (!this.onboardingState) {
        await this.initializeSession();
      }

      if (this.onboardingState) {
        this.onboardingState.steps[stepId] = {
          completed: true,
          data: data,
          completed_at: new Date().toISOString()
        };

        this.onboardingState.currentStep = this.getNextStep(stepId);
        this.onboardingState.progress = this.calculateProgress();
        
        await this.saveOnboardingState();
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to save onboarding step:', error);
      return false;
    }
  }

  /**
   * Calculate onboarding progress
   */
  private calculateProgress(): number {
    if (!this.onboardingState) return 0;
    
    const totalSteps = Object.keys(this.onboardingState.steps).length;
    const completedSteps = Object.values(this.onboardingState.steps)
      .filter((step: any) => step.completed).length;
    
    return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  }

  /**
   * Get next step in onboarding flow
   */
  private getNextStep(currentStep: string): string {
    const stepOrder = ['profile', 'interests', 'goals', 'project_details', 'skills'];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex >= 0 && currentIndex < stepOrder.length - 1) {
      return stepOrder[currentIndex + 1];
    }
    
    return 'completed';
  }

  /**
   * Check if onboarding is complete
   */
  isOnboardingComplete(): boolean {
    return this.onboardingState?.completed === true;
  }

  /**
   * Clear session data
   */
  async clearSession(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('userSession');
      await SecureStore.deleteItemAsync('onboarding_state');
      
      this.currentSession = null;
      this.onboardingState = null;
      this.userMigrated = false;
      
      // Sign out from Supabase if signed in
      await supabase.auth.signOut();
      
      logger.info('🧹 Session cleared');
    } catch (error) {
      logger.error('Failed to clear session:', error);
    }
  }

  getCurrentStep(): string {
    return this.onboardingState?.currentStep || 'profile';
  }

  isMockSession(): boolean {
    return this.isMockUser;
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