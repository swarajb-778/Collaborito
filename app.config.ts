import { ExpoConfig, ConfigContext } from 'expo/config';
import 'dotenv/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  // Development fallback values
  const isDev = process.env.NODE_ENV === 'development';
  
  return {
    ...config,
    name: 'Collaborito',
    slug: 'collaborito',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.collaborito.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.collaborito.app',
    },
    web: {
      favicon: './assets/images/favicon.png',
    },
    scheme: 'collaborito',
    plugins: [
      'expo-router',
      ['expo-font', {
        fonts: ['./assets/fonts/Nunito-Regular.ttf']
      }],
      // Note: Most other Expo packages (expo-status-bar, expo-secure-store, etc.) 
      // can be used directly in code without being configured as plugins
    ],
    extra: {
      SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ekydublgvsoaaepdhtzc.supabase.co',
      SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWR1YmxndnNvYWFlcGRodHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTA0NTUsImV4cCI6MjA1OTA4NjQ1NX0.CSN4WGqUDaOeTB-Mz9SEJvKM6_wx_ReH3lZIQRkGAzA',
      LINKEDIN_CLIENT_ID: process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID || '77dpxmsrs0t56d',
      LINKEDIN_CLIENT_SECRET: process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_SECRET || 'WPL_AP1.Yl49K57KkulMZDQj.p+g9mg==',
      LINKEDIN_REDIRECT_URI: process.env.EXPO_PUBLIC_LINKEDIN_REDIRECT_URI || 'https://collaborito-auth.ngrok.io/callback',
    },
  };
}; 