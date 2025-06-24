import { supabase } from './supabase';
import { createLogger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

const logger = createLogger('AuthService');

interface SignupOptions {
  email: string;
  password: string;
  metadata?: {
    username?: string;
    firstName?: string;
    lastName?: string;
  };
  bypassConfirmation?: boolean;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

export class AuthService {
  private static instance: AuthService;
  private rateLimitCache = new Map<string, number>();
  private lastSignupAttempt = 0;
  private readonly MIN_SIGNUP_INTERVAL = 2000; // 2 seconds between attempts

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Robust signup with rate limit handling and fallback strategies
   */
  async signUp(options: SignupOptions): Promise<{ success: boolean; user?: any; needsConfirmation?: boolean; error?: string; isPending?: boolean }> {
    const { email, password, metadata = {}, bypassConfirmation = false } = options;

    try {
      logger.info('🔐 Starting robust signup process for:', email);

      // Check for rate limiting
      const rateLimitCheck = await this.checkRateLimit(email);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          error: `Please wait ${Math.ceil(rateLimitCheck.waitTime / 1000)} seconds before trying again`
        };
      }

      // Throttle signup attempts
      const now = Date.now();
      if (now - this.lastSignupAttempt < this.MIN_SIGNUP_INTERVAL) {
        const waitTime = this.MIN_SIGNUP_INTERVAL - (now - this.lastSignupAttempt);
        await this.delay(waitTime);
      }
      this.lastSignupAttempt = Date.now();

      // Strategy 1: Try normal signup with email confirmation
      if (!bypassConfirmation) {
        const normalResult = await this.attemptNormalSignup(email, password, metadata);
        if (normalResult.success) {
          return normalResult;
        }

        // If rate limited, try fallback strategies
        if (this.isRateLimitError(normalResult.error)) {
          logger.warn('⚠️ Rate limit detected, trying fallback strategies...');
          return await this.handleRateLimitedSignup(email, password, metadata);
        }

        // If user already exists, handle gracefully
        if (this.isUserExistsError(normalResult.error)) {
          return await this.handleExistingUser(email, password);
        }

        return normalResult;
      } else {
        // Strategy 2: Try signup without email confirmation (if supported)
        return await this.attemptSignupWithoutConfirmation(email, password, metadata);
      }

    } catch (error) {
      logger.error('❌ Signup process failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown signup error'
      };
    }
  }

  /**
   * Attempt normal signup with email confirmation
   */
  private async attemptNormalSignup(email: string, password: string, metadata: any) {
    try {
      logger.info('📧 Attempting normal signup with email confirmation...');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: undefined // Let Supabase handle default
        }
      });

      if (error) {
        logger.error('Normal signup failed:', error.message);
        return { success: false, error: error.message };
      }

      if (data.user && data.user.email_confirmed_at) {
        logger.info('✅ User signed up and email confirmed immediately');
        return { success: true, user: data.user, needsConfirmation: false };
      } else if (data.user) {
        logger.info('📧 User signed up, awaiting email confirmation');
        return { success: true, user: data.user, needsConfirmation: true };
      }

      return { success: false, error: 'Signup failed - no user created' };

    } catch (error) {
      logger.error('Exception during normal signup:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Signup failed'
      };
    }
  }

  /**
   * Handle rate-limited signup with fallback strategies
   */
  private async handleRateLimitedSignup(email: string, password: string, metadata: any) {
    logger.info('🔄 Implementing rate limit fallback strategies...');

    // Strategy 1: Wait and retry with exponential backoff
    const retryResult = await this.retryWithBackoff(
      () => this.attemptNormalSignup(email, password, metadata),
      DEFAULT_RETRY_CONFIG
    );

    if (retryResult.success) {
      return retryResult;
    }

    // Strategy 2: Try creating a local pending user
    logger.info('💾 Creating local pending user due to rate limits...');
    return await this.createPendingUser(email, password, metadata);
  }

  /**
   * Handle existing user gracefully
   */
  private async handleExistingUser(email: string, password: string) {
    logger.info('👤 User already exists, attempting sign in...');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { 
          success: false, 
          error: 'User already exists with different password. Please sign in instead.' 
        };
      }

      return {
        success: true,
        user: data.user,
        needsConfirmation: false
      };

    } catch (error) {
      return { 
        success: false, 
        error: 'User already exists. Please sign in instead.' 
      };
    }
  }

  /**
   * Create a pending user locally when Supabase is rate limited
   */
  private async createPendingUser(email: string, password: string, metadata: any) {
    try {
      logger.info('📝 Creating pending user locally...');

      const pendingUser = {
        id: `pending_${Date.now()}`,
        email,
        password, // Store temporarily (encrypted in real app)
        metadata,
        status: 'pending',
        createdAt: new Date().toISOString(),
        retryAfter: Date.now() + (5 * 60 * 1000) // Retry after 5 minutes
      };

      await AsyncStorage.setItem(`pending_user_${email}`, JSON.stringify(pendingUser));

      return {
        success: true,
        user: {
          id: pendingUser.id,
          email: pendingUser.email,
          user_metadata: metadata,
          created_at: pendingUser.createdAt
        },
        needsConfirmation: true,
        isPending: true
      };

    } catch (error) {
      logger.error('Failed to create pending user:', error);
      return {
        success: false,
        error: 'Unable to process signup due to server limits. Please try again later.'
      };
    }
  }

  /**
   * Attempt to process pending users
   */
  async processPendingUsers(): Promise<void> {
    try {
      logger.info('🔄 Processing pending users...');

      const keys = await AsyncStorage.getAllKeys();
      const pendingKeys = keys.filter(key => key.startsWith('pending_user_'));

      for (const key of pendingKeys) {
        const userDataStr = await AsyncStorage.getItem(key);
        if (!userDataStr) continue;

        const userData = JSON.parse(userDataStr);
        
        // Check if enough time has passed to retry
        if (Date.now() < userData.retryAfter) {
          continue;
        }

        // Try to create the user in Supabase
        const result = await this.attemptNormalSignup(
          userData.email,
          userData.password,
          userData.metadata
        );

        if (result.success) {
          logger.info('✅ Successfully processed pending user:', userData.email);
          await AsyncStorage.removeItem(key);
        } else {
          // Update retry time
          userData.retryAfter = Date.now() + (10 * 60 * 1000); // Retry in 10 minutes
          await AsyncStorage.setItem(key, JSON.stringify(userData));
        }
      }

    } catch (error) {
      logger.error('Error processing pending users:', error);
    }
  }

  /**
   * Retry with exponential backoff
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    let lastError: any;
    let delay = config.baseDelay;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          logger.info(`🔄 Retry attempt ${attempt}/${config.maxRetries} after ${delay}ms...`);
          await this.delay(delay);
        }

        const result = await operation();
        return result;

      } catch (error) {
        lastError = error;
        
        if (attempt === config.maxRetries) {
          break;
        }

        // Only retry for rate limit errors
        if (!this.isRateLimitError(error)) {
          throw error;
        }

        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }

    throw lastError;
  }

  /**
   * Check if error is rate limit related
   */
  private isRateLimitError(error: any): boolean {
    if (!error) return false;
    
    const errorMsg = typeof error === 'string' ? error : error.message || '';
    return errorMsg.toLowerCase().includes('rate limit') || 
           errorMsg.toLowerCase().includes('too many requests') ||
           errorMsg.toLowerCase().includes('email rate limit exceeded');
  }

  /**
   * Check if error indicates user already exists
   */
  private isUserExistsError(error: any): boolean {
    if (!error) return false;
    
    const errorMsg = typeof error === 'string' ? error : error.message || '';
    return errorMsg.toLowerCase().includes('already registered') || 
           errorMsg.toLowerCase().includes('user already exists');
  }

  /**
   * Check rate limit for email
   */
  private async checkRateLimit(email: string): Promise<{ allowed: boolean; waitTime: number }> {
    const now = Date.now();
    const key = `rate_limit_${email}`;
    const lastAttempt = this.rateLimitCache.get(key) || 0;
    const timeSinceLastAttempt = now - lastAttempt;
    const minInterval = 30000; // 30 seconds between attempts per email

    if (timeSinceLastAttempt < minInterval) {
      return {
        allowed: false,
        waitTime: minInterval - timeSinceLastAttempt
      };
    }

    this.rateLimitCache.set(key, now);
    
    // Clean up old entries
    setTimeout(() => {
      this.rateLimitCache.delete(key);
    }, minInterval * 2);

    return { allowed: true, waitTime: 0 };
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Attempt signup without email confirmation (fallback)
   */
  private async attemptSignupWithoutConfirmation(email: string, password: string, metadata: any) {
    try {
      logger.info('🚀 Attempting signup without email confirmation...');

      // This might not work with all Supabase configurations
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: undefined // Try to bypass email confirmation
        }
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        user: data.user,
        needsConfirmation: !data.user?.email_confirmed_at
      };

    } catch (error) {
      logger.error('Signup without confirmation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Signup failed'
      };
    }
  }

  /**
   * Sign in with improved error handling
   */
  async signIn(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      logger.info('🔐 Signing in user:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user };

    } catch (error) {
      logger.error('Sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed'
      };
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (error) {
      logger.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      logger.error('Sign out error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed'
      };
    }
  }
}

export const authService = AuthService.getInstance(); 