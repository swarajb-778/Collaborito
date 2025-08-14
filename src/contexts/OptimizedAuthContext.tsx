import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { optimizedOnboardingService, ProfileData, OnboardingProgress } from '../services/OptimizedOnboardingService';
import securityMonitoringService, { SecurityMonitoringService } from '../services/SecurityMonitoringService';
import sessionTimeoutService, { SessionTimeoutService } from '../services/SessionTimeoutService';
import { createLogger } from '../utils/logger';

const logger = createLogger('OptimizedAuthContext');

// Enhanced User interface with onboarding data
export interface ExtendedUser extends User {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  location?: string;
  jobTitle?: string;
  bio?: string;
  username?: string;
  profileImage?: string;
  oauthProvider?: string;
  onboardingStep?: string;
  onboardingCompleted?: boolean;
  onboardingProgress?: OnboardingProgress;
}

interface OptimizedAuthContextType {
  user: ExtendedUser | null;
  session: Session | null;
  loading: boolean;
  
  // Authentication methods
  signUp: (email: string, password: string, userData?: Partial<ExtendedUser>) => Promise<{ success: boolean; error?: string; user?: ExtendedUser }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: ExtendedUser; securityAlerts?: any[] }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  
  // OPTIMIZED: Profile management with database persistence
  updateUser: (userData: Partial<ExtendedUser>) => Promise<{ success: boolean; error?: string; user?: ExtendedUser }>;
  refreshUserProfile: () => Promise<void>;
  
  // OPTIMIZED: Onboarding management
  initializeOnboarding: () => Promise<{ success: boolean; error?: string }>;
  getOnboardingProgress: () => Promise<OnboardingProgress | null>;
  preloadOnboardingData: () => Promise<void>;
  
  // Cache management
  clearCache: () => Promise<void>;
  
  // Performance monitoring
  getPerformanceMetrics: () => Promise<any>;
  
  // Security monitoring
  isDeviceTrusted: () => Promise<boolean>;
  registerTrustedDevice: () => Promise<void>;
  getSecurityMetrics: () => Promise<any>;
  updateSessionActivity: () => Promise<void>;
  
  // Session timeout management
  getSessionInfo: () => { isActive: boolean; timeRemaining: number; lastActivity: Date | null; warningShown: boolean };
  extendSession: (additionalMinutes?: number) => void;
  setSessionTimeoutCallback: (callback: () => void) => void;
  setSessionWarningCallback: (callback: (minutes: number) => void) => void;
}

const OptimizedAuthContext = createContext<OptimizedAuthContextType | undefined>(undefined);

// Cache keys
const USER_CACHE_KEY = 'auth_user_cache';
const ONBOARDING_CACHE_KEY = 'auth_onboarding_cache';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export function OptimizedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Cache utilities
  const setCache = useCallback(async (key: string, data: any): Promise<void> => {
    try {
      const cacheData = { data, timestamp: Date.now() };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      logger.warn('Cache set failed:', error);
    }
  }, []);

  const getFromCache = useCallback(async (key: string): Promise<any | null> => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          return parsed.data;
        }
      }
    } catch (error) {
      logger.warn('Cache get failed:', error);
    }
    return null;
  }, []);

  // OPTIMIZED: Enhanced user profile loading with caching
  const loadUserProfile = useCallback(async (authUser: User): Promise<ExtendedUser> => {
    try {
      // Try cache first
      const cached = await getFromCache(USER_CACHE_KEY);
      if (cached && cached.id === authUser.id) {
        logger.info('📦 Returning cached user profile');
        return { ...authUser, ...cached };
      }

      logger.info('🔍 Loading user profile from database...');
      
      // Load from database with optimized query
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const extendedUser: ExtendedUser = {
        ...authUser,
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        fullName: profile?.full_name,
        location: profile?.location,
        jobTitle: profile?.job_title,
        bio: profile?.bio,
        onboardingStep: profile?.onboarding_step,
        onboardingCompleted: profile?.onboarding_completed
      };

      // Cache the result
      await setCache(USER_CACHE_KEY, extendedUser);
      
      logger.info('✅ User profile loaded and cached');
      return extendedUser;

    } catch (error) {
      logger.error('❌ Error loading user profile:', error);
      return authUser;
    }
  }, [getFromCache, setCache]);

  // OPTIMIZED: Initialize auth state with parallel loading
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        logger.info('🚀 Initializing optimized auth with security monitoring...');
        
        // Initialize security monitoring
        await securityMonitoringService.initialize();
        
        // Initialize session timeout service
        await sessionTimeoutService.initialize();
        
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user && mounted) {
          // Load user profile and preload onboarding data in parallel
          const [extendedUser] = await Promise.all([
            loadUserProfile(initialSession.user),
            optimizedOnboardingService.preloadOnboardingData()
          ]);
          
          setUser(extendedUser);
          setSession(initialSession);
        }
      } catch (error) {
        logger.error('❌ Auth initialization failed:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        logger.info(`🔄 Auth event: ${event}`);
        setSession(newSession);

        if (newSession?.user) {
          const extendedUser = await loadUserProfile(newSession.user);
          setUser(extendedUser);
        } else {
          setUser(null);
          // Clear cache on sign out
          await AsyncStorage.multiRemove([USER_CACHE_KEY, ONBOARDING_CACHE_KEY]);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  // OPTIMIZED: Sign up with profile initialization
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    userData?: Partial<ExtendedUser>
  ): Promise<{ success: boolean; error?: string; user?: ExtendedUser }> => {
    try {
      logger.info('📝 Optimized sign up process...');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData?.firstName,
            last_name: userData?.lastName
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Initialize profile if user data provided
        if (userData?.firstName && userData?.lastName) {
          await optimizedOnboardingService.saveProfile(data.user.id, {
            firstName: userData.firstName,
            lastName: userData.lastName,
            location: userData.location,
            jobTitle: userData.jobTitle,
            bio: userData.bio
          });
        }

        const extendedUser = await loadUserProfile(data.user);
        return { success: true, user: extendedUser };
      }

      return { success: true };
    } catch (error) {
      logger.error('❌ Sign up failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign up failed' 
      };
    }
  }, [loadUserProfile]);

  // OPTIMIZED: Sign in with profile preloading and security monitoring
  const signIn = useCallback(async (
    email: string, 
    password: string
  ): Promise<{ success: boolean; error?: string; user?: ExtendedUser; securityAlerts?: any[] }> => {
    try {
      logger.info('🔐 Optimized sign in process with security monitoring...');
      
      // Initialize security monitoring first
      await securityMonitoringService.initialize();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      // Record login attempt for security monitoring
      const securityResult = await securityMonitoringService.recordLoginAttempt(
        email,
        !error && !!data.user,
        error?.message
      );

      // Check if login should be blocked due to security concerns
      if (!securityResult.allowed) {
        return { 
          success: false, 
          error: securityResult.lockoutInfo ? 
            `Account temporarily locked. Try again in ${securityResult.lockoutInfo.remainingMinutes} minutes.` :
            'Login blocked due to security concerns.',
          securityAlerts: securityResult.securityAlerts
        };
      }

      if (error) {
        return { 
          success: false, 
          error: error.message,
          securityAlerts: securityResult.securityAlerts
        };
      }

      if (data.user) {
        // Load user profile and preload onboarding data in parallel
        const [extendedUser] = await Promise.all([
          loadUserProfile(data.user),
          optimizedOnboardingService.preloadOnboardingData()
        ]);
        
        // Start secure session monitoring
        await securityMonitoringService.startSecureSession(data.user.id, data.session?.access_token || '');
        
        // Start session timeout monitoring
        await sessionTimeoutService.startSession(data.user.id, data.session?.access_token || '');
        
        return { 
          success: true, 
          user: extendedUser,
          securityAlerts: securityResult.securityAlerts
        };
      }

      return { success: true, securityAlerts: securityResult.securityAlerts };
    } catch (error) {
      logger.error('❌ Sign in failed:', error);
      
      // Record failed attempt
      try {
        await securityMonitoringService.recordLoginAttempt(email, false, 'System error');
      } catch (secError) {
        logger.warn('Failed to record security attempt:', secError);
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign in failed' 
      };
    }
  }, [loadUserProfile]);

  // Sign out with security cleanup
  const signOut = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      logger.info('👋 Signing out with security cleanup...');
      
      // End security session
      await securityMonitoringService.endSession();
      
      // End session timeout monitoring
      await sessionTimeoutService.endSession();
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      // Clear all cache
      await AsyncStorage.multiRemove([USER_CACHE_KEY, ONBOARDING_CACHE_KEY]);
      
      return { success: true };
    } catch (error) {
      logger.error('❌ Sign out failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign out failed' 
      };
    }
  }, []);

  // OPTIMIZED: Update user with database persistence (FIXES CORE ISSUE)
  const updateUser = useCallback(async (
    userData: Partial<ExtendedUser>
  ): Promise<{ success: boolean; error?: string; user?: ExtendedUser }> => {
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      logger.info('💾 Updating user with database persistence...');

      // Use optimized service for profile update
      const result = await optimizedOnboardingService.saveProfile(user.id, {
        firstName: userData.firstName || user.firstName || '',
        lastName: userData.lastName || user.lastName || '',
        location: userData.location || user.location,
        jobTitle: userData.jobTitle || user.jobTitle,
        bio: userData.bio || user.bio
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Update local state
      const updatedUser: ExtendedUser = {
        ...user,
        ...userData,
        fullName: userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}` 
          : user.fullName
      };

      setUser(updatedUser);
      
      // Update cache
      await setCache(USER_CACHE_KEY, updatedUser);

      logger.info('✅ User updated with database persistence');
      return { success: true, user: updatedUser };

    } catch (error) {
      logger.error('❌ User update failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'User update failed' 
      };
    }
  }, [user, setCache]);

  // Refresh user profile
  const refreshUserProfile = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      logger.info('🔄 Refreshing user profile...');
      
      // Clear cache and reload
      await AsyncStorage.removeItem(USER_CACHE_KEY);
      const refreshedUser = await loadUserProfile(user);
      setUser(refreshedUser);
      
      logger.info('✅ User profile refreshed');
    } catch (error) {
      logger.error('❌ Profile refresh failed:', error);
    }
  }, [user, loadUserProfile]);

  // Initialize onboarding
  const initializeOnboarding = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      logger.info('🎯 Initializing onboarding...');
      
      // Preload onboarding data
      await optimizedOnboardingService.preloadOnboardingData();
      
      return { success: true };
    } catch (error) {
      logger.error('❌ Onboarding initialization failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Onboarding initialization failed' 
      };
    }
  }, [user]);

  // Get onboarding progress
  const getOnboardingProgress = useCallback(async (): Promise<OnboardingProgress | null> => {
    if (!user) return null;

    try {
      // Try cache first
      const cached = await getFromCache(ONBOARDING_CACHE_KEY);
      if (cached) {
        logger.info('📦 Returning cached onboarding progress');
        return cached;
      }

      logger.info('🔍 Fetching onboarding progress...');
      
      const result = await optimizedOnboardingService.getOnboardingProgress(user.id);
      
      if (result.success && result.data) {
        // Cache the result
        await setCache(ONBOARDING_CACHE_KEY, result.data);
        return result.data;
      }

      return null;
    } catch (error) {
      logger.error('❌ Failed to get onboarding progress:', error);
      return null;
    }
  }, [user, getFromCache, setCache]);

  // Preload onboarding data
  const preloadOnboardingData = useCallback(async (): Promise<void> => {
    await optimizedOnboardingService.preloadOnboardingData();
  }, []);

  // Clear cache
  const clearCache = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([USER_CACHE_KEY, ONBOARDING_CACHE_KEY]);
      logger.info('✅ Cache cleared');
    } catch (error) {
      logger.error('❌ Cache clear failed:', error);
    }
  }, []);

  // Get performance metrics
  const getPerformanceMetrics = useCallback(async (): Promise<any> => {
    try {
      // This would call the database function for performance metrics
      // Implementation depends on whether this should be available to users
      return null;
    } catch (error) {
      logger.error('❌ Failed to get performance metrics:', error);
      return null;
    }
  }, []);

  // Security monitoring methods
  const isDeviceTrusted = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    try {
      return await securityMonitoringService.isDeviceTrusted(user.id);
    } catch (error) {
      logger.error('❌ Failed to check device trust:', error);
      return false;
    }
  }, [user]);

  const registerTrustedDevice = useCallback(async (): Promise<void> => {
    if (!user) return;
    try {
      await securityMonitoringService.registerTrustedDevice(user.id);
      logger.info('✅ Device registered as trusted');
    } catch (error) {
      logger.error('❌ Failed to register trusted device:', error);
    }
  }, [user]);

  const getSecurityMetrics = useCallback(async (): Promise<any> => {
    try {
      return await securityMonitoringService.getSecurityMetrics();
    } catch (error) {
      logger.error('❌ Failed to get security metrics:', error);
      return null;
    }
  }, []);

  const updateSessionActivity = useCallback(async (): Promise<void> => {
    try {
      await securityMonitoringService.updateSessionActivity();
      sessionTimeoutService.recordActivity();
    } catch (error) {
      logger.error('❌ Failed to update session activity:', error);
    }
  }, []);

  // Session timeout management methods
  const getSessionInfo = useCallback(() => {
    return sessionTimeoutService.getSessionInfo();
  }, []);

  const extendSession = useCallback((additionalMinutes?: number) => {
    sessionTimeoutService.extendSession(additionalMinutes);
    logger.info('⏰ Session extended by user request');
  }, []);

  const setSessionTimeoutCallback = useCallback((callback: () => void) => {
    sessionTimeoutService.setSessionTimeoutCallback(async () => {
      logger.info('🔒 Session timeout triggered, signing out...');
      try {
        await signOut();
      } catch (error) {
        logger.error('❌ Error during timeout logout:', error);
      }
      callback();
    });
  }, [signOut]);

  const setSessionWarningCallback = useCallback((callback: (minutes: number) => void) => {
    sessionTimeoutService.setSessionWarningCallback(callback);
  }, []);

  const value: OptimizedAuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateUser,
    refreshUserProfile,
    initializeOnboarding,
    getOnboardingProgress,
    preloadOnboardingData,
    clearCache,
    getPerformanceMetrics,
    isDeviceTrusted,
    registerTrustedDevice,
    getSecurityMetrics,
    updateSessionActivity,
    getSessionInfo,
    extendSession,
    setSessionTimeoutCallback,
    setSessionWarningCallback
  };

  return (
    <OptimizedAuthContext.Provider value={value}>
      {children}
    </OptimizedAuthContext.Provider>
  );
}

export function useOptimizedAuth() {
  const context = useContext(OptimizedAuthContext);
  if (context === undefined) {
    throw new Error('useOptimizedAuth must be used within an OptimizedAuthProvider');
  }
  return context;
}

// Backward compatibility hook that uses the optimized context
export function useAuth() {
  return useOptimizedAuth();
} 