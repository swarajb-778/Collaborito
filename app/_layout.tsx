import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useColorScheme, View, ActivityIndicator, Text, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from '../src/utils/logger';

// Keep the splash screen visible until ready
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore errors */
});

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
  // Try to use the system monospace font as a fallback if SpaceMono fails
  const monospaceFontFamily = Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  });

  const [fontsLoaded] = useFonts({
    ...FontAwesome.font,
  });

  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Keep the splash screen visible while we prepare
        await SplashScreen.preventAutoHideAsync();
        
        // Artificial delay to let things load
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        logger.error('Error preparing app:', e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {
        /* ignore errors */
      });
    }
  }, [appIsReady, fontsLoaded]);

  if (!appIsReady || !fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <AuthProvider>
      <RootLayoutNav monospaceFontFamily={monospaceFontFamily} />
    </AuthProvider>
  );
}

// Navigation component that handles auth state and initial route
function RootLayoutNav({ monospaceFontFamily }: { monospaceFontFamily: string }) {
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
