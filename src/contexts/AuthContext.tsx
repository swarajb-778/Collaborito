import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface UserMetadata {
  full_name?: string;
  avatar_url?: string;
  email?: string;
}

export interface User {
  id: string;
  email: string;
  user_metadata: UserMetadata;
  app_metadata: Record<string, any>;
  // Add other fields as needed
}

interface AuthContextType {
  user: User | null;
  session: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (userData: Partial<UserMetadata>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for demo purposes
const MOCK_USER: User = {
  id: '123456789',
  email: 'demo@collaborito.com',
  user_metadata: {
    full_name: 'Demo User',
    avatar_url: 'https://ui-avatars.com/api/?name=Demo+User&background=3F83F8&color=fff',
  },
  app_metadata: {
    roles: ['user'],
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const loadSession = async () => {
      try {
        const storedSession = await SecureStore.getItemAsync('userSession');
        if (storedSession) {
          setSession(storedSession);
          setUser(MOCK_USER); // In a real app, you would validate the session and fetch user data
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // In a real app, this would be an API call to your authentication service
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating API call

      // Validate credentials
      if (email !== 'demo@collaborito.com' || password !== 'password123') {
        throw new Error('Invalid email or password');
      }

      // Set mock session and user
      const mockSession = `session_${Date.now()}`;
      await SecureStore.setItemAsync('userSession', mockSession);
      setSession(mockSession);
      setUser(MOCK_USER);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign in';
      Alert.alert('Sign In Failed', errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      // In a real app, this would be an API call to your authentication service
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulating API call

      // Create mock user
      const newUser: User = {
        ...MOCK_USER,
        id: `user_${Date.now()}`,
        email,
        user_metadata: {
          full_name: fullName,
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            fullName
          )}&background=3F83F8&color=fff`,
        },
      };

      // Set mock session and user
      const mockSession = `session_${Date.now()}`;
      await SecureStore.setItemAsync('userSession', mockSession);
      setSession(mockSession);
      setUser(newUser);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign up';
      Alert.alert('Sign Up Failed', errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await SecureStore.deleteItemAsync('userSession');
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Sign Out Failed', 'An error occurred while signing out');
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      // In a real app, this would trigger a password reset email
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating API call
      Alert.alert(
        'Password Reset Initiated',
        `If an account exists for ${email}, you will receive a password reset link.`
      );
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<UserMetadata>) => {
    setLoading(true);
    try {
      // In a real app, this would update the user profile on your backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating API call

      if (user) {
        const updatedUser: User = {
          ...user,
          user_metadata: {
            ...user.user_metadata,
            ...userData,
          },
        };
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Profile Update Failed', 'An error occurred while updating your profile');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};