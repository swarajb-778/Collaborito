import { createContext, useContext, useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { makeRedirectUri, useAuthRequest, ResponseType } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../services/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// For the development mock server
import { startServer } from '../utils/mockAuthServer';
import { constants } from '../constants';

// Define User type - updated to work with Supabase
export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  profileImage: string | null;
  oauthProvider: string;
  supabaseUser?: SupabaseUser; // Store the actual Supabase user object
  // Keeping these for backward compatibility
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
  app_metadata?: {
    roles?: string[];
    provider?: string;
  };
};

// LinkedIn API response types
interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  id_token?: string;
  error?: string;
  error_description?: string;
}

interface LinkedInProfileResponse {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: {
    'displayImage~'?: {
      elements?: Array<{
        identifiers?: Array<{
          identifier?: string;
        }>;
      }>;
    };
  };
}

interface LinkedInEmailResponse {
  elements: Array<{
    'handle~': {
      emailAddress: string;
    };
  }>;
}

// OIDC user info response
interface OpenIDUserInfoResponse {
  sub: string;
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

// LinkedIn configuration
const LINKEDIN_CONFIG = {
  clientId: constants.auth.linkedin.clientId,
  clientSecret: constants.auth.linkedin.clientSecret,
  scopes: constants.auth.linkedin.scopes,
  authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
  tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
  userInfoEndpoint: 'https://api.linkedin.com/v2/userinfo',
  redirectUri: constants.auth.linkedin.redirectUri,
  appRedirectScheme: constants.appScheme,
} as const;

// Create context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, username?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  signInWithLinkedIn: () => Promise<void>;
  signInWithDemo: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mockServer, setMockServer] = useState<{ stop: () => void } | null>(null);

  useEffect(() => {
    void loadUser();
    
    // Set up deep link listener for handling OAuth callbacks
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Set up Supabase auth state listener
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Supabase auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await handleSupabaseSignIn(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Token refreshed for user:', session.user.id);
        }
      }
    );
    
    // In development, start the mock auth server
    if (__DEV__) {
      const server = startServer();
      setMockServer(server);
    }
    
    return () => {
      subscription.remove();
      authSubscription.unsubscribe();
      // Clean up the mock server if it exists
      if (mockServer) {
        mockServer.stop();
      }
    };
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      
      // Check if there's an active Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting Supabase session:', error);
        return false;
      }
      
      if (session?.user) {
        console.log('Found active Supabase session for user:', session.user.id);
        await handleSupabaseSignIn(session.user);
        return true;
      }
      
      console.log('No active Supabase session found');
      return false;
    } catch (error) {
      console.error('Error loading user:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Convert Supabase user to our User type and load profile data
  const handleSupabaseSignIn = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Handling Supabase sign in for user:', supabaseUser.id);
      
      // Get user profile from our profiles table
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
      
      // If profile doesn't exist, create it
      if (error && error.code === 'PGRST116') {
        console.log('Profile not found, creating new profile for user:', supabaseUser.id);
        
        const newProfile = {
          id: supabaseUser.id,
          full_name: supabaseUser.user_metadata?.full_name || '',
          avatar_url: supabaseUser.user_metadata?.avatar_url || null,
          linkedin_id: supabaseUser.user_metadata?.linkedin_id || null,
          first_name: supabaseUser.user_metadata?.first_name || '',
          last_name: supabaseUser.user_metadata?.last_name || '',
          onboarding_completed: false,
          onboarding_step: 'profile'
        };
        
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating profile:', createError);
          throw createError;
        }
        
        profile = createdProfile;
      } else if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      // Create our User object
      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        firstName: profile?.first_name || supabaseUser.user_metadata?.first_name || '',
        lastName: profile?.last_name || supabaseUser.user_metadata?.last_name || '',
        username: supabaseUser.user_metadata?.username || '',
        profileImage: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url || null,
        oauthProvider: supabaseUser.app_metadata?.provider || 'email',
        supabaseUser: supabaseUser,
        user_metadata: supabaseUser.user_metadata,
        app_metadata: supabaseUser.app_metadata
      };
      
      setUser(userData);
      console.log('User loaded successfully:', userData.id);
      
    } catch (error) {
      console.error('Error handling Supabase sign in:', error);
      // Sign out on error to prevent auth loops
      await supabase.auth.signOut();
    }
  };

  // Deep link handler 
  const handleDeepLink = async (event: { url: string }) => {
    console.log('Deep link received:', event.url);
    
    // Check if this is our LinkedIn auth callback
    if (event.url.includes('collaborito://auth')) {
      console.log('Handling LinkedIn auth callback');
      
      try {
        // Extract the query parameters from the deep link URL
        const url = new URL(event.url);
        const params = url.searchParams;
        
        // If the URL doesn't parse correctly, try to extract manually
        let code, state, error;
        
        if (params.size === 0 && event.url.includes('?')) {
          const queryPart = event.url.split('?')[1];
          if (queryPart) {
            const queryParams = queryPart.split('&');
            for (const param of queryParams) {
              const [key, value] = param.split('=');
              if (key === 'code') code = decodeURIComponent(value);
              if (key === 'state') state = decodeURIComponent(value);
              if (key === 'error') error = decodeURIComponent(value);
            }
          }
        } else {
          code = params.get('code');
          state = params.get('state');
          error = params.get('error');
        }
        
        console.log('Extracted params:', { 
          hasCode: !!code, 
          hasState: !!state, 
          hasError: !!error 
        });
        
        if (error) {
          console.error('OAuth error returned:', error);
          Alert.alert('Authentication Error', `LinkedIn returned an error: ${error}`);
          return;
        }
        
        if (code) {
          await handleLinkedInAuthCallback({ url: event.url });
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Starting sign in with email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });
      
      if (error) {
        console.error('Supabase sign in error:', error);
        throw new Error(error.message);
      }
      
      if (data.user) {
        console.log('Sign in successful:', data.user.id);
        // handleSupabaseSignIn will be called automatically by the auth state listener
        return true;
      }
      
      throw new Error('Sign in failed - no user returned');
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      setLoading(true);
      console.log('Starting signup process with username:', username);
      console.log('Signing up with email:', email, 'username:', username);
      
      // Validate inputs
      if (!email || !validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            username: username || '',
            first_name: '',
            last_name: ''
          }
        }
      });
      
      if (error) {
        console.error('Supabase sign up error:', error);
        throw new Error(error.message);
      }
      
      if (data.user) {
        console.log('Sign up successful:', data.user.id);
        
        // Check if email confirmation is required
        if (!data.session) {
          Alert.alert(
            'Check Your Email',
            'Please check your email and click the confirmation link to complete your registration.',
            [{ text: 'OK' }]
          );
          return false; // Don't proceed to onboarding yet
        }
        
        // If we have a session, the user is signed in
        // handleSupabaseSignIn will be called automatically by the auth state listener
        return true;
      }
      
      throw new Error('Sign up failed - no user returned');
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase sign out error:', error);
        throw error;
      }
      setUser(null);
      console.log('Sign out successful');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Sign out error:', errorMessage);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const signInWithLinkedIn = async () => {
    try {
      console.log('Starting LinkedIn sign-in flow');
      
      // Use Supabase OAuth for LinkedIn
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: LINKEDIN_CONFIG.appRedirectScheme + '://auth'
        }
      });
      
      if (error) {
        console.error('LinkedIn OAuth error:', error);
        throw error;
      }
      
      console.log('LinkedIn OAuth initiated');
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('LinkedIn sign in error:', errorMessage);
      Alert.alert('Authentication Error', `Failed to sign in with LinkedIn: ${errorMessage}`);
      
      // In development, create a mock user to continue testing
      if (__DEV__) {
        await createMockLinkedInUser();
      }
    }
  };
  
  // Helper function to create a mock LinkedIn user for development
  const createMockLinkedInUser = async () => {
    try {
      console.log('Creating mock LinkedIn user');
      
      // Create a test user with Supabase
      const mockEmail = `mock_linkedin_${Date.now()}@example.com`;
      const mockPassword = 'password123';
      
      const { data, error } = await supabase.auth.signUp({
        email: mockEmail,
        password: mockPassword,
        options: {
          data: {
            first_name: 'Mock',
            last_name: 'LinkedIn User',
            full_name: 'Mock LinkedIn User',
            avatar_url: 'https://via.placeholder.com/150',
            provider: 'linkedin_mock'
          }
        }
      });
      
      if (error) {
        console.error('Error creating mock user:', error);
        throw error;
      }
      
      console.log('Mock LinkedIn user created successfully');
      
      Alert.alert(
        'LinkedIn Profile (Mock)',
        `Name: Mock LinkedIn User\nEmail: ${mockEmail}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error creating mock user:', error);
    }
  };

  const handleLinkedInAuthCallback = async (event: { url: string }) => {
    console.log('Handling LinkedIn auth callback', event);
    // This is now handled by Supabase OAuth flow
    // The auth state listener will handle the rest
  };

  const signInWithDemo = async () => {
    try {
      setLoading(true);
      console.log('Starting demo sign in');
      
      // Create a demo user with Supabase
      const demoEmail = `demo_${Date.now()}@collaborito.com`;
      const demoPassword = 'demopassword123';
      
      const { data, error } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          data: {
            first_name: 'Demo',
            last_name: 'User',
            full_name: 'Demo User',
            username: 'demouser',
            provider: 'demo'
          }
        }
      });
      
      if (error) {
        console.error('Demo sign up error:', error);
        throw error;
      }
      
      console.log('Demo user created and signed in');
      return true;
    } catch (error) {
      console.error('Demo sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!user?.id) {
        throw new Error('No user logged in');
      }
      
      console.log('Updating user profile:', userData);
      
      // Update the profiles table
      const profileUpdate: any = {};
      if (userData.firstName !== undefined) profileUpdate.first_name = userData.firstName;
      if (userData.lastName !== undefined) profileUpdate.last_name = userData.lastName;
      if (userData.profileImage !== undefined) profileUpdate.avatar_url = userData.profileImage;
      
      if (Object.keys(profileUpdate).length > 0) {
        const { error } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', user.id);
        
        if (error) {
          console.error('Error updating profile:', error);
          throw error;
        }
      }
      
      // Update local user state
      setUser(prev => prev ? { ...prev, ...userData } : null);
      
      console.log('User profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithLinkedIn,
        signInWithDemo,
        updateUser,
      }}
    >
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