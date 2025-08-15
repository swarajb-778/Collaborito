import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { OptimizedAuthProvider } from '../src/contexts/OptimizedAuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/Colors';
import { ErrorBoundary } from '../components/ErrorBoundary';
import ActionToast from '../components/ui/ActionToast';
import sessionTimeoutService from '../src/services/SessionTimeoutService';
import { SessionWarningToast } from '../components/ui/SessionWarningToast';
import { NewDeviceAlert } from '../components/ui/NewDeviceAlert';
import { newDeviceNotificationService, NewDeviceNotification } from '../src/services/NewDeviceNotificationService';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <OptimizedAuthProvider>
            <RootLayoutNav />
          </OptimizedAuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
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
  
  const [toast, setToast] = useState<{ msg: string; action?: () => void } | null>(null);
  const [sessionWarning, setSessionWarning] = useState<{ visible: boolean; minutes: number }>({ 
    visible: false, 
    minutes: 0 
  });
  const [newDeviceAlert, setNewDeviceAlert] = useState<{ 
    visible: boolean; 
    notification: NewDeviceNotification | null 
  }>({ 
    visible: false, 
    notification: null 
  });

  useEffect(() => {
    // Global warning callback for session timeout
    sessionTimeoutService.setSessionWarningCallback((m) => {
      if (m === 5) {
        setSessionWarning({ visible: true, minutes: m });
      }
    });
    
    // Session timeout callback
    sessionTimeoutService.setSessionTimeoutCallback(() => {
      setSessionWarning({ visible: false, minutes: 0 });
      // Handle session expiration (e.g., redirect to login)
      // This will be handled by the auth context
    });
    
    // New device notification callback
    const unsubscribeNewDevice = newDeviceNotificationService.onNewDeviceNotification((notification) => {
      setNewDeviceAlert({ visible: true, notification });
    });
    
    return () => {
      unsubscribeNewDevice();
    };
  }, []);
  
  const handleExtendSession = () => {
    sessionTimeoutService.extendSession(120); // Extend by 2 hours
    setSessionWarning({ visible: false, minutes: 0 });
  };
  
  const handleDismissWarning = () => {
    setSessionWarning({ visible: false, minutes: 0 });
  };
  
  const handleSessionExpired = () => {
    setSessionWarning({ visible: false, minutes: 0 });
    // Additional handling can be added here if needed
  };
  
  const handleTrustDevice = async () => {
    if (!newDeviceAlert.notification) return;
    
    try {
      await newDeviceNotificationService.trustDevice(
        newDeviceAlert.notification.id,
        newDeviceAlert.notification.user_id,
        newDeviceAlert.notification.device_fingerprint
      );
      setNewDeviceAlert({ visible: false, notification: null });
    } catch (error) {
      console.error('Failed to trust device:', error);
    }
  };
  
  const handleBlockDevice = async () => {
    if (!newDeviceAlert.notification) return;
    
    try {
      await newDeviceNotificationService.blockDevice(
        newDeviceAlert.notification.id,
        newDeviceAlert.notification.user_id,
        newDeviceAlert.notification.device_fingerprint
      );
      setNewDeviceAlert({ visible: false, notification: null });
    } catch (error) {
      console.error('Failed to block device:', error);
    }
  };
  
  const handleViewDeviceDetails = () => {
    setNewDeviceAlert({ visible: false, notification: null });
    router.push('/device-management');
  };
  
  const handleDismissDeviceAlert = async () => {
    if (!newDeviceAlert.notification) return;
    
    try {
      await newDeviceNotificationService.dismissNotification(newDeviceAlert.notification.id);
      setNewDeviceAlert({ visible: false, notification: null });
    } catch (error) {
      console.error('Failed to dismiss device alert:', error);
      setNewDeviceAlert({ visible: false, notification: null });
    }
  };

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
      {toast && (
        <ActionToast
          message={toast.msg}
          type="warning"
          actionLabel="Extend"
          onAction={toast.action}
          onClose={() => setToast(null)}
          autoDismissMs={5000}
        />
      )}
      
      <SessionWarningToast
        isVisible={sessionWarning.visible}
        minutesRemaining={sessionWarning.minutes}
        onExtendSession={handleExtendSession}
        onDismiss={handleDismissWarning}
        onSessionExpired={handleSessionExpired}
      />
      
      {newDeviceAlert.notification && (
        <NewDeviceAlert
          isVisible={newDeviceAlert.visible}
          deviceInfo={{
            device_name: newDeviceAlert.notification.device_name,
            os: newDeviceAlert.notification.device_info?.os || 'Unknown',
            browser: newDeviceAlert.notification.device_info?.browser,
            ip_address: newDeviceAlert.notification.ip_address,
            location: newDeviceAlert.notification.location_info?.city || 
                     newDeviceAlert.notification.location_info?.region,
            device_fingerprint: newDeviceAlert.notification.device_fingerprint
          }}
          onTrustDevice={handleTrustDevice}
          onViewDetails={handleViewDeviceDetails}
          onDismiss={handleDismissDeviceAlert}
          onDontTrust={handleBlockDevice}
        />
      )}
    </>
  );
}
