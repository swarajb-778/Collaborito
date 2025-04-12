import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from '../src/utils/logger';

// Keep the splash screen visible until ready
SplashScreen.preventAutoHideAsync();

const WELCOME_COMPLETED_KEY = 'welcome_completed';

const logger = createLogger('RootLayout');

// Loading component
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1121' }}>
    <ActivityIndicator size="large" color="#6C63FF" />
  </View>
);

// Root layout component that wraps the entire app
export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

// Navigation component that handles auth state and initial route
function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const [hasCompletedWelcome, setHasCompletedWelcome] = useState<boolean | null>(null);
  const colorScheme = useColorScheme();

  useEffect(() => {
    const checkWelcomeStatus = async () => {
      try {
        const value = await AsyncStorage.getItem(WELCOME_COMPLETED_KEY);
        setHasCompletedWelcome(value === 'true');
        logger.debug(`Welcome completed status: ${value === 'true'}`);
      } catch (error) {
        logger.error('Error checking welcome status', error);
        setHasCompletedWelcome(false);
      }
    };

    checkWelcomeStatus();
  }, []);

  // Show loading state while checking auth status
  if (isLoading || hasCompletedWelcome === null) {
    return <LoadingScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colorScheme === 'dark' ? '#0B1121' : '#f5f5f7',
        },
      }}
      initialRouteName={
        !hasCompletedWelcome ? "welcome/index" : 
        !isAuthenticated ? "login" : "(tabs)"
      }
    >
      <Stack.Screen name="welcome/index" options={{ gestureEnabled: false }} />
      <Stack.Screen name="welcome/details" options={{ gestureEnabled: false }} />
      <Stack.Screen name="login" options={{ gestureEnabled: false }} />
      <Stack.Screen name="register" options={{ gestureEnabled: false }} />
      <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
