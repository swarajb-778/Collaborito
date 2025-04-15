import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export function useAuthRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Skip redirect if still loading
    if (loading) {
      return;
    }

    // Check if the user is on the login screen or welcome screens
    const isLoginScreen = segments[0] === 'login';
    const isWelcomeScreen = segments[0] === 'welcome';
    
    // If not signed in and not on login or welcome screens, redirect to welcome
    if (!user && !isLoginScreen && !isWelcomeScreen) {
      router.replace('/welcome');
    }

    // If signed in and on login, redirect to home
    if (user && (isLoginScreen || isWelcomeScreen)) {
      router.replace('/');
    }
  }, [user, loading, segments, router]);
}

export default useAuthRedirect; 