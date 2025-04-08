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
    
    try {
      // For LinkedIn, check if the URL contains auth.expo.io and has a code parameter
      if (url.includes('auth.expo.io')) {
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        const state = urlObj.searchParams.get('state');
        const error = urlObj.searchParams.get('error');
        
        console.log('LinkedIn callback detected, parameters:', { 
          code: code ? `${code.substring(0, 8)}...` : 'none',
          state: state || 'none',
          error: error || 'none'
        });
        
        if (code) {
          // Exchange the code for a token
          await exchangeCodeForToken(code);
        } else if (error) {
          console.error('LinkedIn auth error:', error);
          Alert.alert('Authentication Error', 'LinkedIn authentication failed');
        }
      }
      
      // For Supabase auth callbacks
      else if (url.includes('auth/callback')) {
        console.log('Supabase auth callback detected');
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session from callback:', error);
        } else if (data?.session) {
          console.log('Got Supabase session from callback');
        }
      }
    } catch (error) {
      console.error('Error handling URL callback:', error);
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
      
      // Use hardcoded values for reliability
      const redirectUri = 'https://auth.expo.io/@swaraj77/collaborito';
      const clientId = '77dpxmsrs0t56d';
      const clientSecret = 'WPL_AP1.Yl49K57KkulMZDQj.p+g9mg==';
      
      // Prepare the form data for the token request
      const formData = new URLSearchParams();
      formData.append('grant_type', 'authorization_code');
      formData.append('code', code);
      formData.append('redirect_uri', redirectUri);
      formData.append('client_id', clientId);
      formData.append('client_secret', clientSecret);
      
      console.log('Sending token request with redirect URI:', redirectUri);
      
      // Request the access token
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token request failed:', errorText);
        throw new Error(`Failed to get token: ${tokenResponse.status}`);
      }
      
      const tokenData = await tokenResponse.json();
      console.log('Token received successfully:', !!tokenData.access_token);
      
      // Use the token to fetch user profile and email
      await fetchLinkedInUserProfile(tokenData.access_token);
      
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      Alert.alert('Authentication Error', 'Failed to complete LinkedIn authentication');
    }
  };

  // Fetch the LinkedIn user profile and create a user
  const fetchLinkedInUserProfile = async (accessToken: string) => {
    try {
      console.log('Fetching LinkedIn profile...');
      
      // Get profile information
      const profileResponse = await fetch(LINKEDIN_CONFIG.profileUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (!profileResponse.ok) {
        throw new Error(`Failed to get profile: ${profileResponse.status}`);
      }
      
      const profileData = await profileResponse.json();
      console.log('Profile data received');
      
      // Get email information
      const emailResponse = await fetch(LINKEDIN_CONFIG.emailUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (!emailResponse.ok) {
        throw new Error(`Failed to get email: ${emailResponse.status}`);
      }
      
      const emailData = await emailResponse.json();
      console.log('Email data received');
      
      // Extract profile picture URL if available
      let pictureUrl = '';
      if (profileData.profilePicture && 
          profileData.profilePicture['displayImage~'] && 
          profileData.profilePicture['displayImage~'].elements && 
          profileData.profilePicture['displayImage~'].elements.length > 0) {
        const elements = profileData.profilePicture['displayImage~'].elements;
        if (elements[0].identifiers && elements[0].identifiers.length > 0) {
          pictureUrl = elements[0].identifiers[0].identifier;
        }
      }
      
      // Extract email address
      let email = 'unknown@example.com';
      if (emailData.elements && 
          emailData.elements.length > 0 && 
          emailData.elements[0]['handle~']) {
        email = emailData.elements[0]['handle~'].emailAddress;
      }
      
      // Try to sign in with Supabase using the LinkedIn OAuth data
      // In a real implementation, you would create a server-side function for this
      // Here we'll simulate it by either finding an existing user or creating one
      
      // Check if a user with this email already exists
      const { data: existingUserData, error: existingUserError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
        
      let userId;
      
      if (!existingUserData) {
        // No existing user - create a new one
        // In a real implementation, you would use Supabase Auth to create a proper user
        // For this demo, we'll create a user directly (not recommended for production)
        const { data: newUser, error: createError } = await supabase
          .from('profiles')
          .insert({
            full_name: `${profileData.localizedFirstName} ${profileData.localizedLastName}`,
            email: email,
            avatar_url: pictureUrl,
            linkedin_id: profileData.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
          
        if (createError) {
          throw new Error(`Failed to create user: ${createError.message}`);
        }
        
        userId = newUser.id;
      } else {
        userId = existingUserData.id;
        
        // Update existing user's LinkedIn data
        await supabase
          .from('profiles')
          .update({
            full_name: `${profileData.localizedFirstName} ${profileData.localizedLastName}`,
            avatar_url: pictureUrl,
            linkedin_id: profileData.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }
      
      // Create user object
      const linkedInUser: User = {
        id: userId,
        email: email,
        user_metadata: {
          full_name: `${profileData.localizedFirstName} ${profileData.localizedLastName}`,
          avatar_url: pictureUrl,
        },
        app_metadata: {
          roles: ['user'],
          provider: 'linkedin',
        },
      };
      
      console.log('Creating user session with LinkedIn data');
      
      // Save the user data
      setUser(linkedInUser);
      await SecureStore.setItemAsync('user', JSON.stringify(linkedInUser));
      await SecureStore.setItemAsync('userSession', `linkedin_${accessToken}`);
      
      Alert.alert('Success', 'Logged in with LinkedIn successfully');
      
    } catch (error) {
      console.error('Error fetching LinkedIn profile:', error);
      Alert.alert('Authentication Error', 'Failed to get LinkedIn profile information');
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
      console.log('Starting LinkedIn login');
      
      // Create a very simple auth state to prevent CSRF attacks
      const state = generateRandomString(16);
      setLinkedInAuthState(state);
      
      // Use the simplest possible redirect URI that LinkedIn accepts
      const redirectUri = 'https://auth.expo.io/@swaraj77/collaborito';
      console.log('Using LinkedIn redirect URI:', redirectUri);
      
      // Build the LinkedIn authorization URL
      const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('client_id', '77dpxmsrs0t56d');
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('state', state);
      authUrl.searchParams.append('scope', 'r_liteprofile r_emailaddress');
      
      console.log('Opening LinkedIn auth URL:', authUrl.toString());
      
      // Just use a simple browser without trying to manage the redirect
      const result = await WebBrowser.openBrowserAsync(authUrl.toString());
      console.log('Browser result type:', result.type);
      
      // When the browser closes, we'll need to handle the deep link manually via the
      // URL handler that's already set up. We don't try to handle the redirect here.
      
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