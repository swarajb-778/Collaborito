import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../services/supabase';
import { authService } from '../services/AuthService';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuthContext');

// Define User type for your app
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  profileImage: string | null;
  oauthProvider: string;
  isPending?: boolean; // For users created during rate limits
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loggedIn: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions for security
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUsername = (username: string): { isValid: boolean; error?: string } => {
  if (!username) {
    return { isValid: false, error: 'Username is required' };
  }
  
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }
  
  if (username.length > 30) {
    return { isValid: false, error: 'Username must be less than 30 characters long' };
  }
  
  // Allow alphanumeric characters, underscores, hyphens, and dots
  const usernameRegex = /^[a-zA-Z0-9._-]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, dots, underscores, and hyphens' };
  }
  
  // Username cannot start or end with special characters
  if (/^[._-]|[._-]$/.test(username)) {
    return { isValid: false, error: 'Username cannot start or end with dots, underscores, or hyphens' };
  }
  
  return { isValid: true };
};

const containsSqlInjection = (input: string): boolean => {
  // More targeted SQL injection detection
  const sqlPatterns = [
    // Actual SQL injection patterns
    /('|(\\'))/i,                    // Single quotes
    /(\-\-)/i,                       // SQL comments
    /(\;)/i,                         // Statement terminators
    /(\bunion\b)/i,                  // UNION keyword
    /(\bselect\b)/i,                 // SELECT keyword
    /(\binsert\b)/i,                 // INSERT keyword
    /(\bdelete\b)/i,                 // DELETE keyword
    /(\bupdate\b)/i,                 // UPDATE keyword
    /(\bdrop\b)/i,                   // DROP keyword
    /(\bcreate\b)/i,                 // CREATE keyword
    /(\balter\b)/i,                  // ALTER keyword
    /(\bexec\b|\bexecute\b)/i,       // EXEC/EXECUTE keywords
    /(<script>|<\/script>)/i,        // Script tags
    /(\bjavascript:)/i               // JavaScript protocol
  ];
  
  // Allow normal usernames with alphanumeric characters, underscores, and hyphens
  // Only flag if it contains actual SQL injection patterns
  return sqlPatterns.some(pattern => pattern.test(input));
};

const storeUserData = async (userData: User): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync('user', JSON.stringify(userData));
    await SecureStore.setItemAsync('userSession', JSON.stringify({
      userId: userData.id,
      lastLogin: new Date().toISOString(),
      version: '1.0'
    }));
    return true;
  } catch (error) {
    logger.error('Failed to store user data:', error);
    return false;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

  // Load user from storage on startup
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  // Monitor auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.info('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await handleSupabaseUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          await handleSignOut();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Process pending users periodically
  useEffect(() => {
    const interval = setInterval(() => {
      authService.processPendingUsers();
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const userData = await SecureStore.getItemAsync('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setLoggedIn(true);
        logger.info('User loaded from storage:', parsedUser.id);
      }
    } catch (error) {
      logger.error('Error loading user from storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSupabaseUser = async (supabaseUser: SupabaseUser) => {
    try {
      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        firstName: supabaseUser.user_metadata?.firstName || supabaseUser.user_metadata?.first_name || '',
        lastName: supabaseUser.user_metadata?.lastName || supabaseUser.user_metadata?.last_name || '',
        username: supabaseUser.user_metadata?.username || '',
        profileImage: supabaseUser.user_metadata?.avatar_url || null,
        oauthProvider: supabaseUser.app_metadata?.provider || 'email'
      };

      await storeUserData(userData);
      setUser(userData);
      setLoggedIn(true);
      
      logger.info('User data updated from Supabase:', userData.id);
    } catch (error) {
      logger.error('Error handling Supabase user:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('userSession');
      setUser(null);
      setLoggedIn(false);
      logger.info('User signed out and data cleared');
    } catch (error) {
      logger.error('Error during sign out cleanup:', error);
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      logger.info('🔐 Starting sign in process...');
      
      // Validate inputs
      if (!email || !validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      // Check for SQL injection
      if (containsSqlInjection(email) || containsSqlInjection(password)) {
        logger.error('Potential SQL injection attempt detected');
        throw new Error('Invalid characters detected in email or password');
      }
      
      // Use robust auth service
      const result = await authService.signIn(email, password);
      
      if (!result.success) {
        throw new Error(result.error || 'Sign in failed');
      }
      
      // User data will be updated via onAuthStateChange
      logger.info('✅ Sign in successful');
      return true;
      
    } catch (error) {
      logger.error('❌ Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username?: string): Promise<boolean> => {
    try {
      setLoading(true);
      logger.info('🚀 Starting robust signup process...');
      
      // Validate inputs
      if (!email || !validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      if (username) {
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.isValid) {
          logger.error('Username validation failed:', usernameValidation.error);
          throw new Error(usernameValidation.error || 'Invalid username format');
        }
        
        // Still check for SQL injection in username
        if (containsSqlInjection(username)) {
          logger.error('Potential SQL injection attempt detected in username');
          throw new Error('Username contains prohibited characters');
        }
      }
      
      // Check for SQL injection
      if (containsSqlInjection(email) || containsSqlInjection(password)) {
        logger.error('Potential SQL injection attempt detected');
        throw new Error('Invalid characters detected in email or password');
      }
      
      // Use robust auth service with rate limit handling
      const result = await authService.signUp({
        email,
        password,
        metadata: {
          username: username || '',
          firstName: '',
          lastName: ''
        }
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Account creation failed');
      }
      
      // Handle different signup results
      if (result.isPending) {
        logger.info('📝 User created as pending due to rate limits');
        
        // Create local user data for pending users
        const pendingUserData: User = {
          id: result.user.id,
          email: result.user.email,
          firstName: '',
          lastName: '',
          username: username || '',
          profileImage: null,
          oauthProvider: 'email',
          isPending: true
        };
        
        await storeUserData(pendingUserData);
        setUser(pendingUserData);
        setLoggedIn(true);
        
        Alert.alert(
          'Account Created!',
          'Your account has been created successfully. Email verification may take a few minutes due to high demand.',
          [{ text: 'Continue' }]
        );
        
      } else if (result.needsConfirmation) {
        logger.info('📧 User created, email confirmation required');
        
        Alert.alert(
          'Check Your Email!',
          'We\'ve sent you a confirmation email. Please check your inbox and click the link to verify your account.',
          [{ text: 'OK' }]
        );
        
        // Don't automatically sign in until email is confirmed
        return true;
        
      } else {
        logger.info('✅ User created and confirmed immediately');
        // User data will be updated via onAuthStateChange
      }
      
      logger.info('✅ Signup process completed successfully');
      return true;
      
    } catch (error) {
      logger.error('❌ Signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      logger.info('🚪 Starting sign out process...');
      
      // Use robust auth service
      const result = await authService.signOut();
      
      if (!result.success) {
        logger.warn('Supabase sign out failed, continuing with local cleanup');
      }
      
      // Clean up local storage regardless
      await handleSignOut();
      
      logger.info('✅ Sign out completed');
      
    } catch (error) {
      logger.error('❌ Sign out error:', error);
      
      // Force local cleanup even if Supabase fails
      await handleSignOut();
      
      Alert.alert('Error', 'Failed to sign out completely. Please restart the app if you continue to have issues.');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    try {
      if (!user) {
        throw new Error('No user to update');
      }

      logger.info('🔄 Updating user profile in database...');
      
      // Import ProfileService dynamically to avoid circular imports
      const { ProfileService } = await import('../services/ProfileService');
      
      // Update profile in Supabase database
      const result = await ProfileService.updateProfile(user.id, {
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        // Add other fields as needed
      }, 'interests'); // Move to next step after profile update

      if (!result.success) {
        logger.error('❌ Failed to update profile in database:', result.error);
        throw new Error(result.error || 'Failed to update profile');
      }
      
      // Update local user data
      const updatedUser = { ...user, ...userData };
      await storeUserData(updatedUser);
      setUser(updatedUser);
      
      logger.info('✅ User data updated successfully in database and locally');
      return true;
      
    } catch (error) {
      logger.error('❌ Error updating user:', error);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    loggedIn,
    signUp,
    signIn,
    signOut,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};