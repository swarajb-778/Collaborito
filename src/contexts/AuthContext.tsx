import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Define User type
interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    avatar_url: string;
  };
  app_metadata: {
    roles: string[];
    provider: string;
  };
}

// LinkedIn API response types
interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
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

// LinkedIn configuration
const LINKEDIN_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID || '',
  clientSecret: process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_SECRET || '',
  scopes: ['r_liteprofile', 'r_emailaddress'],
  authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
  tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
  profileEndpoint: 'https://api.linkedin.com/v2/me',
  emailEndpoint: 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
  redirectUri: 'collaborito://auth/linkedin-callback',
} as const;

// Create context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithLinkedIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadUser();
    
    // Set up deep link listener for handling OAuth callbacks
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    return () => {
      subscription.remove();
    };
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await SecureStore.getItemAsync('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error loading user:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle deep links (for OAuth callback)
  const handleDeepLink = (event: { url: string }) => {
    const { url } = event;
    if (url.includes('auth/linkedin-callback')) {
      const params = new URLSearchParams(url.split('?')[1]);
      const code = params.get('code');
      const error = params.get('error');
      const state = params.get('state');

      // Verify state to prevent CSRF attacks
      void SecureStore.getItemAsync('oauth_state').then(storedState => {
        if (state !== storedState) {
          Alert.alert('Security Error', 'Invalid authentication state');
          return;
        }

        if (code) {
          void handleLinkedInAuthCallback(code);
        } else if (error) {
          Alert.alert('Authentication Error', error);
        }
      });
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

  const handleLinkedInAuthCallback = async (code: string) => {
    setLoading(true);
    try {
      // Exchange code for access token
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: LINKEDIN_CONFIG.clientId,
        client_secret: LINKEDIN_CONFIG.clientSecret,
        redirect_uri: LINKEDIN_CONFIG.redirectUri,
      });

      const tokenResponse = await fetch(LINKEDIN_CONFIG.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token request failed: ${tokenResponse.statusText}`);
      }

      const { access_token } = await tokenResponse.json() as LinkedInTokenResponse;

      // Fetch user profile
      const profileResponse = await fetch(LINKEDIN_CONFIG.profileEndpoint, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error(`Profile request failed: ${profileResponse.statusText}`);
      }

      const profile = await profileResponse.json() as LinkedInProfileResponse;

      // Fetch user email
      const emailResponse = await fetch(LINKEDIN_CONFIG.emailEndpoint, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!emailResponse.ok) {
        throw new Error(`Email request failed: ${emailResponse.statusText}`);
      }

      const emailData = await emailResponse.json() as LinkedInEmailResponse;
      const email = emailData.elements[0]['handle~'].emailAddress;

      // Create user object
      const linkedInUser: User = {
        id: profile.id,
        email,
        user_metadata: {
          full_name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
          avatar_url: profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier || '',
        },
        app_metadata: {
          roles: ['user'],
          provider: 'linkedin',
        },
      };

      setUser(linkedInUser);
      await SecureStore.setItemAsync('user', JSON.stringify(linkedInUser));
      await SecureStore.setItemAsync('userSession', `linkedin_${access_token}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('LinkedIn authentication error:', errorMessage);
      Alert.alert('Authentication Error', 'Failed to authenticate with LinkedIn');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Implement your sign up logic here
      // For now, we'll use a mock user
      const mockUser: User = {
        id: '1',
        email,
        user_metadata: {
          full_name: 'New User',
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

  const signInWithLinkedIn = async () => {
    try {
      // Generate and store state for CSRF protection
      const state = Math.random().toString(36).substring(7);
      await SecureStore.setItemAsync('oauth_state', state);

      const authUrl = `${LINKEDIN_CONFIG.authorizationEndpoint}?` +
        `response_type=code&` +
        `client_id=${LINKEDIN_CONFIG.clientId}&` +
        `redirect_uri=${encodeURIComponent(LINKEDIN_CONFIG.redirectUri)}&` +
        `state=${state}&` +
        `scope=${encodeURIComponent(LINKEDIN_CONFIG.scopes.join(' '))}`;

      if (Platform.OS === 'web') {
        // For web, redirect directly
        window.location.href = authUrl;
      } else {
        // For mobile, use WebBrowser
        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          LINKEDIN_CONFIG.redirectUri
        );

        if (result.type === 'success') {
          const params = new URLSearchParams(result.url.split('?')[1]);
          const code = params.get('code');
          if (code) {
            await handleLinkedInAuthCallback(code);
          }
        } else {
          // User cancelled or authentication failed
          Alert.alert('Authentication Cancelled', 'LinkedIn sign in was cancelled');
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('LinkedIn sign in error:', errorMessage);
      Alert.alert('Authentication Error', 'Failed to sign in with LinkedIn');
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