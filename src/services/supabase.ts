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
  
  const message = customMessage || 
    error?.message || 
    'An unexpected error occurred. Please try again.';
  
  Alert.alert('Error', message);
  
  // Return a standardized error object for consistent handling
  return {
    error: true,
    message,
    details: error
  };
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