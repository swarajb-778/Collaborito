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

    // Check if the user is on the login screen
    const isLoginScreen = segments[0] === 'login';
    
    // If not signed in and not on login screen, redirect to login
    if (!user && !isLoginScreen) {
      router.replace('/login');
    }

    // If signed in and on login, redirect to home
    if (user && isLoginScreen) {
      router.replace('/');
    }
  }, [user, loading, segments, router]);
}

export default useAuthRedirect; 