import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabase';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';

// Define the context types
type AuthContextType = {
  session: Session | null;
  user: any | null;
  loading: boolean;
  signIn: (provider: 'linkedin') => Promise<void>;
  signOut: () => Promise<void>;
  devSignIn: () => Promise<void>; // Development sign-in function
  isDevelopmentMode: boolean;
};

// Check if we're in development mode - now we have real credentials, so it should be false
const isDevelopmentMode = false;

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  devSignIn: async () => {},
  isDevelopmentMode,
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for active session on mount
    const getSession = async () => {
      setLoading(true);
      
      // Check for development mode session
      const devModeUser = await AsyncStorage.getItem('devMode.user');
      if (devModeUser && isDevelopmentMode) {
        const parsedUser = JSON.parse(devModeUser);
        setUser(parsedUser);
        
        // Create a fake session
        const fakeSession = {
          access_token: 'fake-token',
          refresh_token: 'fake-refresh-token',
          user: parsedUser,
          expires_at: Date.now() + 3600 * 1000, // Expires in 1 hour
        } as unknown as Session;
        
        setSession(fakeSession);
        setLoading(false);
        return;
      } else if (devModeUser && !isDevelopmentMode) {
        // If dev mode is disabled but we have dev user data, clear it
        await AsyncStorage.removeItem('devMode.user');
      }
      
      // Regular session check
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error.message);
      } else if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      
      setLoading(false);
    };

    getSession();

    // Listen for auth state changes
    const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);
      setSession(newSession);
      setUser(newSession?.user || null);
    });

    // Cleanup subscription on unmount
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // Get the redirect URI
  const redirectUri = makeRedirectUri({
    scheme: Constants.expoConfig?.scheme as string || 'collaborito',
    path: 'auth/callback',
  });

  // Sign in with LinkedIn OAuth
  const signIn = async (provider: 'linkedin') => {
    try {
      // If in development mode, show option to use dev sign-in
      if (isDevelopmentMode) {
        if (Platform.OS !== 'web') {
          Alert.alert(
            'Development Mode',
            'LinkedIn credentials are not configured. Would you like to use development sign-in instead?',
            [
              { 
                text: 'Cancel', 
                style: 'cancel' 
              },
              { 
                text: 'Use Dev Sign-In', 
                onPress: () => devSignIn() 
              }
            ]
          );
          return;
        } else {
          // On web, just use dev sign-in
          return devSignIn();
        }
      }
      
      console.log(`Signing in with ${provider}, redirect URI: ${redirectUri}`);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUri,
          scopes: 'r_liteprofile r_emailaddress',
        },
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error(`Error signing in with ${provider}:`, error.message);
      throw error;
    }
  };

  // Development sign-in function
  const devSignIn = async () => {
    try {
      console.log('Using development sign-in');
      
      // Create a fake session and user
      const fakeUser = {
        id: 'dev-user-id',
        email: 'dev@example.com',
        user_metadata: {
          full_name: 'Development User',
          avatar_url: 'https://ui-avatars.com/api/?name=Development+User&background=random',
        }
      };
      
      // Store in AsyncStorage to simulate a session
      await AsyncStorage.setItem('devMode.user', JSON.stringify(fakeUser));
      
      // Update state
      setUser(fakeUser);
      
      // Create a fake session
      const fakeSession = {
        access_token: 'fake-token',
        refresh_token: 'fake-refresh-token',
        user: fakeUser,
        expires_at: Date.now() + 3600 * 1000, // Expires in 1 hour
      } as unknown as Session;
      
      setSession(fakeSession);
      
    } catch (error: any) {
      console.error('Error with dev sign in:', error.message);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      // Check if using dev mode
      const devModeUser = await AsyncStorage.getItem('devMode.user');
      
      if (devModeUser && isDevelopmentMode) {
        // Clear dev mode session
        await AsyncStorage.removeItem('devMode.user');
        setSession(null);
        setUser(null);
        return;
      }
      
      // Regular sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      // Clear session
      setSession(null);
      setUser(null);
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem('supabase.auth.token');
    } catch (error: any) {
      console.error('Error signing out:', error.message);
      throw error;
    }
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signOut,
    devSignIn,
    isDevelopmentMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};