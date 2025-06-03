import { supabase } from '../services/supabase';
import { Alert } from 'react-native';

export interface CreateProfileData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  full_name?: string;
  profile_image_path?: string;
  onboarding_completed?: boolean;
  onboarding_step?: string;
}

/**
 * Creates or updates a user profile in the profiles table
 * This function ensures the profile exists before other operations
 */
export async function ensureUserProfile(supabaseUser: any, additionalData?: Partial<CreateProfileData>) {
  try {
    console.log('🔧 Ensuring user profile exists for:', supabaseUser.id);
    
    // First, check if profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing profile:', fetchError);
      throw fetchError;
    }
    
    // Prepare profile data
    const profileData: CreateProfileData = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      first_name: additionalData?.first_name || 
                 supabaseUser.user_metadata?.given_name || 
                 existingProfile?.first_name || '',
      last_name: additionalData?.last_name || 
                supabaseUser.user_metadata?.family_name || 
                existingProfile?.last_name || '',
      username: additionalData?.username || 
               supabaseUser.user_metadata?.username || 
               existingProfile?.username || '',
      full_name: additionalData?.full_name || 
                supabaseUser.user_metadata?.full_name || 
                existingProfile?.full_name || '',
      profile_image_path: additionalData?.profile_image_path || 
                         supabaseUser.user_metadata?.avatar_url || 
                         existingProfile?.profile_image_path || null,
      onboarding_completed: additionalData?.onboarding_completed ?? 
                           existingProfile?.onboarding_completed ?? false,
      onboarding_step: additionalData?.onboarding_step || 
                      existingProfile?.onboarding_step || 'profile'
    };
    
    // Use upsert to create or update the profile
    const { data: profile, error: upsertError } = await supabase
      .from('profiles')
      .upsert(profileData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single();
    
    if (upsertError) {
      console.error('Error upserting profile:', upsertError);
      throw upsertError;
    }
    
    console.log('✅ User profile ensured successfully:', profile?.id);
    return profile;
    
  } catch (error) {
    console.error('❌ Error ensuring user profile:', error);
    throw error;
  }
}

/**
 * Creates a User object with robust data handling
 */
export function createUserObject(supabaseUser: any, profile?: any) {
  try {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || profile?.email || '',
      firstName: profile?.first_name || 
                supabaseUser.user_metadata?.given_name || 
                supabaseUser.user_metadata?.first_name || '',
      lastName: profile?.last_name || 
               supabaseUser.user_metadata?.family_name || 
               supabaseUser.user_metadata?.last_name || '',
      username: profile?.username || 
               supabaseUser.user_metadata?.username || '',
      profileImage: profile?.profile_image_path || 
                   supabaseUser.user_metadata?.avatar_url || null,
      oauthProvider: supabaseUser.app_metadata?.provider || 'email',
      user_metadata: supabaseUser.user_metadata,
      app_metadata: supabaseUser.app_metadata
    };
  } catch (error) {
    console.error('Error creating user object:', error);
    throw error;
  }
}

/**
 * Handles authentication errors with user-friendly messages
 */
export function handleAuthError(error: any, operation: string = 'authentication') {
  console.error(`${operation} error:`, error);
  
  let message = 'An unexpected error occurred. Please try again.';
  
  if (error?.message) {
    // Handle specific Supabase error messages
    if (error.message.includes('Invalid login credentials')) {
      message = 'Invalid email or password. Please check your credentials and try again.';
    } else if (error.message.includes('Email not confirmed')) {
      message = 'Please check your email and click the confirmation link before signing in.';
    } else if (error.message.includes('User already registered')) {
      message = 'An account with this email already exists. Please sign in instead.';
    } else if (error.message.includes('Password should be at least')) {
      message = 'Password must be at least 6 characters long.';
    } else if (error.message.includes('Unable to validate email address')) {
      message = 'Please enter a valid email address.';
    } else if (error.message.includes('signup is disabled')) {
      message = 'Account registration is currently disabled. Please contact support.';
    } else if (error.message.includes('Database error')) {
      message = 'Database connection issue. Please try again in a moment.';
    } else {
      message = error.message;
    }
  }
  
  return message;
}

/**
 * Validates onboarding data before submission
 */
export function validateOnboardingData(data: any) {
  const errors: string[] = [];
  
  if (!data.firstName?.trim()) {
    errors.push('First name is required');
  }
  
  if (!data.lastName?.trim()) {
    errors.push('Last name is required');
  }
  
  if (!data.location?.trim()) {
    errors.push('Location is required');
  }
  
  if (!data.jobTitle?.trim()) {
    errors.push('Job title is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Retry mechanism for database operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError;
} 