import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabase';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

// Define the context types
type AuthContextType = {
  session: Session | null;
  user: any | null;
  loading: boolean;
  signIn: (provider: 'linkedin') => Promise<void>;
  signOut: () => Promise<void>;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
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
    scheme: Constants.expoConfig?.scheme || 'collaborito',
    path: 'auth/callback',
  });

  // Sign in with LinkedIn OAuth
  const signIn = async (provider: 'linkedin') => {
    try {
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

  // Sign out
  const signOut = async () => {
    try {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 