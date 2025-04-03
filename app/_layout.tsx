import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/src/contexts/AuthContext';
import { useAuthRedirect } from '@/src/hooks/useAuthRedirect';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// This handles the initial deep link when the app is not open
WebBrowser.maybeCompleteAuthSession();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  
  // Use the auth redirect hook
  useAuthRedirect();
  
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Handle deep links (needed for OAuth flow)
  useEffect(() => {
    // Subscribe to deep link events
    const subscription = Linking.addEventListener('url', (event) => {
      // Handle the deep link
      console.log('Deep link received:', event.url);
      // The rest is handled by expo-auth-session
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
