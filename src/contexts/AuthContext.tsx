import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import { makeRedirectUri, exchangeCodeAsync, TokenResponse, ResponseType, Prompt, AuthRequest, DiscoveryDocument } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Register your redirect URI with Web Browser to properly handle redirects
WebBrowser.maybeCompleteAuthSession();

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
  id_token?: string;  // For OIDC
  error?: string;     // Error code
  error_description?: string; // Error description
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
  sub: string;           // User ID
  email: string;         // Email
  name?: string;         // Full name
  given_name?: string;   // First name
  family_name?: string;  // Last name
  picture?: string;      // Profile picture URL
}

// LinkedIn OIDC discovery document
const LINKEDIN_DISCOVERY: DiscoveryDocument = {
  authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
  tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
  userInfoEndpoint: 'https://api.linkedin.com/v2/userinfo',
  // Required for TypeScript but not used
  revocationEndpoint: 'https://www.linkedin.com/oauth/v2/revoke'
};

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
  const [request, setRequest] = useState<AuthRequest | null>(null);

  // Initialize the AuthRequest when the component mounts
  useEffect(() => {
    // Create a new LinkedIn auth request
    const createAuthRequest = async () => {
      try {
        console.log('Creating LinkedIn auth request...');
        
        // Create a redirect URI that exactly matches what's registered in LinkedIn Developer Console
        // Use this exact URI in your LinkedIn Developer Console
        const redirectUri = 'https://auth.expo.io/@swaraj77/collaborito';
        
        console.log('Using redirect URI:', redirectUri);
        
        // Create the auth request
        const authRequest = new AuthRequest({
          clientId: '77dpxmsrs0t56d', // Your LinkedIn Client ID
          scopes: ['openid', 'profile', 'email'],
          redirectUri,
          responseType: ResponseType.Code,
          extraParams: {
            prompt: Prompt.Login, // Force login screen
          },
        });
        
        setRequest(authRequest);
        console.log('Auth request created successfully');
      } catch (error) {
        console.error('Error creating auth request:', error);
      }
    };
    
    void createAuthRequest();
    void loadUser();
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
      console.log('Starting LinkedIn sign-in flow...');
      
      if (!request) {
        console.error('Auth request not initialized');
        Alert.alert('Error', 'Authentication system not ready. Please try again later.');
        return;
      }
      
      // Prompt the user with the LinkedIn authorization screen
      console.log('Prompting authorization...');
      const result = await request.promptAsync(LINKEDIN_DISCOVERY);
      console.log('Auth result:', result);
      
      if (result.type === 'success') {
        // Exchange the authorization code for an access token
        const { code } = result.params;
        
        console.log('Got authorization code, exchanging for token...');
        
        const tokenResult = await exchangeCodeAsync(
          {
            clientId: '77dpxmsrs0t56d', // Your LinkedIn Client ID
            clientSecret: 'WPL_AP1.Yl49K57KkulMZDQj.p+g9mg==', // Your LinkedIn Client Secret
            code,
            redirectUri: request.redirectUri,
            extraParams: {
              grant_type: 'authorization_code',
            },
          },
          LINKEDIN_DISCOVERY
        );
        
        console.log('Received token response');
        
        // Get user information with the access token
        const userInfoEndpoint = LINKEDIN_DISCOVERY.userInfoEndpoint;
        if (!userInfoEndpoint) {
          throw new Error('User info endpoint is not defined in discovery document');
        }

        const userInfoResponse = await fetch(userInfoEndpoint, {
          headers: {
            Authorization: `Bearer ${tokenResult.accessToken}`,
            Accept: 'application/json',
          },
        });
        
        if (!userInfoResponse.ok) {
          const errorText = await userInfoResponse.text();
          console.error('User info request failed:', errorText);
          throw new Error(`Error fetching user info: ${userInfoResponse.status}`);
        }
        
        const userInfo = await userInfoResponse.json() as OpenIDUserInfoResponse;
        console.log('User info received:', userInfo);
        
        if (!userInfo.sub) {
          throw new Error('User ID not found in response');
        }
        
        // Create user object from OIDC user info
        const linkedInUser: User = {
          id: userInfo.sub,
          email: userInfo.email || 'no-email@example.com',
          user_metadata: {
            full_name: userInfo.name || `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim() || 'LinkedIn User',
            avatar_url: userInfo.picture || '',
          },
          app_metadata: {
            roles: ['user'],
            provider: 'linkedin',
          },
        };
        
        console.log('Setting user and storing in SecureStore');
        setUser(linkedInUser);
        await SecureStore.setItemAsync('user', JSON.stringify(linkedInUser));
        await SecureStore.setItemAsync('userSession', `linkedin_${tokenResult.accessToken}`);
        
        Alert.alert('Success', 'Logged in with LinkedIn successfully');
      } else if (result.type === 'cancel') {
        console.log('User cancelled the login flow');
        Alert.alert('Cancelled', 'LinkedIn login was cancelled');
      } else {
        console.error('Authentication error:', result);
        Alert.alert('Authentication Error', 'Failed to authenticate with LinkedIn');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('LinkedIn sign in error:', errorMessage);
      Alert.alert('Authentication Error', `Failed to sign in with LinkedIn: ${errorMessage}`);
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