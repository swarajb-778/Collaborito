import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { AppState, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import { makeRedirectUri } from 'expo-auth-session';
import { decode } from 'base64-arraybuffer';
import { DevConfig } from '@/src/config/development';

// Types for project members and roles
import { Project, ProjectMember, Profile } from '../types/supabase';

// Initialize Supabase with environment variables
const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Missing Supabase URL or Anon Key. Please set up your environment variables.');
}

// Get the base URL for the app based on the scheme
const getBaseUrl = () => {
  const scheme = Constants.expoConfig?.scheme || 'collaborito';
  return Linking.createURL('/');
};

// Define the role hierarchy for permission checking
const roleHierarchy: Record<string, number> = {
  owner: 3,
  admin: 2,
  member: 1
};

// Use development configuration utility
const supabaseConfig = DevConfig.getSupabaseConfig();
const isDevelopmentMode = !supabaseConfig.isValid || DevConfig.isDevelopment;

// Log development information
DevConfig.logDevInfo();

// Create a custom storage implementation for Supabase to use with AsyncStorage
class LargeSecureStore {
  async getItem(key: string): Promise<string | null> {
    try {
      if (isDevelopmentMode) {
        return await AsyncStorage.getItem(key);
      }
    
      // Check if the value is stored in SecureStore first
      const value = await SecureStore.getItemAsync(key);
      if (value) {
        return value;
      }
      
      // If not in SecureStore, check FileSystem
      const fileUri = `${FileSystem.documentDirectory}securestore/${key}`;
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists) {
        return await FileSystem.readAsStringAsync(fileUri);
      }
      
      return null;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isDevelopmentMode) {
        await AsyncStorage.setItem(key, value);
        return;
      }
    
      try {
        // Try to store in SecureStore first
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        // If SecureStore fails (e.g., value too large), use FileSystem
        const fileUri = `${FileSystem.documentDirectory}securestore/`;
        const dirInfo = await FileSystem.getInfoAsync(fileUri);
        
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(fileUri, { intermediates: true });
        }
        
        await FileSystem.writeAsStringAsync(`${fileUri}${key}`, value);
      }
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (isDevelopmentMode) {
        await AsyncStorage.removeItem(key);
        return;
      }
    
      // Remove from SecureStore
      await SecureStore.deleteItemAsync(key);
      
      // Also remove from FileSystem if it exists there
      const fileUri = `${FileSystem.documentDirectory}securestore/${key}`;
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists) {
        await FileSystem.deleteAsync(fileUri);
      }
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  }
}

// Initialize Supabase with validated configuration
export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    storage: new LargeSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Listen for app state changes to refresh token if needed
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

// Helper functions for Supabase
export const getRedirectUri = () => {
  // For development in Expo Go, use the appropriate redirect
  return makeRedirectUri({
    scheme: isDevelopmentMode ? 'exp' : 'collaborito',
    path: 'auth/callback',
  });
};

/**
 * Handles general API errors with appropriate user feedback
 */
export const handleError = (error: any, customMessage?: string) => {
  console.error('Supabase error:', error);
  
  // Enhanced error message mapping
  let message = customMessage || 'An unexpected error occurred. Please try again.';
  
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116':
        message = 'No data found matching your request.';
        break;
      case '23505':
        message = 'This item already exists. Please try a different value.';
        break;
      case '23503':
        message = 'Cannot delete this item as it is referenced by other data.';
        break;
      case '42501':
        message = 'You do not have permission to perform this action.';
        break;
      case 'invalid_jwt':
        message = 'Your session has expired. Please sign in again.';
        break;
      default:
        message = error?.message || message;
    }
  } else if (error?.message) {
    message = error.message;
  }
  
  Alert.alert('Error', message);
  
  // Return a standardized error object for consistent handling
  return {
    error: true,
    message,
    code: error?.code,
    details: error
  };
};

/**
 * Password reset utilities
 */
export const passwordResetService = {
  /**
   * Sends a password reset email to the user
   */
  async sendResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getBaseUrl()}reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send reset email'
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Password reset service error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred'
      };
    }
  },

  /**
   * Updates user password after reset
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password update error:', error);
        return {
          success: false,
          error: error.message || 'Failed to update password'
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Password update service error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred'
      };
    }
  },

  /**
   * Sets session from reset link parameters
   */
  async setSessionFromResetLink(accessToken: string, refreshToken: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (error) {
        console.error('Session set error:', error);
        return {
          success: false,
          error: 'Invalid or expired reset link'
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Set session service error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred'
      };
    }
  },

  /**
   * Validates password strength
   */
  validatePasswordStrength(password: string): { 
    isValid: boolean; 
    strength: number; 
    feedback: string[] 
  } {
    const feedback: string[] = [];
    let strength = 0;

    if (password.length >= 8) {
      strength += 25;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }

    if (/[a-z]/.test(password)) {
      strength += 25;
    } else {
      feedback.push('Include lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
      strength += 25;
    } else {
      feedback.push('Include uppercase letters');
    }

    if (/[0-9]/.test(password)) {
      strength += 25;
    } else {
      feedback.push('Include numbers');
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      strength += 25;
    } else {
      feedback.push('Include special characters');
    }

    return {
      isValid: strength >= 75,
      strength: Math.min(strength, 100),
      feedback
    };
  }
};

/**
 * Enhanced query wrapper with automatic retry and error handling
 */
export const executeSupabaseQuery = async <T>(
  queryFn: () => Promise<{ data: T; error: any }>,
  options: {
    retries?: number;
    retryDelay?: number;
    customErrorMessage?: string;
    suppressAlert?: boolean;
  } = {}
): Promise<{ data: T | null; error: any; success: boolean }> => {
  const { retries = 2, retryDelay = 1000, customErrorMessage, suppressAlert = false } = options;
  
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await queryFn();
      
      if (result.error) {
        lastError = result.error;
        
        // Check if it's a retryable error
        const isRetryable = ['network_error', 'timeout', '503', '502', '500'].includes(
          result.error.code || result.error.status
        );
        
        if (attempt < retries && isRetryable) {
          console.warn(`Query attempt ${attempt + 1} failed, retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        // Handle error
        if (!suppressAlert) {
          handleError(result.error, customErrorMessage);
        }
        
        return {
          data: null,
          error: result.error,
          success: false
        };
      }
      
      return {
        data: result.data,
        error: null,
        success: true
      };
      
    } catch (error) {
      lastError = error;
      console.error(`Query attempt ${attempt + 1} failed:`, error);
      
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
    }
  }
  
  // All attempts failed
  if (!suppressAlert) {
    handleError(lastError, customErrorMessage);
  }
  
  return {
    data: null,
    error: lastError,
    success: false
  };
};

/**
 * Validate database connection and configuration
 */
export const validateSupabaseConnection = async (): Promise<{
  isValid: boolean;
  error?: string;
  details?: any;
}> => {
  try {
    // Test basic connectivity
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        isValid: false,
        error: 'Failed to connect to Supabase',
        details: error
      };
    }
    
    // Test database query
    const { error: queryError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (queryError) {
      return {
        isValid: false,
        error: 'Database connection failed',
        details: queryError
      };
    }
    
    return { isValid: true };
    
  } catch (error) {
    return {
      isValid: false,
      error: 'Connection validation failed',
      details: error
    };
  }
};

/**
 * Checks if a user has access to perform an action in a project based on their role
 * @param userId The user's ID
 * @param projectId The project ID to check
 * @param requiredRole The minimum role required (defaults to 'member')
 * @returns Promise with boolean indicating if the user has access
 */
export const checkProjectAccess = async (
  userId: string, 
  projectId: string, 
  requiredRole: 'member' | 'admin' | 'owner' = 'member'
): Promise<boolean> => {
  try {
    // Quick validation
    if (!userId || !projectId) {
      console.warn('Invalid params in checkProjectAccess:', { userId, projectId });
      return false;
    }

    // In development mode, just return true for convenience
    if (isDevelopmentMode) {
      console.log('Development mode: project access check bypassed');
      return true;
    }

    // Get the user's role in the project
    const { data, error } = await supabase
      .from('project_members')
      .select('role')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .single();

    if (error) {
      console.error('Error checking project access:', error.message);
      return false;
    }

    // If no data found, user is not a member
    if (!data) {
      return false;
    }

    // Check if the user's role is sufficient
    const userRoleLevel = roleHierarchy[data.role as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    return userRoleLevel >= requiredRoleLevel;
  } catch (error) {
    console.error('Exception checking project access:', error);
    return false;
  }
};

/**
 * Uploads a file to Supabase storage
 * @param bucket The storage bucket name
 * @param path The path within the bucket
 * @param file The file to upload (base64 string)
 * @param fileType The mime type of the file
 * @returns The URL of the uploaded file
 */
export const uploadFile = async (
  bucket: string,
  path: string,
  file: string,
  fileType: string
): Promise<string> => {
  try {
    if (isDevelopmentMode) {
      // Return a dummy URL in development mode
      console.log(`Development mode: simulating file upload to ${bucket}/${path}`);
      return `https://development-placeholder.com/${bucket}/${path}`;
    }

    // Extract the base64 data (remove data:image/jpeg;base64, part if present)
    const base64Data = file.includes('base64,') 
      ? file.split('base64,')[1] 
      : file;

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, decode(base64Data), {
        contentType: fileType,
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Error uploading file: ${uploadError.message}`);
    }

    // Get the public URL
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  } catch (error: any) {
    console.error('Error in uploadFile:', error.message);
    throw error;
  }
};

/**
 * Creates a signed URL for accessing private files
 * @param bucket The storage bucket name
 * @param path The path to the file
 * @param expiresIn Expiration time in seconds (default: 60)
 * @returns Signed URL for temporary access
 */
export const getSignedUrl = async (
  bucket: string,
  path: string,
  expiresIn: number = 60
): Promise<string> => {
  try {
    if (isDevelopmentMode) {
      // Return a dummy URL in development mode
      return `https://development-placeholder.com/signed/${bucket}/${path}`;
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Error creating signed URL: ${error.message}`);
    }

    return data.signedUrl;
  } catch (error: any) {
    console.error('Error in getSignedUrl:', error.message);
    throw error;
  }
};

/**
 * Wrapper for Supabase queries with improved error handling
 * @param queryFn Function that returns a Supabase query
 * @returns Promise with data and error
 */
export async function supabaseQuery<T>(
  queryFn: () => Promise<{ data: T; error: any }>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      console.error('Supabase query error:', error.message);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (err: any) {
    console.error('Unexpected error during Supabase query:', err.message);
    return { data: null, error: err.message };
  }
}

// TypeScript interfaces for Supabase tables
export interface User {
  id: string;
  created_at: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  linkedin_id?: string;
}

export interface Message {
  id: string;
  created_at: string;
  project_id: string;
  user_id: string;
  content: string;
}

export interface Task {
  id: string;
  created_at: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  assigned_to?: string;
}

// For administrative operations, create a separate client with service role
const SUPABASE_SERVICE_ROLE_KEY = Constants.expoConfig?.extra?.SUPABASE_SERVICE_ROLE_KEY || '';

// Admin client for server-side operations (if service role key is available)
export const supabaseAdmin = createClient(
  supabaseConfig.url, 
  SUPABASE_SERVICE_ROLE_KEY || supabaseConfig.anonKey, // Fallback to anon key if no service role
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
); 