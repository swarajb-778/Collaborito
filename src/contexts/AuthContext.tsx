import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { supabase } from '../services/supabase';
import { User as SupabaseUser } from '../types/supabase';

// User type definition that matches the Supabase schema
export type User = {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    avatar_url?: string;
  };
  app_metadata: {
    roles: string[];
    provider: string;
  };
};

// Close any open WebBrowser sessions when the app loads
WebBrowser.maybeCompleteAuthSession();

console.log('=== AUTH CONTEXT INITIALIZATION ===');
console.log('App Scheme:', Linking.createURL('/'));

// Create context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithLinkedIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to generate a random string for state parameter
// This is more compatible than uuid in React Native environments
const generateRandomString = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Constants for LinkedIn OAuth
const LINKEDIN_CONFIG = {
  // Get these values from environment variables
  clientId: Constants.expoConfig?.extra?.EXPO_PUBLIC_LINKEDIN_CLIENT_ID || '77dpxmsrs0t56d',
  clientSecret: Constants.expoConfig?.extra?.EXPO_PUBLIC_LINKEDIN_CLIENT_SECRET || 'WPL_AP1.Yl49K57KkulMZDQj.p+g9mg==',
  // Use basic permission scopes
  scope: 'r_emailaddress r_liteprofile',
  // LinkedIn API endpoints
  authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
  tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
  profileUrl: 'https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))',
  emailUrl: 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
  // LinkedIn only accepts HTTP/HTTPS URLs, so we'll use the Expo proxy service for development
  // In production, this should point to your Supabase auth callback URL
  redirectUri: Platform.select({
    // In production, use your deployed app's callback
    web: 'http://localhost:19006', // Web testing
    default: __DEV__ 
      ? 'https://auth.expo.io/@swaraj77/collaborito' // Expo Go development
      : 'https://ekydublgvsoaaepdhtzc.supabase.co/auth/v1/callback' // Production with Supabase
  }),
};

console.log('LinkedIn redirect URI:', LINKEDIN_CONFIG.redirectUri);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkedInAuthState, setLinkedInAuthState] = useState<string | null>(null);

  // Set up the authentication listener and check initial state
  useEffect(() => {
    // Start by checking if we have a saved session from before
    loadUser();

    // Listen for authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN' && session) {
        // User signed in via Supabase auth
        const userData = await saveUserToStorage(session.user);
        setUser(userData);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        // User signed out from Supabase
        await SecureStore.deleteItemAsync('user');
        setUser(null);
        setLoading(false);
      }
    });

    // Set up deep link handler
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if the app was opened via a deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        handleUrl(url);
      }
    }).catch(err => {
      console.error('Failed to get initial URL:', err);
    });

    // Clean up listeners when component unmounts
    return () => {
      authListener.subscription.unsubscribe();
      subscription.remove();
    };
  }, []);

  // Handle deep link events
  const handleDeepLink = (event: { url: string }) => {
    console.log('Got deep link callback:', event.url);
    handleUrl(event.url);
  };

  // Process the URL to handle OAuth callbacks
  const handleUrl = async (url: string) => {
    console.log('Processing URL:', url);
    
    // Very simple LinkedIn callback handling
    if (url.includes('auth.expo.io') && url.includes('code=')) {
      try {
        // Extract the code parameter using regex for simplicity
        const codeMatch = url.match(/code=([^&]+)/);
        if (codeMatch && codeMatch[1]) {
          const code = codeMatch[1];
          console.log('Got LinkedIn code, length:', code.length);
          
          // Process the LinkedIn authentication
          await exchangeCodeForToken(code);
        } else {
          console.log('No code found in URL');
        }
      } catch (error) {
        console.error('Error handling LinkedIn callback:', error);
      }
    }
  };

  // Helper function to convert Supabase user to our User type and save to storage
  const saveUserToStorage = async (supabaseUser: any): Promise<User> => {
    try {
      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || 'no-email@example.com',
        user_metadata: {
          full_name: supabaseUser.user_metadata?.full_name || 'User',
          avatar_url: supabaseUser.user_metadata?.avatar_url,
        },
        app_metadata: {
          roles: supabaseUser.app_metadata?.roles || ['user'],
          provider: supabaseUser.app_metadata?.provider || 'email',
        },
      };
      
      // Save user to SecureStore
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      
      // Also create or update user profile in Supabase if needed
      await updateUserProfile(userData);
      
      return userData;
    } catch (error) {
      console.error('Error saving user to storage:', error);
      throw error;
    }
  };

  // Update or create user profile in the database
  const updateUserProfile = async (userData: User) => {
    try {
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userData.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        console.error('Error checking profile:', fetchError);
        return;
      }
      
      // Prepare profile data
      const profileData = {
        id: userData.id,
        full_name: userData.user_metadata.full_name,
        avatar_url: userData.user_metadata.avatar_url,
        email: userData.email,
        updated_at: new Date().toISOString(),
      };
      
      if (!existingProfile) {
        // Create new profile
        console.log('Creating new profile');
        const { error } = await supabase
          .from('profiles')
          .insert([{ ...profileData, created_at: new Date().toISOString() }]);
          
        if (error) console.error('Error creating profile:', error);
      } else {
        // Update existing profile
        console.log('Updating existing profile');
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', userData.id);
          
        if (error) console.error('Error updating profile:', error);
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  };

  // Exchange authorization code for access token (LinkedIn OAuth)
  const exchangeCodeForToken = async (code: string) => {
    try {
      console.log('Exchanging code for token...');
      
      // Hardcoded values
      const redirectUri = 'https://auth.expo.io/@swaraj77/collaborito';
      const clientId = '77dpxmsrs0t56d';
      const clientSecret = 'WPL_AP1.Yl49K57KkulMZDQj.p+g9mg==';
      
      // Create form data
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      }).toString();
      
      // Exchange code for token
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
      });
      
      const tokenData = await tokenResponse.json();
      console.log('Token received:', tokenData.access_token ? 'yes' : 'no');
      
      if (tokenData.access_token) {
        // Get user profile
        const profileResponse = await fetch(
          'https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName)', 
          {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`
            }
          }
        );
        
        const profileData = await profileResponse.json();
        console.log('Got profile for:', profileData.localizedFirstName);
        
        // Get email address
        const emailResponse = await fetch(
          'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', 
          {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`
            }
          }
        );
        
        const emailData = await emailResponse.json();
        const email = emailData.elements?.[0]?.['handle~']?.emailAddress || 'no-email@example.com';
        console.log('Email:', email);
        
        // Create simple user object
        const user = {
          id: profileData.id,
          email,
          user_metadata: {
            full_name: `${profileData.localizedFirstName} ${profileData.localizedLastName}`,
            avatar_url: ''
          },
          app_metadata: {
            roles: ['user'],
            provider: 'linkedin'
          }
        };
        
        // Store the user
        setUser(user);
        await SecureStore.setItemAsync('user', JSON.stringify(user));
        
        Alert.alert('Success', 'Logged in with LinkedIn!');
      }
    } catch (error) {
      console.error('LinkedIn token exchange error:', error);
      Alert.alert('Error', 'Failed to complete LinkedIn sign in.');
    }
  };

  // Load user from SecureStore
  const loadUser = async () => {
    try {
      // First check for Supabase session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionData?.session?.user) {
        console.log('Found Supabase session');
        const userData = await saveUserToStorage(sessionData.session.user);
        setUser(userData);
        setLoading(false);
        return;
      }
      
      // If no Supabase session, check SecureStore
      const storedUser = await SecureStore.getItemAsync('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log('Loaded user from storage:', parsedUser.email);
        setUser(parsedUser);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error loading user:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Supabase email/password sign in
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.user) {
        const userData = await saveUserToStorage(data.user);
        setUser(userData);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Sign in error:', errorMessage);
      Alert.alert('Authentication Error', `Failed to sign in: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // LinkedIn sign in
  const signInWithLinkedIn = async () => {
    try {
      console.log('Starting LinkedIn sign-in flow');
      
      // Use a very direct approach with hardcoded values
      const redirectUri = 'https://auth.expo.io/@swaraj77/collaborito';
      const clientId = '77dpxmsrs0t56d';
      
      // Build the authorization URL directly
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=r_liteprofile%20r_emailaddress`;
      
      console.log('Opening LinkedIn auth URL:', authUrl);
      
      // Just open the URL without any redirect handling
      await WebBrowser.openBrowserAsync(authUrl);
      
    } catch (error) {
      console.error('LinkedIn sign in error:', error);
      Alert.alert('Authentication Error', 'Failed to sign in with LinkedIn. Please try again.');
    }
  };

  // Supabase sign up
  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      // Create user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.user) {
        // In Supabase, users are created with email confirmation by default
        // We can either wait for email confirmation or create a user immediately
        // Based on your requirements
        Alert.alert(
          'Verification Email Sent',
          'Please check your email to verify your account before signing in.'
        );
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Sign up error:', errorMessage);
      Alert.alert('Authentication Error', `Failed to sign up: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      // Sign out from Supabase Auth
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Clear local storage
      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('userSession');
      setUser(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Sign out error:', errorMessage);
      Alert.alert('Error', `Failed to sign out: ${errorMessage}`);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithLinkedIn,
  };

  return (
    <AuthContext.Provider value={value}>
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