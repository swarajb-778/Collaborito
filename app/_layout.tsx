import React, { useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { OptimizedAuthProvider } from '../src/contexts/OptimizedAuthContext';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/Colors';
import { ErrorBoundary } from '../components/ErrorBoundary';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
      // Don't throw immediately, let the error boundary handle it
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(console.warn);
    }
  }, [loaded]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ErrorBoundary>
    <OptimizedAuthProvider>
      <RootLayoutNav />
    </OptimizedAuthProvider>
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  // Auth context for routing decisions
  // Lazy import to avoid SSR issues
  const { useAuth } = require('../src/contexts/OptimizedAuthContext');
  const { user, loading, getOnboardingProgress } = useAuth();
  
  // Effect: Decide initial route based on auth and onboarding state
  useEffect(() => {
    // Wait until auth is resolved
    if (loading) return;

    const decideRoute = async () => {
      try {
        // Not signed in → Welcome
        if (!user) {
          if (router.canGoBack() === false) router.replace('/welcome');
          return;
        }

        // Signed in → Check onboarding
        // Prefer user flag, fallback to service lookup
        const completed = Boolean(user.onboardingCompleted);
        if (completed) {
          router.replace('/(tabs)');
          return;
        }

        const progress = await getOnboardingProgress?.();
        const isComplete = Boolean(
          progress?.isComplete || progress?.completed || progress?.onboarding_completed
        );

        if (isComplete) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      } catch (err) {
        // On error, default to tabs for signed-in users to avoid blocking
        if (user) router.replace('/(tabs)');
        else router.replace('/welcome');
      }
    };

    decideRoute();
  }, [user, loading, router, getOnboardingProgress]);
  
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
