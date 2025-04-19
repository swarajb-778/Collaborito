import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Define the User interface
interface User {
  id: string;
  name: string;
  email: string;
  profilePicture: string | undefined | null;
}

// Define the auth state
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

// Define the auth context
interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  linkedInSignIn: () => Promise<void>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the auth provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true
  });

  // Load the authentication state from storage
  const loadState = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const storedUser = await AsyncStorage.getItem('@auth_user');
      const storedToken = await SecureStore.getItemAsync('auth_token');
      
      if (storedUser && storedToken) {
        setState({
          user: JSON.parse(storedUser),
          token: storedToken,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Load state when the component mounts
  useEffect(() => {
    loadState();
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // In a real app, you would call an API here
      // This is a mock implementation
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful authentication
      // Replace with actual authentication logic
      if (email === 'user@example.com' && password === 'password') {
        const mockUser: User = {
          id: '1',
          name: 'Test User',
          email: 'user@example.com',
          profilePicture: null,
        };
        const mockToken = 'mock-auth-token';
        
        // Save to secure storage
        await AsyncStorage.setItem('@auth_user', JSON.stringify(mockUser));
        await SecureStore.setItemAsync('auth_token', mockToken);
        
        // Update state
        setState({
          user: mockUser,
          token: mockToken,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Sign in failed', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw new Error('Authentication failed. Please check your credentials.');
    }
  };
  
  // Sign up function
  const signUp = async (name: string, email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // In a real app, you would call an API here
      // This is a mock implementation
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful registration
      // Replace with actual registration logic
      const mockUser: User = {
        id: '1',
        name,
        email,
        profilePicture: null,
      };
      const mockToken = 'mock-auth-token';
      
      // Save to secure storage
      await AsyncStorage.setItem('@auth_user', JSON.stringify(mockUser));
      await SecureStore.setItemAsync('auth_token', mockToken);
      
      // Update state
      setState({
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      console.error('Sign up failed', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw new Error('Registration failed. Please try again.');
    }
  };
  
  // Sign out function
  const signOut = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Clear storage
      await AsyncStorage.removeItem('@auth_user');
      await SecureStore.deleteItemAsync('auth_token');
      
      // Update state
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });
    } catch (error) {
      console.error('Sign out failed', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw new Error('Sign out failed. Please try again.');
    }
  };

  // LinkedIn sign in function
  const linkedInSignIn = async () => {
    // Set loading state
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Implementation would depend on LinkedIn OAuth integration
      // This is just a placeholder
      console.log('LinkedIn sign in initiated');
      setState(prev => ({ ...prev, isLoading: false }));
      throw new Error('LinkedIn sign in not implemented yet');
    } catch (error) {
      console.error('LinkedIn sign in failed', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading: state.isLoading,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        signIn,
        signUp,
        signOut,
        linkedInSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Create a hook to protect routes
export const useProtectedRoute = (redirectTo: string = '/') => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // If the user is not authenticated and the auth state is loaded, redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Implementation depends on your routing library
      // For expo-router, you might do something like:
      // router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading]);
  
  return { isAuthenticated, isLoading };
}; 