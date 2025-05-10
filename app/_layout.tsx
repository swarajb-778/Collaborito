import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../src/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/Colors';
import { View, Text, ActivityIndicator } from 'react-native';
import { preloadImages } from '../src/utils/performance';

// Preload common images
const COMMON_IMAGES = [
  'https://randomuser.me/api/portraits/women/1.jpg',
  'https://randomuser.me/api/portraits/men/1.jpg',
  'https://randomuser.me/api/portraits/women/2.jpg',
  'https://randomuser.me/api/portraits/men/2.jpg',
];

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
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Load and cache assets in parallel with fonts
  useEffect(() => {
    const loadAssets = async () => {
      try {
        // Preload common images used across the app
        await preloadImages(COMMON_IMAGES);
        setAssetsLoaded(true);
      } catch (e) {
        console.warn('Error preloading assets:', e);
        // Continue even if image preloading fails
        setAssetsLoaded(true);
      }
    };

    loadAssets();
  }, []);

  useEffect(() => {
    if (loaded && assetsLoaded) {
      // Hide splash screen once both fonts and assets are loaded
      const hideSplash = async () => {
        await SplashScreen.hideAsync();
      };
      hideSplash();
    }
  }, [loaded, assetsLoaded]);

  if (!loaded || !assetsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  // Effect to redirect from the root to welcome screen
  useEffect(() => {
    const redirectToWelcome = () => {
      if (router.canGoBack() === false) {
        router.replace('/welcome');
      }
    };
    redirectToWelcome();
  }, [router]);
  
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade_from_bottom', // Faster animation
          animationDuration: 200, // Reduce animation duration
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
