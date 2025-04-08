import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { v4 as uuidv4 } from 'uuid';

// User type definition
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

// LinkedIn configuration
const LINKEDIN_CONFIG = {
  clientId: '77dpxmsrs0t56d', // Your LinkedIn Client ID
  clientSecret: 'WPL_AP1.Yl49K57KkulMZDQj.p+g9mg==', // Your LinkedIn Client Secret
  scope: 'r_emailaddress r_liteprofile',
  authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
  tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
  profileUrl: 'https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))',
  emailUrl: 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
  // LinkedIn only accepts HTTP/HTTPS URLs, so we'll use the Expo proxy service
  redirectUri: 'https://auth.expo.io/@swaraj77/collaborito',
};

console.log('LinkedIn redirect URI:', LINKEDIN_CONFIG.redirectUri);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // To store auth state for LinkedIn OAuth
  const [linkedInAuthState, setLinkedInAuthState] = useState<string | null>(null);

  // Set up deep link handler for LinkedIn callback
  useEffect(() => {
    // Immediately load user from storage
    void loadUser();

    // Set up handling for deep links
    const subscription = Linking.addEventListener('url', handleLinkedInRedirect);

    // Check if app was opened via a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url);
      }
    }).catch(err => {
      console.error('Failed to get initial URL:', err);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Handle deep link URLs
  const handleLinkedInRedirect = (event: { url: string }) => {
    console.log('Got deep link callback:', event.url);
    handleUrl(event.url);
  };

  const handleUrl = async (url: string) => {
    console.log('Processing URL:', url);
    // Check if this is a LinkedIn callback
    if (url.includes('auth/linkedin-callback')) {
      try {
        // Parse the URL to get query parameters
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        const state = urlObj.searchParams.get('state');
        const error = urlObj.searchParams.get('error');
        const errorDescription = urlObj.searchParams.get('error_description');

        console.log('LinkedIn callback params:', { code: code?.substring(0, 10) + '...', state, error, errorDescription });

        // Verify state matches to prevent CSRF
        if (state !== linkedInAuthState) {
          console.error('State mismatch - possible CSRF attack');
          Alert.alert('Security Error', 'Authentication failed due to security verification.');
          return;
        }

        if (error) {
          console.error('LinkedIn auth error:', error, errorDescription);
          Alert.alert('Authentication Error', errorDescription || 'Failed to authenticate with LinkedIn');
          return;
        }

        if (code) {
          // Exchange the code for a token
          await exchangeCodeForToken(code);
        }
      } catch (error) {
        console.error('Error handling LinkedIn callback:', error);
        Alert.alert('Authentication Error', 'Failed to process LinkedIn authentication');
      }
    }
  };

  // Exchange authorization code for access token
  const exchangeCodeForToken = async (code: string) => {
    try {
      console.log('Exchanging code for token...');
      
      // Prepare the form data for the token request
      const formData = new URLSearchParams();
      formData.append('grant_type', 'authorization_code');
      formData.append('code', code);
      formData.append('redirect_uri', LINKEDIN_CONFIG.redirectUri);
      formData.append('client_id', LINKEDIN_CONFIG.clientId);
      formData.append('client_secret', LINKEDIN_CONFIG.clientSecret);
      
      // Request the access token
      const tokenResponse = await fetch(LINKEDIN_CONFIG.tokenUrl, {
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
      console.log('Token received:', tokenData.access_token ? 'success' : 'failed');
      
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
      
      // Create the user object
      const linkedInUser: User = {
        id: profileData.id,
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
      
      console.log('Creating user account with LinkedIn data');
      
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

  const loadUser = async () => {
    try {
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

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Implement your sign in logic here
      // For now, we'll use a mock user
      const mockUser: User = {
        id: '1',
        email,
        user_metadata: {
          full_name: 'Test User',
          avatar_url: 'https://via.placeholder.com/150',
        },
        app_metadata: {
          roles: ['user'],
          provider: 'email',
        },
      };
      
      setUser(mockUser);
      await SecureStore.setItemAsync('user', JSON.stringify(mockUser));
      await SecureStore.setItemAsync('userSession', 'mock_session_token');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Sign in error:', errorMessage);
      Alert.alert('Authentication Error', 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const signInWithLinkedIn = async () => {
    try {
      console.log('Starting LinkedIn sign-in flow with deep linking...');
      
      // Generate a random state parameter to prevent CSRF attacks
      const state = uuidv4();
      setLinkedInAuthState(state);
      
      // Construct the LinkedIn authorization URL
      const authUrl = new URL(LINKEDIN_CONFIG.authUrl);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('client_id', LINKEDIN_CONFIG.clientId);
      authUrl.searchParams.append('redirect_uri', LINKEDIN_CONFIG.redirectUri);
      authUrl.searchParams.append('state', state);
      authUrl.searchParams.append('scope', LINKEDIN_CONFIG.scope);
      
      console.log('Opening LinkedIn auth URL:', authUrl.toString());
      
      // Open the LinkedIn authorization page in the browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl.toString(), 
        LINKEDIN_CONFIG.redirectUri,
        { showInRecents: true, preferEphemeralSession: true }
      );
      
      console.log('Browser session result:', result.type);
      
      if (result.type === 'cancel') {
        console.log('User cancelled the login flow');
        Alert.alert('Cancelled', 'LinkedIn login was cancelled');
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('LinkedIn sign in error:', errorMessage);
      Alert.alert('Authentication Error', `Failed to sign in with LinkedIn: ${errorMessage}`);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      // Implement your sign up logic here
      // For now, we'll use a mock user
      const mockUser: User = {
        id: '1',
        email,
        user_metadata: {
          full_name: fullName || 'New User',
          avatar_url: 'https://via.placeholder.com/150',
        },
        app_metadata: {
          roles: ['user'],
          provider: 'email',
        },
      };

      setUser(mockUser);
      await SecureStore.setItemAsync('user', JSON.stringify(mockUser));
      await SecureStore.setItemAsync('userSession', 'mock_session_token');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Sign up error:', errorMessage);
      Alert.alert('Authentication Error', 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('userSession');
      setUser(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Sign out error:', errorMessage);
      Alert.alert('Error', 'Failed to sign out');
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