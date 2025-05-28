import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import { makeRedirectUri, useAuthRequest, ResponseType } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// For the development mock server
import { startServer } from '../utils/mockAuthServer';
import { constants } from '../constants';

// Define User type
export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  profileImage: string | null;
  oauthProvider: string;
  oauthTokens?: {
    accessToken: string;
    refreshToken: string | null;
    expiresAt: number;
  };
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

// LinkedIn configuration
const LINKEDIN_CONFIG = {
  clientId: constants.auth.linkedin.clientId,
  clientSecret: constants.auth.linkedin.clientSecret,
  scopes: constants.auth.linkedin.scopes,
  authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
  tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
  userInfoEndpoint: 'https://api.linkedin.com/v2/userinfo', // OIDC userinfo endpoint
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
  const [loggedIn, setLoggedIn] = useState(false);
  const [mockServer, setMockServer] = useState<{ stop: () => void } | null>(null);

  useEffect(() => {
    void loadUser();
    
    // Set up deep link listener for handling OAuth callbacks
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // In development, start the mock auth server
    if (__DEV__) {
      const server = startServer();
      setMockServer(server);
    }
    
    return () => {
      subscription.remove();
      // Clean up the mock server if it exists
      if (mockServer) {
        mockServer.stop();
      }
    };
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const userJson = await SecureStore.getItemAsync('user');
      const session = await SecureStore.getItemAsync('userSession');
      
      if (userJson && session) {
        const userData = JSON.parse(userJson) as User;
        setUser(userData);
        setLoggedIn(true);
        console.log('User loaded from storage');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading user:', error);
      return false;
    } finally {
      setLoading(false);
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
          // Fallback manual parsing if URL parsing failed
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
          // Use parsed URL parameters
          code = params.get('code');
          state = params.get('state');
          error = params.get('error');
        }
        
        console.log('Extracted params:', { 
          hasCode: !!code, 
          hasState: !!state, 
          hasError: !!error 
        });
        
        // Check for errors first
        if (error) {
          console.error('OAuth error returned:', error);
          Alert.alert('Authentication Error', `LinkedIn returned an error: ${error}`);
          return;
        }
        
        // Check for required parameters
        if (!code) {
          console.error('No authorization code found in callback URL');
          Alert.alert('Authentication Error', 'No authorization code received from LinkedIn');
          return;
        }
        
        if (!state) {
          console.error('No state parameter found in callback URL');
          Alert.alert('Authentication Error', 'Invalid authentication response (missing state)');
        return;
        }
        
        // Verify state to prevent CSRF attacks
        const storedState = await SecureStore.getItemAsync('oauth_state');
        if (state !== storedState) {
          console.error('State mismatch:', { receivedState: state, storedState });
          
          // In development, we might continue anyway with a warning
          console.warn('Continuing despite state mismatch (for development)');
          Alert.alert('Security Warning', 'State verification failed, but continuing for development');
        }
        
        // Process the authorization code
        console.log('Processing authorization code');
        await handleLinkedInAuthCallback({ url: event.url });
        
      } catch (error) {
        console.error('Error handling deep link:', error);
        Alert.alert('Authentication Error', 'Failed to process authentication response');
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Signing in with email:', email);
      
      // Validate email and password to prevent SQL injection
      if (!email || !validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      // Check for SQL injection patterns
      if (containsSqlInjection(email) || containsSqlInjection(password)) {
        console.error('Potential SQL injection attempt detected');
        throw new Error('Invalid characters detected in email or password');
      }
      
      // Simulate API call for email/password authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would be a call to your auth API
      if (email !== 'user@example.com' || password !== 'password') {
        throw new Error('Invalid email or password');
      }
      
      // Create user data
      const userData: User = {
        id: 'user123',
        email: email,
        firstName: 'Demo',
        lastName: 'User',
        profileImage: null,
        oauthProvider: 'email'
      };
      
      // Store user data and update state
      await storeUserData(userData);
      setUser(userData);
      setLoggedIn(true);
      
      console.log('Sign in successful');
      return true;
    } catch (error) {
      console.error('Sign in error:', error);
      // Throw the error so calling components can handle it properly
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to validate input and prevent SQL injection
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };
  
  const containsSqlInjection = (input: string): boolean => {
    // Check for common SQL injection patterns
    const sqlPatterns = [
      /(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)(\s|$)/i,
      /(\s|^)(FROM|WHERE|UNION|JOIN|INTO|EXEC|EXECUTE)(\s|$)/i,
      /--/,
      /;/,
      /\/\*/,
      /\*\//,
      /xp_/i,
      /'.*OR.*--/i,
      /'.*OR.*'/i,
      /".*OR.*--/i,
      /".*OR.*"/i,
      /'\s*OR\s+.+[=<>].+/i,
      /"\s*OR\s+.+[=<>].+/i,
      /'.*=.*/i,
      /".*=.*/i,
      /'.*<>.*/i,
      /".*<>.*/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  };

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      setLoading(true);
      console.log('Signing up with email:', email, 'username:', username);
      
      // Validate inputs
      if (!email || !validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      // firstName and lastName can be empty - they'll be collected during onboarding
      // Just ensure they don't contain malicious content if provided
      if (username && containsSqlInjection(username)) {
        console.error('Potential SQL injection attempt detected in username');
        throw new Error('Username contains invalid characters');
      }
      
      // Check for SQL injection in required fields
      if (containsSqlInjection(email) || containsSqlInjection(password)) {
        console.error('Potential SQL injection attempt detected');
        throw new Error('Invalid characters detected in email or password');
      }
      
      // Simulate API call for registration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, this would be a call to your registration API
      if (email === 'user@example.com') {
        throw new Error('An account with this email already exists');
      }
      
      // Create user data for the new account
      const userData: User = {
        id: 'new' + Date.now(),
        email: email,
        firstName: '', // Leave empty, will be filled during onboarding
        lastName: '',   // Leave empty, will be filled during onboarding
        username: username || '', // Store username separately
        profileImage: null,
        oauthProvider: 'email'
      };
      
      console.log('Creating user with data:', userData);
      
      // Store user data and update state
      const storeSuccess = await storeUserData(userData);
      
      if (!storeSuccess) {
        throw new Error('Failed to save account data. Please try again.');
      }
      
      console.log('Sign up successful, user data stored');
      return true;
    } catch (error) {
      console.error('Sign up error:', error);
      // Now throw the error so calling components can catch it and show proper messages
      throw error;
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
      console.log('Starting LinkedIn sign-in flow');
      
      // Generate state for CSRF protection
      const state = Math.random().toString(36).substring(7);
      
      // Store state for verification when the callback comes back
      await SecureStore.setItemAsync('oauth_state', state);
      
      console.log('Generated state:', state);

      // Construct the authorization URL with a custom param to signal our ngrok server
      const authUrl = `${LINKEDIN_CONFIG.authorizationEndpoint}?` +
        `response_type=code&` +
        `client_id=${LINKEDIN_CONFIG.clientId}&` +
        `redirect_uri=${encodeURIComponent(LINKEDIN_CONFIG.redirectUri)}&` +
        `state=${state}&` +
        `scope=${encodeURIComponent(LINKEDIN_CONFIG.scopes.join(' '))}&` +
        `app_redirect=${encodeURIComponent(LINKEDIN_CONFIG.appRedirectScheme)}`;

      console.log('Opening LinkedIn auth URL');
      
      // Open the browser to start the auth flow
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        LINKEDIN_CONFIG.appRedirectScheme
      );
      
      console.log('Browser session closed with result type:', result.type);
      
      // Check if we got a successful redirect
      if (result.type === 'success' && result.url) {
        console.log('Successful auth redirect:', result.url);
        await handleLinkedInAuthCallback({ url: result.url });
      } else if (result.type === 'cancel') {
        console.log('Authentication was canceled by user');
        Alert.alert('Authentication Cancelled', 'LinkedIn sign in was cancelled');
        } else {
        console.log('Auth flow completed but without success type');
        // We'll check if our deep link handler caught it instead
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('LinkedIn sign in error:', errorMessage);
      Alert.alert('Authentication Error', `Failed to sign in with LinkedIn: ${errorMessage}`);
      
      // In development, create a mock user to continue testing
      if (__DEV__) {
        createMockLinkedInUser();
      }
    }
  };
  
  // Helper function to create a mock LinkedIn user
  const createMockLinkedInUser = async () => {
    try {
      console.log('Creating mock LinkedIn user');
      const mockUser: User = {
        id: `linkedin_mock_${Date.now()}`,
        email: `mock_linkedin_${Date.now()}@example.com`,
        firstName: 'Mock',
        lastName: 'LinkedIn User',
        profileImage: 'https://via.placeholder.com/150',
        oauthProvider: 'linkedin_mock'
      };
      
      // Store user data and update state
      await storeUserData(mockUser);
      setUser(mockUser);
      setLoggedIn(true);
      
      console.log('Mock LinkedIn user created successfully');
      
      // Display user information in an alert
      Alert.alert(
        'LinkedIn Profile',
        `Name: ${mockUser.firstName} ${mockUser.lastName}\nEmail: ${mockUser.email}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error creating mock user:', error);
    }
  };

  // Store user data securely
  const storeUserData = async (userData: User) => {
    try {
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      await SecureStore.setItemAsync('userSession', 'active');
      setUser(userData);
      setLoggedIn(true);
      return true;
    } catch (error) {
      console.error('Error storing user data:', error);
      return false;
    }
  };

  const handleLinkedInAuthCallback = async (event: { url: string }) => {
    console.log('Handling LinkedIn auth callback', event);
    try {
      setLoading(true);
      
      // Extract the authorization code from the URL
      const { url } = event;
      
      // Parse the URL to extract code and state
      let code, state;
      
      if (url.includes('?')) {
        const queryPart = url.split('?')[1];
        if (queryPart) {
          const params = new URLSearchParams(queryPart);
          code = params.get('code');
          state = params.get('state');
        }
      }
      
      // Fallback to regex if URLSearchParams doesn't work
      if (!code && url.includes('code=')) {
        code = url.match(/code=([^&]+)/)?.[1];
      }
      
      if (!state && url.includes('state=')) {
        state = url.match(/state=([^&]+)/)?.[1];
      }
      
      console.log('Extracted params:', { hasCode: !!code, hasState: !!state });
      
      if (!code) {
        throw new Error('No authorization code found in redirect URL');
      }
      
      // Verify state to prevent CSRF attacks if we have it
      if (state) {
        const storedState = await SecureStore.getItemAsync('oauth_state');
        if (state !== storedState) {
          console.warn('State mismatch:', { receivedState: state, storedState });
          // In development, we might continue anyway with a warning
          console.warn('Continuing despite state mismatch (for development)');
        }
      }
      
      console.log('LinkedIn code obtained', code);
      
      try {
        // Exchange the code for tokens directly (only for development testing)
        // This approach exposes your client secret - DON'T use in production!
        console.log('Exchanging code for token...');
        
        // Prepare token request body
        const tokenRequestBody = new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: LINKEDIN_CONFIG.redirectUri,
          client_id: LINKEDIN_CONFIG.clientId,
          client_secret: LINKEDIN_CONFIG.clientSecret
        }).toString();
        
        // Make token request
        const tokenResponse = await fetch(LINKEDIN_CONFIG.tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: tokenRequestBody
        });
        
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('Token exchange failed:', errorText);
          throw new Error(`Failed to exchange code for token: ${tokenResponse.status}`);
        }
        
        const tokens = await tokenResponse.json();
        console.log('Received tokens:', { 
          hasAccessToken: !!tokens.access_token,
          expiresIn: tokens.expires_in,
          hasRefreshToken: !!tokens.refresh_token
        });
        
        // Now fetch user profile with the token
        console.log('Fetching user profile from LinkedIn...');
        const userInfoResponse = await fetch(LINKEDIN_CONFIG.userInfoEndpoint, {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`
          }
        });
        
        if (!userInfoResponse.ok) {
          const errorText = await userInfoResponse.text();
          console.error('User info fetch failed:', errorText);
          throw new Error(`Failed to fetch user info: ${userInfoResponse.status}`);
        }
        
        const userInfo = await userInfoResponse.json();
        console.log('Received user info data:', userInfo);
        
        // Create user data from the response
        const userData: User = {
          id: userInfo.sub || `linkedin_${Date.now()}`,
          email: userInfo.email || 'unknown@example.com',
          firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || 'LinkedIn',
          lastName: userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || 'User',
          profileImage: userInfo.picture || null,
          oauthProvider: 'linkedin',
          oauthTokens: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || null,
            expiresAt: Date.now() + (tokens.expires_in * 1000)
          }
        };
        
        // Store the user data and update state
        await storeUserData(userData);
        setUser(userData);
        setLoggedIn(true);
        
        // Display the LinkedIn profile data in an alert
        Alert.alert(
          'LinkedIn Profile',
          `Name: ${userData.firstName} ${userData.lastName}\nEmail: ${userData.email}`,
          [{ text: 'OK' }]
        );
        
        console.log('LinkedIn auth completed successfully with real data');
        return;
        
      } catch (apiError) {
        console.error('API error when trying to get LinkedIn data:', apiError);
        
        // Fallback to mock data in development mode
        if (__DEV__) {
          console.log('Falling back to mock data due to API error');
          createMockLinkedInUser();
        } else {
          throw apiError; // Rethrow in production
        }
      }
      
    } catch (error) {
      console.error('LinkedIn auth error:', error);
      Alert.alert('Authentication Error', error instanceof Error ? error.message : 'Failed to authenticate with LinkedIn');
      
      // In development, create a mock user to continue testing
      if (__DEV__) {
        createMockLinkedInUser();
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to sign in with a demo account
  const signInWithDemo = async () => {
    try {
      setLoading(true);
      
      // Create a demo user
      const demoUser: User = {
        id: 'demo-123',
        email: 'demo@collaborito.com',
        firstName: 'Demo',
        lastName: 'User',
        profileImage: null,
        oauthProvider: 'demo'
      };
      
      // Store the user data
      await storeUserData(demoUser);
      
      // Set the user in state
      setUser(demoUser);
      setLoggedIn(true);
      
      console.log('Demo login successful');
      return true;
    } catch (error) {
      console.error('Demo sign in error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Add updateUser function
  const updateUser = async (userData: Partial<User>) => {
    try {
      console.log('updateUser called with data:', userData);
      console.log('Current user state:', user);
      
      if (!user) {
        console.error('Cannot update user: No user is currently logged in');
        console.error('User state:', { user, loading, loggedIn });
        return false;
      }
      
      if (!user.id) {
        console.error('Cannot update user: User ID is missing');
        console.error('User object:', user);
        return false;
      }
      
      // Validate update data
      if (userData.firstName && containsSqlInjection(userData.firstName)) {
        console.error('Invalid firstName in update data');
        return false;
      }
      
      if (userData.lastName && containsSqlInjection(userData.lastName)) {
        console.error('Invalid lastName in update data');
        return false;
      }
      
      // Combine existing user data with the new data
      const updatedUser = { ...user, ...userData };
      
      console.log('Storing updated user data:', updatedUser);
      
      // Store the updated user data
      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      console.log('User profile updated successfully:', updatedUser);
      return true;
    } catch (error) {
      console.error('Error updating user data:', error);
      console.error('Update data that failed:', userData);
      console.error('Current user at time of error:', user);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithLinkedIn,
    signInWithDemo,
    updateUser
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